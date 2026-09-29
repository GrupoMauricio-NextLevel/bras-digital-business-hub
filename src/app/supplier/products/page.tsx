import { Suspense } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { ProductArt } from "@/components/app/product-art";
import { FilterBar, FilterChips, SearchInput } from "@/components/app/filter-bar";
import { requireRole } from "@/lib/require-session";
import { getSupplierProducts } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function SupplierProducts({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const sp = await searchParams;
  const { items, categories } = await getSupplierProducts(session.supplier!.id, sp);
  return (
    <>
      <PageHeader title="Produtos" description="Catálogo central. Cadastre uma vez e distribua para a rede." actions={<><Link href="/supplier/products/import" className={buttonVariants({ variant: "secondary" })}><Upload /> Importar CSV</Link><Link href="/supplier/products/new" className={buttonVariants()}><Plus /> Novo produto</Link></>} />
      <Suspense>
        <FilterBar>
          <SearchInput placeholder="Buscar por nome ou SKU…" />
          <FilterChips param="category" allLabel="Todas" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </FilterBar>
      </Suspense>
      <DataTable
        rows={items}
        rowKey={(r) => r.product.id}
        rowHref={(r) => `/supplier/products/${r.product.id}`}
        columns={[
          { key: "name", header: "Produto", primary: true, cell: (r) => <div className="flex items-center gap-3"><ProductArt images={r.product.images} size="sm" /><div><div className="font-medium">{r.product.name}</div><div className="text-xs text-muted-foreground">{r.product.sku} · {r.categoryName}</div></div></div> },
          { key: "type", header: "Venda", cell: (r) => <div className="flex gap-1">{r.product.sellsUnit ? <Badge tone="outline">Unitária</Badge> : null}{r.product.sellsPack ? <Badge tone="info">Grade 12</Badge> : null}</div> },
          { key: "dist", header: "Distribuição", cell: (r) => <StatusBadge value={r.product.distribution} />, mobile: false },
          { key: "cost", header: "Custo", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.product.costCents)}</span> },
          { key: "price", header: "Sugerido", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.product.suggestedPriceCents)}</span>, mobile: false },
          { key: "stock", header: "Disponível", className: "text-right", cell: (r) => <span className={cn("font-medium tabular-nums", r.available < 10 && "text-warning")}>{r.available} <span className="text-xs font-normal text-muted-foreground">/ {r.onHand}</span></span> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.product.status} dot /> },
        ]}
      />
    </>
  );
}
