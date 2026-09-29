import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { FilterBar, FilterChips, SearchInput } from "@/components/app/filter-bar";
import { listStoresWithPlan } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const rows = await listStoresWithPlan(sp);
  return (
    <>
      <PageHeader title="Lojas" description="Todas as lojas white label da plataforma, com plano e situação da assinatura." />
      <Suspense>
        <FilterBar>
          <SearchInput placeholder="Buscar loja…" />
          <FilterChips param="status" allLabel="Todas" options={[{ value: "ACTIVE", label: "Ativas" }, { value: "SUSPENDED", label: "Suspensas" }, { value: "CLOSED", label: "Encerradas" }]} />
        </FilterBar>
      </Suspense>
      <DataTable
        rows={rows}
        rowKey={(r) => r.store.id}
        columns={[
          { key: "name", header: "Loja", primary: true, cell: (r) => <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: r.store.primaryColor }}>{r.store.logoText}</span><div><div className="font-medium">{r.store.name}</div><div className="text-xs text-muted-foreground">{r.networkName}</div></div></div> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.store.status} dot /> },
          { key: "plan", header: "Plano", cell: (r) => <span>{r.planName ?? "—"} {r.subscriptionStatus ? <StatusBadge value={r.subscriptionStatus} /> : null}</span> },
          { key: "due", header: "Vencimento", cell: (r) => formatDate(r.periodEnd), mobile: false },
          { key: "orders", header: "Pedidos", className: "text-right", cell: (r) => r.orderCount },
          { key: "gmv", header: "GMV", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.gmv)}</span> },
          { key: "link", header: "", className: "text-right", cell: (r) => <a href={`/store/${r.store.slug}`} target="_blank" rel="noreferrer" className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /> abrir</a> },
        ]}
      />
    </>
  );
}
