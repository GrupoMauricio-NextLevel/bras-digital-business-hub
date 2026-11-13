"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";
import { ForbiddenError } from "@/lib/domain/errors";
import { isMaster, type Actor } from "@/lib/domain/access";
import { addCommissionRuleVersion, addOfferVersion, addPriceVersion, setCatalogStatus, updateCatalogProduct, getCatalogItem } from "@/lib/domain/nl-catalog";
import { acceptDelivery, checkOwnTransaction, createCorporateCheckout, reconcile, refundCorporateOrder, simulateCorporatePayment, updateDelivery } from "@/lib/domain/corporate-checkout";
import { cancelSubscription, choosePlan } from "@/lib/domain/commerce-plans";
import { createPartnerLead, movePartnerLead, requestDiagnostic, requestQuote, savePartnerDiagnosis, setPartnerKind, updateQuote } from "@/lib/domain/corporate-sales";
import { saveJourneyConfig, storeJourney } from "@/lib/domain/journey";
import { saveFinanceSettings } from "@/lib/domain/corporate-commissions";
import { saveGatewayRule } from "@/lib/payments/gateway";
import { assertReauth, CORPORATE, recordFinancialAudit } from "@/lib/domain/fin-audit";
import type { CatalogStatus, PartnerLeadStage, PartnerKind } from "@/db/schema";

/**
 * Ações do financeiro (D90). Cada ação declara o domínio: as de Master são `nextlevel_corporate_finance` e exigem o papel
 * (e, nas sensíveis, a senha); as do lojista/fornecedor/parceiro só leem ou compram o que o Master publicou.
 */
const refresh = () => { for (const p of ["/master", "/merchant", "/supplier", "/partner", "/solucoes"]) revalidatePath(p, "layout"); };

async function session() { const s = await getSession(); if (!s) throw new ForbiddenError("Sessão expirada."); return s; }
async function master() { const s = await session(); if (!isMaster(s.actor) || s.support) throw new ForbiddenError("Apenas a NextLevel."); return s; }
async function attribution(): Promise<Record<string, string>> {
  try { const c = await cookies(); const raw = c.get("nl-attr")?.value; const ref = c.get("nl-ref")?.value; const a = raw ? JSON.parse(decodeURIComponent(raw)) as Record<string, string> : {}; return { ...a, ...(ref && !a.ref ? { ref } : {}) }; } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Master: catálogo, preço, ofertas, comissões, gateways, jornada, propostas, entregas, reembolso
// ---------------------------------------------------------------------------
export async function updateCatalogProductAction(productId: string, patch: Parameters<typeof updateCatalogProduct>[3]) {
  return runAction(async () => { const s = await master(); await updateCatalogProduct(await getDb(), s.actor, productId, patch); refresh(); return undefined; });
}
export async function setCatalogStatusAction(productId: string, status: CatalogStatus, reason: string) {
  return runAction(async () => { const s = await master(); await setCatalogStatus(await getDb(), s.actor, productId, status, reason); refresh(); return undefined; });
}
export async function addPriceVersionAction(productId: string, input: Parameters<typeof addPriceVersion>[3], password: string) {
  return runAction(async () => { const s = await master(); const r = await addPriceVersion(await getDb(), s.actor, productId, input, password); refresh(); return r; });
}
export async function addOfferVersionAction(key: string, input: Parameters<typeof addOfferVersion>[3], password: string) {
  return runAction(async () => { const s = await master(); const r = await addOfferVersion(await getDb(), s.actor, key, input, password); refresh(); return r; });
}
export async function addCommissionRuleVersionAction(key: string, input: Parameters<typeof addCommissionRuleVersion>[3], password: string) {
  return runAction(async () => { const s = await master(); const r = await addCommissionRuleVersion(await getDb(), s.actor, key, input, password); refresh(); return r; });
}
export async function saveGatewayRuleAction(gateway: "MERCADOPAGO" | "PAGARME", password: string) {
  return runAction(async () => {
    const s = await master(); const db = await getDb();
    await assertReauth(db, s.actor, password);
    await saveGatewayRule(db, { default: gateway }, s.user.id);
    await recordFinancialAudit(db, s.actor, { domain: CORPORATE, action: "GATEWAY_RULE", entityType: "platform_settings", entityId: "nl_gateway_rule", after: { default: gateway } });
    refresh(); return undefined;
  });
}
export async function saveFinanceSettingsAction(taxBps: number, password: string) {
  return runAction(async () => { const s = await master(); const db = await getDb(); await assertReauth(db, s.actor, password); await saveFinanceSettings(db, s.actor, { taxBps: Math.trunc(taxBps) }); refresh(); return undefined; });
}
export async function saveJourneyConfigAction(raw: unknown) {
  return runAction(async () => { const s = await master(); await saveJourneyConfig(await getDb(), s.actor, raw); refresh(); return undefined; });
}
export async function updateQuoteAction(id: string, patch: Parameters<typeof updateQuote>[3]) {
  return runAction(async () => { const s = await master(); await updateQuote(await getDb(), s.actor, id, patch); refresh(); return undefined; });
}
export async function updateDeliveryAction(id: string, patch: Parameters<typeof updateDelivery>[3]) {
  return runAction(async () => { const s = await master(); await updateDelivery(await getDb(), s.actor, id, patch); refresh(); return undefined; });
}
export async function refundOrderAction(orderId: string, password: string, reason: string) {
  return runAction(async () => { const s = await master(); const r = await refundCorporateOrder(await getDb(), s.actor, orderId, { password, reason }); refresh(); return r; });
}
export async function reconcileAction() {
  return runAction(async () => { const s = await master(); const r = await reconcile(await getDb(), s.actor); refresh(); return r; });
}
export async function setPartnerKindAction(partnerId: string, kind: PartnerKind, reason: string) {
  return runAction(async () => { const s = await master(); await setPartnerKind(await getDb(), s.actor, partnerId, kind, reason); refresh(); return undefined; });
}

// ---------------------------------------------------------------------------
// Cliente (lojista/fornecedor): checkout rápido, plano, proposta, aceite
// ---------------------------------------------------------------------------
/** Confere a elegibilidade da jornada antes de abrir o checkout (produto bloqueado não é comprável, mesmo por chamada direta). */
async function eligibilityFor(actor: Actor) {
  return async (p: Awaited<ReturnType<typeof getCatalogItem>>) => {
    if (!p || actor.role !== "STORE_OWNER" || !actor.storeId) return;
    const j = await storeJourney(await getDb(), actor, actor.storeId);
    const card = j.cards.find((c) => c.product.id === p.id);
    if (card && (card.state === "locked" || card.state === "not_eligible")) throw new ForbiddenError(card.reason);
  };
}

export async function corporateCheckoutAction(input: { productKey: string; method: "PIX" | "CARD"; installments: number; idempotencyKey: string; returnPath: string }) {
  return runAction(async () => {
    const s = await session();
    if (s.support) throw new ForbiddenError("Compras não podem ser feitas em modo suporte.");
    const db = await getDb();
    const url = await getBaseUrl();
    const { getNextLevelMp } = await import("@/lib/domain/nextlevel-billing");
    const demo = isDemoMode() && !(await getNextLevelMp(db)).connected;
    const attr = await attribution();
    const r = await createCorporateCheckout(db, s.actor, { productKey: input.productKey, method: input.method, installments: input.installments, idempotencyKey: input.idempotencyKey, refCode: attr.ref, attribution: attr }, { demo, publicBaseUrl: isPublicHttps(url) ? url : undefined, returnPath: input.returnPath.startsWith("/") ? input.returnPath : "/", eligibility: (await eligibilityFor(s.actor)) as never });
    return r;
  });
}

export async function checkCorporatePaymentAction(txId: string) {
  return runAction(async () => { const s = await session(); const r = await checkOwnTransaction(await getDb(), s.actor, txId); if (r.paid) refresh(); return r; });
}

export async function simulateCorporatePaymentAction(txId: string) {
  return runAction(async () => {
    if (!isDemoMode()) throw new ForbiddenError("Disponível apenas na demonstração.");
    const s = await session(); await simulateCorporatePayment(await getDb(), s.actor, txId); refresh(); return undefined;
  });
}

export async function choosePlanAction(productKey: "COMMERCE_START" | "COMMERCE_PRO" | "COMMERCE_SCALE", cycle: "MONTHLY" | "ANNUAL") {
  return runAction(async () => { const s = await session(); if (s.support) throw new ForbiddenError("Troca de plano não pode ser feita em modo suporte."); const r = await choosePlan(await getDb(), s.actor, { productKey, cycle }); refresh(); return { trial: r.trial }; });
}

export async function cancelSubscriptionAction(reason: string) {
  return runAction(async () => { const s = await session(); await cancelSubscription(await getDb(), s.actor, reason); refresh(); return undefined; });
}

export async function requestQuoteAction(input: { productKey: string; briefing: string; contact?: { name: string; email: string; phone?: string } }) {
  return runAction(async () => { const s = await getSession(); const r = await requestQuote(await getDb(), s?.actor ?? null, input, await attribution()); refresh(); return r; });
}

export async function acceptDeliveryAction(id: string) {
  return runAction(async () => { const s = await session(); await acceptDelivery(await getDb(), s.actor, id); refresh(); return undefined; });
}

// ---------------------------------------------------------------------------
// Público e parceiro
// ---------------------------------------------------------------------------
export async function requestDiagnosticAction(input: Parameters<typeof requestDiagnostic>[1]) {
  return runAction(async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const { headers } = await import("next/headers");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`diag:${ip}`, 5, 60_000)) throw new ForbiddenError("Muitos envios seguidos. Tente de novo em um minuto.");
    const db = await getDb();
    const r = await requestDiagnostic(db, input, await attribution());
    const { registrarOrigemDaVisita } = await import("@/lib/trafego/lead-na-sessao");
    await registrarOrigemDaVisita(db, { chave: `interessado:${r.id}`, brand: "NEXTLEVEL", via: "DIAGNOSTICO" });
    return r;
  });
}

export async function createPartnerLeadAction(input: Parameters<typeof createPartnerLead>[2]) {
  return runAction(async () => { const s = await session(); const r = await createPartnerLead(await getDb(), s.actor, input); revalidatePath("/partner", "layout"); return r; });
}
export async function movePartnerLeadAction(id: string, stage: PartnerLeadStage, notes?: string) {
  return runAction(async () => { const s = await session(); await movePartnerLead(await getDb(), s.actor, id, stage, notes); revalidatePath("/partner", "layout"); return undefined; });
}
export async function savePartnerDiagnosisAction(id: string, answers: Parameters<typeof savePartnerDiagnosis>[3]) {
  return runAction(async () => { const s = await session(); const r = await savePartnerDiagnosis(await getDb(), s.actor, id, answers); revalidatePath("/partner", "layout"); return r; });
}
