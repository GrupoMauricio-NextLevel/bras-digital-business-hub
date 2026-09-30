"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { createCoupon, extendTrial } from "@/lib/domain/store-access";

async function session() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s;
}

export async function createCouponAction(input: { code: string; trialDays?: number; maxRedemptions?: number | null; supplierId?: string }) {
  return runAction(async () => {
    const s = await session();
    const r = await createCoupon(await getDb(), s.actor, input);
    revalidatePath("/supplier/stores"); revalidatePath("/master/suppliers");
    return r;
  });
}

export async function extendTrialAction(storeId: string, days: number) {
  return runAction(async () => {
    const s = await session();
    const r = await extendTrial(await getDb(), s.actor, storeId, days);
    revalidatePath("/supplier/stores"); revalidatePath("/master/stores");
    return { trialEndsAt: r.trialEndsAt.toISOString() };
  });
}
