import { timingSafeEqual } from "node:crypto";
import { and, asc, desc, eq, ne, or, lt, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { SOLICITACAO_TIPOS, agenciaCiclos, agenciaClientes, agenciaFaturas, agenciaPecaComentarios, agenciaPecaEventos, agenciaPecas, agenciaSolicitacoes, agencias, type PecaEtapa } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { assinarSessao, codigoDaJanela, lerSessao } from "@/lib/domain/conta-cliente";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { sendEmail } from "@/lib/email";
import { brandByCode } from "@/lib/brand";
import { agenciasUrl } from "@/lib/host-routing";
import { newId } from "@/lib/ids";
import { escopoDaAgencia, exigirAgenciasLigado, pode, podeVerCliente } from "./acesso";
import { hojeEmSaoPaulo } from "./clientes";
import { situacaoMostrada } from "./cobranca";
import { TIPO_ROTULO, contagemDoCiclo, escolherResponsavel, etapaParaCliente, mesDe, mesRotulo, prazoDaEtapa, publicada, situacaoInicial } from "./fluxo";
import { equipeDoCliente } from "./producao";

/**
 * Portal do cliente da agência (D320). O cliente entra SEM SENHA, com código de 6 dígitos no e-mail cadastrado na ficha
 * dele (o mesmo mecanismo da conta do cliente das lojas, D240). Vê só o que é dele e foi feito para ele ver: resumo do
 * mês, produção em situações simples, peças para aprovar, publicações, cobranças e os pedidos que fez. Nunca comentário
 * interno, custo, valor de freelancer, nomes da equipe ou outro cliente.
 */
export const COOKIE_PORTAL = "nl-portal-ag";
const JANELA_MS = 10 * 60_000;
const SESSAO_MS = 30 * 86_400_000;
const normal = (e: string) => e.trim().toLowerCase();
const escopoCodigo = (agenciaId: string) => `ag:${agenciaId}`;
const janelaDe = (agora: Date) => Math.floor(agora.getTime() / JANELA_MS);

/** Endereço do portal (no endereço das agências, se configurado; senão no da NextLevel Commerce). */
export const urlDoPortal = (slug: string) => `${(agenciasUrl() ?? brandByCode("NEXTLEVEL_COMMERCE").baseUrl).replace(/\/$/, "")}/portal/${slug}`;

export async function agenciaDoPortal(db: Database, slug: string) {
  exigirAgenciasLigado();
  const a = await db.query.agencias.findFirst({ where: eq(agencias.slug, z.string().max(80).parse(slug)), columns: { id: true, nome: true, slug: true, situacao: true } });
  if (!a || a.situacao === "PAUSADA") throw new NotFoundError("Portal não encontrado.");
  return a;
}

/** Manda o código se o e-mail é de algum cliente da agência; a resposta é a mesma nos dois casos (não revela quem é cliente). */
export async function pedirCodigoDoPortal(db: Database, slug: string, emailRaw: string, agora = new Date()) {
  const email = normal(emailRaw);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) throw new DomainError("EMAIL_INVALIDO", "Confira o e-mail.");
  const a = await agenciaDoPortal(db, slug);
  const tem = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.agenciaId, a.id), sql`lower(${agenciaClientes.email}) = ${email}`, ne(agenciaClientes.situacao, "ENCERRADO")), columns: { id: true } });
  if (tem) {
    const codigo = codigoDaJanela(escopoCodigo(a.id), email, janelaDe(agora));
    await sendEmail(db, {
      kind: "AGENCIA_PORTAL_CODIGO", to: email, brand: "NEXTLEVEL_COMMERCE",
      subject: `Seu código para entrar no portal da ${a.nome}: ${codigo}`,
      text: `Use o código ${codigo} para entrar no portal da ${a.nome}. Ele vale por 10 minutos.\n\nSe não foi você, ignore este e-mail.`,
      cta: { label: "Abrir o portal", url: urlDoPortal(a.slug) }, dedupeKey: `portal-codigo:${a.id}:${email}:${janelaDe(agora)}`,
    });
  }
  return { ok: true as const };
}

/** Confere o código (janela atual ou anterior) e devolve o cookie da sessão do portal daquela agência. */
export async function entrarNoPortal(db: Database, slug: string, emailRaw: string, codigo: string, agora = new Date()) {
  const a = await agenciaDoPortal(db, slug);
  const email = normal(emailRaw); const c = codigo.replace(/\D/g, "");
  const j = janelaDe(agora);
  const ok = c.length === 6 && [j, j - 1].some((x) => timingSafeEqual(Buffer.from(codigoDaJanela(escopoCodigo(a.id), email, x)), Buffer.from(c)));
  if (!ok) throw new DomainError("CODIGO_INVALIDO", "Código inválido ou vencido. Peça um novo.");
  return assinarSessao({ s: escopoCodigo(a.id), e: email, x: agora.getTime() + SESSAO_MS });
}

/** Clientes da agência com o e-mail da sessão (um contato pode cuidar de mais de uma empresa). */
export async function clientesDaSessao(db: Database, agenciaId: string, token: string | undefined, agora = new Date()) {
  const email = lerSessao(token, escopoCodigo(agenciaId), agora);
  if (!email) return { email: null, clientes: [] as { id: string; nome: string }[] };
  const clientes = await db.select({ id: agenciaClientes.id, nome: agenciaClientes.nome }).from(agenciaClientes)
    .where(and(eq(agenciaClientes.agenciaId, agenciaId), sql`lower(${agenciaClientes.email}) = ${email}`, ne(agenciaClientes.situacao, "ENCERRADO"))).orderBy(asc(agenciaClientes.nome));
  return { email, clientes };
}

async function clienteDoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string) {
  const { email, clientes } = await clientesDaSessao(db, agenciaId, token);
  if (!email) throw new ForbiddenError("Entre de novo no portal.");
  if (!clientes.some((c) => c.id === clienteId)) throw new NotFoundError("Cliente não encontrado.");
  return { email, cliente: (await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, clienteId) }))! };
}

/** O que o cliente vê no portal. Só dados dele; nada interno. */
export async function portalDoCliente(db: Database, agenciaId: string, token: string | undefined, clienteId: string, hoje = hojeEmSaoPaulo()) {
  const { cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const mes = mesDe(hoje);
  const pecas = await db.select({ id: agenciaPecas.id, titulo: agenciaPecas.titulo, tipo: agenciaPecas.tipo, etapa: agenciaPecas.etapa, prazo: agenciaPecas.prazo, extra: agenciaPecas.extra, linkVersao: agenciaPecas.linkVersao, linkPublicacao: agenciaPecas.linkPublicacao, publicarEm: agenciaPecas.publicarEm, publicadoEm: agenciaPecas.publicadoEm, versao: agenciaPecas.versao, mes: agenciaCiclos.mes, contratado: agenciaCiclos.contratado })
    .from(agenciaPecas).innerJoin(agenciaCiclos, eq(agenciaCiclos.id, agenciaPecas.cicloId))
    .where(and(eq(agenciaPecas.clienteId, cliente.id), or(eq(agenciaCiclos.mes, mes), and(lt(agenciaCiclos.mes, mes), ne(agenciaPecas.etapa, "PUBLICADO"), ne(agenciaPecas.etapa, "CONCLUIDO")))))
    .orderBy(asc(agenciaPecas.prazo));
  const ciclo = await db.query.agenciaCiclos.findFirst({ where: and(eq(agenciaCiclos.clienteId, cliente.id), eq(agenciaCiclos.mes, mes)) });
  const contagem = contagemDoCiclo(ciclo?.contratado ?? cliente.incluso, pecas.filter((p) => p.mes === mes), pecas.filter((p) => p.mes < mes), hoje);
  const [cobrancas, solicitacoes] = await Promise.all([
    db.select({ id: agenciaFaturas.id, descricao: agenciaFaturas.descricao, valorCents: agenciaFaturas.valorCents, vencimento: agenciaFaturas.vencimento, situacao: agenciaFaturas.situacao, checkoutUrl: agenciaFaturas.checkoutUrl }).from(agenciaFaturas)
      .where(and(eq(agenciaFaturas.clienteId, cliente.id), ne(agenciaFaturas.situacao, "CANCELADA"))).orderBy(desc(agenciaFaturas.vencimento)).limit(6),
    db.select().from(agenciaSolicitacoes).where(eq(agenciaSolicitacoes.clienteId, cliente.id)).orderBy(desc(agenciaSolicitacoes.createdAt)).limit(20),
  ]);
  return {
    cliente: { id: cliente.id, nome: cliente.nome, exigeAprovacao: cliente.exigeAprovacao }, mes, mesRotulo: mesRotulo(mes), contagem,
    paraAprovar: pecas.filter((p) => p.etapa === "APROVACAO").map((p) => ({ id: p.id, titulo: p.titulo, tipo: TIPO_ROTULO[p.tipo], versao: p.versao, link: p.linkVersao })),
    producao: pecas.filter((p) => !publicada(p.etapa)).map((p) => ({ id: p.id, titulo: p.titulo, tipo: TIPO_ROTULO[p.tipo], situacao: etapaParaCliente(p.etapa), anterior: p.mes < mes })),
    publicacoes: pecas.filter((p) => publicada(p.etapa)).map((p) => ({ id: p.id, titulo: p.titulo, link: p.linkPublicacao, em: p.publicadoEm })),
    programadas: pecas.filter((p) => p.etapa === "AGENDAMENTO" && p.publicarEm).map((p) => ({ id: p.id, titulo: p.titulo, em: p.publicarEm! })),
    cobrancas: cobrancas.map((f) => ({ ...f, mostrada: situacaoMostrada(f, hoje) })),
    solicitacoes: solicitacoes.map((s) => ({ id: s.id, tipo: s.tipo, texto: s.texto, situacao: s.situacao, resposta: s.resposta, createdAt: s.createdAt })),
  };
}

async function pecaDoCliente(db: Database, clienteId: string, pecaId: string) {
  const p = await db.query.agenciaPecas.findFirst({ where: and(eq(agenciaPecas.id, pecaId), eq(agenciaPecas.clienteId, clienteId)) });
  if (!p) throw new NotFoundError("Conteúdo não encontrado.");
  if (p.etapa !== "APROVACAO") throw new DomainError("NAO_AGUARDA", "Este conteúdo não está esperando a sua aprovação.");
  return p;
}

async function mover(db: Database, peca: { id: string; agenciaId: string; etapa: PecaEtapa }, cliente: { id: string; responsavelId: string | null }, para: PecaEtapa, situacao: string, tipo: string, mensagem: string, email: string) {
  const ag = await db.query.agencias.findFirst({ where: eq(agencias.id, peca.agenciaId), columns: { prazosEtapas: true } });
  const equipe = await equipeDoCliente(db, cliente.id);
  const responsavelId = escolherResponsavel(para, equipe, cliente.responsavelId);
  const r = await db.update(agenciaPecas).set({ etapa: para, situacao, responsavelId, prazo: prazoDaEtapa(para, hojeEmSaoPaulo(), ag?.prazosEtapas ?? {}), updatedAt: new Date().toISOString() })
    .where(and(eq(agenciaPecas.id, peca.id), eq(agenciaPecas.etapa, peca.etapa))).returning({ id: agenciaPecas.id });
  if (!r.length) throw new DomainError("MUDOU", "Este conteúdo acabou de mudar. Atualize a página.");
  await db.insert(agenciaPecaEventos).values({ id: newId("agpe"), pecaId: peca.id, agenciaId: peca.agenciaId, tipo, mensagem, autorNome: `Cliente (${email})`, destinoId: responsavelId });
}

/** O cliente aprova: a peça segue para o social media do cliente, com aviso. */
export async function aprovarPeloCliente(db: Database, agenciaId: string, token: string | undefined, clienteId: string, pecaId: string) {
  const { email, cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const p = await pecaDoCliente(db, cliente.id, pecaId);
  await mover(db, p, cliente, "AGENDAMENTO", situacaoInicial("AGENDAMENTO"), "APROVADA", "Aprovado pelo cliente no portal → Social media.", email);
}

/** O cliente pede ajuste (comentário obrigatório): volta para o editor, com o pedido visível também ao cliente. */
export async function ajustePeloCliente(db: Database, agenciaId: string, token: string | undefined, clienteId: string, pecaId: string, comentario: string) {
  const { email, cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const p = await pecaDoCliente(db, cliente.id, pecaId);
  const texto = z.string().trim().min(3, "Conte o que precisa mudar").max(2000).parse(comentario);
  await mover(db, p, cliente, "EDICAO", "AJUSTES", "AJUSTE", `Ajuste pedido pelo cliente: ${texto}`, email);
  await db.insert(agenciaPecaComentarios).values({ id: newId("agcm"), pecaId: p.id, agenciaId: p.agenciaId, autorNome: `Cliente (${email})`, texto: `Pedido do cliente: ${texto}`, interno: false });
}

export const solicitacaoSchema = z.object({ tipo: z.enum(SOLICITACAO_TIPOS), texto: z.string().trim().min(3, "Escreva o pedido").max(2000) });
export async function enviarSolicitacao(db: Database, agenciaId: string, token: string | undefined, clienteId: string, raw: z.input<typeof solicitacaoSchema>) {
  const { email, cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const d = solicitacaoSchema.parse(raw);
  const id = newId("agso");
  await db.insert(agenciaSolicitacoes).values({ id, agenciaId, clienteId: cliente.id, tipo: d.tipo, texto: d.texto, autorEmail: email });
  return { id };
}

// ---------------------------------------------------------------------------
// Lado da agência: solicitações dos clientes e aviso por e-mail quando há conteúdo para aprovar
// ---------------------------------------------------------------------------
export async function solicitacoesDaAgencia(db: Database, actor: Actor, filtro: { clienteId?: string; abertas?: boolean } = {}) {
  const { membro } = await escopoDaAgencia(db, actor);
  const rows = await db.select({ s: agenciaSolicitacoes, cliente: agenciaClientes }).from(agenciaSolicitacoes).innerJoin(agenciaClientes, eq(agenciaClientes.id, agenciaSolicitacoes.clienteId))
    .where(and(eq(agenciaSolicitacoes.agenciaId, membro.agenciaId), filtro.clienteId ? eq(agenciaSolicitacoes.clienteId, filtro.clienteId) : undefined, filtro.abertas ? ne(agenciaSolicitacoes.situacao, "RESPONDIDA") : undefined))
    .orderBy(desc(agenciaSolicitacoes.createdAt)).limit(50);
  return rows.filter((r) => pode.verTodosClientes(membro) || r.cliente.responsavelId === membro.userId).map((r) => ({ ...r.s, clienteNome: r.cliente.nome }));
}

export async function responderSolicitacao(db: Database, actor: Actor, id: string, raw: { resposta?: string; situacao: "EM_ANDAMENTO" | "RESPONDIDA" }) {
  const { membro } = await escopoDaAgencia(db, actor);
  const s = await db.query.agenciaSolicitacoes.findFirst({ where: and(eq(agenciaSolicitacoes.id, id), eq(agenciaSolicitacoes.agenciaId, membro.agenciaId)) });
  if (!s) throw new NotFoundError("Pedido não encontrado.");
  const c = (await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, s.clienteId) }))!;
  if (!podeVerCliente(membro, c, (await equipeDoCliente(db, c.id)).map((p) => p.userId))) throw new NotFoundError("Pedido não encontrado.");
  const d = z.object({ resposta: z.string().trim().max(2000).optional(), situacao: z.enum(["EM_ANDAMENTO", "RESPONDIDA"]) }).parse(raw);
  if (d.situacao === "RESPONDIDA" && !d.resposta) throw new DomainError("RESPOSTA", "Escreva a resposta para o cliente.");
  await db.update(agenciaSolicitacoes).set({ situacao: d.situacao, resposta: d.resposta ?? s.resposta, respondidaEm: d.situacao === "RESPONDIDA" ? new Date().toISOString() : s.respondidaEm }).where(eq(agenciaSolicitacoes.id, s.id));
}

/** E-mail ao cliente quando um conteúdo chega para aprovação (uma vez por versão). Sem e-mail na ficha, não envia. */
export async function avisarClienteParaAprovar(db: Database, pecaId: string) {
  const p = await db.query.agenciaPecas.findFirst({ where: eq(agenciaPecas.id, pecaId) });
  if (!p || p.etapa !== "APROVACAO") return "SKIPPED" as const;
  const [c, a] = await Promise.all([db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, p.clienteId) }), db.query.agencias.findFirst({ where: eq(agencias.id, p.agenciaId), columns: { nome: true, slug: true } })]);
  if (!c?.email || !a) return "SKIPPED" as const;
  return sendEmail(db, {
    kind: "AGENCIA_PARA_APROVAR", to: c.email, brand: "NEXTLEVEL_COMMERCE",
    subject: `${a.nome}: "${p.titulo}" está pronto para você aprovar`,
    text: `Olá! O conteúdo "${p.titulo}" está pronto. Assista e aprove, ou peça um ajuste, pelo portal da ${a.nome}.`,
    cta: { label: "Ver e aprovar", url: urlDoPortal(a.slug) }, dedupeKey: `agencia-aprovar:${p.id}:${p.versao}`,
  });
}


