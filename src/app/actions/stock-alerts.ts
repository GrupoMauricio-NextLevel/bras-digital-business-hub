"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { markAlertsNotified, subscribeStockAlert } from "@/lib/domain/stock-alerts";

/** Pública: qualquer visitante pode pedir aviso. Nada é enviado automaticamente. */
export async function subscribeStockAlertAction(slug: string, input: { productId: string; variantId: string; contact: string }) {
  return runAction(async () => {
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    return subscribeStockAlert(db, store.id, input);
  });
}

export async function markAlertsNotifiedAction(variantId: string) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await markAlertsNotified(await getDb(), requireStoreId(s.actor), variantId);
    revalidatePath("/merchant/avise-me");
    return undefined;
  });
}
