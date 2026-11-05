import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getPartnerForMaster } from "@/lib/domain/partners";
import { NotFoundError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PartnerAdmin } from "../partners-client";
import { PartnerKindControl, PartnerTierControl } from "@/app/master/financeiro/catalog-admin";
import { NIVEIS } from "@/lib/domain/niveis-parceiro";
import { ROTULO_TIPO } from "@/lib/domain/parceiros-ec";

export const dynamic = "force-dynamic";
const nomeNivel = (t: string) => NIVEIS.find((n) => n.tier === t)?.nome ?? t;
const KIND: Record<string, string> = { BONUS: "Bônus", SALE: "Venda", RECURRING: "Recorrência", SETUP: "Setup", MAINTENANCE: "Manutenção", ADJUSTMENT: "Ajuste de faixa", CLAWBACK: "Estorno", PAYOUT: "Saque", PAYOUT_REVERSAL: "Saque devolvido", FEE: "Taxa de reativação", MANUAL: "Ajuste manual" };
const ST: Record<string, string> = { PENDING: "Em garantia", AVAILABLE: "Disponível", PAID: "Pago", VOID: "Anulado" };

export default async function MasterPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  let d;
  try { d = await getPartnerForMaster(await getDb(), session.actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const p = d.partner;
  return (
    <>
      <Link href="/master/partners" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Voltar aos parceiros</Link>
      <PageHeader title={p.displayName} description={`${p.email} · código ${p.code} · CPF/CNPJ ${p.taxId} · desde ${formatDate(p.createdAt)} · termos ${p.termsVersion}`} badge={<Badge tone={p.status === "ACTIVE" ? "success" : p.status === "INACTIVE" ? "warning" : "danger"}>{p.status === "ACTIVE" ? "Ativo" : p.status === "INACTIVE" ? "Inativo" : "Suspenso"}</Badge>} />
      <MetricGrid className="mb-8">
        <MetricCard label="Em garantia" value={formatBRL(d.balances.pendingCents)} tone="warning" />
        <MetricCard label="Disponível" value={formatBRL(d.balances.availableCents)} tone={d.balances.availableCents < 0 ? "danger" : "success"} />
        <MetricCard label="Pago" value={formatBRL(d.balances.paidCents)} />
        <MetricCard label="Chave Pix" value={p.hasPix ? "Cadastrada" : "Não cadastrada"} tone={p.hasPix ? "success" : "warning"} />
      </MetricGrid>
      <Card className="mb-8"><CardContent className="pt-5"><PartnerAdmin id={p.id} status={p.status} /></CardContent></Card>
      {/* D220: tipo do parceiro (agência parceira = 50% + 25%, D226) e o pedido feito pelo parceiro no painel. */}
      <Card className="mb-8"><CardContent className="space-y-3 pt-5">
        <h2 className="text-base font-semibold">Tipo: {ROTULO_TIPO[p.kind] ?? p.kind}</h2>
        {p.agencyRequestedAt ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">Pediu para ser agência parceira em {formatDate(p.agencyRequestedAt)}: {p.agencyInfo ?? "sem detalhes"}</p> : null}
        <PartnerKindControl partnerId={p.id} kind={p.kind} />
      </CardContent></Card>
      {/* D249: nível por desempenho (sobe na hora, desce após 2 meses abaixo) e fixação manual com motivo. */}
      <Card className="mb-8"><CardContent className="space-y-3 pt-5">
        <h2 className="text-base font-semibold">Nível: {NIVEIS.find((n) => n.tier === p.tier)?.nome ?? p.tier} · {d.nivel.ativos} {d.nivel.ativos === 1 ? "cliente ativo" : "clientes ativos"}</h2>
        <p className="text-sm text-muted-foreground">{NIVEIS.find((n) => n.tier === p.tier)?.efeito}.{p.tierLockedReason ? ` Fixado pelo Master: ${p.tierLockedReason}.` : p.tierBelowSince ? ` Abaixo do limite desde ${p.tierBelowSince}: desce após 2 meses.` : " Calculado sozinho todo dia."}</p>
        <PartnerTierControl partnerId={p.id} tier={p.tier} travado={!!p.tierLockedReason} />
        {d.nivel.historico.length ? <ul className="grid gap-1 text-xs text-muted-foreground">{d.nivel.historico.map((h) => <li key={h.id}>{formatDate(h.at)} · {nomeNivel(h.fromTier)} → {nomeNivel(h.toTier)} · {h.activeClients} ativos · {h.source === "MASTER" ? "Master" : "cálculo"}{h.reason ? ` · ${h.reason}` : ""}</li>)}</ul> : null}
      </CardContent></Card>
      <SectionTitle title="Meses fechados" />
      <Card className="mb-8"><Table><THead><TR><TH>Mês</TH><TH className="text-right">Ativações</TH><TH className="text-right">Faixa</TH><TH>Meta</TH></TR></THead><TBody>{d.months.length === 0 ? <TR><TD colSpan={4} className="text-muted-foreground">Nenhum mês fechado ainda.</TD></TR> : d.months.map((m) => <TR key={m.period}><TD>{m.period}</TD><TD className="text-right tabular-nums">{m.activations}</TD><TD className="text-right tabular-nums">{m.tierBps / 100}%</TD><TD>{m.metGoal ? "Cumprida" : "Não cumprida"}</TD></TR>)}</TBody></Table></Card>
      <SectionTitle title="Lojas indicadas" />
      <Card className="mb-8"><Table><THead><TR><TH>Loja</TH><TH>Origem</TH><TH>Data</TH><TH>Revisão</TH></TR></THead><TBody>{d.referrals.length === 0 ? <TR><TD colSpan={4} className="text-muted-foreground">Nenhuma loja indicada.</TD></TR> : d.referrals.map((r) => <TR key={r.id}><TD>{r.name}</TD><TD>{r.via === "COUPON" ? "Cupom" : "Link"}</TD><TD>{r.at ? formatDate(r.at) : "—"}</TD><TD>{r.flag ? <Badge tone="danger">autoindicação</Badge> : "—"}</TD></TR>)}</TBody></Table></Card>
      <SectionTitle title="Livro-razão" description="Imutável: correções entram como novos lançamentos." />
      <Card><Table><THead><TR><TH>Data</TH><TH>Lançamento</TH><TH>Mês</TH><TH>Faixa</TH><TH>Situação</TH><TH className="text-right">Valor</TH></TR></THead><TBody>{d.entries.map((e) => <TR key={e.id}><TD>{formatDate(e.createdAt)}</TD><TD>{KIND[e.kind] ?? e.kind}{e.note ? <span className="block text-xs text-muted-foreground">{e.note}</span> : null}</TD><TD>{e.period}</TD><TD>{e.rateBps ? `${e.rateBps / 100}%` : "—"}</TD><TD>{ST[e.status]}</TD><TD className={`text-right tabular-nums ${e.amountCents < 0 ? "text-danger" : ""}`}>{formatBRL(e.amountCents)}</TD></TR>)}</TBody></Table></Card>
    </>
  );
}
