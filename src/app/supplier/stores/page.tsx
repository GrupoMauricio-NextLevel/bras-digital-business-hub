import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { requireAreaRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StoreOwnerActions } from "./owner-actions";

export default async function SupplierStoresPage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const rows = await getSupplierStores(session.supplier!.id);
  return (
    <>
      <PageHeader title="Lojistas da rede" description="Lojas white label que revendem o catálogo da Central." actions={<Link href="/supplier/stores/new" className={buttonVariants()}><Plus /> Nova loja</Link>} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.store.id}
        columns={[
          { key: "name", header: "Loja", primary: true, cell: (r) => <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: r.store.primaryColor }}>{r.store.logoText}</span><div><div className="font-medium">{r.store.name}</div><div className="text-xs text-muted-foreground">{r.store.whatsapp ?? r.store.slug}</div></div></div> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.store.status} dot /> },
          { key: "products", header: "Produtos ativos", className: "text-right", cell: (r) => r.products },
          { key: "orders", header: "Pedidos", className: "text-right", cell: (r) => r.orders },
          { key: "gmv", header: "Vendas", className: "text-right", cell: (r) => <span className="tabular-nums">{formatBRL(r.gmv)}</span> },
          { key: "cost", header: "Receita Central", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.cost)}</span> },
          { key: "link", header: "", className: "text-right", cell: (r) => <div className="flex items-center justify-end gap-1"><a href={`/store/${r.store.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /> loja</a><StoreOwnerActions owner={r.owner} /></div> },
        ]}
      />
    </>
  );
}
