import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agenciaClientes, agenciaFaturas, agencias, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId } from "@/lib/ids";
import { formatBRL } from "@/lib/money";
import { MercadoPagoError, createPreference, findApprovedPaymentId, getPayment, verifyAccessToken, type FetchLike } from "@/lib/payments/mercadopago";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { escopoDaAgencia, pode } from "./acesso";
import { hojeEmSaoPaulo, telefoneTexto } from "./clientes";
import { mesRotulo } from "./fluxo";

/**
 * Cobrança da agência (D318, AGF1 do racional da UPClips). O cliente da agência paga direto na conta Mercado Pago da
 * AGÊNCIA (a NextLevel nunca guarda esse dinheiro). Uma mensalidade por cliente por mês, gerada pelo contrato; avulsas à
 * parte. O pagamento só vale conferido na API do Mercado Pago (o aviso dele nunca é confiável sozinho). Só administrador
 * e financeiro mexem em cobrança.
 */
async function escopo(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (!pode.editarContrato(e.membro)) throw new ForbiddenError("A cobrança é do administrador e do financeiro.");
  return e;
}
const tokenDa = (a: { mpTokenEnc: string | null }) => decryptSecret(a.mpTokenEnc);

/** Regra pura (testada): vencimento da mensalidade no mês (dia do contrato, de 1 a 28). */
export const vencimentoNoMes = (mes: string, dia: number) => `${mes}-${String(Math.min(28, Math.max(1, dia))).padStart(2, "0")}`;
/** Regra pura (testada): situação mostrada (aberta passa a "atrasada" depois do vencimento). */
export const situacaoMostrada = (f: { situacao: "ABERTA" | "PAGA" | "CANCELADA"; vencimento: string }, hoje: string): "ABERTA" | "ATRASADA" | "PAGA" | "CANCELADA" => (f.situacao === "ABERTA" && f.vencimento < hoje ? "ATRASADA" : f.situacao);
/** Regra pura (testada): em que dia lembrar o cliente (3 dias antes, no dia, 1, 5 e 10 dias depois). */
export function lembreteDoDia(vencimento: string, hoje: string): string | null {
  const d = Math.round((Date.parse(`${hoje}T12:00:00Z`) - Date.parse(`${vencimento}T12:00:00Z`)) / 86_400_000);
  if (d === -3) return "Vence em 3 dias";
  if (d === 0) return "Vence hoje";
  if (d === 1 || d === 5 || d === 10) return `Venceu há ${d} dia${d > 1 ? "s" : ""}`;
  return null;
}

export async function conectarMercadoPago(db: Database, actor: Actor, token: string, fetchImpl: FetchLike = fetch) {
  const { agencia, membro } = await escopo(db, actor);
  if (!pode.gerirEquipe(membro)) throw new ForbiddenError("Só o administrador conecta a conta de pagamento.");
  const t = z.string().trim().min(20, "Cole o access token completo do Mercado Pago.").max(300).parse(token);
  // Erro do Mercado Pago vira mensagem clara para a pessoa (token errado, conta sem permissão), nunca "erro inesperado".
  const conta = await verifyAccessToken(t, fetchImpl).catch((e) => { if (e instanceof MercadoPagoError) throw new DomainError("MP_TOKEN", e.status === 401 ? "O Mercado Pago recusou esse access token. Confira se copiou o token de produção completo." : e.message); throw e; });
  await db.update(agencias).set({ mpTokenEnc: encryptSecret(t), mpConta: conta.nickname, mpTeste: conta.isTest, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
  await recordAudit(db, actor, { action: "AGENCIA_MP_CONECTADO", entityType: "agencia", entityId: agencia.id, after: { conta: conta.nickname, teste: conta.isTest } }, { force: true });
  return { conta: conta.nickname, teste: conta.isTest };
}

export async function desconectarMercadoPago(db: Database, actor: Actor) {
  const { agencia, membro } = await escopo(db, actor);
  if (!pode.gerirEquipe(membro)) throw new ForbiddenError("Só o administrador mexe na conta de pagamento.");
  await db.update(agencias).set({ mpTokenEnc: null, mpConta: null, mpTeste: false, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agencia.id));
  await recordAudit(db, actor, { action: "AGENCIA_MP_DESCONECTADO", entityType: "agencia", entityId: agencia.id }, { force: true });
}

/** Gera as mensalidades do mês dos clientes ativos com valor e vencimento. Rodar de novo não duplica. */
export async function gerarCobrancasDoMes(db: Database, actor: Actor, mes: string) {
  const { membro } = await escopo(db, actor);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new DomainError("MES", "Mês inválido.");
  const clientes = await db.select().from(agenciaClientes).where(and(eq(agenciaClientes.agenciaId, membro.agenciaId), eq(agenciaClientes.situacao, "ATIVO")));
  const comContrato = clientes.filter((c) => c.valorMensalCents && c.valorMensalCents > 0 && c.diaVencimento);
  if (!comContrato.length) return { criadas: 0, semContrato: clientes.length };
  const criadas = await db.insert(agenciaFaturas).values(comContrato.map((c) => ({
    id: newId("agft"), agenciaId: membro.agenciaId, clienteId: c.id, competencia: mes, descricao: `Mensalidade de ${mesRotulo(mes)}${c.pacote ? ` · ${c.pacote}` : ""}`,
    valorCents: c.valorMensalCents!, vencimento: vencimentoNoMes(mes, c.diaVencimento!),
  }))).onConflictDoNothing().returning({ id: agenciaFaturas.id });
  return { criadas: criadas.length, semContrato: clientes.length - comContrato.length };
}

export const avulsaSchema = z.object({ clienteId: z.string().min(1), descricao: z.string().trim().min(3, "Descreva a cobrança").max(160), valorCents: z.number().int().min(100, "Valor mínimo de R$ 1,00").max(100_000_000), vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** Cobrança fora da mensalidade (gravação extra, diária, criativo avulso). */
export async function criarCobrancaAvulsa(db: Database, actor: Actor, raw: z.input<typeof avulsaSchema>) {
  const { membro } = await escopo(db, actor);
  const d = avulsaSchema.parse(raw);
  const c = await db.query.agenciaClientes.findFirst({ where: and(eq(agenciaClientes.id, d.clienteId), eq(agenciaClientes.agenciaId, membro.agenciaId)) });
  if (!c) throw new NotFoundError("Cliente não encontrado.");
  const id = newId("agft");
  await db.insert(agenciaFaturas).values({ id, agenciaId: membro.agenciaId, clienteId: c.id, competencia: d.vencimento.slice(0, 7), descricao: d.descricao, valorCents: d.valorCents, vencimento: d.vencimento, avulsa: true });
  return { id };
}

async function faturaDaAgencia(db: Database, agenciaId: string, id: string) {
  const f = await db.query.agenciaFaturas.findFirst({ where: and(eq(agenciaFaturas.id, id), eq(agenciaFaturas.agenciaId, agenciaId)) });
  if (!f) throw new NotFoundError("Cobrança não encontrada.");
  return f;
}

/** Link de pagamento (Pix ou cartão) na conta Mercado Pago da agência. O aviso volta para a NextLevel conferir. */
export async function gerarLinkDePagamento(db: Database, actor: Actor, faturaId: string, opts: { baseUrl?: string; fetchImpl?: FetchLike } = {}) {
  const { agencia, membro } = await escopo(db, actor);
  const f = await faturaDaAgencia(db, membro.agenciaId, faturaId);
  if (f.situacao !== "ABERTA") throw new DomainError("NAO_ABERTA", "Esta cobrança não está em aberto.");
  if (f.checkoutUrl) return { checkoutUrl: f.checkoutUrl };
  const token = tokenDa(agencia);
  if (!token) throw new DomainError("SEM_MP", "Conecte a conta Mercado Pago da agência para gerar links de pagamento.");
  const c = (await db.query.agenciaClientes.findFirst({ where: eq(agenciaClientes.id, f.clienteId) }))!;
  const admin = await db.query.users.findFirst({ where: eq(users.organizationId, agencia.organizationId), columns: { email: true } });
  const base = (opts.baseUrl ?? process.env.APP_URL ?? "").replace(/\/$/, "");
  const pref = await createPreference(token, {
    orderId: f.id, orderNumber: 0, storeName: agencia.nome, items: [{ id: f.id, title: f.descricao, quantity: 1, unitPriceCents: f.valorCents }], shippingCents: 0,
    payer: { name: c.contatoNome || c.nome, email: c.email || admin?.email || "cobranca@nextlevelcommerce.com.br" },
    notificationUrl: base.startsWith("https://") ? `${base}/api/webhooks/mercadopago-agencia?fatura=${f.id}` : undefined, maxParcelas: 1,
  }, opts.fetchImpl ?? fetch).catch((e) => { if (e instanceof MercadoPagoError) throw new DomainError("MP_LINK", `Não deu para gerar o link no Mercado Pago: ${e.message}`); throw e; });
  await db.update(agenciaFaturas).set({ checkoutUrl: pref.checkoutUrl, preferenciaId: pref.id, updatedAt: new Date().toISOString() }).where(eq(agenciaFaturas.id, f.id));
  return { checkoutUrl: pref.checkoutUrl };
}

/**
 * Confere na API do Mercado Pago da agência se a cobrança foi paga (aviso do Mercado Pago, botão "Conferir" ou rotina).
 * Idempotente: paga uma vez, continua paga; valor menor que o da cobrança não dá baixa.
 */
export async function conferirPagamento(db: Database, faturaId: string, fetchImpl: FetchLike = fetch): Promise<{ paga: boolean }> {
  const f = await db.query.agenciaFaturas.findFirst({ where: eq(agenciaFaturas.id, faturaId) });
  if (!f) return { paga: false };
  if (f.situacao === "PAGA") return { paga: true };
  if (f.situacao !== "ABERTA" || !f.preferenciaId) return { paga: false };
  const ag = await db.query.agencias.findFirst({ where: eq(agencias.id, f.agenciaId), columns: { mpTokenEnc: true } });
  const token = ag ? tokenDa(ag) : null;
  if (!token) return { paga: false };
  const pid = await findApprovedPaymentId(token, f.id, fetchImpl);
  if (!pid) return { paga: false };
  const p = await getPayment(token, pid, fetchImpl);
  if (p.externalReference !== f.id || p.status !== "approved") return { paga: false };
  if (p.amountCents < f.valorCents) throw new DomainError("VALOR_MENOR", "Valor pago menor que o da cobrança.");
  const r = await db.update(agenciaFaturas).set({ situacao: "PAGA", pagoEm: new Date().toISOString(), pagoComo: "SISTEMA", mpPaymentId: pid, updatedAt: new Date().toISOString() })
    .where(and(eq(agenciaFaturas.id, f.id), eq(agenciaFaturas.situacao, "ABERTA"))).returning({ id: agenciaFaturas.id });
  void r; return { paga: true };
}

/** "Conferir pagamentos": confere as cobranças abertas que já têm link (limite por vez para não sobrecarregar). */
export async function conferirPagamentosAbertos(db: Database, actor: Actor, fetchImpl: FetchLike = fetch) {
  const { membro } = await escopo(db, actor);
  const abertas = await db.select({ id: agenciaFaturas.id }).from(agenciaFaturas).where(and(eq(agenciaFaturas.agenciaId, membro.agenciaId), eq(agenciaFaturas.situacao, "ABERTA"))).limit(50);
  let pagas = 0;
  for (const f of abertas) { try { if ((await conferirPagamento(db, f.id, fetchImpl)).paga) pagas += 1; } catch { /* segue para a próxima */ } }
  return { conferidas: abertas.length, pagas };
}

/** Baixa manual (o cliente pagou por fora: transferência, dinheiro), com observação. */
export const baixaSchema = z.object({
  pagoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data do pagamento").optional(),
  meio: z.enum(["PIX", "TRANSFERENCIA", "DINHEIRO", "CARTAO", "MERCADO_PAGO", "OUTRO"]).optional(),
});
/** "Recebi por fora": baixa manual, com a data e o meio do pagamento quando informados (parcelas de contrato, D335). */
export async function marcarPagaManual(db: Database, actor: Actor, faturaId: string, observacao: string, extra: z.input<typeof baixaSchema> = {}) {
  const { membro } = await escopo(db, actor);
  const f = await faturaDaAgencia(db, membro.agenciaId, faturaId);
  if (f.situacao !== "ABERTA") throw new DomainError("NAO_ABERTA", "Esta cobrança não está em aberto.");
  const obs = z.string().trim().min(3, "Diga como foi pago (ex.: Pix direto na conta)").max(300).parse(observacao);
  const e = baixaSchema.parse(extra);
  if (e.pagoEm && e.pagoEm > hojeEmSaoPaulo()) throw new DomainError("DATA_FUTURA", "A data do pagamento não pode ser depois de hoje.");
  const pagoEm = e.pagoEm ? `${e.pagoEm}T15:00:00.000Z` : new Date().toISOString();
  await db.update(agenciaFaturas).set({ situacao: "PAGA", pagoEm, pagoComo: "MANUAL", pagoMeio: e.meio ?? null, observacao: obs, updatedAt: new Date().toISOString() }).where(eq(agenciaFaturas.id, f.id));
  await recordAudit(db, actor, { action: "AGENCIA_FATURA_PAGA_MANUAL", entityType: "agencia_fatura", entityId: f.id, after: { observacao: obs, pagoEm, meio: e.meio ?? null } }, { force: true });
}

export async function cancelarCobranca(db: Database, actor: Actor, faturaId: string, motivo: string) {
  const { membro } = await escopo(db, actor);
  const f = await faturaDaAgencia(db, membro.agenciaId, faturaId);
  if (f.situacao !== "ABERTA") throw new DomainError("NAO_ABERTA", "Só cobrança em aberto pode ser cancelada.");
  const m = z.string().trim().min(3, "Diga o motivo").max(300).parse(motivo);
  await db.update(agenciaFaturas).set({ situacao: "CANCELADA", observacao: m, updatedAt: new Date().toISOString() }).where(eq(agenciaFaturas.id, f.id));
  await recordAudit(db, actor, { action: "AGENCIA_FATURA_CANCELADA", entityType: "agencia_fatura", entityId: f.id, after: { motivo: m } }, { force: true });
}

/** Mensagem pronta para o WhatsApp do cliente (régua assistida: a pessoa revisa e envia). */
export function mensagemDeCobranca(f: { descricao: string; valorCents: number; vencimento: string; checkoutUrl: string | null }, cliente: { nome: string; contatoNome: string | null }, agencia: string) {
  const data = f.vencimento.split("-").reverse().join("/");
  return `Olá, ${(cliente.contatoNome || cliente.nome).split(" ")[0]}! Aqui é da ${agencia}. Segue a cobrança de ${f.descricao} (${formatBRL(f.valorCents)}), com vencimento em ${data}.${f.checkoutUrl ? ` Para pagar por Pix ou cartão: ${f.checkoutUrl}` : ""} Qualquer dúvida, é só chamar.`;
}

/** Tela Financeiro: cobranças do mês (e atrasadas de antes), números, lembretes do dia e a conta conectada. */
export async function financeiroDaAgencia(db: Database, actor: Actor, mes?: string, hoje = hojeEmSaoPaulo()) {
  const { agencia, membro } = await escopo(db, actor);
  const m = mes ?? hoje.slice(0, 7);
  const rows = await db.select({ f: agenciaFaturas, cliente: agenciaClientes.nome, contatoNome: agenciaClientes.contatoNome, whatsapp: agenciaClientes.whatsapp })
    .from(agenciaFaturas).innerJoin(agenciaClientes, eq(agenciaClientes.id, agenciaFaturas.clienteId))
    .where(eq(agenciaFaturas.agenciaId, membro.agenciaId)).orderBy(asc(agenciaFaturas.vencimento));
  const lista = rows.filter((r) => r.f.competencia === m || (r.f.situacao === "ABERTA" && r.f.vencimento < `${m}-01`)).map((r) => ({
    ...r.f, cliente: r.cliente, whatsapp: r.whatsapp ? telefoneTexto(r.whatsapp) : null, whatsappDigitos: r.whatsapp, mostrada: situacaoMostrada(r.f, hoje), lembrete: r.f.situacao === "ABERTA" ? lembreteDoDia(r.f.vencimento, hoje) : null,
    mensagem: mensagemDeCobranca(r.f, { nome: r.cliente, contatoNome: r.contatoNome }, agencia.nome),
  }));
  // Pago e lançado no caixa do Master (contrato trazido de lá, D335): aparece na lista, mas não soma de novo.
  const doMes = lista.filter((f) => f.competencia === m && f.situacao !== "CANCELADA" && !f.registradoNoMaster);
  const atrasadas = lista.filter((f) => f.mostrada === "ATRASADA");
  return {
    mes: m, conta: agencia.mpConta, teste: agencia.mpTeste, conectada: !!agencia.mpTokenEnc, podeConectar: pode.gerirEquipe(membro),
    numeros: {
      previstoCents: doMes.reduce((s, f) => s + f.valorCents, 0), recebidoCents: doMes.filter((f) => f.situacao === "PAGA").reduce((s, f) => s + f.valorCents, 0),
      emAbertoCents: doMes.filter((f) => f.situacao === "ABERTA").reduce((s, f) => s + f.valorCents, 0), atrasadoCents: atrasadas.reduce((s, f) => s + f.valorCents, 0),
      inadimplentes: new Set(atrasadas.map((f) => f.clienteId)).size,
    },
    lista, lembrar: lista.filter((f) => f.lembrete),
  };
}

/** Para a fila do dia do cockpit: cobranças atrasadas e lembretes de hoje (só para quem vê valores). */
export async function pendenciasDeCobranca(db: Database, actor: Actor, hoje = hojeEmSaoPaulo()) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.verValores(membro)) return { atrasadas: 0, atrasadoCents: 0, lembrar: 0 };
  const abertas = await db.select().from(agenciaFaturas).where(and(eq(agenciaFaturas.agenciaId, membro.agenciaId), eq(agenciaFaturas.situacao, "ABERTA")));
  const atr = abertas.filter((f) => f.vencimento < hoje);
  return { atrasadas: atr.length, atrasadoCents: atr.reduce((s, f) => s + f.valorCents, 0), lembrar: abertas.filter((f) => lembreteDoDia(f.vencimento, hoje)).length };
}

/** Cobranças de um cliente (ficha do cliente). */
export async function cobrancasDoCliente(db: Database, actor: Actor, clienteId: string, hoje = hojeEmSaoPaulo()) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.verValores(membro)) return [];
  const rows = await db.select().from(agenciaFaturas).where(and(eq(agenciaFaturas.agenciaId, membro.agenciaId), eq(agenciaFaturas.clienteId, clienteId), ne(agenciaFaturas.situacao, "CANCELADA"))).orderBy(asc(agenciaFaturas.vencimento));
  return rows.map((f) => ({ ...f, mostrada: situacaoMostrada(f, hoje) }));
}


