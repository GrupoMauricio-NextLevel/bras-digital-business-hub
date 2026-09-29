import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOrderForActor } from "@/lib/domain/orders";
import { DomainError } from "@/lib/domain/errors";
import { OrderDetail } from "@/components/shared/order-detail";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  try {
    const data = await getOrderForActor(getDb(), session.actor, id);
    return <OrderDetail role={session.user.role} backHref="/master/orders" {...data} />;
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
}
