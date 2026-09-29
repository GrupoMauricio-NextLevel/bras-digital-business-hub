import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { ProductArt } from "@/components/app/product-art";
import { listAllProducts } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export default async function CatalogPage() {
  const rows = await listAllProducts();
  return (
    <>
      <PageHeader title="Catálogo central" description="Todos os produtos cadastrados pelos fornecedores da plataforma." />
      <DataTable
        rows={rows}
        rowKey={(r) => r.product.id}
        columns={[
          { key: "name", header: "Produto", primary: true, cell: (r) => <div className="flex items-center gap-3"><ProductArt images={r.product.images} size="sm" /><div><div className="font-medium">{r.product.name}</div><div className="text-xs text-muted-foreground">{r.product.sku} · {r.supplierName}</div></div></div> },
          { key: "dist", header: "Distribuição", cell: (r) => <StatusBadge value={r.product.distribution} /> },
          { key: "type", header: "Venda", cell: (r) => <div className="flex gap-1">{r.product.sellsUnit ? <Badge tone="outline">Unitária</Badge> : null}{r.product.sellsPack ? <Badge tone="info">Grade</Badge> : null}</div> },
          { key: "cost", header: "Custo", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.product.costCents)}</span> },
          { key: "price", header: "Sugerido", className: "text-right", cell: (r) => <span className="tabular-nums font-medium">{formatBRL(r.product.suggestedPriceCents)}</span> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.product.status} dot /> },
        ]}
      />
    </>
  );
}
