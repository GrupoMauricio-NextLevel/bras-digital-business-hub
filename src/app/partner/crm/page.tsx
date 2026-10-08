import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listPartnerLeads, partnerCatalog, partnerSalesDashboard, STAGE_LABEL } from "@/lib/domain/corporate-sales";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { LeadActions, NewLead } from "./crm-client";

export const dynamic = "force-dynamic";

export default async function PartnerCrm() {
  const s = await requireRole("AFFILIATE");
  const db = await getDb();
  const [leads, dash, catalog] = await Promise.all([listPartnerLeads(db, s.actor), partnerSalesDashboard(db, s.actor), partnerCatalog(db, s.actor)]);
  const products = catalog.map((c) => ({ key: c.key, name: c.name, quote: c.kind === "quote_required" }));
  return (
    <>
      <PageHeader title="CRM de clientes" description="Sua carteira: só você vê os seus leads. Lead registrado primeiro fica com quem registrou. Você não vê caixa, margens ou dados de outros parceiros." />
      <OperationalPulse className="mb-6" items={[{ label: "Leads", value: dash.leads, tone: "info" }, { label: "Propostas abertas", value: dash.quotesOpen, tone: "warning" }, { label: "Vendas pagas", value: dash.salesPaid, tone: "success", hint: formatBRL(dash.salesValueCents) }, { label: "Conversão", value: `${(dash.conversionBps / 100).toFixed(1).replace(".", ",")}%`, tone: "neutral", hint: "leads ganhos" }]} />
      <Card className="mb-6"><CardContent className="pt-5"><SectionTitle title="Novo lead" /><NewLead /></CardContent></Card>
      {leads.length ? <ul className="space-y-3">{leads.map((l) => (
        <li key={l.id} className="ds-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{l.name}{l.company ? ` · ${l.company}` : ""}</p><p className="text-xs text-muted-foreground">{l.email}{l.phone ? ` · ${l.phone}` : ""} · desde {formatDate(l.createdAt)}</p></div>
            <Badge tone={l.stage === "WON" ? "success" : l.stage === "LOST" ? "neutral" : "info"}>{STAGE_LABEL[l.stage]}</Badge>
          </div>
          {l.diagnosis ? <p className="mt-2 text-sm">Maturidade <strong>{l.diagnosis.score}/100</strong> · recomendações: {l.diagnosis.recommendations.map((k) => catalog.find((c) => c.key === k)?.name ?? k).join(", ") || "—"} · válido até {formatDate(l.diagnosis.validUntil)}</p> : null}
          {l.notes ? <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p> : null}
          <div className="mt-3"><LeadActions lead={{ id: l.id, name: l.name, email: l.email, phone: l.phone, stage: l.stage }} products={products} /></div>
        </li>
      ))}</ul> : <p className="text-sm text-muted-foreground">Nenhum lead ainda. Registre o primeiro acima ou divulgue o seu link do diagnóstico gratuito.</p>}
    </>
  );
}
