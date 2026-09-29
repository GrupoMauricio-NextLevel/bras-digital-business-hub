import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { listServicesWithLeads } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function ServicesPage() {
  const { services, leads } = await listServicesWithLeads();
  return (
    <>
      <PageHeader title="Serviços NextLevel" description="Marketplace interno de serviços oferecidos aos lojistas. Leads gerados pelo botão “Tenho interesse”." />
      <SectionTitle title="Leads" description="Oportunidades comerciais geradas pelos lojistas" />
      <DataTable
        rows={leads}
        rowKey={(r) => r.lead.id}
        columns={[
          { key: "service", header: "Serviço", primary: true, cell: (r) => <span className="font-medium">{r.serviceName}</span> },
          { key: "store", header: "Loja", cell: (r) => r.storeName },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.lead.status} dot /> },
          { key: "date", header: "Data", className: "text-right text-muted-foreground", cell: (r) => formatDateTime(r.lead.createdAt) },
        ]}
      />
      <div className="mt-8">
        <SectionTitle title="Catálogo de serviços" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Card key={s.id}><CardContent className="pt-5"><div className="text-xs uppercase tracking-wide text-muted-foreground">{s.category}</div><div className="mt-1 font-medium">{s.name}</div><div className="mt-2 text-sm text-muted-foreground">a partir de {formatBRL(s.priceFromCents ?? 0)}</div></CardContent></Card>
          ))}
        </div>
      </div>
    </>
  );
}
