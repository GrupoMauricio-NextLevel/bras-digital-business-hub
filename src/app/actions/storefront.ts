"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { runAction } from "@/lib/action-result";
import { NotFoundError } from "@/lib/domain/errors";
import { createOrder, type CreateOrderInput } from "@/lib/domain/orders";

/** Checkout demonstrativo: pagamento do cliente é simulado como aprovado. */
export async function placeStorefrontOrderAction(slug: string, input: Omit<CreateOrderInput, "storeId" | "channel" | "customerPaymentStatus">) {
  return runAction(async () => {
    const db = getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    const r = await createOrder(db, { ...input, storeId: store.id, channel: "ONLINE_STORE", customerPaymentStatus: "PAID" });
    revalidatePath("/merchant", "layout");
    revalidatePath("/supplier", "layout");
    revalidatePath("/master", "layout");
    revalidatePath(`/store/${slug}`, "layout");
    return r;
  });
}
