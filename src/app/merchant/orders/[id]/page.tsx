import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOrderForActor } from "@/lib/domain/orders";
import { DomainError } from "@/lib/domain/errors";
import { canFulfilOrder, storeModality } from "@/lib/domain/order-policy";
import { OrderDetail } from "@/components/shared/order-detail";
import { isCommerceStore } from "@/lib/store-brand";

async function loadOrder(actor: Parameters<typeof getOrderForActor>[1], id: string) {
  try {
    return await getOrderForActor((await getDb()), actor, id);
  } catch (e) {
    if (e instanceof DomainError) return null;
    throw e;
  }
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { id } = await params;
  const data = await loadOrder(session.actor, id);
  if (!data) notFound();
  const db = await getDb();
  const modality = await storeModality(db, data.order.storeId);
  const canFulfil = canFulfilOrder(session.actor, data.order, modality);
  const commerce = await isCommerceStore(db, session.store!);
  return <OrderDetail role={session.user.role} backHref="/merchant/orders" {...data} canFulfil={canFulfil} independent={modality === "INDEPENDENT"} productLabel={commerce ? "NextLevel E-commerce" : "SuperDrop"} />;
}
