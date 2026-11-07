import { and, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { caixaLancamentos, financeInvoices, nlSubscriptions, organizations, partnerCommissions, partners, stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DESTINOS, DESTINOS_DO_MEIO, MEIOS_MANUAIS, NOME_DO_MEIO, dataSP, type Meio } from "@/lib/finance/caixa-regras";
import { nomePlanoEc } from "@/lib/marcas/nextlevel-ecommerce";
import type { Actor } from "./access";
import { estornarLancamento, lancar, podeOperarCaixa } from "./caixa";
import { COMMERCE_PLAN_KEYS, STATUS_LABEL, ensureSubscriptionInvoice, startCommerceSubscription, subscriptionOf, trocarPlanoDaAssinatura, type PlanCycle } from "./commerce-plans";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { CORPORATE, recordFinancialAudit } from "./fin-audit";
import { markInvoicePaid, periodOf } from "./finance";

/**
 * Assinaturas e recebimentos no Master (CX2, D270). Receber manualmente usa o MESMO caminho do pagamento online: a fatura
 * da assinatura é paga, o período é renovado, a loja é liberada e a comissão nasce pela regra (D260). O recebimento entra
 * no caixa do dia com o meio. Só o dono e a função Financeiro.
 */
const DAY = 86_400_000;
const exigir = (actor: Actor) => { if (!podeOperarCaixa(actor)) throw new ForbiddenError("Só o dono e o Financeiro recebem pagamentos."); };
const reais = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;

async function lojaCommerce(db: Database, storeId: string) {
  const row = (await db.select({ s: stores, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, storeId)).limit(1))[0];
  if (!row) throw new NotFoundError("Loja não encontrada.");
  if (row.brand !== "NEXTLEVEL_COMMERCE") throw new DomainError("NOT_COMMERCE", "Assinaturas manuais são só para lojas da NextLevel E-commerce.");
  return row.s;
}

export const recebimentoSchema = z.object({
  storeId: z.string().min(1, "Escolha a loja"),
  productKey: z.enum(COMMERCE_PLAN_KEYS).optional(),
  cycle: z.enum(["MONTHLY", "ANNUAL"]).optional(),
  meio: z.enum(MEIOS_MANUAIS),
  /** Conta de destino (vazio = a sugerida para a forma de pagamento). */
  destino: z.enum(DESTINOS).nullish(),
  /** Valor recebido; vazio = valor da tabela. Menor que a tabela = desconto, com motivo. */
  valorCents: z.number().int().positive().max(100_000_00).optional(),
  motivoDesconto: z.string().trim().max(300).optional(),
  /** Executivo ou parceiro que vendeu (vira a indicação da loja se ela ainda não tiver uma). */
  partnerId: z.string().nullish(),
  observacao: z.string().trim().max(300).optional(),
});

/** Recebe a assinatura à mão: (troca o plano se pedido) → fatura → paga → renova e libera → comissão → caixa do dia. */
export async function receberAssinatura(db: Database, actor: Actor, raw: z.input<typeof recebimentoSchema>, now = new Date()) {
  exigir(actor);
  const v = recebimentoSchema.parse(raw);
  const store = await lojaCommerce(db, v.storeId);
  const hoje = dataSP(now);
  const dia = await db.query.caixaDias.findFirst({ where: (t, { eq: e }) => e(t.data, hoje) });
  if (!dia || dia.status !== "ABERTO") throw new DomainError("CAIXA_FECHADO", "Abra o caixa de hoje antes de receber.");
  if (v.destino && !DESTINOS_DO_MEIO[v.meio].includes(v.destino)) throw new DomainError("CAIXA_DESTINO", "Esta conta não combina com a forma de pagamento.");
  let aviso: string | null = null;
  if (v.partnerId) {
    const p = await db.query.partners.findFirst({ where: eq(partners.id, v.partnerId) });
    if (!p) throw new NotFoundError("Executivo ou parceiro não encontrado.");
    if (!store.partnerId) await db.update(stores).set({ partnerId: p.id, attributedVia: "EXECUTIVO", attributedAt: now.toISOString(), updatedAt: now.toISOString() }).where(eq(stores.id, store.id));
    else if (store.partnerId !== p.id) aviso = "Esta loja já foi indicada por outro parceiro: a comissão segue com quem indicou primeiro.";
  }
  let sub = await subscriptionOf(db, store.id);
  if (!sub) {
    if (!v.productKey || !v.cycle) throw new DomainError("PLANO", "Escolha o plano e o ciclo desta loja.");
    await startCommerceSubscription(db, { storeId: store.id, productKey: v.productKey, cycle: v.cycle, taxId: store.taxId ?? null, actor, now, allowOffer: false });
  } else if ((v.productKey && v.productKey !== sub.productKey) || (v.cycle && v.cycle !== sub.cycle) || ["cancelled", "expired"].includes(sub.status)) {
    await trocarPlanoDaAssinatura(db, actor, store.id, sub, { productKey: (v.productKey ?? sub.productKey) as (typeof COMMERCE_PLAN_KEYS)[number], cycle: (v.cycle ?? sub.cycle) as PlanCycle }, now);
  }
  sub = (await subscriptionOf(db, store.id))!;
  const fatura = await ensureSubscriptionInvoice(db, store, now);
  if (!fatura) throw new DomainError("FATURA", "Não foi possível gerar a cobrança desta assinatura.");
  const tabela = fatura.amountCents;
  const valor = v.valorCents ?? tabela;
  if (valor > tabela) throw new DomainError("VALOR", `O valor passa da tabela (${reais(tabela)}). Para cobrar mais, troque o plano ou o ciclo.`);
  const desconto = tabela - valor;
  if (desconto > 0) {
    if (!v.motivoDesconto || v.motivoDesconto.length < 3) throw new DomainError("DESCONTO", `Desconto de ${reais(desconto)}: diga o motivo.`);
    const inv = (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, fatura.invoiceId) }))!;
    await db.update(financeInvoices).set({ amountCents: valor, lines: [...inv.lines, { kind: "STORE_PLAN", description: `Desconto: ${v.motivoDesconto}`, amountCents: -desconto }] }).where(eq(financeInvoices.id, inv.id));
  }
  await markInvoicePaid(db, fatura.invoiceId, now);
  const paga = (await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, fatura.invoiceId) }))!;
  const descricao = `${fatura.description} · ${store.name}${desconto ? ` · desconto ${reais(desconto)} (${v.motivoDesconto})` : ""}${v.observacao ? ` · ${v.observacao}` : ""}`.slice(0, 300);
  const l = await lancar(db, actor, { data: hoje, meio: v.meio, destino: v.destino ?? null, origem: "ASSINATURA", valorCents: valor, storeId: store.id, partnerId: v.partnerId ?? null, invoiceId: paga.id, descricao }, now);
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_PAID_MANUAL", entityType: "finance_invoice", entityId: paga.id, storeId: store.id, after: { meio: v.meio, valorCents: valor, tabelaCents: tabela, descontoCents: desconto, lancamentoId: l.id, partnerId: v.partnerId ?? null } });
  const loja = (await db.query.stores.findFirst({ where: eq(stores.id, store.id) }))!;
  return { invoiceId: paga.id, lancamentoId: l.id, valorCents: valor, descontoCents: desconto, pagoAte: loja.paidUntil, aviso };
}

/**
 * Estorna um recebimento manual: o lançamento sai das contas (com motivo), a fatura é cancelada, a comissão é desfeita
 * (em garantia: anulada; já liberada: débito igual no saldo) e o período pago volta o que tinha andado.
 */
export async function estornarRecebimento(db: Database, actor: Actor, lancamentoId: string, motivo: string, now = new Date()) {
  exigir(actor);
  const m = z.string().trim().min(3, "Diga o motivo do estorno").max(300).parse(motivo);
  const l = await db.query.caixaLancamentos.findFirst({ where: eq(caixaLancamentos.id, lancamentoId) });
  if (!l || !l.invoiceId) throw new NotFoundError("Recebimento de assinatura não encontrado.");
  if (l.estornadoEm) return { ok: true };
  const inv = await db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, l.invoiceId) });
  if (!inv?.storeId) throw new NotFoundError("Fatura não encontrada.");
  await estornarLancamento(db, actor, l.id, m);
  await db.update(financeInvoices).set({ status: "CANCELED" }).where(eq(financeInvoices.id, inv.id));
  const comissoes = await db.select().from(partnerCommissions).where(and(eq(partnerCommissions.invoiceId, inv.id), inArray(partnerCommissions.kind, ["SALE", "RECURRING"]), ne(partnerCommissions.status, "VOID")));
  for (const c of comissoes) {
    if (c.status === "PENDING") await db.update(partnerCommissions).set({ status: "VOID", note: `${c.note ?? ""} · Estorno: ${m}` }).where(eq(partnerCommissions.id, c.id));
    else await db.insert(partnerCommissions).values({ id: newId("pcm"), partnerId: c.partnerId, storeId: c.storeId, invoiceId: inv.id, refId: c.id, kind: "CLAWBACK", amountCents: -c.amountCents, period: periodOf(now), status: "AVAILABLE", availableAt: now.toISOString(), note: `Estorno: ${m}`, dedupeKey: `CLAWBACK:${c.id}` }).onConflictDoNothing();
  }
  const sub = await subscriptionOf(db, inv.storeId);
  const loja = await db.query.stores.findFirst({ where: eq(stores.id, inv.storeId) });
  if (sub && loja?.paidUntil) {
    const fim = new Date(loja.paidUntil);
    fim.setUTCMonth(fim.getUTCMonth() - (sub.cycle === "ANNUAL" ? 12 : 1));
    await db.update(stores).set({ paidUntil: fim.toISOString(), updatedAt: now.toISOString() }).where(eq(stores.id, loja.id));
    await db.update(nlSubscriptions).set({ currentPeriodEnd: fim.toISOString(), status: fim < now ? "past_due" : sub.status, updatedAt: now.toISOString() }).where(eq(nlSubscriptions.id, sub.id));
  }
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_PAYMENT_REVERSED", entityType: "finance_invoice", entityId: inv.id, storeId: inv.storeId, after: { lancamentoId: l.id, comissoes: comissoes.length }, reason: m });
  return { ok: true };
}

const motivo = z.string().trim().min(3, "Diga o motivo").max(300);

/** Estende o vencimento (cortesia de dias), a partir do que já está pago ou de hoje. */
export async function estenderVencimento(db: Database, actor: Actor, storeId: string, dias: number, raw: string, now = new Date()) {
  exigir(actor);
  const m = motivo.parse(raw);
  const n = z.number().int().min(1, "Pelo menos 1 dia").max(90, "No máximo 90 dias por vez").parse(dias);
  const loja = await lojaCommerce(db, storeId);
  const base = Math.max(now.getTime(), loja.paidUntil ? new Date(loja.paidUntil).getTime() : 0, loja.trialEndsAt ? new Date(loja.trialEndsAt).getTime() : 0);
  const fim = new Date(base + n * DAY).toISOString();
  await db.update(stores).set({ paidUntil: fim, status: loja.status === "PENDING_PAYMENT" ? "ACTIVE" : loja.status, updatedAt: now.toISOString() }).where(eq(stores.id, storeId));
  const sub = await subscriptionOf(db, storeId);
  if (sub) await db.update(nlSubscriptions).set({ currentPeriodEnd: fim, status: ["past_due", "suspended", "pending_payment"].includes(sub.status) ? "active" : sub.status, updatedAt: now.toISOString() }).where(eq(nlSubscriptions.id, sub.id));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_EXTENDED", entityType: "store", entityId: storeId, storeId, before: { paidUntil: loja.paidUntil }, after: { paidUntil: fim, dias: n }, reason: m });
  return { pagoAte: fim };
}

/** Troca plano e ciclo pelo Master (vale a partir da próxima cobrança). */
export async function trocarPlanoPeloMaster(db: Database, actor: Actor, storeId: string, input: { productKey: (typeof COMMERCE_PLAN_KEYS)[number]; cycle: PlanCycle }, raw: string, now = new Date()) {
  exigir(actor);
  const m = motivo.parse(raw);
  const loja = await lojaCommerce(db, storeId);
  const sub = await subscriptionOf(db, storeId);
  if (!sub) await startCommerceSubscription(db, { storeId, productKey: input.productKey, cycle: input.cycle, taxId: loja.taxId ?? null, actor, now, allowOffer: false });
  else await trocarPlanoDaAssinatura(db, actor, storeId, sub, input, now);
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_PLAN_CHANGED_MASTER", entityType: "store", entityId: storeId, storeId, after: input, reason: m });
}

/** Cancela pelo Master: o acesso segue até o fim do período pago; nada é cobrado depois. */
export async function cancelarPeloMaster(db: Database, actor: Actor, storeId: string, raw: string, now = new Date()) {
  exigir(actor);
  const m = motivo.parse(raw);
  await lojaCommerce(db, storeId);
  const sub = await subscriptionOf(db, storeId);
  if (!sub) throw new NotFoundError("Esta loja não tem assinatura.");
  await db.update(nlSubscriptions).set({ cancelAtPeriodEnd: true, updatedAt: now.toISOString(), ...(["trial", "pending_payment"].includes(sub.status) ? { status: "cancelled" as const, canceledAt: now.toISOString() } : {}) }).where(eq(nlSubscriptions.id, sub.id));
  await db.update(financeInvoices).set({ status: "CANCELED" }).where(and(eq(financeInvoices.storeId, storeId), eq(financeInvoices.status, "OPEN")));
  await recordFinancialAudit(db, actor, { domain: CORPORATE, action: "SUBSCRIPTION_CANCELED_MASTER", entityType: "nl_subscription", entityId: sub.id, storeId, before: { status: sub.status }, reason: m });
}

// ---------------------------------------------------------------------------------------------------------------------
// Painel de assinaturas e histórico da loja
// ---------------------------------------------------------------------------------------------------------------------
export const FILTROS_ASSINATURA = ["todas", "vencendo", "vencidas", "teste", "manual", "sem_plano"] as const;
export type FiltroAssinatura = (typeof FILTROS_ASSINATURA)[number];
export const NOME_DO_FILTRO: Record<FiltroAssinatura, string> = { todas: "Todas", vencendo: "Vencem em 7 dias", vencidas: "Vencidas", teste: "Em teste", manual: "Pagas à mão", sem_plano: "Sem plano" };

export async function painelDeAssinaturas(db: Database, actor: Actor, now = new Date()) {
  exigir(actor);
  const lojas = await db.select({ s: stores, sub: nlSubscriptions, parceiro: partners.displayName })
    .from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).leftJoin(nlSubscriptions, eq(nlSubscriptions.storeId, stores.id)).leftJoin(partners, eq(partners.id, stores.partnerId))
    .where(and(eq(organizations.brand, "NEXTLEVEL_COMMERCE"), isNull(stores.showcaseTheme)));
  const ids = lojas.map((l) => l.s.id);
  const ultimos = ids.length ? await db.select({ storeId: caixaLancamentos.storeId, meio: caixaLancamentos.meio, data: caixaLancamentos.data }).from(caixaLancamentos).where(and(inArray(caixaLancamentos.storeId, ids), eq(caixaLancamentos.origem, "ASSINATURA"), isNull(caixaLancamentos.estornadoEm))).orderBy(desc(caixaLancamentos.ocorridoEm)) : [];
  const ultimoManual = new Map<string, { meio: Meio; data: string }>();
  for (const u of ultimos) if (u.storeId && !ultimoManual.has(u.storeId)) ultimoManual.set(u.storeId, { meio: u.meio, data: u.data });
  const t = now.getTime();
  const linhas = lojas.map(({ s, sub, parceiro }) => {
    const ate = s.paidUntil ? new Date(s.paidUntil).getTime() : null;
    const emTeste = sub?.status === "trial" || (!!s.trialEndsAt && new Date(s.trialEndsAt).getTime() > t && !ate);
    const vencida = !emTeste && ((ate !== null && ate < t) || ["past_due", "suspended"].includes(sub?.status ?? ""));
    const vencendo = !vencida && ate !== null && ate >= t && ate - t <= 7 * DAY && !sub?.cancelAtPeriodEnd;
    const manual = ultimoManual.get(s.id) ?? null;
    return {
      storeId: s.id, loja: s.name, slug: s.slug, parceiro,
      plano: sub ? nomePlanoEc(sub.productKey) : null, productKey: sub?.productKey ?? null, ciclo: sub?.cycle ?? null, valorCents: sub?.amountCents ?? null,
      status: sub ? STATUS_LABEL[sub.status] : "Sem plano", cancelando: !!sub?.cancelAtPeriodEnd,
      pagoAte: s.paidUntil, testeAte: s.trialEndsAt, ultimoManual: manual ? { ...manual, nome: NOME_DO_MEIO[manual.meio] } : null,
      grupos: [
        ...(vencendo ? ["vencendo"] : []), ...(vencida ? ["vencidas"] : []), ...(emTeste ? ["teste"] : []), ...(manual ? ["manual"] : []), ...(!sub ? ["sem_plano"] : []),
      ] as FiltroAssinatura[],
    };
  }).sort((a, b) => (a.pagoAte ?? "9").localeCompare(b.pagoAte ?? "9"));
  const contagem = Object.fromEntries(FILTROS_ASSINATURA.map((f) => [f, f === "todas" ? linhas.length : linhas.filter((l) => l.grupos.includes(f)).length])) as Record<FiltroAssinatura, number>;
  return { linhas, contagem };
}

/** Todos os pagamentos de plano da loja, com meio, quem recebeu e o valor. */
export async function historicoDaLoja(db: Database, actor: Actor, storeId: string) {
  exigir(actor);
  const loja = await lojaCommerce(db, storeId);
  const sub = await subscriptionOf(db, storeId);
  const faturas = await db.select({ inv: financeInvoices, meio: caixaLancamentos.meio, quem: users.name, lancamentoId: caixaLancamentos.id, estornado: caixaLancamentos.estornadoEm, parceiro: partners.displayName })
    .from(financeInvoices).leftJoin(caixaLancamentos, eq(caixaLancamentos.invoiceId, financeInvoices.id)).leftJoin(users, eq(users.id, caixaLancamentos.criadoPor)).leftJoin(partners, eq(partners.id, caixaLancamentos.partnerId))
    .where(and(eq(financeInvoices.storeId, storeId), inArray(financeInvoices.kind, ["STORE_PLAN", "STORE_SETUP"]))).orderBy(desc(financeInvoices.createdAt)).limit(60);
  return {
    loja: { id: loja.id, nome: loja.name, pagoAte: loja.paidUntil, testeAte: loja.trialEndsAt, taxId: loja.taxId },
    assinatura: sub ? { plano: nomePlanoEc(sub.productKey), productKey: sub.productKey, ciclo: sub.cycle, status: STATUS_LABEL[sub.status], valorCents: sub.amountCents, cancelando: sub.cancelAtPeriodEnd } : null,
    pagamentos: faturas.map(({ inv, meio, quem, lancamentoId, estornado, parceiro }) => ({
      id: inv.id, descricao: inv.description, valorCents: inv.amountCents, status: inv.status, pagoEm: inv.paidAt, criadoEm: inv.createdAt,
      meio: meio ? NOME_DO_MEIO[meio] : inv.status === "PAID" ? NOME_DO_MEIO.MERCADO_PAGO : null, quem, parceiro, lancamentoId, estornado: !!estornado,
    })),
  };
}
