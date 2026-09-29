import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOrderForActor } from "@/lib/domain/orders";
import { DomainError } from "@/lib/domain/errors";
import { OrderDetail } from "@/components/shared/order-detail";

async function loadOrder(actor: Parameters<typeof getOrderForActor>[1], id: string) {
  try {
    return await getOrderForActor(getDb(), actor, id);
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
  return <OrderDetail role={session.user.role} backHref="/master/orders" {...data} />;
}
