"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { setPriceTiers } from "@/lib/domain/price-tiers";

export async function setPriceTiersAction(productId: string, tiers: { minQty: number; priceCents: number }[]) {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Sessão expirada.");
    await setPriceTiers(await getDb(), requireStoreId(session.actor), productId, tiers);
    revalidatePath("/merchant/atacado");
    if (session.store?.slug) revalidatePath(`/store/${session.store.slug}`, "layout");
    return undefined;
  });
}
