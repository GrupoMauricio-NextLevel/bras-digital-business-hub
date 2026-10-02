import { Suspense } from "react";
import { AlertTriangle, Boxes, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { FilterBar, FilterChips, SearchInput } from "@/components/app/filter-bar";
import { requireRole } from "@/lib/require-session";
import { getSupplierInventory } from "@/lib/queries/supplier";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; level?: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { q, level } = await searchParams;
  const all = await getSupplierInventory(session.supplier!.id);
  const rows = all.filter((r) => (!q || r.product.name.toLowerCase().includes(q.toLowerCase()) || r.variant.sku.toLowerCase().includes(q.toLowerCase())) && (!level || (level === "low" ? r.available < 5 : level === "reserved" ? r.reserved > 0 : true)));
  const onHand = all.reduce((s, r) => s + r.onHand, 0), reserved = all.reduce((s, r) => s + r.reserved, 0);
  const low = all.filter((r) => r.available < 5).length;
  return (
    <>
      <PageHeader title="Estoque central" description="Um único estoque físico para toda a rede. Nenhuma loja possui estoque próprio." />
      <OperationalPulse className="mb-5" items={[
        { label: "Estoque físico", value: onHand, icon: Boxes, tone: "neutral", hint: "unidades registradas" },
        { label: "Reservado", value: reserved, icon: PackageCheck, tone: reserved ? "warning" : "neutral", hint: "já comprometido com pedidos" },
        { label: "Disponível", value: Math.max(0, onHand - reserved), icon: Boxes, tone: "success", hint: "livre para novas vendas" },
        { label: "Baixo estoque", value: low, icon: AlertTriangle, tone: low ? "danger" : "success", hint: "variantes com menos de 5" },
      ]} />
      <Suspense>
        <FilterBar>
          <SearchInput placeholder="Produto ou SKU…" />
          <FilterChips param="level" allLabel="Tudo" options={[{ value: "low", label: "Baixo estoque", count: low }, { value: "reserved", label: "Com reserva" }]} />
        </FilterBar>
      </Suspense>
      <DataTable
        rows={rows}
        rowKey={(r) => r.variant.id}
        rowHref={(r) => `/supplier/products/${r.product.id}`}
        columns={[
          { key: "product", header: "Produto", primary: true, cell: (r) => <div><div className="font-medium">{r.product.name}</div><div className="text-xs text-muted-foreground">{r.variant.sku}</div></div> },
          { key: "size", header: "Tam.", cell: (r) => <Badge tone="outline">{r.variant.size}</Badge> },
          { key: "onHand", header: "Físico", className: "text-right", cell: (r) => <span className="tabular-nums">{r.onHand}</span> },
          { key: "reserved", header: "Reservado", className: "text-right", cell: (r) => <span className="tabular-nums text-warning">{r.reserved}</span> },
          { key: "available", header: "Disponível", className: "text-right", cell: (r) => <span className={cn("font-medium tabular-nums", r.available < 5 && "text-danger")}>{r.available}</span> },
        ]}
      />
    </>
  );
}
