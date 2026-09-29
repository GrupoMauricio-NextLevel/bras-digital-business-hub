"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { advanceServiceOrder, postServiceMessage, requestService, updateService } from "@/lib/domain/services";
import { SERVICE_ORDER_STATUSES } from "@/db/schema";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, db: await getDb() };
}
const refresh = () => { revalidatePath("/master", "layout"); revalidatePath("/merchant", "layout"); revalidatePath("/supplier", "layout"); };

export async function requestServiceAction(input: { serviceId: string; briefing: string }) {
  return runAction(async () => { const { session, db } = await ctx(); const r = await requestService(db, session.actor, input); refresh(); return r; });
}

export async function postServiceMessageAction(orderId: string, body: string) {
  return runAction(async () => { const { session, db } = await ctx(); await postServiceMessage(db, session.actor, orderId, body); refresh(); return undefined; });
}

export async function advanceServiceOrderAction(orderId: string, next: string, quotedCents?: number) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const status = z.enum(SERVICE_ORDER_STATUSES).parse(next);
    await advanceServiceOrder(db, session.actor, orderId, status, { quotedCents });
    refresh();
    return undefined;
  });
}

export async function updateServiceAction(serviceId: string, patch: Parameters<typeof updateService>[3]) {
  return runAction(async () => { const { session, db } = await ctx(); await updateService(db, session.actor, serviceId, patch); refresh(); return undefined; });
}
