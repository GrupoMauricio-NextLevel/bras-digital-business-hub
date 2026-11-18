import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agenciaClientes, agenciaContratos, agenciaFaturas, agenciaMembros, agencias, users, type AgenciaContratoModelo } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { dataHora, gerarPdfContrato, gerarPdfDocumento } from "@/lib/contratos/pdf";
import { CONTRATADA_PADRAO, formatar, impressaoDigital, type DadosLojaPronta, type Secao } from "@/lib/contratos/loja-pronta-express";
import { PRODUTOS_PROJETO, VERSAO_PROJETO, pendenciasDoProjeto, resumoDoProjetoParaPdf, secoesDoProjeto, situacaoDoPagamento, tituloDoProjeto, type DadosContratoProjeto, type ProdutoProjeto } from "@/lib/contratos/projeto";
import { escopoDaAgencia, pode } from "./acesso";
import { hojeEmSaoPaulo, inclusoTexto } from "./clientes";
import { pendenciasDoContrato, secoesDoContrato, type DadosContratoAgencia } from "./contrato-modelo";
import { clienteDoPortal, urlDoPortal } from "./portal";

/**
 * Contratos da agência com os clientes dela (D321, D341), sobre o motor dos contratos do Master (D276): a agência gera
 * pelo modelo (com os dados da ficha), envia e o cliente aceita no portal com o texto que viu (impressão digital igual).
 * O aceite guarda a prova, marca o onboarding e manda o PDF assinado por e-mail aos dois lados. Só administrador e
 * financeiro.
 *
 * Modelos (D341): a mensalidade de marketing (D321) e os PROJETOS com entrega ("Loja Virtual Pronta Express" e
 * "Migração Nuvemshop → NextLevel"), com sinal e restante (ou à vista), cortesias e o que já foi pago. Cada parcela do
 * projeto vira uma cobrança avulsa ligada ao contrato. Contrato trazido do Master (origem MASTER) mantém o texto, a
 * impressão digital e a prova do aceite originais.
 */
async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!pode.editarContrato(e.membro)) throw new ForbiddenError("Os contratos são do administrador e do financeiro.");
  return e;
}
type Agencia = typeof agencias.$inferSelect;
type Cliente = typeof agenciaClientes.$inferSelect;
type Contrato = typeof agenciaContratos.$inferSelect;
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD");

export const MODELO_ROTULO: Record<AgenciaContratoModelo, string> = {
  MENSAL_MARKETING: "Mensalidade de marketing",
  LOJA_PRONTA_EXPRESS: PRODUTOS_PROJETO.LOJA_PRONTA_EXPRESS.nome,
  MIGRACAO_PLATAFORMA: PRODUTOS_PROJETO.MIGRACAO_PLATAFORMA.nome,
};
export const ehProjeto = (m: AgenciaContratoModelo): m is ProdutoProjeto => m !== "MENSAL_MARKETING";

export const dadosJuridicosSchema = z.object({
  razaoSocial: z.string().trim().min(3, "Razão social").max(160),
  documento: z.string().trim().min(11, "CNPJ ou CPF").max(20),
  cidadeForo: z.string().trim().min(3, "Cidade do foro, ex.: São Paulo/SP").max(80),
});
export async function salvarDadosJuridicos(db: Database, actor: Actor, raw: z.input<typeof dadosJuridicosSchema>) {
  const { agencia } = await escopo(db, actor);
  const d = dadosJuridicosSchema.parse(raw);
  await db.update(agencias).set({ ...d, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
}

/** Opções do contrato mensal (D321). */
export const opcoesSchema = z.object({
  modelo: z.literal("MENSAL_MARKETING").optional(),
  inicio: dataIso,
  vigenciaMeses: z.number().int().min(1).max(60).default(12),
  avisoPrevioDias: z.number().int().min(0).max(180).default(30),
  rodadasAjuste: z.number().int().min(0).max(10).default(2),
  prazoAprovacaoDias: z.number().int().min(1).max(30).default(3),
  extras: z.string().trim().max(4000).optional().nullable(),
  aditivoDeId: z.string().optional().nullable(),
});

const meioSchema = z.enum(["PIX", "TRANSFERENCIA", "DINHEIRO", "CARTAO", "MERCADO_PAGO", "OUTRO"]);
/** Opções do contrato de projeto (D341). */
export const projetoSchema = z.object({
  modelo: z.enum(["LOJA_PRONTA_EXPRESS", "MIGRACAO_PLATAFORMA"]),
  origem: z.string().trim().max(40).optional().nullable(),
  loja: z.string().trim().max(120).optional().nullable(),
  valorCheioCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  valorCents: z.number().int().min(100, "Informe o valor do serviço").max(100_000_000),
  parcelas: z.array(z.object({
    descricao: z.string().trim().min(2).max(60),
    valorCents: z.number().int().min(1, "Cada parcela precisa de valor").max(100_000_000),
    vencimento: dataIso,
    pagoEm: dataIso.optional().nullable(),
    meio: meioSchema.optional().nullable(),
  })).min(1, "Informe como o cliente paga").max(12),
  produtos: z.number().int().min(1).max(10_000).default(40),
  banners: z.number().int().min(0).max(500).default(8),
  prazoDias: z.number().int().min(1).max(180).default(10),
  cortesias: z.array(z.object({ titulo: z.string().trim().min(3, "Descreva a cortesia").max(160), valorReferenciaCents: z.number().int().min(0).max(100_000_000).optional().nullable() })).max(10).default([]),
  extras: z.string().trim().max(4000).optional().nullable(),
  aditivoDeId: z.string().optional().nullable(),
});
export type OpcoesContrato = z.input<typeof opcoesSchema> | z.input<typeof projetoSchema>;
const ehOpcaoProjeto = (raw: OpcoesContrato): raw is z.input<typeof projetoSchema> => !!raw.modelo && raw.modelo !== "MENSAL_MARKETING";

/** Quem assina pela agência. Agência interna (a própria NextLevel): a empresa do grupo, com o Pix do Itaú (D279). */
function contratadaDe(agencia: Agencia, u: { name: string; email: string }) {
  if (agencia.interna) return { nome: agencia.nome, razao: agencia.razaoSocial || CONTRATADA_PADRAO.razao, documento: agencia.documento || CONTRATADA_PADRAO.cnpj, cidadeForo: agencia.cidadeForo || "São Paulo/SP", representante: CONTRATADA_PADRAO.representante, email: CONTRATADA_PADRAO.emailRepresentante, pix: { chave: CONTRATADA_PADRAO.chavePix, banco: CONTRATADA_PADRAO.banco, favorecido: CONTRATADA_PADRAO.favorecido } };
  return { nome: agencia.nome, razao: agencia.razaoSocial ?? "", documento: agencia.documento ?? "", cidadeForo: agencia.cidadeForo ?? "", representante: u.name, email: u.email, pix: null };
}
const clienteDe = (c: Cliente) => ({ nome: c.nome, documento: c.documento ?? "", email: c.email?.toLowerCase() ?? "", contato: c.contatoNome });

/** Dados do contrato mensal a partir da ficha. */
function dadosMensais(agencia: Agencia, u: { name: string; email: string }, c: Cliente, o: z.output<typeof opcoesSchema>): DadosContratoAgencia {
  const k = contratadaDe(agencia, u);
  return {
    contratada: { nome: k.nome, razao: k.razao, documento: k.documento, cidadeForo: k.cidadeForo, representante: k.representante, email: k.email },
    cliente: clienteDe(c), pacote: c.pacote ?? "", inclusoTexto: inclusoTexto(c.incluso), valorMensalCents: c.valorMensalCents ?? 0, diaVencimento: c.diaVencimento ?? 0,
    inicio: o.inicio, vigenciaMeses: o.vigenciaMeses, avisoPrevioDias: o.avisoPrevioDias, rodadasAjuste: o.rodadasAjuste, prazoAprovacaoDias: o.prazoAprovacaoDias, extras: o.extras?.trim() || null,
  };
}

/** Dados do contrato de projeto (as parcelas recebem ordem e "Sinal/Restante" quando a pessoa não muda o nome). */
function dadosDoProjeto(agencia: Agencia, u: { name: string; email: string }, c: Cliente, o: z.output<typeof projetoSchema>): DadosContratoProjeto {
  return {
    produto: o.modelo, contratada: contratadaDe(agencia, u), cliente: clienteDe(c),
    loja: o.loja?.trim() || null, origem: o.modelo === "MIGRACAO_PLATAFORMA" ? (o.origem?.trim() || "Nuvemshop") : null,
    valorCheioCents: o.valorCheioCents ?? null, valorCents: o.valorCents,
    parcelas: o.parcelas.map((p, i) => ({ ordem: i + 1, descricao: p.descricao, valorCents: p.valorCents, vencimento: p.vencimento, pagoEm: p.pagoEm ?? null, meio: p.pagoEm ? (p.meio ?? "PIX") : null })),
    produtos: o.produtos, banners: o.banners, prazoDias: o.prazoDias,
    cortesias: o.cortesias.map((k) => ({ titulo: k.titulo, valorReferenciaCents: k.valorReferenciaCents ?? null })),
    extras: o.extras?.trim() || null,
  };
}

/** Texto e pendências de qualquer modelo (regra única, usada na prévia, no envio e ao refazer). */
function textoDoModelo(modelo: AgenciaContratoModelo, dados: unknown): { secoes: Secao[]; pendencias: string[] } {
  if (ehProjeto(modelo)) { const d = dados as DadosContratoProjeto; return { secoes: secoesDoProjeto(d), pendencias: pendenciasDoProjeto(d) }; }
  const d = dados as DadosContratoAgencia;
  return { secoes: secoesDoContrato(d), pendencias: pendenciasDoContrato(d) };
}

async function montar(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato) {
  const { agencia, membro } = await escopo(db, actor);
  const c = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, clienteId), eq(agenciaClientes.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Cliente não encontrado.");
  const u = (await db.query.users.findFirst({ where: eq(users.id, membro.userId), columns: { name: true, email: true } }))!;
  if (ehOpcaoProjeto(raw)) {
    const o = projetoSchema.parse(raw);
    const dados = dadosDoProjeto(agencia, u, c, o);
    const { secoes, pendencias } = textoDoModelo(o.modelo, dados);
    return { agencia, membro, cliente: c, modelo: o.modelo as AgenciaContratoModelo, dados: dados as unknown, secoes, pendencias, titulo: tituloDoProjeto(dados, c.nome), valorTotalCents: o.valorCents, aditivoDeId: o.aditivoDeId ?? null };
  }
  const o = opcoesSchema.parse(raw);
  const dados = dadosMensais(agencia, u, c, o);
  const { secoes, pendencias } = textoDoModelo("MENSAL_MARKETING", dados);
  return { agencia, membro, cliente: c, modelo: "MENSAL_MARKETING" as AgenciaContratoModelo, dados: dados as unknown, secoes, pendencias, titulo: `Prestação de serviços de marketing · ${c.nome}`, valorTotalCents: null, aditivoDeId: o.aditivoDeId ?? null };
}

/** Prévia: o texto exatamente como vai sair, e o que falta preencher. */
export async function previaDoContrato(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato) {
  const { dados, secoes, pendencias, titulo, modelo } = await montar(db, actor, clienteId, raw);
  return { dados, secoes, pendencias, titulo, modelo };
}

const pagoIso = (dia: string) => `${dia}T15:00:00.000Z`;

/** Envia o contrato (o envio é a assinatura da agência) e avisa o cliente por e-mail com o link do portal. */
export async function enviarContrato(db: Database, actor: Actor, clienteId: string, raw: OpcoesContrato, now = new Date()) {
  const { agencia, membro, cliente, modelo, dados, secoes, pendencias, titulo, valorTotalCents, aditivoDeId } = await montar(db, actor, clienteId, raw);
  if (pendencias.length) throw new DomainError("CONTRATO_INCOMPLETO", `Falta preencher: ${pendencias.join("; ")}.`);
  const aberto = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.status, "ENVIADO")), columns: { id: true } });
  if (aberto) throw new DomainError("JA_ENVIADO", "Já há um contrato esperando o aceite deste cliente. Cancele aquele antes de mandar outro.");
  if (aditivoDeId) {
    const base = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, aditivoDeId), eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agencia.id)) });
    if (!base || base.status !== "ACEITO") throw new DomainError("ADITIVO", "O aditivo precisa substituir um contrato aceito deste cliente.");
  }
  const id = newId("agct");
  const numero = `AG-${hojeEmSaoPaulo(now).replace(/-/g, "")}-${id.slice(-5).toUpperCase()}`;
  const hash = impressaoDigital(dados, secoes);
  await db.insert(agenciaContratos).values({ id, agenciaId: agencia.id, clienteId: cliente.id, numero, titulo: aditivoDeId ? `Aditivo · ${titulo}` : titulo, dados: dados as Record<string, unknown>, conteudo: { secoes }, hash, enviadoPor: membro.userId, enviadoEm: now.toISOString(), modelo, versaoModelo: ehProjeto(modelo) ? VERSAO_PROJETO : 1, valorTotalCents, aditivoDeId });
  if (ehProjeto(modelo)) {
    // Cada parcela vira uma cobrança avulsa ligada ao contrato; a que já foi paga nasce paga (com a data e o meio).
    const d = dados as DadosContratoProjeto;
    await db.insert(agenciaFaturas).values(d.parcelas.map((p) => ({
      id: newId("agft"), agenciaId: agencia.id, clienteId: cliente.id, competencia: (p.pagoEm ?? p.vencimento).slice(0, 7), descricao: `${MODELO_ROTULO[modelo]} · ${p.descricao}`,
      valorCents: p.valorCents, vencimento: p.vencimento, avulsa: true, contratoId: id, parcela: p.ordem,
      ...(p.pagoEm ? { situacao: "PAGA" as const, pagoEm: pagoIso(p.pagoEm), pagoComo: "MANUAL" as const, pagoMeio: p.meio, observacao: `Pago antes do contrato ${numero}` } : {}),
    })));
  }
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_ENVIADO", entityType: "agencia_contrato", entityId: id, after: { numero, clienteId: cliente.id, hash, modelo } }, { force: true });
  const resumo = ehProjeto(modelo) ? `${MODELO_ROTULO[modelo]}, ${formatar.brl(valorTotalCents ?? 0)}` : `${formatar.brl((dados as DadosContratoAgencia).valorMensalCents)} por mês`;
  await sendEmail(db, {
    kind: "AGENCIA_CONTRATO_ENVIADO", to: (dados as { cliente: { email: string } }).cliente.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${id}:enviado`,
    subject: `${agencia.nome}: seu contrato está pronto para aceite`,
    text: `Olá! A ${agencia.nome} enviou o contrato ${numero} (${resumo}). Leia com calma e aceite pelo portal, com o seu e-mail e um código, sem senha. Depois do aceite, a cópia assinada chega por e-mail.`,
    cta: { label: "Ler e aceitar", url: urlDoPortal(agencia.slug) },
  });
  return { id, numero };
}

/** Cancela as cobranças ainda abertas de um contrato (as pagas ficam). */
async function cancelarParcelasAbertas(db: Database, contratoId: string, motivo: string) {
  await db.update(agenciaFaturas).set({ situacao: "CANCELADA", observacao: motivo, updatedAt: new Date().toISOString() }).where(and(eq(agenciaFaturas.contratoId, contratoId), eq(agenciaFaturas.situacao, "ABERTA")));
}

export async function cancelarContratoDaAgencia(db: Database, actor: Actor, id: string, now = new Date()) {
  const { agencia } = await escopo(db, actor);
  const r = await db.update(agenciaContratos).set({ status: "CANCELADO", canceladoEm: now.toISOString() }).where(and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id), eq(agenciaContratos.status, "ENVIADO"))).returning({ id: agenciaContratos.id, numero: agenciaContratos.numero });
  if (!r.length) throw new DomainError("NAO_CANCELA", "Só dá para cancelar contrato que ainda não foi aceito.");
  await cancelarParcelasAbertas(db, id, `Contrato ${r[0]!.numero} cancelado`);
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_CANCELADO", entityType: "agencia_contrato", entityId: id }, { force: true });
}

/** Encerra um contrato aceito (fim do trabalho, desistência): nada é apagado; cobranças abertas são canceladas. */
export async function encerrarContratoDaAgencia(db: Database, actor: Actor, id: string, motivo: string, now = new Date()) {
  const { agencia } = await escopo(db, actor);
  const m = z.string().trim().min(3, "Diga o motivo").max(300).parse(motivo);
  const r = await db.update(agenciaContratos).set({ status: "ENCERRADO", encerradoEm: now.toISOString(), encerradoMotivo: m }).where(and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id), eq(agenciaContratos.status, "ACEITO"))).returning({ id: agenciaContratos.id, numero: agenciaContratos.numero });
  if (!r.length) throw new DomainError("NAO_ENCERRA", "Só dá para encerrar contrato aceito.");
  await cancelarParcelasAbertas(db, id, `Contrato ${r[0]!.numero} encerrado: ${m}`);
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_ENCERRADO", entityType: "agencia_contrato", entityId: id, after: { motivo: m } }, { force: true });
}

/**
 * Os dados da ficha mudaram (D341, "editar quando eu quiser"): contrato ENVIADO e ainda não aceito é refeito com os dados
 * novos (o cliente lê o texto atualizado). Contrato aceito nunca muda: para isso existe o aditivo.
 */
export async function regerarContratosPendentes(db: Database, agenciaId: string, clienteId: string) {
  const [pend, c, agencia] = await Promise.all([
    db.select().from(agenciaContratos).where(and(eq(agenciaContratos.agenciaId, agenciaId), eq(agenciaContratos.clienteId, clienteId), eq(agenciaContratos.status, "ENVIADO"), eq(agenciaContratos.origem, "AGENCIA"))),
    db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, clienteId), eq(agenciaClientes.agenciaId, agenciaId)) }),
    db.query.agencias.findFirst({ where: eq(agencias.id, agenciaId) }),
  ]);
  if (!c || !agencia) return 0;
  for (const k of pend) {
    const antigo = k.dados as Record<string, unknown> & { contratada: Record<string, unknown> };
    const contratada = { ...antigo.contratada, razao: agencia.razaoSocial || antigo.contratada.razao, documento: agencia.documento || antigo.contratada.documento, cidadeForo: agencia.cidadeForo || antigo.contratada.cidadeForo };
    const dados = ehProjeto(k.modelo)
      ? { ...antigo, contratada, cliente: clienteDe(c) }
      : { ...antigo, contratada, cliente: clienteDe(c), pacote: c.pacote ?? "", inclusoTexto: inclusoTexto(c.incluso), valorMensalCents: c.valorMensalCents ?? 0, diaVencimento: c.diaVencimento ?? 0 };
    const { secoes } = textoDoModelo(k.modelo, dados);
    const hash = impressaoDigital(dados, secoes);
    if (hash === k.hash) continue;
    const titulo = ehProjeto(k.modelo) ? `${k.aditivoDeId ? "Aditivo · " : ""}${tituloDoProjeto(dados as DadosContratoProjeto, c.nome)}` : `${k.aditivoDeId ? "Aditivo · " : ""}Prestação de serviços de marketing · ${c.nome}`;
    await db.update(agenciaContratos).set({ dados, conteudo: { secoes }, hash, titulo }).where(and(eq(agenciaContratos.id, k.id), eq(agenciaContratos.status, "ENVIADO")));
  }
  return pend.length;
}

export async function contratosDoClienteNaAgencia(db: Database, actor: Actor, clienteId: string) {
  const { agencia } = await escopo(db, actor);
  return db.select({ id: agenciaContratos.id, numero: agenciaContratos.numero, titulo: agenciaContratos.titulo, modelo: agenciaContratos.modelo, origem: agenciaContratos.origem, status: agenciaContratos.status, enviadoEm: agenciaContratos.enviadoEm, aceitoEm: agenciaContratos.aceitoEm, aceitoNome: agenciaContratos.aceitoNome })
    .from(agenciaContratos).where(and(eq(agenciaContratos.agenciaId, agencia.id), eq(agenciaContratos.clienteId, clienteId), ne(agenciaContratos.status, "CANCELADO"))).orderBy(desc(agenciaContratos.enviadoEm));
}

// ---------------------------------------------------------------------------
// Tela Contratos (D341): lista com o que já foi pago, detalhe, parcelas e e-mail
// ---------------------------------------------------------------------------
export const FILTROS_CONTRATO = { todos: "Todos", aguardando: "Aguardando aceite", aceitos: "Aceitos", "a-receber": "Com parcela a receber", master: "Trazidos do Master", encerrados: "Encerrados e cancelados" } as const;
export type FiltroContrato = keyof typeof FILTROS_CONTRATO;

/** Situação para a tela, a partir do contrato e das cobranças dele. */
export function situacaoDoContrato(c: Pick<Contrato, "status">, pagoCents: number, totalCents: number) {
  if (c.status === "CANCELADO") return { rotulo: "Cancelado", tom: "neutral" as const };
  if (c.status === "ENCERRADO") return { rotulo: "Encerrado", tom: "neutral" as const };
  if (c.status === "ENVIADO") return { rotulo: "Aguardando aceite", tom: "warning" as const };
  if (totalCents > 0 && pagoCents < totalCents) return { rotulo: "Aceito · a receber", tom: "info" as const };
  return { rotulo: "Aceito", tom: "success" as const };
}

async function pagamentosPorContrato(db: Database, agenciaId: string, ids: string[]) {
  const m = new Map<string, { pagoCents: number; totalCents: number; abertas: number; registradoNoMaster: boolean }>();
  if (!ids.length) return m;
  const fs = await db.select({ contratoId: agenciaFaturas.contratoId, valorCents: agenciaFaturas.valorCents, situacao: agenciaFaturas.situacao, registradoNoMaster: agenciaFaturas.registradoNoMaster }).from(agenciaFaturas).where(and(eq(agenciaFaturas.agenciaId, agenciaId), inArray(agenciaFaturas.contratoId, ids), ne(agenciaFaturas.situacao, "CANCELADA")));
  for (const f of fs) {
    const x = m.get(f.contratoId!) ?? { pagoCents: 0, totalCents: 0, abertas: 0, registradoNoMaster: false };
    x.totalCents += f.valorCents;
    if (f.situacao === "PAGA") x.pagoCents += f.valorCents; else x.abertas++;
    if (f.registradoNoMaster) x.registradoNoMaster = true;
    m.set(f.contratoId!, x);
  }
  return m;
}

/** Lista da tela Contratos, com números do topo. */
export async function contratosDaAgencia(db: Database, actor: Actor, filtro: FiltroContrato = "todos", busca = "", hoje = hojeEmSaoPaulo()) {
  const { agencia, membro } = await escopo(db, actor);
  const rows = await db.select({ c: agenciaContratos, cliente: agenciaClientes.nome }).from(agenciaContratos).innerJoin(agenciaClientes, eq(agenciaClientes.id, agenciaContratos.clienteId)).where(eq(agenciaContratos.agenciaId, agencia.id)).orderBy(desc(agenciaContratos.enviadoEm));
  const pag = await pagamentosPorContrato(db, agencia.id, rows.map((r) => r.c.id));
  const todos = rows.map(({ c, cliente }) => {
    const p = pag.get(c.id) ?? { pagoCents: 0, totalCents: c.valorTotalCents ?? 0, abertas: 0, registradoNoMaster: false };
    return { id: c.id, numero: c.numero, titulo: c.titulo, cliente, clienteId: c.clienteId, modelo: c.modelo, origem: c.origem, status: c.status, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aditivo: !!c.aditivoDeId, ...p, situacao: situacaoDoContrato(c, p.pagoCents, p.totalCents) };
  });
  const q = busca.trim().toLowerCase();
  const lista = todos.filter((c) => {
    if (q && !`${c.numero} ${c.cliente} ${c.titulo}`.toLowerCase().includes(q)) return false;
    switch (filtro) {
      case "aguardando": return c.status === "ENVIADO";
      case "aceitos": return c.status === "ACEITO";
      case "a-receber": return c.status !== "CANCELADO" && c.abertas > 0;
      case "master": return c.origem === "MASTER";
      case "encerrados": return c.status === "CANCELADO" || c.status === "ENCERRADO";
      default: return true;
    }
  });
  const mes = hoje.slice(0, 7);
  const vivos = todos.filter((c) => c.status === "ENVIADO" || c.status === "ACEITO");
  return {
    agencia: { nome: agencia.nome, interna: agencia.interna }, podeTrazerDoMaster: agencia.interna && pode.gerirEquipe(membro),
    numeros: {
      aguardando: todos.filter((c) => c.status === "ENVIADO").length,
      aceitosNoMes: todos.filter((c) => c.aceitoEm?.slice(0, 7) === mes).length,
      projetosNoMesCents: todos.filter((c) => c.enviadoEm.slice(0, 7) === mes && ehProjeto(c.modelo) && c.status !== "CANCELADO" && c.origem === "AGENCIA").reduce((s, c) => s + c.totalCents, 0),
      aReceberCents: vivos.reduce((s, c) => s + (c.totalCents - c.pagoCents), 0),
    },
    lista,
  };
}

/** Um contrato com as parcelas, o cliente e o histórico (aditivos). */
export async function detalheDoContrato(db: Database, actor: Actor, id: string, hoje = hojeEmSaoPaulo()) {
  const { agencia } = await escopo(db, actor);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  const [cliente, parcelas, aditivos, base] = await Promise.all([
    db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, c.clienteId) }),
    db.select().from(agenciaFaturas).where(and(eq(agenciaFaturas.contratoId, c.id), eq(agenciaFaturas.agenciaId, agencia.id))).orderBy(asc(agenciaFaturas.parcela)),
    db.select({ id: agenciaContratos.id, numero: agenciaContratos.numero, status: agenciaContratos.status }).from(agenciaContratos).where(and(eq(agenciaContratos.aditivoDeId, c.id), eq(agenciaContratos.agenciaId, agencia.id))),
    c.aditivoDeId ? db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, c.aditivoDeId), eq(agenciaContratos.agenciaId, agencia.id)), columns: { id: true, numero: true } }) : Promise.resolve(undefined),
  ]);
  const validas = parcelas.filter((p) => p.situacao !== "CANCELADA");
  const pg = situacaoDoPagamento(validas.map((p) => ({ valorCents: p.valorCents, pagoEm: p.situacao === "PAGA" ? p.pagoEm : null })));
  const origemNumero = c.origemContratoId ? c.numero : null;
  return {
    contrato: c, cliente: cliente!, agencia: { nome: agencia.nome, slug: agencia.slug, interna: agencia.interna }, linkPortal: urlDoPortal(agencia.slug),
    parcelas: parcelas.map((p) => ({ ...p, atrasada: p.situacao === "ABERTA" && p.vencimento < hoje })), pagamento: pg,
    situacao: situacaoDoContrato(c, pg.pagoCents, pg.totalCents), aditivos, substitui: base ?? null, origemNumero,
    texto: c.conteudo.secoes, integro: impressaoDigital(c.dados, c.conteudo.secoes) === c.hash,
  };
}

/** Mensagem pronta para o WhatsApp com o link do portal (a pessoa revisa e envia). */
export function mensagemDoContrato(c: { numero: string; status: string }, cliente: { nome: string; contatoNome: string | null }, agencia: string, link: string) {
  const nome = (cliente.contatoNome || cliente.nome).split(" ")[0];
  return c.status === "ENVIADO"
    ? `Olá, ${nome}! Aqui é da ${agencia}. Seu contrato ${c.numero} está pronto. Para ler e aceitar, entre no portal com o seu e-mail (chega um código, sem senha): ${link}`
    : `Olá, ${nome}! Aqui é da ${agencia}. Seu contrato ${c.numero} está assinado e fica sempre no portal: ${link}. A cópia em PDF também foi para o seu e-mail.`;
}

// ---------------------------------------------------------------------------
// Portal do cliente
// ---------------------------------------------------------------------------
/** Contratos que o cliente vê no portal: os que esperam o aceite (com o texto) e os aceitos. */
export async function contratosDoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string) {
  const { cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  return contratosVistosPeloCliente(db, agenciaId, cliente.id);
}
/** Os contratos como o cliente vê (portal e "Ver como cliente"). Quem chama já conferiu o acesso. */
export async function contratosVistosPeloCliente(db: Database, agenciaId: string, clienteId: string) {
  const rows = await db.select().from(agenciaContratos).where(and(eq(agenciaContratos.clienteId, clienteId), eq(agenciaContratos.agenciaId, agenciaId), ne(agenciaContratos.status, "CANCELADO"))).orderBy(desc(agenciaContratos.enviadoEm));
  return rows.map((c) => ({ id: c.id, numero: c.numero, titulo: c.titulo, status: c.status, hash: c.hash, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aceitoNome: c.aceitoNome, origem: c.origem, secoes: c.status === "ENVIADO" ? c.conteudo.secoes : [] }));
}

export const aceiteSchema = z.object({ concordo: z.literal(true, { error: "Marque \"Li e concordo\" para aceitar." }), hashVisto: z.string().length(64), nome: z.string().trim().min(3, "Digite o seu nome completo").max(120) });

/** E-mails com o PDF assinado: à agência (contratada, administradores e financeiro) e ao cliente. */
async function enviarPdfAssinado(db: Database, c: Contrato, agenciaId: string, opts: { paraAgencia: boolean; chave: string; quando: string; nomeCliente: string; emailCliente: string | null }) {
  const anexo = [{ filename: `Contrato-${c.numero}.pdf`, contentBase64: Buffer.from(await pdfDoContratoDaAgencia(c)).toString("base64") }];
  const d = c.dados as { contratada: { nome?: string; razao: string; email?: string; emailRepresentante?: string } };
  const contratada = d.contratada.nome ?? d.contratada.razao;
  if (opts.paraAgencia) {
    const admins = await db.select({ email: users.email }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(and(eq(agenciaMembros.agenciaId, agenciaId), inArray(agenciaMembros.funcao, ["ADMIN", "FINANCEIRO"])));
    for (const to of new Set([d.contratada.email ?? d.contratada.emailRepresentante, ...admins.map((a) => a.email)].filter(Boolean) as string[])) {
      await sendEmail(db, { kind: "AGENCIA_CONTRATO_ACEITO", to, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${c.id}:aceito:${to}`, subject: `Contrato ${c.numero} aceito por ${opts.nomeCliente}`, text: `${c.aceitoNome ?? opts.nomeCliente} aceitou o contrato ${c.numero} (${c.titulo}) em ${opts.quando}. A cópia assinada pelas duas partes está em anexo.\n\nImpressão digital: ${c.hash}`, attachments: anexo });
    }
  }
  if (opts.emailCliente) await sendEmail(db, { kind: "AGENCIA_CONTRATO_ACEITO_CLIENTE", to: opts.emailCliente, brand: "NEXTLEVEL_COMMERCE", dedupeKey: opts.chave, subject: `Seu contrato com a ${contratada} está assinado`, text: `Olá! Segue a cópia assinada do contrato ${c.numero} (${c.titulo}), aceito em ${opts.quando}. Ela também fica no portal do cliente, junto com as parcelas.`, attachments: anexo });
}

/** Aceite do cliente no portal: só uma vez, só do texto que ele viu, com a prova gravada e o PDF para os dois lados. */
export async function aceitarContratoNoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string, id: string, raw: z.input<typeof aceiteSchema>, prova: { ip: string | null; aparelho: string | null }, now = new Date()) {
  const { email, cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const input = aceiteSchema.parse(raw);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agenciaId)) });
  if (!c || c.status === "CANCELADO") throw new NotFoundError("Contrato não encontrado.");
  if (c.status !== "ENVIADO") throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  if (input.hashVisto !== c.hash || impressaoDigital(c.dados, c.conteudo.secoes) !== c.hash) throw new DomainError("CONTRATO_MUDOU", "O contrato mudou desde que você abriu a página. Recarregue e leia de novo.");
  const r = await db.update(agenciaContratos).set({ status: "ACEITO", aceitoEmail: email, aceitoNome: input.nome, aceitoEm: now.toISOString(), aceitoIp: prova.ip?.slice(0, 100) ?? null, aceitoAparelho: prova.aparelho?.slice(0, 300) ?? null, aceitoHash: c.hash, emailAceiteEnviadoEm: now.toISOString() })
    .where(and(eq(agenciaContratos.id, c.id), eq(agenciaContratos.status, "ENVIADO"))).returning({ id: agenciaContratos.id });
  if (!r.length) throw new DomainError("JA_ACEITO", "Este contrato já foi aceito.");
  await db.update(agenciaClientes).set({ onboarding: { ...(cliente.onboarding ?? {}), contrato: now.toISOString() }, updatedAt: now.toISOString() }).where(eq(agenciaClientes.id, cliente.id));
  const aceito = (await db.query.agenciaContratos.findFirst({ where: eq(agenciaContratos.id, c.id) }))!;
  await enviarPdfAssinado(db, aceito, agenciaId, { paraAgencia: true, chave: `agencia-contrato:${c.id}:aceito-cliente`, quando: dataHora(now.toISOString()), nomeCliente: cliente.nome, emailCliente: email });
  return { numero: c.numero };
}

/** "Reenviar por e-mail": manda de novo o PDF assinado ao cliente (o e-mail da ficha, ou o do aceite). */
export async function reenviarContratoPorEmail(db: Database, actor: Actor, id: string, now = new Date()) {
  const { agencia } = await escopo(db, actor);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  const cliente = (await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, c.clienteId) }))!;
  const para = cliente.email || c.aceitoEmail;
  if (!para) throw new DomainError("SEM_EMAIL", "Cadastre o e-mail do cliente para mandar o contrato.");
  if (c.status === "ENVIADO") {
    await sendEmail(db, { kind: "AGENCIA_CONTRATO_LEMBRETE", to: para, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `agencia-contrato:${c.id}:lembrete:${now.toISOString()}`, subject: `${agencia.nome}: seu contrato ${c.numero} espera o seu aceite`, text: `Olá! O contrato ${c.numero} (${c.titulo}) está no portal esperando o seu aceite. Entre com o seu e-mail e um código, sem senha.`, cta: { label: "Ler e aceitar", url: urlDoPortal(agencia.slug) } });
  } else if (c.status === "ACEITO" || c.status === "ENCERRADO") {
    await enviarPdfAssinado(db, c, agencia.id, { paraAgencia: false, chave: `agencia-contrato:${c.id}:reenvio:${now.toISOString()}`, quando: dataHora(c.aceitoEm ?? c.enviadoEm), nomeCliente: cliente.nome, emailCliente: para });
    await db.update(agenciaContratos).set({ emailAceiteEnviadoEm: now.toISOString() }).where(eq(agenciaContratos.id, c.id));
  } else throw new DomainError("CANCELADO", "Contrato cancelado não é enviado.");
  await recordAudit(db, actor, { action: "AGENCIA_CONTRATO_REENVIADO", entityType: "agencia_contrato", entityId: c.id, after: { para } }, { force: true });
  return { para };
}

/** PDF do contrato. Trazido do Master: o mesmo PDF de lá (mesma impressão digital). Projeto e mensal: marca da agência. */
export function pdfDoContratoDaAgencia(c: Contrato) {
  if (c.origem === "MASTER") {
    return gerarPdfContrato({ numero: c.numero, titulo: c.titulo, hash: c.hash, dados: c.dados as unknown as DadosLojaPronta, secoes: c.conteudo.secoes, enviadoEm: c.enviadoEm, aceitoEm: c.aceitoEm, aceitoNome: c.aceitoNome, aceitoIp: c.aceitoIp, aceitoAparelho: c.aceitoAparelho });
  }
  const aceite = (doc: string) => c.aceitoEm ? `CONTRATANTE: ${c.aceitoNome}, CPF/CNPJ ${doc}. Aceito no portal do cliente, com código enviado a ${c.aceitoEmail}, em ${dataHora(c.aceitoEm)}. Endereço de rede: ${c.aceitoIp ?? "não informado"}. Aparelho: ${c.aceitoAparelho ?? "não informado"}.` : "CONTRATANTE: aguardando o aceite no portal do cliente.";
  if (ehProjeto(c.modelo)) {
    const d = c.dados as unknown as DadosContratoProjeto;
    const pg = situacaoDoPagamento(d.parcelas);
    const abertas = d.parcelas.filter((p) => !p.pagoEm);
    return gerarPdfDocumento({
      titulo: `Contrato ${c.numero} · ${c.titulo}`, autor: d.contratada.razao, marca: d.contratada.pix ? ["NextLevel", "Soluções"] : [d.contratada.nome, "com tecnologia NextLevel"],
      cabecalho: ["Contrato de Prestação de Serviços", `${MODELO_ROTULO[c.modelo]} · nº ${c.numero} · ${formatar.data(c.enviadoEm)}`],
      rodape: `Contrato ${c.numero} · ${d.contratada.nome} e ${d.cliente.nome}`,
      resumo: resumoDoProjetoParaPdf(d),
      destaque: d.contratada.pix && !pg.quitado ? {
        rotulo: "DADOS PARA PAGAMENTO · PIX", chaveRotulo: "Chave Pix (CNPJ)", chave: d.contratada.pix.chave,
        lado: [`Banco ${d.contratada.pix.banco}`, `Favorecido: ${d.contratada.pix.favorecido}`, ...abertas.map((p) => `${p.descricao}: ${formatar.brl(p.valorCents)} até ${formatar.data(p.vencimento)}`)],
        nota: `Confira o nome do favorecido antes de confirmar e envie o comprovante para ${d.contratada.email}.`,
      } : undefined,
      secoes: c.conteudo.secoes,
      registro: [`CONTRATADA: ${d.contratada.razao}, CNPJ/CPF ${d.contratada.documento}, representada por ${d.contratada.representante}. Assinado e enviado pelo Painel da Agência em ${dataHora(c.enviadoEm)}.`, aceite(d.cliente.documento)],
      hash: c.hash,
    });
  }
  const d = c.dados as unknown as DadosContratoAgencia;
  return gerarPdfDocumento({
    titulo: `Contrato ${c.numero} · ${c.titulo}`, autor: d.contratada.razao, marca: [d.contratada.nome, "com tecnologia NextLevel"],
    cabecalho: ["Contrato de Prestação de Serviços", `Marketing digital · nº ${c.numero} · ${formatar.data(c.enviadoEm)}`],
    rodape: `Contrato ${c.numero} · ${d.contratada.nome} e ${d.cliente.nome}`,
    resumo: [
      ["Contratada", `${d.contratada.razao} · CNPJ/CPF ${d.contratada.documento} · representada por ${d.contratada.representante} · ${d.contratada.email}`],
      ["Contratante", `${d.cliente.nome} · CPF/CNPJ ${d.cliente.documento} · ${d.cliente.email}`],
      ["Pacote", `${d.pacote ? `${d.pacote}: ` : ""}${d.inclusoTexto}`],
      ["Valor", `${formatar.brl(d.valorMensalCents)} por mês, vencimento todo dia ${d.diaVencimento}`],
      ["Vigência", `A partir de ${formatar.data(d.inicio)}, ${d.vigenciaMeses} meses com renovação automática; aviso prévio de ${d.avisoPrevioDias} dias`],
    ],
    secoes: c.conteudo.secoes,
    registro: [`CONTRATADA: ${d.contratada.razao}, CNPJ/CPF ${d.contratada.documento}, representada por ${d.contratada.representante}. Assinado e enviado pelo Painel da Agência em ${dataHora(c.enviadoEm)}.`, aceite(d.cliente.documento)],
    hash: c.hash,
  });
}

/** Contrato para baixar: pela agência (administrador e financeiro) ou pelo cliente dono, no portal. */
export async function contratoParaPdfDaAgencia(db: Database, actor: Actor, id: string) {
  const { agencia } = await escopo(db, actor);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.agenciaId, agencia.id)) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  return c;
}
export async function contratoParaPdfDoPortal(db: Database, agenciaId: string, token: string | undefined, clienteId: string, id: string) {
  const { cliente } = await clienteDoPortal(db, agenciaId, token, clienteId);
  const c = await db.query.agenciaContratos.findFirst({ where: and(eq(agenciaContratos.id, id), eq(agenciaContratos.clienteId, cliente.id), eq(agenciaContratos.agenciaId, agenciaId), ne(agenciaContratos.status, "CANCELADO")) });
  if (!c) throw new NotFoundError("Contrato não encontrado.");
  return c;
}

