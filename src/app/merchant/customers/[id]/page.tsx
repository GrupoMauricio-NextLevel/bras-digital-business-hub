import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getStoreCustomer } from "@/lib/domain/crm";
import { NotFoundError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { CustomerProfileForm } from "./profile-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { id } = await params;
  const data = await getStoreCustomer(await getDb(), session.store!.id, id).catch((e) => { if (e instanceof NotFoundError) return null; throw e; });
  if (!data) notFound();
  const { sc, customer, consents, history } = data;
  return (
    <>
      <PageHeader backHref="/merchant/customers" title={customer.name} description={`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""} · cliente desde ${formatDateTime(sc.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Compras nesta loja</CardTitle></CardHeader>
          <CardContent className="px-0 pb-0">
            {history.length === 0 ? <p className="px-5 pb-5 text-sm text-muted-foreground">Nenhuma compra ativa.</p> : (
              <ul className="divide-y divide-border">
                {history.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/merchant/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">#{o.number}</Link>
                    <span className="text-muted-foreground">{formatDateTime(o.createdAt)}</span>
                    <OrderStatusBadge status={o.status} />
                    <span className="tabular-nums">{formatBRL(o.totalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <CustomerProfileForm storeCustomerId={sc.id} notes={sc.notes ?? ""} tags={sc.tags.join(", ")} consents={consents.map((c) => c.purpose)} />
      </div>
    </>
  );
}
