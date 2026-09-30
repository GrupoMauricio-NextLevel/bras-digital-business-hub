import Link from "next/link";
import { Download, Handshake } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { fraudQueue, getPartnerSettings, listPartners, payoutQueue } from "@/lib/domain/partners";
import { periodOf } from "@/lib/domain/finance";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { FraudActions, PayoutActions, SettingsForm } from "./partners-client";

export const dynamic = "force-dynamic";
const TABS = [{ key: "parceiros", label: "Parceiros" }, { key: "saques", label: "Saques" }, { key: "antifraude", label: "Antifraude" }, { key: "regras", label: "Regras" }];
const STATUS = { ACTIVE: { label: "Ativo", tone: "success" }, INACTIVE: { label: "Inativo", tone: "warning" }, SUSPENDED: { label: "Suspenso", tone: "danger" } } as const;
const PAYOUT = { REQUESTED: "Solicitado", APPROVED: "Aprovado", PAID: "Pago", REJECTED: "Recusado" } as const;
const num = "text-right tabular-nums";

export default async function MasterPartners({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { tab: raw, status } = await searchParams;
  const tab = TABS.some((t) => t.key === raw) ? raw! : "parceiros";
  const db = await getDb();
  const [list, queue, fraud, settings] = await Promise.all([listPartners(db, session.actor), payoutQueue(db, session.actor), fraudQueue(db, session.actor), getPartnerSettings(db)]);
  const openPayouts = queue.filter((p) => p.status === "REQUESTED" || p.status === "APPROVED");
  const period = periodOf(new Date());
  const shown = list.filter((p) => !status || p.status === status);
  return (
    <>
      <PageHeader title="Programa de Parceiros" description="Afiliados que indicam planos NextLevel: cadastros, comissões, saques e antifraude." actions={<a href={`/master/partners/export?period=${period}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground hover:underline"><Download className="size-4" aria-hidden /> Exportar CSV do mês</a>} />
      <MetricGrid className="mb-8">
        <MetricCard label="Parceiros" value={list.length} icon={Handshake} hint={`${list.filter((p) => p.status === "ACTIVE").length} ativos · ${list.filter((p) => p.status === "INACTIVE").length} inativos`} />
        <MetricCard label="Ativações no mês" value={list.reduce((t, p) => t + p.activationsMonth, 0)} tone="success" />
        <MetricCard label="Saques em aberto" value={openPayouts.length} tone={openPayouts.length ? "warning" : "neutral"} hint={formatBRL(openPayouts.reduce((t, p) => t + p.amountCents, 0))} />
        <MetricCard label="Em revisão" value={fraud.length} tone={fraud.length ? "danger" : "neutral"} hint="Possível autoindicação" />
      </MetricGrid>
      <LinkTabs label="Programa de parceiros" active={tab} items={TABS.map((t) => ({ ...t, href: `/master/partners?tab=${t.key}` }))} />

      {tab === "parceiros" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            {[["", "Todos"], ["ACTIVE", "Ativos"], ["INACTIVE", "Inativos"], ["SUSPENDED", "Suspensos"]].map(([k, l]) => <Link key={k} href={k ? `/master/partners?status=${k}` : "/master/partners"} aria-current={(status ?? "") === k ? "true" : undefined} className={`rounded-full border px-3 py-1 text-xs font-medium ${(status ?? "") === k ? "border-accent bg-accent-soft" : "border-border text-muted-foreground"}`}>{l}</Link>)}
          </div>
          {shown.length === 0 ? <EmptyState icon={Handshake} title="Nenhum parceiro" description="Os cadastros de /parceiros/cadastro aparecem aqui." /> : (
            <Card><Table>
              <THead><TR><TH>Parceiro</TH><TH>Código</TH><TH>Situação</TH><TH className={num}>Indicados</TH><TH className={num}>Ativações (mês)</TH><TH className={num}>Em garantia</TH><TH className={num}>Disponível</TH><TH className={num}>Pago</TH></TR></THead>
              <TBody>{shown.map((p) => (
                <TR key={p.id}><TD className="font-medium"><Link className="hover:underline" href={`/master/partners/${p.id}`}>{p.displayName}</Link>{p.flagged ? <Badge tone="danger" className="ml-2">revisão</Badge> : null}</TD><TD className="font-mono text-xs">{p.code}</TD><TD><Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge></TD><TD className={num}>{p.referrals}</TD><TD className={num}>{p.activationsMonth}</TD><TD className={num}>{formatBRL(p.pendingCents)}</TD><TD className={num}>{formatBRL(p.availableCents)}</TD><TD className={num}>{formatBRL(p.paidCents)}</TD></TR>
              ))}</TBody>
            </Table></Card>
          )}
        </>
      ) : null}

      {tab === "saques" ? (
        queue.length === 0 ? <EmptyState icon={Handshake} title="Nenhum saque solicitado" /> : (
          <ul className="space-y-3">{queue.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium"><Link className="hover:underline" href={`/master/partners/${p.partnerId}`}>{p.partnerName}</Link> <span className="text-xs text-muted-foreground">({p.partnerCode})</span></p><p className="text-xs text-muted-foreground">Pedido em {formatDate(p.requestedAt)} · CPF/CNPJ {p.taxId} · chave Pix <code>{p.pixKeySnapshot}</code></p></div><div className="text-right"><p className="text-lg font-semibold tabular-nums">{formatBRL(p.amountCents)}</p><p className="text-xs text-muted-foreground">{PAYOUT[p.status]}{p.receiptNote ? ` · ${p.receiptNote}` : ""}</p></div></div>
              <div className="mt-3"><PayoutActions id={p.id} status={p.status} /></div>
            </li>
          ))}</ul>
        )
      ) : null}

      {tab === "antifraude" ? (
        fraud.length === 0 ? <EmptyState icon={Handshake} title="Nada em revisão" description="Lojas indicadas com o mesmo CPF/CNPJ ou e-mail do parceiro aparecem aqui e não geram comissão até você decidir." /> : (
          <ul className="space-y-3">{fraud.map((f) => (
            <li key={f.storeId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-soft/40 p-4"><div><p className="font-medium">{f.storeName}</p><p className="text-sm text-muted-foreground">Indicada por <Link className="underline" href={`/master/partners/${f.partnerId}`}>{f.partnerName}</Link> · mesmo CPF/CNPJ ou e-mail do parceiro</p></div><FraudActions storeId={f.storeId} /></li>
          ))}</ul>
        )
      ) : null}

      {tab === "regras" ? (<><SectionTitle title="Regras do programa" description="Nada de percentual fixo no código: tudo é lido daqui. Vale para novas ativações; ajustes de faixa usam o valor vigente no fechamento." /><Card className="p-5"><SettingsForm settings={settings} /></Card></>) : null}
    </>
  );
}
