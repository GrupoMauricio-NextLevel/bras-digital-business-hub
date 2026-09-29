"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { closeMonth, contractPatchSchema, getPriceBook, issueSubscriptionInvoices, markInvoicePaid, refreshSupplierAccess, savePriceBook, updateContract, voidStoreSetup, type ContractPatch } from "@/lib/domain/finance";

async function master() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  requireMaster(s.actor);
  return s;
}
const refresh = () => { revalidatePath("/master", "layout"); revalidatePath("/supplier", "layout"); revalidatePath("/merchant", "layout"); };
const validPeriod = (p: string) => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(p)) throw new ForbiddenError("Competência inválida."); return p; };

export async function savePriceBookAction(raw: unknown) {
  return runAction(async () => { const s = await master(); await savePriceBook(await getDb(), raw, s.user.id); refresh(); return undefined; });
}

export async function updateContractAction(supplierId: string, patch: ContractPatch) {
  return runAction(async () => { await master(); await updateContract(await getDb(), supplierId, contractPatchSchema.parse(patch)); refresh(); return undefined; });
}

/** Concede a isenção padrão de mensalidade e setup (prazo da tabela de preços) e trava o preço de lista. */
export async function grantWaiverAction(supplierId: string) {
  return runAction(async () => {
    await master();
    const db = await getDb();
    const book = await getPriceBook(db);
    const until = new Date(); until.setDate(until.getDate() + book.billing.waiverDays);
    const lock = new Date(); lock.setMonth(lock.getMonth() + book.billing.priceLockMonths);
    await updateContract(db, supplierId, { monthlyWaivedUntil: until.toISOString(), setupWaivedUntil: until.toISOString(), priceLockUntil: lock.toISOString() });
    refresh();
    return undefined;
  });
}

export async function issueSubscriptionsAction(period: string) {
  return runAction(async () => { await master(); const r = await issueSubscriptionInvoices(await getDb(), validPeriod(period)); refresh(); return r; });
}

export async function closeMonthAction(period: string) {
  return runAction(async () => { await master(); const r = await closeMonth(await getDb(), validPeriod(period)); refresh(); return r; });
}

export async function markInvoicePaidAction(invoiceId: string) {
  return runAction(async () => { await master(); await markInvoicePaid(await getDb(), invoiceId); refresh(); return undefined; });
}

export async function refreshAccessAction() {
  return runAction(async () => { await master(); const r = await refreshSupplierAccess(await getDb()); refresh(); return r; });
}

export async function voidStoreSetupAction(storeId: string) {
  return runAction(async () => { await master(); const r = await voidStoreSetup(await getDb(), storeId); refresh(); return r; });
}
