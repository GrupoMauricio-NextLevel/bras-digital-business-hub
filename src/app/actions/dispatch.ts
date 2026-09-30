"use server";
import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { isSupplierSide } from "@/lib/domain/access";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { createDispatchUser, createWave, dispatchAdvance, releaseClaim, removeDispatchUser, saveOps } from "@/lib/domain/operations";
import { recordPickingListPrint } from "@/lib/domain/labels";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  if (!isSupplierSide(s.actor)) throw new ForbiddenError();
  return { session: s, db: await getDb() };
}
const refresh = () => { revalidatePath("/supplier", "layout"); };

export async function advanceDispatchAction(orderId: string, next: "PICKING" | "READY_TO_SHIP" | "SHIPPED") {
  return runAction(async () => { const { session, db } = await ctx(); await dispatchAdvance(db, session.actor, orderId, next); refresh(); return undefined; });
}

export async function releaseClaimAction(orderId: string) {
  return runAction(async () => { const { session, db } = await ctx(); await releaseClaim(db, session.actor, orderId); refresh(); return undefined; });
}

export async function createWaveAction(input: { orderIds?: string[]; untilCutoff?: boolean }) {
  return runAction(async () => { const { session, db } = await ctx(); const w = await createWave(db, session.actor, input); refresh(); return { id: w.id, number: w.number, orders: w.orders }; });
}

export async function recordListPrintAction(orderIds: string[]) {
  return runAction(async () => { const { session, db } = await ctx(); await recordPickingListPrint(db, session.actor, z.array(z.string()).max(200).parse(orderIds)); refresh(); return undefined; });
}

/** Campo de leitura: aceita número do pedido (#1006, 1006) ou o código da etiqueta e devolve o pedido da esteira. */
export async function scanOrderAction(code: string) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const raw = z.string().trim().min(1, "Leia ou digite o código").max(60).parse(code).replace(/^#/, "");
    const n = /^\d+$/.test(raw) ? Number(raw) : null;
    const supplierId = session.actor.supplierId!;
    const rows = await db.select({ id: orders.id, number: orders.number, status: orders.status }).from(orders).where(and(eq(orders.supplierId, supplierId), or(n !== null ? eq(orders.number, n) : undefined, eq(orders.shippingLabelCode, raw))));
    const hit = rows.find((r) => ["READY_TO_PICK", "PICKING", "READY_TO_SHIP"].includes(r.status)) ?? rows[0];
    if (!hit) throw new DomainError("NOT_FOUND", `Nenhum pedido encontrado para "${raw}".`);
    return { id: hit.id, number: hit.number, status: hit.status };
  });
}

export async function saveOpsAction(input: Parameters<typeof saveOps>[2]) {
  return runAction(async () => { const { session, db } = await ctx(); await saveOps(db, session.actor, input); refresh(); return undefined; });
}

export async function createDispatchUserAction(input: { name: string; email: string }) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await createDispatchUser(db, session.actor, input); refresh(); return r; });
}

export async function removeDispatchUserAction(userId: string) {
  return runAction(async () => { const { session, db } = await ctx(); await removeDispatchUser(db, session.actor, userId); refresh(); return undefined; });
}


