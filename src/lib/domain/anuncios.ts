import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { anunciosEventos, anunciosLoja, anunciosResultados, corporateQuotes, orders, stores, users, type AnuncioStatus } from "@/db/schema";
import { newId } from "@/lib/ids";
import { sendEmail } from "@/lib/email";
import { type Actor, requireMasterFn } from "./access";
import { recordAudit } from "./audit";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { getCatalogItem } from "./nl-catalog";
import { storeUrl } from "@/lib/store-url";
import { brandByCode } from "@/lib/brand";

/**
 * Anúncios da loja na Meta (D299). O lojista faz um diagnóstico no painel; a equipe da NextLevel recebe na "mesa de
 * anúncios" do Master, manda a proposta, configura a campanha no Gerenciador de Anúncios (conta do lojista, verba no
 * cartão dele) e acompanha. Tudo manual por enquanto; a "sala da campanha" mostra ao lojista cada etapa, o que falta
 * dele, a conversa com a equipe, os números lançados e as vendas da loja com a etiqueta da campanha (automático).
 * Sem promessa de resultado em nenhum texto.
 */

// ---------------------------------------------------------------------------------------------------------------------
// Etapas (o que o lojista vê)
// ---------------------------------------------------------------------------------------------------------------------
export const ETAPAS_ANUNCIO: { status: AnuncioStatus; rotulo: string; titulo: string; agora: string; quem: "VOCE" | "EQUIPE" | "META" }[] = [
  { status: "RASCUNHO", rotulo: "Diagnóstico", titulo: "Diagnóstico em andamento", agora: "Responda as perguntas: é com elas que a equipe monta a sua campanha. Tudo fica salvo enquanto você responde.", quem: "VOCE" },
  { status: "ENVIADA", rotulo: "Na mesa da equipe", titulo: "Recebemos o seu diagnóstico", agora: "O pedido está na mesa da equipe de anúncios da NextLevel. Um especialista vai assumir e responder por aqui.", quem: "EQUIPE" },
  { status: "ANALISE", rotulo: "Análise", titulo: "Especialista analisando", agora: "A equipe está estudando os seus produtos, o público e a concorrência para desenhar a campanha.", quem: "EQUIPE" },
  { status: "PROPOSTA", rotulo: "Proposta", titulo: "Proposta pronta para você", agora: "Veja a proposta abaixo. Com o seu aceite, seguimos para a preparação.", quem: "VOCE" },
  { status: "PREPARACAO", rotulo: "Preparação", titulo: "Preparando o terreno", agora: "Faltam alguns passos do seu lado (acesso à conta de anúncios, forma de pagamento na Meta, fotos e vídeos). Marque cada um quando fizer.", quem: "VOCE" },
  { status: "CONFIGURACAO", rotulo: "Montagem", titulo: "Montando a campanha", agora: "A equipe está criando os públicos, os anúncios e os textos no Gerenciador de Anúncios da Meta.", quem: "EQUIPE" },
  { status: "REVISAO_META", rotulo: "Revisão da Meta", titulo: "Em revisão pela Meta", agora: "A Meta confere todo anúncio antes de mostrar. Costuma levar até 24 horas; avisamos aqui quando aprovar.", quem: "META" },
  { status: "NO_AR", rotulo: "No ar", titulo: "Campanha no ar", agora: "Os anúncios estão rodando. A equipe acompanha e lança os números aqui; as vendas da loja com a etiqueta da campanha aparecem sozinhas.", quem: "EQUIPE" },
];
export const ROTULO_STATUS: Record<AnuncioStatus, string> = {
  RASCUNHO: "Diagnóstico em andamento", ENVIADA: "Na mesa da equipe", ANALISE: "Em análise", PROPOSTA: "Proposta enviada", PREPARACAO: "Preparação",
  CONFIGURACAO: "Montando a campanha", REVISAO_META: "Em revisão pela Meta", NO_AR: "No ar", PAUSADA: "Pausada", ENCERRADA: "Encerrada", CANCELADA: "Cancelada",
};

// ---------------------------------------------------------------------------------------------------------------------
// Diagnóstico
// ---------------------------------------------------------------------------------------------------------------------
export const OBJETIVOS = { VENDAS: "Vender mais na loja", WHATSAPP: "Receber mensagens no WhatsApp", ALCANCE: "Ficar conhecido na minha região", LANCAMENTO: "Divulgar um lançamento ou promoção" } as const;
export const MATERIAIS = { FOTOS: "Tenho boas fotos dos produtos", VIDEOS: "Tenho vídeos (Reels, provador, bastidores)", AJUDA: "Preciso de ajuda com fotos e vídeos" } as const;
const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;

const base = {
  objetivo: z.enum(Object.keys(OBJETIVOS) as [keyof typeof OBJETIVOS]),
  lojaToda: z.boolean(),
  produtos: z.array(z.string().max(40)).max(10),
  genero: z.enum(["TODOS", "MULHERES", "HOMENS"]),
  idadeMin: z.number().int().min(18).max(65),
  idadeMax: z.number().int().min(18).max(65),
  regiao: z.enum(["BRASIL", "ESTADOS", "CIDADE"]),
  estados: z.array(z.enum(UFS)).max(27),
  cidade: z.string().trim().max(80),
  raioKm: z.number().int().min(1).max(80),
  interesses: z.string().trim().max(300),
  verbaDiariaCents: z.number().int().min(1000, "A verba mínima é R$ 10 por dia.").max(10_000_000),
  duracao: z.enum(["7", "15", "30", "CONTINUA"]),
  instagram: z.string().trim().max(60).transform((v) => v.replace(/^@+/, "").replace(/[^\w.]/g, "")),
  contaAnuncios: z.enum(["SIM", "NAO", "NAO_SEI"]),
  materiais: z.array(z.enum(Object.keys(MATERIAIS) as [keyof typeof MATERIAIS])).max(3),
  oferta: z.string().trim().max(300),
  diferencial: z.string().trim().max(300),
  observacoes: z.string().trim().max(600),
};
/** Rascunho: tudo opcional (salva enquanto responde). */
export const diagnosticoParcial = z.object(base).partial();
/** Envio: o essencial preenchido. */
export const diagnosticoCompleto = z.object(base).partial().extend({
  objetivo: base.objetivo, genero: base.genero, idadeMin: base.idadeMin, idadeMax: base.idadeMax, regiao: base.regiao,
  verbaDiariaCents: base.verbaDiariaCents, duracao: base.duracao, contaAnuncios: base.contaAnuncios,
}).superRefine((d, ctx) => {
  if (d.idadeMin > d.idadeMax) ctx.addIssue({ code: "custom", message: "A idade mínima é maior que a máxima.", path: ["idadeMin"] });
  if (!d.lojaToda && !(d.produtos?.length)) ctx.addIssue({ code: "custom", message: "Escolha os produtos ou marque \"a loja toda\".", path: ["produtos"] });
  if (d.regiao === "ESTADOS" && !(d.estados?.length)) ctx.addIssue({ code: "custom", message: "Escolha pelo menos um estado.", path: ["estados"] });
  if (d.regiao === "CIDADE" && !d.cidade) ctx.addIssue({ code: "custom", message: "Informe a cidade.", path: ["cidade"] });
});
export type Diagnostico = z.infer<typeof diagnosticoParcial>;

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DIAS: Record<string, number | null> = { "7": 7, "15": 15, "30": 30, CONTINUA: null };
/** Resumo em português do diagnóstico (briefing da proposta, mesa da equipe). */
export function resumoDiagnostico(d: Diagnostico, nomesProdutos: string[] = []): string[] {
  const linhas: string[] = [];
  if (d.objetivo) linhas.push(`Objetivo: ${OBJETIVOS[d.objetivo]}`);
  linhas.push(d.lojaToda ? "Anunciar: a loja toda" : `Anunciar: ${nomesProdutos.join(", ") || `${d.produtos?.length ?? 0} produto(s)`}`);
  if (d.genero) linhas.push(`Público: ${{ TODOS: "todos", MULHERES: "mulheres", HOMENS: "homens" }[d.genero]}, de ${d.idadeMin ?? 18} a ${d.idadeMax ?? 65} anos`);
  if (d.regiao) linhas.push(`Onde: ${d.regiao === "BRASIL" ? "Brasil todo" : d.regiao === "ESTADOS" ? (d.estados ?? []).join(", ") : `${d.cidade} (raio de ${d.raioKm ?? 10} km)`}`);
  if (d.interesses) linhas.push(`Interesses: ${d.interesses}`);
  if (d.verbaDiariaCents) { const dias = DIAS[d.duracao ?? "30"]; linhas.push(`Verba na Meta: ${brl(d.verbaDiariaCents)} por dia${dias ? ` por ${dias} dias (cerca de ${brl(d.verbaDiariaCents * dias)})` : ", contínua"}`); }
  if (d.instagram) linhas.push(`Instagram: @${d.instagram}`);
  if (d.contaAnuncios) linhas.push(`Conta de anúncios: ${{ SIM: "já tem", NAO: "ainda não tem", NAO_SEI: "não sabe" }[d.contaAnuncios]}`);
  if (d.materiais?.length) linhas.push(`Materiais: ${d.materiais.map((m) => MATERIAIS[m]).join("; ")}`);
  if (d.oferta) linhas.push(`Oferta: ${d.oferta}`);
  if (d.diferencial) linhas.push(`Diferencial: ${d.diferencial}`);
  if (d.observacoes) linhas.push(`Observações: ${d.observacoes}`);
  return linhas;
}

// ---------------------------------------------------------------------------------------------------------------------
// Acesso
// ---------------------------------------------------------------------------------------------------------------------
const equipe = (actor: Actor) => requireMasterFn(actor, ["COMERCIAL", "CONTEUDO"]);
function daLoja(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja cuida dos anúncios.");
  return actor.storeId;
}
async function carregar(db: Database, id: string) {
  const a = await db.query.anunciosLoja.findFirst({ where: eq(anunciosLoja.id, id) });
  if (!a) throw new NotFoundError("Campanha não encontrada.");
  return a;
}
async function doLojista(db: Database, actor: Actor, id: string) {
  const storeId = daLoja(actor);
  const a = await carregar(db, id);
  if (a.storeId !== storeId) throw new NotFoundError("Campanha não encontrada.");
  return a;
}

async function evento(db: Database, anuncioId: string, e: { autor: "LOJISTA" | "EQUIPE" | "SISTEMA"; autorNome?: string | null; tipo: "ETAPA" | "MENSAGEM" | "PENDENCIA" | "RESULTADO" | "PROPOSTA"; texto: string }) {
  await db.insert(anunciosEventos).values({ id: newId("aev"), anuncioId, autor: e.autor, autorNome: e.autorNome ?? null, tipo: e.tipo, texto: e.texto.slice(0, 2000) });
}

async function avisarLojista(db: Database, a: typeof anunciosLoja.$inferSelect, assunto: string, texto: string, dedupe?: string) {
  const dono = await db.query.users.findFirst({ where: and(eq(users.storeId, a.storeId), eq(users.role, "STORE_OWNER")), columns: { email: true, name: true } });
  if (!dono?.email) return;
  await sendEmail(db, { kind: "ANUNCIO_ETAPA", to: dono.email, brand: "NEXTLEVEL_COMMERCE", ...(dedupe ? { dedupeKey: dedupe } : {}), subject: assunto, text: `Olá, ${dono.name.split(" ")[0]}!\n\n${texto}\n\nAcompanhe tudo no seu painel, em Anúncios.` }).catch(() => undefined);
}

// ---------------------------------------------------------------------------------------------------------------------
// Lojista
// ---------------------------------------------------------------------------------------------------------------------
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export async function criarAnuncio(db: Database, actor: Actor, agora = new Date()) {
  const storeId = daLoja(actor);
  const aberta = await db.query.anunciosLoja.findFirst({ where: and(eq(anunciosLoja.storeId, storeId), eq(anunciosLoja.status, "RASCUNHO")), columns: { id: true } });
  if (aberta) return { id: aberta.id };
  const id = newId("anc");
  const codigo = id.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, "x");
  await db.insert(anunciosLoja).values({ id, storeId, nome: `Campanha de ${MESES[agora.getMonth()]}`, utmCampaign: `nl-meta-${codigo}` });
  return { id };
}

export async function salvarDiagnostico(db: Database, actor: Actor, id: string, raw: unknown) {
  const a = await doLojista(db, actor, id);
  if (a.status !== "RASCUNHO") throw new DomainError("ENVIADO", "Este diagnóstico já foi enviado. Fale com a equipe pela conversa da campanha.");
  const parcial = diagnosticoParcial.parse(raw);
  const diag = { ...a.diagnostico, ...parcial };
  const nome = diag.objetivo ? `${OBJETIVOS[diag.objetivo as keyof typeof OBJETIVOS]} · ${MESES[new Date(a.createdAt).getMonth()]}` : a.nome;
  await db.update(anunciosLoja).set({ diagnostico: diag, nome, updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
}

function pendenciasIniciais(d: z.infer<typeof diagnosticoCompleto>): (typeof anunciosLoja.$inferSelect)["pendencias"] {
  const p: (typeof anunciosLoja.$inferSelect)["pendencias"] = [];
  if (d.contaAnuncios !== "SIM") p.push({ chave: "conta", rotulo: "Criar a conta de anúncios na Meta", dica: "No Gerenciador de Negócios da Meta (business.facebook.com), crie a conta de anúncios da loja. A equipe ajuda pela conversa se precisar.", quem: "LOJISTA", feitoEm: null });
  p.push({ chave: "acesso", rotulo: "Dar acesso de parceiro à NextLevel", dica: "No Gerenciador de Negócios: Configurações → Parceiros → Dar acesso a um parceiro, com o ID que a equipe enviar aqui na conversa.", quem: "LOJISTA", feitoEm: null });
  p.push({ chave: "pagamento", rotulo: "Cadastrar a forma de pagamento na conta de anúncios", dica: "A verba vai direto para a Meta, no seu cartão ou Pix. A NextLevel não recebe nem guarda esse dinheiro.", quem: "LOJISTA", feitoEm: null });
  if (d.materiais?.includes("AJUDA") || !(d.materiais?.length)) p.push({ chave: "criativos", rotulo: "Combinar fotos e vídeos dos anúncios", dica: "A equipe orienta o que gravar ou fotografar.", quem: "EQUIPE", feitoEm: null });
  else p.push({ chave: "materiais", rotulo: "Enviar as fotos e vídeos para os anúncios", dica: "Mande pela conversa abaixo ou por um link (Google Drive, WeTransfer).", quem: "LOJISTA", feitoEm: null });
  if (d.instagram) p.push({ chave: "instagram", rotulo: "Ligar o Instagram da loja à página do Facebook", dica: "No Instagram: Configurações → Central de contas. Assim os anúncios saem com o nome e a foto da loja.", quem: "LOJISTA", feitoEm: null });
  return p;
}

export async function enviarDiagnostico(db: Database, actor: Actor, id: string, agora = new Date()) {
  const a = await doLojista(db, actor, id);
  if (a.status !== "RASCUNHO") throw new DomainError("ENVIADO", "Este diagnóstico já foi enviado.");
  const d = diagnosticoCompleto.parse(a.diagnostico);
  await db.update(anunciosLoja).set({ status: "ENVIADA", enviadaEm: agora.toISOString(), pendencias: pendenciasIniciais(d), updatedAt: agora.toISOString() }).where(eq(anunciosLoja.id, id));
  await evento(db, id, { autor: "SISTEMA", tipo: "ETAPA", texto: "Diagnóstico enviado. A campanha está na mesa da equipe de anúncios da NextLevel." });
  await avisarLojista(db, a, "Recebemos o diagnóstico da sua campanha", "O diagnóstico da sua campanha na Meta chegou à equipe de anúncios da NextLevel. Um especialista vai analisar e responder pelo painel.", `ANUNCIO_ENVIADO:${id}`);
}

export async function anunciosDaLoja(db: Database, actor: Actor) {
  const storeId = daLoja(actor);
  return db.select().from(anunciosLoja).where(eq(anunciosLoja.storeId, storeId)).orderBy(desc(anunciosLoja.updatedAt));
}

/** Vendas pagas da loja com a etiqueta da campanha (automático, sem a equipe lançar). */
async function vendasDaCampanha(db: Database, storeId: string, utm: string) {
  const [r] = await db.select({ n: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${orders.totalCents}), 0)` }).from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.utmCampaign, utm), eq(orders.customerPaymentStatus, "PAID")));
  return { pedidos: Number(r?.n ?? 0), totalCents: Number(r?.total ?? 0) };
}

async function montarSala(db: Database, a: typeof anunciosLoja.$inferSelect) {
  const [eventos, resultados, quote, loja, vendas] = await Promise.all([
    db.select().from(anunciosEventos).where(eq(anunciosEventos.anuncioId, a.id)).orderBy(asc(anunciosEventos.criadoEm)),
    db.select().from(anunciosResultados).where(eq(anunciosResultados.anuncioId, a.id)).orderBy(desc(anunciosResultados.ate)),
    a.quoteId ? db.query.corporateQuotes.findFirst({ where: eq(corporateQuotes.id, a.quoteId) }) : Promise.resolve(null),
    db.query.stores.findFirst({ where: eq(stores.id, a.storeId), columns: { name: true, slug: true, customDomain: true, domainStatus: true } }),
    vendasDaCampanha(db, a.storeId, a.utmCampaign),
  ]);
  const proposta = quote && ["SENT", "ACCEPTED", "CONVERTED"].includes(quote.status)
    ? { status: quote.status, itens: quote.items, descontoCents: quote.discountCents, totalCents: quote.totalCents ?? 0, termos: quote.terms, validaAte: quote.validUntil, aceitaEm: quote.acceptedAt } : null;
  const totais = resultados.reduce((t, r) => ({ gastoCents: t.gastoCents + r.gastoCents, alcance: t.alcance + r.alcance, cliques: t.cliques + r.cliques, conversas: t.conversas + r.conversas }), { gastoCents: 0, alcance: 0, cliques: 0, conversas: 0 });
  // Link que vai nos anúncios: a loja com a etiqueta da campanha (as vendas com ela aparecem sozinhas na sala).
  const endereco = loja ? storeUrl(loja.slug, undefined, loja.customDomain, loja.domainStatus) : null;
  const absoluto = endereco ? (endereco.startsWith("/") ? `${brandByCode("NEXTLEVEL_COMMERCE").baseUrl.replace(/\/$/, "")}${endereco}` : endereco) : null;
  const linkAnuncio = absoluto ? `${absoluto}?utm_source=meta&utm_medium=pago&utm_campaign=${a.utmCampaign}&utm_content={{ad.name}}` : null;
  return { anuncio: a, eventos, resultados, totais, proposta, vendas, loja: loja ?? null, linkAnuncio, rotuloStatus: ROTULO_STATUS[a.status] };
}

export async function salaDaCampanha(db: Database, actor: Actor, id: string) {
  return montarSala(db, await doLojista(db, actor, id));
}

export async function mensagemDoLojista(db: Database, actor: Actor, id: string, nome: string, texto: string) {
  const a = await doLojista(db, actor, id);
  const t = texto.trim();
  if (t.length < 2) throw new DomainError("VAZIO", "Escreva a mensagem.");
  if (a.status === "RASCUNHO") throw new DomainError("RASCUNHO", "Envie o diagnóstico primeiro; depois a conversa com a equipe abre aqui.");
  await evento(db, id, { autor: "LOJISTA", autorNome: nome, tipo: "MENSAGEM", texto: t });
  await db.update(anunciosLoja).set({ updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
}

/** O lojista marca (ou desmarca) uma pendência dele. As da equipe só a equipe marca. */
export async function marcarPendencia(db: Database, actor: Actor, id: string, chave: string, feito: boolean, nome?: string) {
  const ehEquipe = actor.role === "NEXTLEVEL_MASTER";
  const a = ehEquipe ? (equipe(actor), await carregar(db, id)) : await doLojista(db, actor, id);
  const p = a.pendencias.find((x) => x.chave === chave);
  if (!p) throw new NotFoundError("Pendência não encontrada.");
  if (!ehEquipe && p.quem !== "LOJISTA") throw new ForbiddenError("Esse passo é da equipe.");
  if (chave === "aceite" && !ehEquipe) throw new DomainError("ACEITE", "Para aceitar, use o botão da proposta.");
  const pendencias = a.pendencias.map((x) => (x.chave === chave ? { ...x, feitoEm: feito ? new Date().toISOString() : null } : x));
  await db.update(anunciosLoja).set({ pendencias, updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await evento(db, id, { autor: ehEquipe ? "EQUIPE" : "LOJISTA", autorNome: nome ?? null, tipo: "PENDENCIA", texto: `${feito ? "Feito" : "Desmarcado"}: ${p.rotulo}` });
}

export async function aceitarProposta(db: Database, actor: Actor, id: string, nome: string, agora = new Date()) {
  const a = await doLojista(db, actor, id);
  if (!a.quoteId) throw new DomainError("SEM_PROPOSTA", "Ainda não há proposta para aceitar.");
  const q = await db.query.corporateQuotes.findFirst({ where: eq(corporateQuotes.id, a.quoteId) });
  if (!q || q.storeId !== a.storeId) throw new NotFoundError("Proposta não encontrada.");
  if (q.status !== "SENT") throw new DomainError("PROPOSTA", q.status === "ACCEPTED" ? "Proposta já aceita." : "Esta proposta não está aberta para aceite.");
  if (q.validUntil && new Date(q.validUntil) < agora) throw new DomainError("VENCIDA", "A proposta passou da validade. Peça uma nova pela conversa.");
  await db.update(corporateQuotes).set({ status: "ACCEPTED", acceptedAt: agora.toISOString(), updatedAt: agora.toISOString() }).where(eq(corporateQuotes.id, q.id));
  const pendencias = a.pendencias.map((x) => (x.chave === "aceite" ? { ...x, feitoEm: agora.toISOString() } : x));
  await db.update(anunciosLoja).set({ status: a.status === "PROPOSTA" ? "PREPARACAO" : a.status, pendencias, updatedAt: agora.toISOString() }).where(eq(anunciosLoja.id, id));
  await evento(db, id, { autor: "LOJISTA", autorNome: nome, tipo: "PROPOSTA", texto: `Proposta aceita (${brl(q.totalCents ?? 0)}). A equipe combina o pagamento e seguimos para a preparação.` });
  await recordAudit(db, actor, { action: "ANUNCIO_PROPOSTA_ACEITA", entityType: "corporate_quote", entityId: q.id, storeId: a.storeId, after: { totalCents: q.totalCents } }, { force: true });
}

export async function cancelarAnuncio(db: Database, actor: Actor, id: string, nome: string) {
  const a = await doLojista(db, actor, id);
  if (["NO_AR", "PAUSADA", "ENCERRADA", "CANCELADA"].includes(a.status)) throw new DomainError("CANCELAR", "Com a campanha já no ar, peça a pausa ou o encerramento pela conversa.");
  await db.update(anunciosLoja).set({ status: "CANCELADA", updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await evento(db, id, { autor: "LOJISTA", autorNome: nome, tipo: "ETAPA", texto: "Campanha cancelada pelo lojista." });
}

// ---------------------------------------------------------------------------------------------------------------------
// Equipe (Master)
// ---------------------------------------------------------------------------------------------------------------------
export async function mesaDeAnuncios(db: Database, actor: Actor) {
  equipe(actor);
  const rows = await db.select({ a: anunciosLoja, loja: stores.name }).from(anunciosLoja).innerJoin(stores, eq(stores.id, anunciosLoja.storeId))
    .where(ne(anunciosLoja.status, "RASCUNHO")).orderBy(desc(anunciosLoja.updatedAt)).limit(300);
  const ids = rows.map((r) => r.a.id);
  const ultimas = ids.length ? await db.select({ anuncioId: anunciosEventos.anuncioId, autor: anunciosEventos.autor, em: sql<string>`max(${anunciosEventos.criadoEm})` }).from(anunciosEventos)
    .where(and(inArray(anunciosEventos.anuncioId, ids), eq(anunciosEventos.tipo, "MENSAGEM"))).groupBy(anunciosEventos.anuncioId, anunciosEventos.autor) : [];
  return rows.map(({ a, loja }) => {
    const lojista = ultimas.find((u) => u.anuncioId === a.id && u.autor === "LOJISTA")?.em;
    const eq_ = ultimas.find((u) => u.anuncioId === a.id && u.autor === "EQUIPE")?.em;
    return {
      ...a, loja, rotuloStatus: ROTULO_STATUS[a.status],
      pendentesLojista: a.pendencias.filter((p) => p.quem === "LOJISTA" && !p.feitoEm).length,
      pendentesEquipe: a.pendencias.filter((p) => p.quem === "EQUIPE" && !p.feitoEm).length,
      // Lojista escreveu depois da última resposta da equipe: precisa de resposta.
      aguardandoResposta: !!lojista && (!eq_ || new Date(lojista) > new Date(eq_)),
    };
  });
}

export async function detalheDaMesa(db: Database, actor: Actor, id: string) {
  equipe(actor);
  return montarSala(db, await carregar(db, id));
}

export async function mudarEtapa(db: Database, actor: Actor, id: string, status: AnuncioStatus, nome: string, mensagem?: string, agora = new Date()) {
  equipe(actor);
  const a = await carregar(db, id);
  if (status === "RASCUNHO") throw new DomainError("ETAPA", "O rascunho é do lojista.");
  if (status === "PROPOSTA") {
    const q = a.quoteId ? await db.query.corporateQuotes.findFirst({ where: eq(corporateQuotes.id, a.quoteId) }) : null;
    if (!q || q.status !== "SENT") throw new DomainError("PROPOSTA", "Monte e envie a proposta antes (botão \"Criar proposta\", depois \"Enviar\" em Propostas).");
  }
  const set: Partial<typeof anunciosLoja.$inferInsert> = { status, updatedAt: agora.toISOString() };
  if (status === "NO_AR" && !a.noArEm) set.noArEm = agora.toISOString();
  if (status === "PROPOSTA" && !a.pendencias.some((p) => p.chave === "aceite")) set.pendencias = [{ chave: "aceite", rotulo: "Aceitar a proposta", dica: "Veja a proposta logo abaixo e aperte \"Aceitar proposta\".", quem: "LOJISTA", feitoEm: null }, ...a.pendencias];
  if (!a.responsavelId) { set.responsavelId = actor.userId; set.responsavelNome = nome; }
  await db.update(anunciosLoja).set(set).where(eq(anunciosLoja.id, id));
  const etapa = ETAPAS_ANUNCIO.find((e) => e.status === status);
  await evento(db, id, { autor: "EQUIPE", autorNome: nome, tipo: "ETAPA", texto: `${ROTULO_STATUS[status]}${mensagem?.trim() ? `: ${mensagem.trim()}` : etapa ? `. ${etapa.agora}` : ""}` });
  await avisarLojista(db, a, `Sua campanha: ${ROTULO_STATUS[status].toLowerCase()}`, `${etapa?.titulo ?? ROTULO_STATUS[status]}.${mensagem?.trim() ? `\n\nRecado da equipe: ${mensagem.trim()}` : etapa ? `\n\n${etapa.agora}` : ""}`);
}

export async function mensagemDaEquipe(db: Database, actor: Actor, id: string, nome: string, texto: string) {
  equipe(actor);
  const a = await carregar(db, id);
  const t = texto.trim();
  if (t.length < 2) throw new DomainError("VAZIO", "Escreva a mensagem.");
  await evento(db, id, { autor: "EQUIPE", autorNome: nome, tipo: "MENSAGEM", texto: t });
  await db.update(anunciosLoja).set({ updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await avisarLojista(db, a, "Nova mensagem da equipe sobre a sua campanha", `${nome} escreveu: ${t.slice(0, 500)}`);
}

export async function assumirAnuncio(db: Database, actor: Actor, id: string, nome: string) {
  equipe(actor);
  await carregar(db, id);
  await db.update(anunciosLoja).set({ responsavelId: actor.userId, responsavelNome: nome, updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
}

/** Cria a proposta (pedido de orçamento do serviço "Gestão de Meta Ads") com o diagnóstico como briefing. */
export async function criarPropostaDoAnuncio(db: Database, actor: Actor, id: string) {
  equipe(actor);
  const a = await carregar(db, id);
  if (a.quoteId) return { quoteId: a.quoteId };
  const produto = await getCatalogItem(db, { key: "MKT_META_ADS" }, { includeUnpublished: true });
  if (!produto) throw new DomainError("CATALOGO", "O serviço \"Gestão de Meta Ads\" não está no catálogo.");
  const dono = await db.query.users.findFirst({ where: and(eq(users.storeId, a.storeId), eq(users.role, "STORE_OWNER")), columns: { name: true, email: true } });
  const loja = await db.query.stores.findFirst({ where: eq(stores.id, a.storeId), columns: { whatsapp: true } });
  if (!dono) throw new DomainError("DONO", "A loja está sem dono cadastrado.");
  const quoteId = newId("cqt");
  await db.insert(corporateQuotes).values({ id: quoteId, productId: produto.id, requesterType: "STORE", storeId: a.storeId, contactName: dono.name, contactEmail: dono.email, contactPhone: loja?.whatsapp ?? null, briefing: [`Campanha: ${a.nome}`, ...resumoDiagnostico(a.diagnostico as Diagnostico)].join("\n").slice(0, 4000), status: "DRAFTING" });
  await db.update(anunciosLoja).set({ quoteId, updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await recordAudit(db, actor, { action: "ANUNCIO_PROPOSTA_CRIADA", entityType: "corporate_quote", entityId: quoteId, storeId: a.storeId }, { force: true });
  return { quoteId };
}

export const resultadoSchema = z.object({
  de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data inicial."), ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data final."),
  gastoCents: z.number().int().min(0).max(100_000_000), alcance: z.number().int().min(0).max(1_000_000_000), cliques: z.number().int().min(0).max(100_000_000),
  conversas: z.number().int().min(0).max(10_000_000), comentario: z.string().trim().max(1000).optional(),
}).refine((r) => r.de <= r.ate, { message: "A data inicial vem antes da final.", path: ["de"] });

/** A equipe lança os números do período (do Gerenciador de Anúncios). */
export async function lancarResultado(db: Database, actor: Actor, id: string, nome: string, raw: z.input<typeof resultadoSchema>) {
  equipe(actor);
  const a = await carregar(db, id);
  const r = resultadoSchema.parse(raw);
  await db.insert(anunciosResultados).values({ id: newId("ars"), anuncioId: id, ...r, comentario: r.comentario || null, criadoPor: actor.userId });
  const data = (d: string) => d.split("-").reverse().join("/");
  await evento(db, id, { autor: "EQUIPE", autorNome: nome, tipo: "RESULTADO", texto: `Números de ${data(r.de)} a ${data(r.ate)}: ${brl(r.gastoCents)} investidos na Meta, ${r.alcance.toLocaleString("pt-BR")} pessoas alcançadas, ${r.cliques.toLocaleString("pt-BR")} cliques${r.conversas ? `, ${r.conversas} conversas` : ""}.${r.comentario ? ` ${r.comentario}` : ""}` });
  await db.update(anunciosLoja).set({ updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await avisarLojista(db, a, "Números novos da sua campanha", `A equipe lançou os números de ${data(r.de)} a ${data(r.ate)}. Veja no painel, em Anúncios.`);
}

export async function novaPendencia(db: Database, actor: Actor, id: string, p: { rotulo: string; dica?: string; quem: "LOJISTA" | "EQUIPE" }, nome: string) {
  equipe(actor);
  const a = await carregar(db, id);
  const rotulo = p.rotulo.trim().slice(0, 120);
  if (rotulo.length < 3) throw new DomainError("VAZIO", "Descreva a pendência.");
  const chave = `p${Date.now().toString(36)}`;
  await db.update(anunciosLoja).set({ pendencias: [...a.pendencias, { chave, rotulo, dica: (p.dica ?? "").trim().slice(0, 300), quem: p.quem, feitoEm: null }], updatedAt: new Date().toISOString() }).where(eq(anunciosLoja.id, id));
  await evento(db, id, { autor: "EQUIPE", autorNome: nome, tipo: "PENDENCIA", texto: `Novo passo ${p.quem === "LOJISTA" ? "para você" : "da equipe"}: ${rotulo}` });
}
export type Sala = Awaited<ReturnType<typeof salaDaCampanha>>;
