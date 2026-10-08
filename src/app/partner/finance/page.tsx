import { Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { isDemoMode } from "@/lib/auth";
import { requireRole } from "@/lib/require-session";
import { balances, getPartnerSettings, ledger, listPayouts, partnerOfActor, pixKeyOf } from "@/lib/domain/partners";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PayoutPanel, ReactivatePanel } from "../partner-client";
import { partnerStatement } from "@/lib/domain/corporate-commissions";

export const dynamic = "force-dynamic";
const KIND: Record<string, string> = { SALE: "Venda do catálogo NextLevel", RECURRING: "Recorrência", SETUP: "Comissão de setup", MAINTENANCE: "Manutenção (mensalidade)", ADJUSTMENT: "Ajuste de faixa", CLAWBACK: "Estorno", PAYOUT: "Saque", PAYOUT_REVERSAL: "Saque recusado (devolvido)", FEE: "Taxa de reativação", MANUAL: "Ajuste da NextLevel" };
const STATUS: Record<string, { label: string; tone: "warning" | "success" | "neutral" | "outline" }> = { PENDING: { label: "Em carência", tone: "warning" }, AVAILABLE: { label: "Liberada", tone: "success" }, PAID: { label: "Paga", tone: "neutral" }, VOID: { label: "Cancelada/estornada", tone: "outline" } };
const PAYOUT: Record<string, string> = { REQUESTED: "Solicitado", APPROVED: "Aprovado", PAID: "Pago", REJECTED: "Recusado" };

export default async function PartnerFinance() {
  const session = await requireRole("AFFILIATE");
  const db = await getDb();
  const [p, s, rows, payouts] = await Promise.all([partnerOfActor(db, session.actor), getPartnerSettings(db), ledger(db, session.actor), listPayouts(db, session.actor)]);
  const b = await balances(db, p.id);
  const st = await partnerStatement(db, session.actor);
  return (
    <>
      <PageHeader title="Financeiro" description={`Comissões ficam em garantia por ${s.guaranteeDays} dias e só depois ficam disponíveis para saque.`} />
      <MetricGrid className="mb-8">
        <MetricCard label="Em garantia" value={formatBRL(b.pendingCents)} tone="warning" hint={`Libera em até ${s.guaranteeDays} dias`} />
        <MetricCard label="Disponível" value={formatBRL(b.availableCents)} tone={b.availableCents < 0 ? "danger" : "success"} hint={b.availableCents < 0 ? "Saldo negativo a compensar" : "Pronto para saque"} icon={Wallet} />
        <MetricCard label="Já recebido" value={formatBRL(b.paidCents)} hint="Saques pagos" />
      </MetricGrid>

      {p.status === "INACTIVE" ? <Card className="mb-8" id="reativar"><CardContent className="pt-5"><h2 className="mb-2 text-base font-semibold">Reativar cadastro</h2><ReactivatePanel feeLabel={formatBRL(s.inactiveFeeCents)} canPayFromBalance={b.availableCents >= s.inactiveFeeCents} demo={isDemoMode()} /></CardContent></Card> : null}

      <SectionTitle title="Solicitar saque" description="O pagamento é feito por Pix pela equipe NextLevel." />
      <Card className="mb-8"><CardContent className="pt-5"><PayoutPanel availableCents={b.availableCents} availableLabel={formatBRL(Math.max(b.availableCents, 0))} minLabel={formatBRL(s.minPayoutCents)} hasPix={!!pixKeyOf(p)} disabled={p.status === "SUSPENDED" || b.availableCents < s.minPayoutCents} /></CardContent></Card>

      {payouts.length ? (<><SectionTitle title="Histórico de saques" /><Card className="mb-8"><Table>
        <THead><TR><TH>Pedido</TH><TH>Situação</TH><TH>Pago em</TH><TH>Observação</TH><TH className="text-right">Valor</TH></TR></THead>
        <TBody>{payouts.map((x) => <TR key={x.id}><TD>{formatDate(x.requestedAt)}</TD><TD>{PAYOUT[x.status]}</TD><TD>{x.paidAt ? formatDate(x.paidAt) : "—"}</TD><TD className="max-w-xs truncate">{x.receiptNote ?? "—"}</TD><TD className="text-right tabular-nums">{formatBRL(x.amountCents)}</TD></TR>)}</TBody>
      </Table></Card></>) : null}

      {st.pending.length ? (<><SectionTitle title="Pendente: vendas aguardando pagamento" description="A comissão só nasce depois que o cliente paga, e fica em carência antes de ser liberada." /><Card className="mb-8"><CardContent className="pt-5"><ul className="space-y-1 text-sm">{st.pending.map((o) => <li key={o.code} className="flex justify-between gap-2"><span>{o.productName} · {o.code}</span><span className="tabular-nums">{formatBRL(o.totalCents)}</span></li>)}</ul></CardContent></Card></>) : null}

      <SectionTitle title="Extrato de comissões" description="Em carência → liberada → paga. Estornos e chargebacks aparecem como cancelados ou como débito." />
      {rows.length === 0 ? <EmptyState compact icon={Wallet} title="Sem lançamentos ainda" description="Comissões de setup e manutenção aparecem aqui." /> : (
        <Card><Table>
          <THead><TR><TH>Data</TH><TH>Lançamento</TH><TH>Loja</TH><TH>Faixa</TH><TH>Situação</TH><TH className="text-right">Valor</TH></TR></THead>
          <TBody>{rows.map((r) => <TR key={r.id}><TD>{formatDate(r.createdAt)}</TD><TD>{KIND[r.kind] ?? r.kind}{r.note ? <span className="block text-xs text-muted-foreground">{r.note}</span> : null}</TD><TD className="font-mono text-xs">{r.storeMasked ?? "—"}</TD><TD>{r.rateBps ? `${r.rateBps / 100}%` : "—"}</TD><TD><Badge tone={STATUS[r.status]!.tone}>{STATUS[r.status]!.label}</Badge></TD><TD className={`text-right tabular-nums ${r.amountCents < 0 ? "text-danger" : ""}`}>{formatBRL(r.amountCents)}</TD></TR>)}</TBody>
        </Table></Card>
      )}
    </>
  );
}
