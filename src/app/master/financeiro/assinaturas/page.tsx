import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listSubscriptions, STATUS_LABEL } from "@/lib/domain/commerce-plans";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function AssinaturasMaster() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const rows = await listSubscriptions(await getDb(), s.actor);
  const n = (st: string) => rows.filter((r) => r.sub.status === st).length;
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Assinaturas Commerce" description="Ciclo: em teste → aguardando pagamento → ativa → em atraso → suspensa → cancelada/expirada. Preço e taxa ficam congelados na contratação; a cobrança é a fatura da loja (Pix ou cartão na conta da NextLevel)." />
      <FinNav active="assinaturas" />
      <OperationalPulse className="mb-6" items={[{ label: "Ativas", value: n("active"), tone: "success" }, { label: "Em teste", value: n("trial"), tone: "info" }, { label: "Aguardando pagamento", value: n("pending_payment"), tone: "warning" }, { label: "Em atraso / suspensas", value: n("past_due") + n("suspended"), tone: n("past_due") + n("suspended") ? "danger" : "neutral" }]} />
      <DataTable rows={rows} rowKey={(r) => r.sub.id} empty={<p className="text-sm text-muted-foreground">Nenhuma assinatura Commerce ainda.</p>} columns={[
        { key: "l", header: "Loja", primary: true, cell: (r) => <div><div className="font-semibold">{r.storeName}</div><div className="text-xs text-muted-foreground">{r.sub.productKey.replace("COMMERCE_", "Commerce ")} · {r.sub.cycle === "ANNUAL" ? "anual" : "mensal"}</div></div> },
        { key: "v", header: "Valor congelado", cell: (r) => <div className="tabular-nums"><div>{formatBRL(r.sub.amountCents)}</div><div className="text-xs text-muted-foreground">taxa {r.sub.platformFeeBps / 100}%{r.sub.firstPeriodCents !== null ? ` · 1º mês ${formatBRL(r.sub.firstPeriodCents)}` : ""}</div></div> },
        { key: "o", header: "Oferta", cell: (r) => <span className="text-xs">{r.sub.offerKey ? `${r.sub.offerKey} v${r.sub.offerVersion}` : "sem oferta"}{r.sub.feeHolidayUntil ? ` · sem taxa até ${formatDate(r.sub.feeHolidayUntil)}` : ""}</span> },
        { key: "s", header: "Situação", cell: (r) => <Badge tone={r.sub.status === "active" ? "success" : r.sub.status === "trial" ? "info" : ["past_due", "suspended"].includes(r.sub.status) ? "danger" : "warning"}>{STATUS_LABEL[r.sub.status]}</Badge> },
        { key: "p", header: "Período", cell: (r) => <span className="text-xs">{r.sub.currentPeriodEnd ? `até ${formatDate(r.sub.currentPeriodEnd)}` : r.sub.trialEndsAt ? `teste até ${formatDate(r.sub.trialEndsAt)}` : "—"}{r.sub.cancelAtPeriodEnd ? " · cancela no fim" : ""}</span> },
      ]} />
    </>
  );
}
