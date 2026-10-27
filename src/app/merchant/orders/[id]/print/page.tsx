import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOrderForActor } from "@/lib/domain/orders";
import { DomainError } from "@/lib/domain/errors";
import { OrderPrintSheet } from "@/components/shared/order-print-sheet";
import { MarcarImpresso } from "./marcar-impresso";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { id } = await params;
  const data = await getOrderForActor(await getDb(), session.actor, id).catch((e) => { if (e instanceof DomainError) return null; throw e; });
  if (!data) notFound();
  return <><MarcarImpresso orderId={id} /><OrderPrintSheet order={data.order} items={data.items} storeName={data.store?.name} backHref={`/merchant/orders/${id}`} /></>;
}
