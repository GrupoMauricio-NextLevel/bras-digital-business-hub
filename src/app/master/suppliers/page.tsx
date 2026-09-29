import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { listSuppliers } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuppliersPage() {
  const rows = await listSuppliers();
  return (
    <>
      <PageHeader title="Fornecedores" description="Centrais que abastecem a rede com catálogo e estoque." actions={<Link href="/master/suppliers/new" className={buttonVariants()}><Plus /> Novo fornecedor</Link>} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Fornecedor", primary: true, cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.city}/{r.state} · {r.slug}</div></div> },
          { key: "model", header: "Modelo", cell: (r) => <StatusBadge value={r.businessModel} /> },
          { key: "fee", header: "Taxa", cell: (r) => <span className="tabular-nums">{r.platformFeePercent}% · setup {formatBRL(r.setupFeeCents)}</span> },
          { key: "stores", header: "Lojas", className: "text-right", cell: (r) => r.storeCount },
          { key: "products", header: "Produtos", className: "text-right", cell: (r) => r.productCount },
          { key: "gmv", header: "GMV", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.gmv)}</span> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} dot /> },
        ]}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>SuperDrop</CardTitle><CardDescription>Baixa barreira de entrada para fornecedores.</CardDescription></div><StatusBadge value="SUPERDROP" /></CardHeader>
          <CardContent className="text-sm"><div className="text-2xl font-semibold">R$ 0 <span className="text-sm font-normal text-muted-foreground">setup</span></div><div className="text-muted-foreground">+ 6% do faturamento bruto</div></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>White Label</CardTitle><CardDescription>Ambiente com a marca do fornecedor.</CardDescription></div><StatusBadge value="WHITE_LABEL" /></CardHeader>
          <CardContent className="text-sm"><div className="text-2xl font-semibold">R$ 6.000 <span className="text-sm font-normal text-muted-foreground">setup</span></div><div className="text-muted-foreground">+ 3% do faturamento bruto</div></CardContent>
        </Card>
      </div>
    </>
  );
}
