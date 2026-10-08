import { inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { catalogProducts } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { listQuotes } from "@/lib/domain/corporate-sales";
import { listDeliveries } from "@/lib/domain/corporate-checkout";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { DeliveryControl, QuoteEditor } from "../catalog-admin";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function PropostasEntregas() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [quotes, deliveries] = await Promise.all([listQuotes(db, s.actor), listDeliveries(db, s.actor)]);
  const ids = [...new Set(quotes.map((q) => q.productId))];
  const names = new Map(ids.length ? (await db.select({ id: catalogProducts.id, name: catalogProducts.name }).from(catalogProducts).where(inArray(catalogProducts.id, ids))).map((p) => [p.id, p.name]) : []);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Propostas e entregas" description="Produtos sob consulta (Enterprise, Premium, Scale, White Label, marketing) viram proposta, nunca cobrança automática. Serviços pagos viram entrega com prazo, checklist e aceite do cliente." />
      <FinNav active="propostas" />
      <SectionTitle title={`Propostas (${quotes.length})`} />
      {quotes.length ? <div className="mb-8 grid gap-4 lg:grid-cols-2">{quotes.map((q) => (
        <Card key={q.id}><CardContent className="pt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{names.get(q.productId) ?? "Produto"}</h3><Badge tone={q.status === "ACCEPTED" || q.status === "CONVERTED" ? "success" : q.status === "SENT" ? "info" : "warning"}>{q.status}</Badge></div>
          <p className="text-sm">{q.contactName} · {q.contactEmail}{q.contactPhone ? ` · ${q.contactPhone}` : ""}</p>
          <p className="text-xs text-muted-foreground">{q.requesterType === "PARTNER" ? "Pedida por parceiro" : q.requesterType === "STORE" ? "Pedida por lojista" : q.requesterType === "SUPPLIER" ? "Pedida por fornecedor" : "Pedida no site"} · {formatDate(q.createdAt)}{q.totalCents !== null ? ` · total ${formatBRL(q.totalCents)}` : ""}</p>
          <p className="my-3 whitespace-pre-line rounded-md bg-surface-muted p-3 text-sm">{q.briefing}</p>
          <QuoteEditor quote={{ id: q.id, status: q.status, items: q.items, discountCents: q.discountCents, terms: q.terms, validUntil: q.validUntil }} />
        </CardContent></Card>
      ))}</div> : <p className="mb-8 text-sm text-muted-foreground">Nenhuma proposta pedida ainda.</p>}
      <SectionTitle title={`Entregas (${deliveries.length})`} />
      {deliveries.length ? <div className="grid gap-4 lg:grid-cols-2">{deliveries.map((d) => (
        <Card key={d.id}><CardContent className="pt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{d.productKey}</h3><Badge tone={d.status === "ACCEPTED" ? "success" : d.status === "CANCELED" ? "neutral" : "info"}>{d.status}</Badge></div>
          <p className="mb-2 text-xs text-muted-foreground">{d.dueAt ? `Prazo: ${formatDate(d.dueAt)}` : "Sem prazo"}{d.acceptedAt ? ` · aceite em ${formatDate(d.acceptedAt)}` : ""}{d.details.mediaSpendPaidByClient ? " · verba de mídia paga pelo cliente direto à plataforma" : ""}</p>
          {d.status === "ACCEPTED" || d.status === "CANCELED" ? <ul className="text-sm">{d.checklist.map((c) => <li key={c.label}>{c.done ? "✓" : "○"} {c.label}</li>)}</ul> : <DeliveryControl id={d.id} status={d.status} checklist={d.checklist} />}
        </CardContent></Card>
      ))}</div> : <p className="text-sm text-muted-foreground">Nenhuma entrega aberta.</p>}
    </>
  );
}
