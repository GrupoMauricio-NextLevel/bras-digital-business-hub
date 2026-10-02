"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { moderateReview, submitReview } from "@/lib/domain/reviews";

/** Pública: o cliente prova a compra com número do pedido + e-mail. A avaliação nasce pendente. */
export async function submitReviewAction(slug: string, input: { number: string; email: string; productId: string; rating: number; body?: string }) {
  return runAction(async () => {
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug) });
    if (!store) throw new NotFoundError("Loja não encontrada.");
    await submitReview(db, store.id, input);
    return undefined;
  });
}

export async function moderateReviewAction(id: string, status: "APPROVED" | "REJECTED") {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Sessão expirada.");
    await moderateReview(await getDb(), requireStoreId(session.actor), id, status);
    revalidatePath("/merchant/avaliacoes");
    if (session.store?.slug) revalidatePath(`/store/${session.store.slug}`, "layout");
    return undefined;
  });
}
