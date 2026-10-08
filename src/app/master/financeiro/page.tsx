import { AlertTriangle, BarChart3, CalendarClock, Repeat, TrendingUp, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { corporateOverview } from "@/lib/domain/corporate-metrics";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { FinNav } from "./fin-nav";

export const dynamic = "force-dynamic";

const pct = (bps: number | null) => (bps === null ? "sem dados" : `${(bps / 100).toFixed(1).replace(".", ",")}%`);

function Bars({ title, rows, note }: { title: string; rows: { label: string; cents: number; feeCents?: number }[]; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.cents));
  return (
    <Card><CardContent className="pt-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-sm">
              <div className="flex justify-between gap-3"><span className="min-w-0 truncate">{r.label}</span><span className="shrink-0 font-semibold tabular-nums">{formatBRL(r.cents)}{r.feeCents ? <span className="ml-1 text-xs font-normal text-muted-foreground">(taxa {formatBRL(r.feeCents)})</span> : null}</span></div>
              <div className="mt-1 h-2 rounded-full bg-surface-muted" aria-hidden><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, Math.round((r.cents / max) * 100))}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted-foreground">Sem receita registrada no período.</p>}
    </CardContent></Card>
  );
}

export default async function FinanceiroNextLevel() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const o = await corporateOverview(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Visão executiva" description="Receita da própria NextLevel: planos, taxas de plataforma, temas, setup, loja pronta, migração, serviços e fornecedores. O dinheiro das vendas dos lojistas e das recargas dos fornecedores não entra aqui: ele é deles." />
      <FinNav active="visao" />
      <OperationalPulse className="mb-6" label="Indicadores" items={[
        { label: "MRR", value: formatBRL(o.mrrCents), icon: Repeat, tone: "info", hint: `ARR ${formatBRL(o.arrCents)}` },
        { label: "Recebido em 30 dias", value: formatBRL(o.received30Cents), icon: TrendingUp, tone: "success", hint: `12 meses: ${formatBRL(o.received365Cents)}` },
        { label: "Receita prevista", value: formatBRL(o.forecastCents), icon: CalendarClock, tone: "neutral", hint: "faturas a vencer + MRR" },
        { label: "Inadimplência", value: formatBRL(o.overdueCents), icon: AlertTriangle, tone: o.overdueCount ? "danger" : "success", hint: `${o.overdueCount} fatura(s) vencida(s)` },
      ]} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Assinaturas Commerce ativas", v: String(o.activeSubscriptions), h: `${o.trialSubscriptions} em teste` },
          { l: "Churn (30 dias)", v: pct(o.churnBps), h: "assinaturas Commerce" },
          { l: "LTV", v: o.ltvCents === null ? "sem dados" : formatBRL(o.ltvCents), h: "ticket mensal ÷ churn" },
          { l: "Ticket médio", v: o.avgTicketCents === null ? "sem dados" : formatBRL(o.avgTicketCents), h: `CAC: ${o.cacCents === null ? "sem dados de investimento" : formatBRL(o.cacCents)}` },
        ].map((k) => <Card key={k.l}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{k.l}</p><p className="mt-1 text-2xl font-bold tabular-nums">{k.v}</p><p className="text-xs text-muted-foreground">{k.h}</p></CardContent></Card>)}
      </div>
      <SectionTitle title="Composição do MRR" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[{ l: "Planos Commerce", v: o.mrrParts.commerce, i: BarChart3 }, { l: "Lojas SuperDrop pagas", v: o.mrrParts.superdropStores, i: Wallet }, { l: "Mensalidades de fornecedores", v: o.mrrParts.suppliers, i: Wallet }].map((k) => <Card key={k.l}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{k.l}</p><p className="mt-1 text-xl font-bold tabular-nums">{formatBRL(k.v)}</p></CardContent></Card>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bars title="Receita por produto (12 meses)" rows={o.byProduct} />
        <Bars title="Receita por gateway (12 meses)" rows={o.byGateway} note="Faturas de planos e setup são cobradas pelo Mercado Pago da NextLevel." />
        <Bars title="Receita por canal (12 meses)" rows={o.byChannel} />
        <Bars title="Receita por parceiro (12 meses)" rows={o.byPartner} note="Vendas do catálogo atribuídas a parceiros." />
      </div>
    </>
  );
}
