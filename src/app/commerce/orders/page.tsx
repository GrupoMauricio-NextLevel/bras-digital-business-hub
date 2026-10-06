import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";

export const dynamic = "force-dynamic";

export default async function CommerceOrdersPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  const stores = new Map(data.stores.map(({ store }) => [store.id, store.name]));
  return (
    <>
      <PageHeader eyebrow="Vendas" title="Pedidos das lojas" description="Vendas originadas somente nas lojas NextLevel Commerce. Sem pagamento à Central ou fila de expedição SuperDrop." />
      <DataTable rows={data.orders} rowKey={(o) => o.id}
        empty={<EmptyState title="Nenhuma venda Commerce encontrada" description="Os pedidos das lojas aparecem aqui." />}
        columns={[
          { key: "n", header: "Pedido", primary: true, cell: (o) => <div><div className="font-bold">#{o.number}</div><div className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</div></div> },
          { key: "store", header: "Loja", cell: (o) => stores.get(o.storeId) ?? "Loja" },
          { key: "customer", header: "Cliente", cell: (o) => o.customerName },
          { key: "channel", header: "Canal", cell: (o) => <StatusBadge value={o.channel} dot={false} /> },
          { key: "total", header: "Total", className: "text-right", cell: (o) => <span className="font-bold tabular-nums">{formatBRL(o.totalCents)}</span> },
        ]} />
    </>
  );
}
