import { and, asc, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { executivoRecebimentos, financeInvoices, organizations, partnerCommissions, partners, stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { formatBRL } from "@/lib/money";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";
import { periodoDe } from "@/lib/finance/bonus-regras";
import { atrasado, codigoDeRecibo, linkDoRecibo, prazoDeEntrega, textoDoRecibo } from "@/lib/finance/executivo-regras";
import { isMasterOwner, type Actor } from "./access";
import { desfazerPagamento, pagarAssinaturaManual } from "./assinaturas-master";
import { lancar, podeOperarCaixa } from "./caixa";
import { COMMERCE_PLAN_KEYS, subscriptionOf } from "./commerce-plans";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { partnerOfActor, registerPartner } from "./partners";

/**
 * Executivos de venda (CX3, D273): a equipe de rua da NextLevel. É um parceiro do tipo vendedor marcado como executivo,
 * cadastrado pelo dono, com a mesma comissão do programa. Vende na rua em dinheiro ou na maquininha: a loja é liberada na
 * hora, o lojista recebe recibo pelo WhatsApp e o dinheiro fica com o executivo até a prestação de contas (2 dias úteis),
 * que entra no caixa do dia. Atrasou: não registra nova venda em dinheiro até entregar (a loja do cliente não é bloqueada).
 */
const exigirOperador = (actor: Actor) => { if (!podeOperarCaixa(actor)) throw new ForbiddenError("Só o dono e o Financeiro recebem dos executivos."); };

// ---------------------------------------------------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------------------------------------------------
export const executivoSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "Senha provisória com pelo menos 8 caracteres"),
  taxId: z.string().min(11, "Informe o CPF ou CNPJ"),
  telefone: z.string().min(10, "WhatsApp com DDD"),
});

/** Só o dono cadastra um executivo (nunca pela página pública). */
export async function cadastrarExecutivo(db: Database, actor: Actor, raw: z.input<typeof executivoSchema>, now = new Date()) {
  if (!isMasterOwner(actor)) throw new ForbiddenError("Só o dono cadastra executivos de venda.");
  const v = executivoSchema.parse(raw);
  const r = await registerPartner(db, { name: v.nome, email: v.email, password: v.senha, taxId: v.taxId, phone: v.telefone, acceptTerms: true, brand: "NEXTLEVEL_COMMERCE" }, now);
  const p = (await db.query.partners.findFirst({ where: eq(partners.userId, r.userId) }))!;
  await db.update(partners).set({ kind: "REPRESENTATIVE", executivo: true, status: "ACTIVE" }).where(eq(partners.id, p.id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_CRIADO", entityType: "partner", entityId: p.id, partnerId: p.id, after: { nome: v.nome, email: v.email } });
  return { partnerId: p.id };
}

/** Lista de executivos com o que importa no dia: vendas, comissão, dinheiro na mão e atrasos. */
export async function painelDosExecutivos(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  const lista = await db.select({ p: partners, email: users.email }).from(partners).innerJoin(users, eq(users.id, partners.userId)).where(eq(partners.executivo, true)).orderBy(asc(partners.displayName));
  const ids = lista.map((x) => x.p.id);
  const sem = periodoDe("SEMANA", now), mes = periodoDe("MES", now);
  const [vendas, comissoes, recebimentos] = ids.length ? await Promise.all([
    db.select({ partnerId: partnerCommissions.partnerId, criado: partnerCommissions.createdAt }).from(partnerCommissions).where(and(inArray(partnerCommissions.partnerId, ids), eq(partnerCommissions.kind, "SALE"), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, mes.inicio.toISOString()))),
    db.select({ partnerId: partnerCommissions.partnerId, valor: partnerCommissions.amountCents }).from(partnerCommissions).where(and(inArray(partnerCommissions.partnerId, ids), inArray(partnerCommissions.kind, ["SALE", "RECURRING", "BONUS", "CLAWBACK"]), ne(partnerCommissions.status, "VOID"), gte(partnerCommissions.createdAt, mes.inicio.toISOString()))),
    db.select().from(executivoRecebimentos).where(inArray(executivoRecebimentos.partnerId, ids)),
  ]) : [[], [], []];
  return lista.map(({ p, email }) => {
    const minhas = recebimentos.filter((r) => r.partnerId === p.id);
    const comigo = minhas.filter((r) => r.status === "COM_EXECUTIVO" && r.meio === "DINHEIRO");
    const entregas = minhas.filter((r) => r.status === "ENTREGUE").map((r) => r.entregueEm!).sort();
    return {
      id: p.id, nome: p.displayName, email, telefone: p.phone, status: p.status, nivel: p.tier,
      vendasSemana: vendas.filter((v) => v.partnerId === p.id && v.criado >= sem.inicio.toISOString()).length,
      vendasMes: vendas.filter((v) => v.partnerId === p.id).length,
      comissaoMesCents: comissoes.filter((c) => c.partnerId === p.id).reduce((t, c) => t + c.valor, 0),
      dinheiroComEleCents: comigo.reduce((t, r) => t + r.valorCents, 0),
      atrasados: comigo.filter((r) => atrasado(r.prazoAte, now)).length,
      maquininhaAConferir: minhas.filter((r) => r.status === "COM_EXECUTIVO" && r.meio === "MAQUININHA_VENDEDOR").length,
      ultimaPrestacao: entregas.at(-1) ?? null,
    };
  });
}

/** Tudo que está com os executivos (dinheiro a entregar e maquininha a conferir), dos mais antigos aos mais novos. */
export async function pendenciasDosExecutivos(db: Database, actor: Actor, now = new Date()) {
  if (actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
  const rows = await db.select({ r: executivoRecebimentos, loja: stores.name, executivo: partners.displayName }).from(executivoRecebimentos).innerJoin(stores, eq(stores.id, executivoRecebimentos.storeId)).innerJoin(partners, eq(partners.id, executivoRecebimentos.partnerId)).where(eq(executivoRecebimentos.status, "COM_EXECUTIVO")).orderBy(asc(executivoRecebimentos.recebidoEm));
  return rows.map(({ r, loja, executivo }) => ({ ...r, loja, executivo, atrasado: atrasado(r.prazoAte, now) }));
}

/** Prestação de contas: o dono confere e o valor entra no caixa do dia (dinheiro na gaveta; maquininha no Mercado Pago). */
export async function receberDoExecutivo(db: Database, actor: Actor, id: string, now = new Date()) {
  exigirOperador(actor);
  const r = await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.id, id) });
  if (!r) throw new NotFoundError("Recebimento não encontrado.");
  if (r.status !== "COM_EXECUTIVO") throw new DomainError("EXECUTIVO_STATUS", r.status === "ENTREGUE" ? "Este valor já foi recebido." : "Esta venda foi estornada.");
  const p = (await db.query.partners.findFirst({ where: eq(partners.id, r.partnerId) }))!;
  const dinheiro = r.meio === "DINHEIRO";
  const l = await lancar(db, actor, dinheiro
    ? { meio: "DINHEIRO", destino: "DINHEIRO_MAURICIO", origem: "PRESTACAO_EXECUTIVO", valorCents: r.valorCents, storeId: r.storeId, partnerId: r.partnerId, invoiceId: r.invoiceId, descricao: `Prestação de contas de ${p.displayName} · ${r.codigo}` }
    : { meio: "MAQUININHA_VENDEDOR", destino: "MP_MEGATRON", origem: "ASSINATURA", valorCents: r.valorCents, storeId: r.storeId, partnerId: r.partnerId, invoiceId: r.invoiceId, descricao: `Maquininha de ${p.displayName} conferida · ${r.codigo}` }, now);
  await db.update(executivoRecebimentos).set({ status: "ENTREGUE", entregueEm: now.toISOString(), recebidoPor: actor.userId, lancamentoId: l.id }).where(eq(executivoRecebimentos.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_PRESTOU_CONTAS", entityType: "executivo_recebimento", entityId: id, partnerId: r.partnerId, storeId: r.storeId, after: { valorCents: r.valorCents, meio: r.meio, lancamentoId: l.id } });
  return { lancamentoId: l.id };
}

/** Estorna uma venda de rua ainda com o executivo: fatura cancelada, comissão desfeita e período devolvido. */
export async function estornarVendaDeRua(db: Database, actor: Actor, id: string, motivo: string, now = new Date()) {
  exigirOperador(actor);
  const m = z.string().trim().min(3, "Diga o motivo do estorno").max(300).parse(motivo);
  const r = await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.id, id) });
  if (!r) throw new NotFoundError("Recebimento não encontrado.");
  if (r.status !== "COM_EXECUTIVO") throw new DomainError("EXECUTIVO_STATUS", "Já entrou no caixa: estorne pelo caixa.");
  const inv = (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, r.invoiceId) }))!;
  await desfazerPagamento(db, inv, m, now);
  await db.update(executivoRecebimentos).set({ status: "ESTORNADO", motivoEstorno: m }).where(eq(executivoRecebimentos.id, id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_VENDA_ESTORNADA", entityType: "executivo_recebimento", entityId: id, partnerId: r.partnerId, storeId: r.storeId, reason: m });
}

// ---------------------------------------------------------------------------------------------------------------------
// Executivo (painel do parceiro)
// ---------------------------------------------------------------------------------------------------------------------
async function executivoDoActor(db: Database, actor: Actor) {
  const p = await partnerOfActor(db, actor);
  if (!p.executivo) throw new ForbiddenError("Área dos executivos de venda da NextLevel.");
  return p;
}

export const vendaDeRuaSchema = z.object({
  storeId: z.string().min(1, "Escolha a loja"),
  productKey: z.enum(COMMERCE_PLAN_KEYS),
  cycle: z.enum(["MONTHLY", "ANNUAL"]),
  meio: z.enum(["DINHEIRO", "MAQUININHA_VENDEDOR"]),
  observacao: z.string().trim().max(300).optional(),
});

/** Venda na rua: libera a loja na hora, gera a comissão do executivo e o recibo; o valor fica "com o executivo". */
export async function registrarVendaDeRua(db: Database, actor: Actor, raw: z.input<typeof vendaDeRuaSchema>, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  if (p.status !== "ACTIVE") throw new DomainError("EXECUTIVO_INATIVO", "Seu cadastro não está ativo. Fale com a NextLevel.");
  const v = vendaDeRuaSchema.parse(raw);
  if (v.meio === "DINHEIRO") {
    const pend = await db.select().from(executivoRecebimentos).where(and(eq(executivoRecebimentos.partnerId, p.id), eq(executivoRecebimentos.status, "COM_EXECUTIVO"), eq(executivoRecebimentos.meio, "DINHEIRO")));
    if (pend.some((x) => atrasado(x.prazoAte, now))) throw new DomainError("EXECUTIVO_ATRASADO", "Você tem dinheiro com prazo vencido. Entregue à NextLevel para registrar nova venda em dinheiro (maquininha continua liberada).");
  }
  const loja = (await db.select({ s: stores, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, v.storeId)).limit(1))[0];
  if (!loja || loja.brand !== "NEXTLEVEL_COMMERCE") throw new NotFoundError("Loja não encontrada.");
  if (loja.s.partnerId && loja.s.partnerId !== p.id) throw new ForbiddenError("Esta loja foi indicada por outro parceiro.");
  const pg = await pagarAssinaturaManual(db, null, loja.s, { productKey: v.productKey, cycle: v.cycle, partnerId: p.id }, now);
  let codigo = codigoDeRecibo();
  while (await db.query.executivoRecebimentos.findFirst({ where: eq(executivoRecebimentos.codigo, codigo), columns: { id: true } })) codigo = codigoDeRecibo();
  const id = newId("exr");
  await db.insert(executivoRecebimentos).values({ id, codigo, partnerId: p.id, storeId: loja.s.id, invoiceId: pg.paga.id, meio: v.meio, valorCents: pg.valor, recebidoEm: now.toISOString(), prazoAte: prazoDeEntrega(now).toISOString(), observacao: v.observacao ?? null });
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "EXECUTIVO_VENDEU", entityType: "executivo_recebimento", entityId: id, partnerId: p.id, storeId: loja.s.id, after: { codigo, meio: v.meio, valorCents: pg.valor, invoiceId: pg.paga.id } });
  const s = (await db.query.stores.findFirst({ where: eq(stores.id, loja.s.id) }))!;
  const texto = textoDoRecibo({ codigo, loja: s.name, plano: `${nomePlanoEc(v.productKey)} ${v.cycle === "ANNUAL" ? "anual" : "mensal"}`, valor: formatBRL(pg.valor), meio: v.meio, executivo: p.displayName, quando: now, pagoAte: s.paidUntil ? new Date(s.paidUntil) : null });
  return { id, codigo, valorCents: pg.valor, pagoAte: s.paidUntil, recibo: texto, whatsapp: linkDoRecibo(texto, s.whatsapp) };
}

/** O que o executivo vê: lojas que pode cobrar, dinheiro com ele (com prazo) e os últimos recibos. */
export async function painelDoExecutivo(db: Database, actor: Actor, now = new Date()) {
  const p = await executivoDoActor(db, actor);
  const [lojas, recs] = await Promise.all([
    db.select({ id: stores.id, nome: stores.name, pagoAte: stores.paidUntil, testeAte: stores.trialEndsAt }).from(stores).where(eq(stores.partnerId, p.id)).orderBy(asc(stores.name)),
    db.select({ r: executivoRecebimentos, loja: stores.name }).from(executivoRecebimentos).innerJoin(stores, eq(stores.id, executivoRecebimentos.storeId)).where(eq(executivoRecebimentos.partnerId, p.id)).orderBy(desc(executivoRecebimentos.recebidoEm)).limit(30),
  ]);
  const planos = await Promise.all(lojas.map(async (l) => ({ ...l, assinatura: await subscriptionOf(db, l.id) })));
  const comigo = recs.filter((x) => x.r.status === "COM_EXECUTIVO" && x.r.meio === "DINHEIRO").map((x) => ({ ...x.r, loja: x.loja, atrasado: atrasado(x.r.prazoAte, now) }));
  return {
    executivo: { id: p.id, nome: p.displayName },
    lojas: planos.map((l) => ({ id: l.id, nome: l.nome, pagoAte: l.pagoAte, testeAte: l.testeAte, productKey: l.assinatura?.productKey ?? null, ciclo: l.assinatura?.cycle ?? null })),
    comigo, totalComigoCents: comigo.reduce((t, r) => t + r.valorCents, 0), travado: comigo.some((r) => r.atrasado),
    recibos: recs.map((x) => ({ id: x.r.id, codigo: x.r.codigo, loja: x.loja, valorCents: x.r.valorCents, meio: x.r.meio, status: x.r.status, recebidoEm: x.r.recebidoEm })),
  };
}
export type PainelDoExecutivo = Awaited<ReturnType<typeof painelDoExecutivo>>;
