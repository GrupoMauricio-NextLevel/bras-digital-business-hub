import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { requireRole } from "@/lib/require-session";
import { getMerchantCustomers } from "@/lib/queries/merchant";
import { formatBRL } from "@/lib/money";
import { formatDate, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default async function CustomersPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await getMerchantCustomers(session.store!.id);
  return (
    <>
      <PageHeader title="Clientes" description="Clientes da sua loja. Dados de marketing só são utilizáveis com consentimento registrado." />
      <Card className="mb-4"><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-success" /><div><span className="font-medium">LGPD-ready.</span> <span className="text-muted-foreground">Customer, StoreCustomer e MarketingConsent são separados. O acesso operacional (processar pedidos) não autoriza campanhas.</span></div></CardContent></Card>
      <DataTable
        rows={rows}
        rowKey={(r) => r.sc.id}
        columns={[
          { key: "name", header: "Cliente", primary: true, cell: (r) => <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">{initials(r.customer.name)}</span><div><div className="font-medium">{r.customer.name}</div><div className="text-xs text-muted-foreground">{r.customer.email}{r.customer.phone ? ` · ${r.customer.phone}` : ""}</div></div></div> },
          { key: "orders", header: "Pedidos", className: "text-right", cell: (r) => r.sc.ordersCount },
          { key: "spent", header: "Total gasto", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.sc.totalSpentCents)}</span> },
          { key: "last", header: "Último pedido", className: "text-right", cell: (r) => formatDate(r.sc.lastOrderAt) },
          { key: "consent", header: "Marketing", cell: (r) => r.consents.length ? <Badge tone="success" dot>Consentiu ({r.consents.map((c) => c.purpose.split("_")[0]).join(", ")})</Badge> : <Badge tone="outline">Sem consentimento</Badge> },
        ]}
      />
    </>
  );
}
