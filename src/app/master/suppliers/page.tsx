import { Factory, Package, Plus, Store, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { listSuppliers } from "@/lib/queries/master";
import { formatBRL } from "@/lib/money";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuppliersPage() {
  const rows = await listSuppliers();
  const active = rows.filter((r) => r.status === "ACTIVE").length;
  const withoutContract = rows.filter((r) => !r.contract).length;
  const stores = rows.reduce((sum, r) => sum + r.storeCount, 0);
  const products = rows.reduce((sum, r) => sum + r.productCount, 0);
  const gmv = rows.reduce((sum, r) => sum + r.gmv, 0);
  return (
    <>
      <PageHeader title="Fornecedores" description="Centrais que abastecem a rede com catálogo e estoque." actions={<Link href="/master/suppliers/new" className={buttonVariants()}><Plus /> Novo fornecedor</Link>} />
      <OperationalPulse className="mb-5" items={[
        { label: "Fornecedores", value: rows.length, icon: Factory, tone: "neutral", hint: active + " ativos" },
        { label: "Lojas conectadas", value: stores, icon: Store, tone: "info", hint: "na rede dos fornecedores" },
        { label: "Produtos centrais", value: products, icon: Package, tone: "neutral", hint: "catálogo agregado" },
        { label: "GMV da rede", value: formatBRL(gmv), icon: TrendingUp, tone: withoutContract ? "warning" : "success", hint: withoutContract ? withoutContract + " sem contrato" : "contratos completos" },
      ]} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: "name", header: "Fornecedor", primary: true, cell: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.city}/{r.state} · {r.slug}</div></div> },
          { key: "model", header: "Modelo", cell: (r) => <StatusBadge value={r.businessModel} /> },
          { key: "fee", header: "Contrato", cell: (r) => r.contract ? <span className="tabular-nums">{formatBRL(r.contract.monthlyFeeCents)}/mês · {r.contract.volumeFeeBps / 100}%</span> : <span className="text-muted-foreground">sem contrato</span> },
          { key: "stores", header: "Lojas", className: "text-right", cell: (r) => r.storeCount },
          { key: "products", header: "Produtos", className: "text-right", cell: (r) => r.productCount },
          { key: "gmv", header: "GMV", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.gmv)}</span> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} dot /> },
        ]}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>SuperDrop</CardTitle><CardDescription>Fornecedor vende com a marca SuperDrop.</CardDescription></div><StatusBadge value="SUPERDROP" /></CardHeader>
          <CardContent className="text-sm"><div className="text-2xl font-semibold">Mensalidade por faixa</div><div className="text-muted-foreground">+ taxa de 3% sobre o custo pago à Central, com mínimo mensal</div></CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>White Label</CardTitle><CardDescription>Ambiente com marca e domínio do fornecedor.</CardDescription></div><StatusBadge value="WHITE_LABEL" /></CardHeader>
          <CardContent className="text-sm"><div className="text-2xl font-semibold">R$ 15.000 <span className="text-sm font-normal text-muted-foreground">setup</span></div><div className="text-muted-foreground">+ manutenção mensal e taxa de 1,5%. Valores completos em Financeiro.</div></CardContent>
        </Card>
      </div>
    </>
  );
}
