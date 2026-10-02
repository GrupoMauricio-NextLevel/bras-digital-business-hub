"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { createDiscount, setDiscountActive } from "@/lib/domain/discounts";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { storeId: requireStoreId(session.actor), db: await getDb() };
}

type Input = { code: string; kind: "PERCENT" | "FIXED"; value: number; minSubtotalCents?: number; maxRedemptions?: number | null; expiresAt?: string | null };
const brt = (v?: string | null) => (v ? (/Z|[+-]\d\d:\d\d$/.test(v) ? v : `${v}:00-03:00`) : null);

export async function createDiscountAction(input: Input) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    await createDiscount(db, storeId, { ...input, expiresAt: brt(input.expiresAt) });
    revalidatePath("/merchant/descontos");
    return undefined;
  });
}

export async function setDiscountActiveAction(id: string, active: boolean) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    await setDiscountActive(db, storeId, id, active);
    revalidatePath("/merchant/descontos");
    return undefined;
  });
}
