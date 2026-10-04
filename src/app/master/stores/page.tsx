import { Suspense } from "react";
import { AlertTriangle, ExternalLink, Store, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { FilterBar, FilterChips, SearchInput } from "@/components/app/filter-bar";
import { listStoresWithPlan } from "@/lib/queries/master";
import { BAND_LABEL, healthScore, loadTowerSnapshot, opportunities } from "@/lib/domain/control-tower";
import { getDb } from "@/db/client";
import { storeUrl } from "@/lib/store-url";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PRODUCT_BRANDS, brandByCode } from "@/lib/brand";
import { masterBrandFilter } from "@/lib/brand-server";

export default async function StoresPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; offer?: string; marca?: string }> }) {
  const sp = await searchParams;
  const marca = await masterBrandFilter(sp.marca);
  const [rows, snap] = await Promise.all([listStoresWithPlan({ ...sp, marca }), getDb().then((db) => loadTowerSnapshot(db))]);
  const signal = new Map(snap.stores.map((x) => [x.id, x]));
  const healthy = rows.filter((r) => { const s = signal.get(r.store.id); return s ? healthScore(s).band === "HEALTHY" : false; }).length;
  const risk = rows.filter((r) => { const s = signal.get(r.store.id); return s ? healthScore(s).band === "RISK" : false; }).length;
  const gmv = rows.reduce((sum, r) => sum + r.gmv, 0);
  const balance = rows.reduce((sum, r) => sum + (signal.get(r.store.id)?.balanceCents ?? 0), 0);
  return (
    <>
      <PageHeader title="Lojas" description="Todos os lojistas da rede por oferta: Drop manual, Loja SuperDrop (subdomínio) e Loja própria (domínio próprio), com saúde, saldo e situação." />
      <OperationalPulse className="mb-5" items={[
        { label: "Lojas", value: rows.length, icon: Store, tone: "neutral", hint: healthy + " saudáveis" },
        { label: "Em risco", value: risk, icon: AlertTriangle, tone: risk ? "danger" : "success", hint: risk ? "exigem atenção" : "nenhuma em risco" },
        { label: "GMV", value: formatBRL(gmv), icon: TrendingUp, tone: "success", hint: "resultado das lojas filtradas" },
        { label: "Saldo agregado", value: formatBRL(balance), icon: Wallet, tone: "info", hint: "saldos operacionais" },
      ]} />
      <Suspense>
        <FilterBar>
          <SearchInput placeholder="Buscar loja…" />
          <FilterChips param="offer" allLabel="Todas as ofertas" options={[{ value: "DROP_MANUAL", label: "Drop manual" }, { value: "STORE_SUBDOMAIN", label: "Loja SuperDrop" }, { value: "STORE_OWN", label: "Loja própria" }]} />
          <FilterChips param="marca" allLabel={marca && !sp.marca ? `Só ${brandByCode(marca).name}` : "Todas as marcas"} options={[{ value: "todas", label: "Todas as marcas" }, ...PRODUCT_BRANDS.map((c) => ({ value: c, label: brandByCode(c).name }))]} />
          <FilterChips param="status" allLabel="Todas" options={[{ value: "ACTIVE", label: "Ativas" }, { value: "SUSPENDED", label: "Suspensas" }, { value: "CLOSED", label: "Encerradas" }]} />
        </FilterBar>
      </Suspense>
      <DataTable
        rows={rows}
        rowKey={(r) => r.store.id}
        columns={[
          { key: "name", header: "Loja", primary: true, cell: (r) => <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded text-[10px] font-bold text-white" style={{ background: r.store.primaryColor }}>{r.store.logoText}</span><div><div className="font-medium">{r.store.name}</div><div className="text-xs text-muted-foreground">{r.networkName}</div></div></div> },
          { key: "offer", header: "Oferta", cell: (r) => <StatusBadge value={r.store.offer} />, mobile: false },
          { key: "brand", header: "Marca", cell: (r) => <span className="text-xs">{brandByCode(r.brand).name}</span>, mobile: false },
          { key: "opp", header: "Oportunidade", cell: (r) => { const sg = signal.get(r.store.id); const o = sg ? opportunities(sg) : []; return o.length ? <span title={o.join(" · ")} className="text-xs text-muted-foreground">Vendas baixas</span> : <span className="text-xs text-subtle-foreground">—</span>; } },
          { key: "health", header: "Saúde", cell: (r) => { const sg = signal.get(r.store.id); if (!sg) return null; const h = healthScore(sg); return <span title={h.reasons.join(" · ") || "Sem pendências"} className={h.band === "HEALTHY" ? "text-success" : h.band === "ATTENTION" ? "text-warning" : "text-danger"}>{BAND_LABEL[h.band]} · {h.score}</span>; } },
          { key: "balance", header: "Saldo", className: "text-right", mobile: false, cell: (r) => <span className="tabular-nums">{formatBRL(signal.get(r.store.id)?.balanceCents ?? 0)}</span> },
          { key: "status", header: "Status", cell: (r) => <StatusBadge value={r.store.status} dot /> },
          { key: "plan", header: "Plano", cell: (r) => <span>{r.planName ?? "—"} {r.subscriptionStatus ? <StatusBadge value={r.subscriptionStatus} /> : null}</span> },
          { key: "due", header: "Vencimento", cell: (r) => formatDate(r.periodEnd), mobile: false },
          { key: "orders", header: "Pedidos", className: "text-right", cell: (r) => r.orderCount },
          { key: "gmv", header: "GMV", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.gmv)}</span> },
          { key: "link", header: "", className: "text-right", cell: (r) => <a href={storeUrl(r.store.slug, r.store.offer, r.store.customDomain, r.store.domainStatus)} target="_blank" rel="noreferrer" className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /> abrir</a> },
        ]}
      />
    </>
  );
}
