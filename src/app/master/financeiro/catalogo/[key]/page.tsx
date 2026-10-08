import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCatalogItem, priceHistory } from "@/lib/domain/nl-catalog";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { CYCLE_LABEL, FAMILY_LABEL, KIND_LABEL, priceLines, STATUS_LABEL } from "@/lib/finance/catalog-labels";
import { PriceVersionForm, ProductEditForm, StatusControl } from "../../catalog-admin";
import { FinNav } from "../../fin-nav";

export const dynamic = "force-dynamic";

export default async function ProdutoCatalogo({ params }: { params: Promise<{ key: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const p = await getCatalogItem(db, { key: (await params).key }, { includeUnpublished: true });
  if (!p) notFound();
  const history = await priceHistory(db, s.actor, p.id);
  const current = p.prices.ONE_TIME ?? p.prices.MONTHLY ?? p.prices.ANNUAL ?? p.prices.QUOTE;
  const lines = priceLines(p);
  return (
    <>
      <PageHeader backHref="/master/financeiro/catalogo" eyebrow={FAMILY_LABEL[p.family]} title={p.name} badge={<Badge tone={p.status === "PUBLISHED" ? "success" : "warning"}>{STATUS_LABEL[p.status]}</Badge>} description={`${KIND_LABEL[p.kind]} · página pública: /solucoes/${p.slug}`} actions={current ? <PriceVersionForm productId={p.id} defaults={{ cycle: current.cycle, amountCents: current.amountCents, pixDiscountBps: current.pixDiscountBps, cardMaxInstallments: current.cardMaxInstallments, cardMarkupBps: current.cardMarkupBps, platformFeeBps: current.platformFeeBps, methods: current.methods }} /> : null} />
      <FinNav active="catalogo" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="pt-5"><SectionTitle title="Dados do produto" /><ProductEditForm product={{ id: p.id, name: p.name, tagline: p.tagline, summary: p.summary, phase: p.phase, lockMode: p.lockMode, gateway: p.gateway, partnerDiscountMaxBps: p.partnerDiscountMaxBps, commissionHoldDays: p.commissionHoldDays, deliveryDays: p.deliveryDays, prerequisites: p.prerequisites }} /></CardContent></Card>
        <div className="space-y-6">
          <Card><CardContent className="pt-5"><SectionTitle title="Preço vigente" /><p className="text-2xl font-bold tabular-nums">{lines.main}</p><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{lines.details.map((d) => <li key={d}>{d}</li>)}</ul></CardContent></Card>
          <Card><CardContent className="pt-5"><SectionTitle title="Publicação" /><StatusControl productId={p.id} status={p.status} /></CardContent></Card>
        </div>
      </div>
      <SectionTitle title="Histórico de versões de preço" />
      <DataTable rows={history} rowKey={(v) => v.id} columns={[
        { key: "v", header: "Versão", primary: true, cell: (v) => <span className="font-semibold">{CYCLE_LABEL[v.cycle]} v{v.version}</span> },
        { key: "amount", header: "Preço-base", cell: (v) => v.amountCents === null ? "Sob consulta" : formatBRL(v.amountCents) },
        { key: "rule", header: "Regras", cell: (v) => <span className="text-xs">Pix −{v.pixDiscountBps / 100}% · cartão até {v.cardMaxInstallments}x{v.cardMarkupBps ? ` (+${v.cardMarkupBps / 100}%)` : ""}{v.platformFeeBps !== null ? ` · taxa ${v.platformFeeBps / 100}%` : ""}</span> },
        { key: "from", header: "Vigência", cell: (v) => formatDate(v.effectiveFrom) },
        { key: "why", header: "Motivo", cell: (v) => <span className="text-xs">{v.reason}</span> },
      ]} />
    </>
  );
}
