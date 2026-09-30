import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceThread } from "@/components/services/service-thread";
import { getDb } from "@/db/client";
import type { Session } from "@/lib/auth";
import { getServiceOrder } from "@/lib/domain/services";
import { NotFoundError, ForbiddenError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";

export async function ServiceOrderPage({ session, id, backHref }: { session: Session; id: string; backHref: string }) {
  const data = await getServiceOrder(await getDb(), session.actor, id).catch((e) => { if (e instanceof NotFoundError || e instanceof ForbiddenError) return null; throw e; });
  if (!data) notFound();
  const { order, messages, service } = data;
  return (
    <>
      <PageHeader title={service?.name ?? "Pedido de serviço"} backHref={backHref} description={order.quotedCents ? `Orçamento: ${formatBRL(order.quotedCents)}` : "Aguardando orçamento da NextLevel"} />
      <Card><CardContent className="pt-5">
        <ServiceThread id={order.id} status={order.status} messages={messages.map((m) => ({ id: m.id, authorRole: m.authorRole, body: m.body, createdAt: m.createdAt, mine: m.authorRole === session.user.role }))} />
      </CardContent></Card>
    </>
  );
}
