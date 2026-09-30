import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getSupplierStores } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StoreOwnerActions } from "./owner-actions";
import { CouponsCard, ExtendTrialButton } from "./trials-panel";
import { getDb } from "@/db/client";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { storeAccess } from "@/lib/domain/store-access";
import { getBaseUrl } from "@/lib/base-url";
import { formatDate } from "@/lib/utils";

export default async function SupplierStoresPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const rows = await getSupplierStores(session.supplier!.id);
  const myCoupons = await (await getDb()).select().from(coupons).where(eq(coupons.supplierId, session.supplier!.id));
  return (
    <>
      <PageHeader title="Lojistas da rede" description="Lojas white label que revendem o catálogo da Central." actions={<Link href="/supplier/stores/new" className={buttonVariants()}><Plus /> Nova loja</Link>} />
      <CouponsCard coupons={myCoupons.map((c) => ({ id: c.id, code: c.code, trialDays: c.trialDays, redemptions: c.redemptions, maxRedemptions: c.maxRedemptions }))} origin={await getBaseUrl()} />
      <DataTable
        rows={rows}
        rowKey={(r) => r.store.id}
        columns={[
          { key: "name", header: "Loja", primary: true, cell: (r) => <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: r.store.primaryColor }}>{r.store.logoText}</span><div><div className="font-medium">{r.store.name}</div><div className="text-xs text-muted-foreground">{r.store.whatsapp ?? r.store.slug}</div></div></div> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.store.status} dot /> },
          { key: "access", header: "Acesso", cell: (r) => { const a = storeAccess(r.store); return a.state === "TRIAL" ? <div className="flex items-center gap-1 text-xs"><span className="rounded bg-info-soft px-1.5 py-0.5 font-medium text-info">Teste até {formatDate(a.endsAt!.toISOString())}</span><ExtendTrialButton storeId={r.store.id} /></div> : a.state === "BLOCKED" ? <span className="rounded bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">Bloqueada: aguardando pagamento</span> : a.state === "PAID" ? <span className="text-xs text-muted-foreground">Assinatura até {formatDate(a.endsAt!.toISOString())}</span> : <span className="text-xs text-muted-foreground">—</span>; } },
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
