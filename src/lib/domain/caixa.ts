import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { caixaDias, caixaHistorico, caixaLancamentos, catalogProducts, corporateOrders, financeInvoices, gatewayTransactions, nextlevelPayments, partners, stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { MEIOS, MEIO_FIXO, ORIGENS, TIPO_FIXO, dataSP, diferencaDoFechamento, ehData, limitesDoDia, resumoDoDia, semanaDe, somarDias, type Meio, type Origem, type Tipo } from "@/lib/finance/caixa-regras";
import { isMasterOwner, requireMasterFn, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

/**
 * Caixa do Master (CX0 e CX1, D269): o dia abre e fecha; cada entrada ou saída guarda o meio e a origem; nada se apaga
 * (edição e estorno sempre com motivo, no histórico). Opera: o dono e a função Financeiro. Reabrir dia fechado: só o dono.
 * Os pagamentos do Mercado Pago aparecem sozinhos (lidos das cobranças pagas), sem mexer no dinheiro da gaveta.
 */
export const podeOperarCaixa = (actor: Actor) => isMasterOwner(actor) || (actor.role === "NEXTLEVEL_MASTER" && actor.masterFunction === "FINANCEIRO");
const exigir = (actor: Actor) => requireMasterFn(actor, ["FINANCEIRO"]);
const exigirDono = (actor: Actor, msg: string) => { if (!isMasterOwner(actor)) throw new ForbiddenError(msg); };
const reais = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;

async function diaDe(db: Database, data: string) {
  return db.query.caixaDias.findFirst({ where: eq(caixaDias.data, data) });
}

/** Dinheiro sugerido para abrir: o que foi contado no último fechamento. */
export async function sugestaoDeAbertura(db: Database, data: string): Promise<number> {
  const ultimo = (await db.select({ contado: caixaDias.contadoCents }).from(caixaDias).where(and(eq(caixaDias.status, "FECHADO"), lt(caixaDias.data, data))).orderBy(desc(caixaDias.data)).limit(1))[0];
  return ultimo?.contado ?? 0;
}

const aberturaSchema = z.object({ data: z.string().refine(ehData, "Data inválida").optional(), saldoInicialCents: z.number().int().min(0).max(100_000_000).optional() });

export async function abrirCaixa(db: Database, actor: Actor, raw: z.input<typeof aberturaSchema> = {}, now = new Date()) {
  exigir(actor);
  const v = aberturaSchema.parse(raw);
  const data = v.data ?? dataSP(now);
  if (data > dataSP(now)) throw new DomainError("CAIXA_DATA", "Não dá para abrir o caixa de um dia que ainda não chegou.");
  const existe = await diaDe(db, data);
  if (existe) throw new DomainError("CAIXA_EXISTE", existe.status === "ABERTO" ? "O caixa deste dia já está aberto." : "O caixa deste dia já foi fechado. Só o dono reabre.");
  const saldo = v.saldoInicialCents ?? await sugestaoDeAbertura(db, data);
  const id = newId("cxd");
  await db.insert(caixaDias).values({ id, data, saldoInicialCents: saldo, abertoEm: now.toISOString(), abertoPor: actor.userId });
  await db.insert(caixaHistorico).values({ id: newId("cxh"), diaId: id, acao: "ABRIR", depois: { data, saldoInicialCents: saldo }, userId: actor.userId });
  return { id, data, saldoInicialCents: saldo };
}

export const lancamentoSchema = z.object({
  data: z.string().refine(ehData, "Data inválida").optional(),
  tipo: z.enum(["ENTRADA", "SAIDA"]).optional(),
  meio: z.enum(MEIOS),
  origem: z.enum(ORIGENS),
  valorCents: z.number().int().positive("Informe o valor").max(100_000_000),
  storeId: z.string().nullish(),
  partnerId: z.string().nullish(),
  descricao: z.string().trim().max(300).default(""),
  ocorridoEm: z.string().datetime({ offset: true }).optional(),
});
type DadosDoLancamento = { tipo: Tipo; meio: Meio; origem: Origem; valorCents: number; storeId: string | null; partnerId: string | null; descricao: string };

/** Ajusta tipo e meio fixos da origem (sangria sai em dinheiro, reforço entra em dinheiro…) e confere loja e parceiro. */
async function normalizar(db: Database, v: { tipo?: Tipo; meio: Meio; origem: Origem; valorCents: number; storeId?: string | null; partnerId?: string | null; descricao: string }): Promise<DadosDoLancamento> {
  const tipo = TIPO_FIXO[v.origem] ?? v.tipo;
  if (!tipo) throw new DomainError("CAIXA_TIPO", "Diga se é entrada ou saída.");
  if (v.tipo && TIPO_FIXO[v.origem] && v.tipo !== TIPO_FIXO[v.origem]) throw new DomainError("CAIXA_TIPO", "Esta origem só pode ser " + (TIPO_FIXO[v.origem] === "ENTRADA" ? "entrada." : "saída."));
  const meio = MEIO_FIXO[v.origem] ?? v.meio;
  if (MEIO_FIXO[v.origem] && v.meio !== MEIO_FIXO[v.origem]) throw new DomainError("CAIXA_MEIO", "Sangria e reforço são sempre em dinheiro.");
  if (meio === "MERCADO_PAGO") throw new DomainError("CAIXA_MEIO", "Pagamento pelo Mercado Pago entra sozinho no caixa. Lance à mão só o que veio por outro meio.");
  if (v.origem === "PRESTACAO_EXECUTIVO" && !v.partnerId) throw new DomainError("CAIXA_EXECUTIVO", "Escolha o executivo que prestou contas.");
  if (v.storeId && !(await db.query.stores.findFirst({ where: eq(stores.id, v.storeId), columns: { id: true } }))) throw new NotFoundError("Loja não encontrada.");
  if (v.partnerId && !(await db.query.partners.findFirst({ where: eq(partners.id, v.partnerId), columns: { id: true } }))) throw new NotFoundError("Parceiro não encontrado.");
  return { tipo, meio, origem: v.origem, valorCents: v.valorCents, storeId: v.storeId ?? null, partnerId: v.partnerId ?? null, descricao: v.descricao };
}

/** Dia precisa estar aberto para receber ou mudar lançamento. Dia fechado: só o dono, e o dia volta a abrir (fica no histórico). */
async function garantirAberto(db: Database, actor: Actor, data: string, motivo: string | null) {
  const dia = await diaDe(db, data);
  if (!dia) throw new DomainError("CAIXA_FECHADO", `O caixa de ${data.split("-").reverse().join("/")} não foi aberto.`);
  if (dia.status === "ABERTO") return dia;
  exigirDono(actor, "Este dia já foi fechado. Só o dono reabre para mudar.");
  if (!motivo) throw new DomainError("CAIXA_MOTIVO", "Diga o motivo para mexer num dia fechado.");
  await reabrir(db, actor, dia, motivo);
  return { ...dia, status: "ABERTO" as const };
}

async function reabrir(db: Database, actor: Actor, dia: typeof caixaDias.$inferSelect, motivo: string) {
  await db.update(caixaDias).set({ status: "ABERTO", fechadoEm: null, fechadoPor: null, contadoCents: null, esperadoCents: null, diferencaCents: null, motivoDiferenca: null, updatedAt: new Date().toISOString() }).where(eq(caixaDias.id, dia.id));
  await db.insert(caixaHistorico).values({ id: newId("cxh"), diaId: dia.id, acao: "REABRIR", antes: { contadoCents: dia.contadoCents, diferencaCents: dia.diferencaCents }, motivo, userId: actor.userId });
}

export async function lancar(db: Database, actor: Actor, raw: z.input<typeof lancamentoSchema>, now = new Date()) {
  exigir(actor);
  const v = lancamentoSchema.parse(raw);
  const data = v.data ?? dataSP(now);
  await garantirAberto(db, actor, data, null);
  const d = await normalizar(db, v);
  const id = newId("cxl");
  await db.insert(caixaLancamentos).values({ id, data, ocorridoEm: v.ocorridoEm ?? now.toISOString(), ...d, criadoPor: actor.userId });
  await db.insert(caixaHistorico).values({ id: newId("cxh"), lancamentoId: id, acao: "LANCAR", depois: { data, ...d }, userId: actor.userId });
  return { id };
}

const edicaoSchema = lancamentoSchema.partial().extend({ motivo: z.string().trim().min(3, "Diga o motivo da mudança (pelo menos 3 letras)").max(300) });

/** Edita meio, valor, data, origem, loja, executivo ou descrição. Guarda o antes e o depois. */
export async function editarLancamento(db: Database, actor: Actor, id: string, raw: z.input<typeof edicaoSchema>) {
  exigir(actor);
  const v = edicaoSchema.parse(raw);
  const l = await db.query.caixaLancamentos.findFirst({ where: eq(caixaLancamentos.id, id) });
  if (!l) throw new NotFoundError("Lançamento não encontrado.");
  if (l.estornadoEm) throw new DomainError("CAIXA_ESTORNADO", "Lançamento estornado não muda. Faça um novo.");
  const novaData = v.data ?? l.data;
  await garantirAberto(db, actor, l.data, v.motivo);
  if (novaData !== l.data) await garantirAberto(db, actor, novaData, v.motivo);
  const d = await normalizar(db, { tipo: v.tipo ?? (v.origem && TIPO_FIXO[v.origem] ? undefined : l.tipo), meio: v.meio ?? l.meio, origem: v.origem ?? l.origem, valorCents: v.valorCents ?? l.valorCents, storeId: v.storeId === undefined ? l.storeId : v.storeId, partnerId: v.partnerId === undefined ? l.partnerId : v.partnerId, descricao: v.descricao ?? l.descricao });
  const depois = { data: novaData, ocorridoEm: v.ocorridoEm ?? l.ocorridoEm, ...d };
  const antes = { data: l.data, ocorridoEm: l.ocorridoEm, tipo: l.tipo, meio: l.meio, origem: l.origem, valorCents: l.valorCents, storeId: l.storeId, partnerId: l.partnerId, descricao: l.descricao };
  await db.update(caixaLancamentos).set({ ...depois, updatedAt: new Date().toISOString() }).where(eq(caixaLancamentos.id, id));
  await db.insert(caixaHistorico).values({ id: newId("cxh"), lancamentoId: id, acao: "EDITAR", antes, depois, motivo: v.motivo, userId: actor.userId });
  return { id };
}

export async function estornarLancamento(db: Database, actor: Actor, id: string, motivo: string) {
  exigir(actor);
  const m = z.string().trim().min(3, "Diga o motivo do estorno").max(300).parse(motivo);
  const l = await db.query.caixaLancamentos.findFirst({ where: eq(caixaLancamentos.id, id) });
  if (!l) throw new NotFoundError("Lançamento não encontrado.");
  if (l.estornadoEm) return { id };
  await garantirAberto(db, actor, l.data, m);
  await db.update(caixaLancamentos).set({ estornadoEm: new Date().toISOString(), estornoMotivo: m }).where(eq(caixaLancamentos.id, id));
  await db.insert(caixaHistorico).values({ id: newId("cxh"), lancamentoId: id, acao: "ESTORNAR", antes: { valorCents: l.valorCents, meio: l.meio }, motivo: m, userId: actor.userId });
  return { id };
}

const fechamentoSchema = z.object({ data: z.string().refine(ehData).optional(), contadoCents: z.number().int().min(0).max(100_000_000), motivo: z.string().trim().max(300).optional() });

/** Fecha o dia: compara o dinheiro contado com o esperado. Diferença exige motivo. */
export async function fecharCaixa(db: Database, actor: Actor, raw: z.input<typeof fechamentoSchema>, now = new Date()) {
  exigir(actor);
  const v = fechamentoSchema.parse(raw);
  const data = v.data ?? dataSP(now);
  const dia = await diaDe(db, data);
  if (!dia) throw new DomainError("CAIXA_FECHADO", "O caixa deste dia não foi aberto.");
  if (dia.status === "FECHADO") throw new DomainError("CAIXA_FECHADO", "Este dia já está fechado.");
  const lanc = await db.select().from(caixaLancamentos).where(eq(caixaLancamentos.data, data));
  const r = resumoDoDia(lanc.map((l) => ({ ...l, estornado: !!l.estornadoEm })), dia.saldoInicialCents);
  const dif = diferencaDoFechamento(r.esperadoGavetaCents, v.contadoCents);
  if (dif !== 0 && (!v.motivo || v.motivo.length < 3)) throw new DomainError("CAIXA_DIFERENCA", `${dif > 0 ? "Sobrou" : "Faltou"} ${reais(Math.abs(dif))} na gaveta. Diga o motivo para fechar.`);
  const depois = { contadoCents: v.contadoCents, esperadoCents: r.esperadoGavetaCents, diferencaCents: dif, motivoDiferenca: dif ? v.motivo! : null };
  await db.update(caixaDias).set({ status: "FECHADO", fechadoEm: now.toISOString(), fechadoPor: actor.userId, ...depois, updatedAt: now.toISOString() }).where(eq(caixaDias.id, dia.id));
  await db.insert(caixaHistorico).values({ id: newId("cxh"), diaId: dia.id, acao: "FECHAR", depois, motivo: dif ? v.motivo : null, userId: actor.userId });
  return depois;
}

export async function reabrirCaixa(db: Database, actor: Actor, data: string, motivo: string) {
  exigirDono(actor, "Só o dono reabre um dia fechado.");
  const m = z.string().trim().min(3, "Diga o motivo da reabertura").max(300).parse(motivo);
  const dia = await diaDe(db, data);
  if (!dia) throw new NotFoundError("Dia de caixa não encontrado.");
  if (dia.status === "ABERTO") return;
  await reabrir(db, actor, dia, m);
}

// ---------------------------------------------------------------------------------------------------------------------
// Leitura: dia, semana e lista de lançamentos (com os pagamentos do Mercado Pago, que entram sozinhos)
// ---------------------------------------------------------------------------------------------------------------------
export type LinhaDoCaixa = {
  id: string; data: string; ocorridoEm: string; tipo: Tipo; meio: Meio; origem: Origem; valorCents: number; descricao: string;
  loja: string | null; storeId: string | null; parceiro: string | null; partnerId: string | null; quem: string | null;
  estornado: boolean; estornoMotivo: string | null; editado: boolean; automatico: boolean;
};

/** Pagamentos confirmados pelo Mercado Pago entre duas datas (cobranças de planos e de faturas). Só leitura. */
async function automaticos(db: Database, de: string, ate: string): Promise<LinhaDoCaixa[]> {
  const inicio = limitesDoDia(de).inicio.toISOString(), fim = limitesDoDia(ate).fim.toISOString();
  const [gt, nl] = await Promise.all([
    db.select({ id: gatewayTransactions.id, paidAt: gatewayTransactions.paidAt, valor: gatewayTransactions.grossCents, method: gatewayTransactions.method, storeId: corporateOrders.storeId, comprador: corporateOrders.buyerName, produto: catalogProducts.name, loja: stores.name })
      .from(gatewayTransactions).innerJoin(corporateOrders, eq(corporateOrders.id, gatewayTransactions.orderId)).leftJoin(catalogProducts, eq(catalogProducts.id, corporateOrders.productId)).leftJoin(stores, eq(stores.id, corporateOrders.storeId))
      .where(and(inArray(gatewayTransactions.status, ["PAID", "REFUNDED"]), gte(gatewayTransactions.paidAt, inicio), lt(gatewayTransactions.paidAt, fim))),
    db.select({ id: nextlevelPayments.id, paidAt: nextlevelPayments.paidAt, valor: nextlevelPayments.amountCents, method: nextlevelPayments.method, storeId: financeInvoices.storeId, descricao: financeInvoices.description, kind: financeInvoices.kind, loja: stores.name })
      .from(nextlevelPayments).innerJoin(financeInvoices, eq(financeInvoices.id, nextlevelPayments.invoiceId)).leftJoin(stores, eq(stores.id, financeInvoices.storeId))
      .where(and(eq(nextlevelPayments.status, "PAID"), gte(nextlevelPayments.paidAt, inicio), lt(nextlevelPayments.paidAt, fim))),
  ]);
  const linha = (id: string, paidAt: string, valor: number, descricao: string, storeId: string | null, loja: string | null, origem: Origem): LinhaDoCaixa => ({ id: `mp:${id}`, data: dataSP(new Date(paidAt)), ocorridoEm: paidAt, tipo: "ENTRADA", meio: "MERCADO_PAGO", origem, valorCents: valor, descricao, loja, storeId, parceiro: null, partnerId: null, quem: null, estornado: false, estornoMotivo: null, editado: false, automatico: true });
  return [
    ...gt.filter((x) => x.paidAt).map((x) => linha(x.id, x.paidAt!, x.valor, `${x.produto ?? "Pedido"} · ${x.method === "PIX" ? "Pix" : "cartão"} · ${x.comprador}`, x.storeId, x.loja, "ASSINATURA")),
    ...nl.filter((x) => x.paidAt).map((x) => linha(x.id, x.paidAt!, x.valor, `${x.descricao} · ${x.method === "PIX" ? "Pix" : "cartão"}`, x.storeId, x.loja, x.kind === "STORE_PLAN" ? "ASSINATURA" : "SERVICO")),
  ];
}

async function manuais(db: Database, datas: string[]): Promise<LinhaDoCaixa[]> {
  if (!datas.length) return [];
  const rows = await db.select({ l: caixaLancamentos, loja: stores.name, parceiro: partners.displayName, quem: users.name })
    .from(caixaLancamentos).leftJoin(stores, eq(stores.id, caixaLancamentos.storeId)).leftJoin(partners, eq(partners.id, caixaLancamentos.partnerId)).leftJoin(users, eq(users.id, caixaLancamentos.criadoPor))
    .where(inArray(caixaLancamentos.data, datas)).orderBy(asc(caixaLancamentos.ocorridoEm));
  const editados = new Set((rows.length ? await db.select({ id: caixaHistorico.lancamentoId }).from(caixaHistorico).where(and(eq(caixaHistorico.acao, "EDITAR"), inArray(caixaHistorico.lancamentoId, rows.map((r) => r.l.id)))) : []).map((r) => r.id));
  return rows.map(({ l, loja, parceiro, quem }) => ({ id: l.id, data: l.data, ocorridoEm: l.ocorridoEm, tipo: l.tipo, meio: l.meio, origem: l.origem, valorCents: l.valorCents, descricao: l.descricao, loja, storeId: l.storeId, parceiro, partnerId: l.partnerId, quem, estornado: !!l.estornadoEm, estornoMotivo: l.estornoMotivo, editado: editados.has(l.id), automatico: false }));
}

export async function caixaDoDia(db: Database, actor: Actor, data: string = dataSP()) {
  exigir(actor);
  if (!ehData(data)) throw new DomainError("CAIXA_DATA", "Data inválida.");
  const [dia, man, auto, sugestao] = await Promise.all([diaDe(db, data), manuais(db, [data]), automaticos(db, data, data), sugestaoDeAbertura(db, data)]);
  const linhas = [...man, ...auto].sort((a, b) => a.ocorridoEm.localeCompare(b.ocorridoEm));
  const resumo = resumoDoDia(linhas.map((l) => ({ ...l })), dia?.saldoInicialCents ?? 0);
  const historico = dia ? await db.select({ h: caixaHistorico, quem: users.name }).from(caixaHistorico).leftJoin(users, eq(users.id, caixaHistorico.userId)).where(eq(caixaHistorico.diaId, dia.id)).orderBy(asc(caixaHistorico.createdAt)) : [];
  return { data, hoje: dataSP(), dia: dia ?? null, linhas, resumo, sugestaoCents: sugestao, historico: historico.map(({ h, quem }) => ({ acao: h.acao, motivo: h.motivo, quando: h.createdAt, quem })), dono: isMasterOwner(actor) };
}

export async function caixaDaSemana(db: Database, actor: Actor, dataRef: string = dataSP()) {
  exigir(actor);
  const datas = semanaDe(ehData(dataRef) ? dataRef : dataSP());
  const [dias, man, auto] = await Promise.all([db.select().from(caixaDias).where(inArray(caixaDias.data, datas)), manuais(db, datas), automaticos(db, datas[0]!, datas[6]!)]);
  const todas = [...man, ...auto];
  const porDia = datas.map((data) => {
    const dia = dias.find((d) => d.data === data) ?? null;
    return { data, dia, resumo: resumoDoDia(todas.filter((l) => l.data === data), dia?.saldoInicialCents ?? 0) };
  });
  return { datas, porDia, total: resumoDoDia(todas), hoje: dataSP() };
}

export const filtrosSchema = z.object({ de: z.string().refine(ehData).optional(), ate: z.string().refine(ehData).optional(), meio: z.enum(MEIOS).optional(), origem: z.enum(ORIGENS).optional() });
/** Lista de lançamentos de um período (até 62 dias), com filtros. */
export async function listaDeLancamentos(db: Database, actor: Actor, raw: z.input<typeof filtrosSchema> = {}) {
  exigir(actor);
  const f = filtrosSchema.parse(raw);
  const ate = f.ate ?? dataSP();
  let de = f.de ?? semanaDe(ate)[0]!;
  if (de > ate) de = ate;
  const datas: string[] = [];
  for (let d = de; d <= ate && datas.length < 62; d = somarDias(d, 1)) datas.push(d);
  const [man, auto] = await Promise.all([manuais(db, datas), automaticos(db, datas[0]!, datas[datas.length - 1]!)]);
  const linhas = [...man, ...auto].filter((l) => (!f.meio || l.meio === f.meio) && (!f.origem || l.origem === f.origem)).sort((a, b) => b.ocorridoEm.localeCompare(a.ocorridoEm));
  return { de: datas[0]!, ate: datas[datas.length - 1]!, linhas, resumo: resumoDoDia(linhas) };
}

/** Histórico de um lançamento (quem mudou o quê e por quê). */
export async function historicoDoLancamento(db: Database, actor: Actor, id: string) {
  exigir(actor);
  return (await db.select({ h: caixaHistorico, quem: users.name }).from(caixaHistorico).leftJoin(users, eq(users.id, caixaHistorico.userId)).where(eq(caixaHistorico.lancamentoId, id)).orderBy(asc(caixaHistorico.createdAt))).map(({ h, quem }) => ({ ...h, quem }));
}

/** Opções dos campos (lojas e executivos/parceiros) para os formulários do caixa. */
export async function opcoesDoCaixa(db: Database, actor: Actor) {
  exigir(actor);
  const [lojas, parc] = await Promise.all([
    db.select({ id: stores.id, nome: stores.name }).from(stores).orderBy(asc(stores.name)).limit(500),
    db.select({ id: partners.id, nome: partners.displayName, executivo: partners.executivo }).from(partners).orderBy(desc(partners.executivo), asc(partners.displayName)).limit(500),
  ]);
  return { lojas, parceiros: parc };
}

