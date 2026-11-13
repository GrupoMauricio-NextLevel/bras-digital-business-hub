import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOrderForActor } from "@/lib/domain/orders";
import { DomainError } from "@/lib/domain/errors";
import { OrderDetail } from "@/components/shared/order-detail";
import { storeModality } from "@/lib/domain/order-policy";
import { brandCodeOfStore } from "@/lib/store-brand";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";

async function loadOrder(actor: Parameters<typeof getOrderForActor>[1], id: string) {
  try {
    return await getOrderForActor((await getDb()), actor, id);
  } catch (e) {
    if (e instanceof DomainError) return null;
    throw e;
  }
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  const data = await loadOrder(session.actor, id);
  if (!data) notFound();
  // O Master vê o pedido com o vocabulário da loja dele (D169): pedido de loja Commerce sem "Central" nem "saldo".
  const db = await getDb();
  const loja = await db.query.stores.findFirst({ where: eq(stores.id, data.order.storeId) });
  const [modality, marca] = await Promise.all([storeModality(db, data.order.storeId), loja ? brandCodeOfStore(db, loja) : Promise.resolve(null)]);
  return <OrderDetail role={session.user.role} backHref="/master/orders" {...data} independent={modality === "INDEPENDENT"} productLabel={marca === "NEXTLEVEL_COMMERCE" ? "NextLevel Commerce" : "SuperDrop"} />;
}
