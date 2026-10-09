import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { brasOverview } from "@/lib/domain/bras/comissoes";
import { brasWeekPlan } from "@/lib/domain/bras/videos";
import { BRAS_REQUEST_LABEL, BRAS_REQUEST_STATUSES } from "@/lib/domain/bras/catalogo";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";
import { WeekPlan } from "../descobertas/week-plan";

export const dynamic = "force-dynamic";

/** Visão geral do Estúdio (D102): o que pede ação agora, o mês e a semana das descobertas. */
export default async function Visao() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [d, o, semana] = await Promise.all([estudioData(session.actor), brasOverview(db, session.actor), brasWeekPlan(db, session.actor)]);
  const mes = new Date(`${o.month}-15T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" });
  return (
    <>
      <EstudioHeader title="Visão geral" description="O que pede ação agora, os números do mês e a semana das descobertas." {...d} />
      {o.stalledCount ? (
        <section aria-labelledby="parados-t" className="mb-6 rounded-xl border border-warning/40 bg-warning-soft/40 p-4">
          <h2 id="parados-t" className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-5 text-warning" aria-hidden />{o.stalledCount} pedido(s) recebido(s) há mais de 24 horas sem confirmação</h2>
          <ul className="mt-2 space-y-1 text-sm">{o.stalled.map((r) => <li key={r.id}>Pedido <b className="tabular-nums">{r.number}</b> · {r.boxes} caixa(s) de {r.productTitle} · {r.city} · desde {formatDateTime(r.createdAt)}</li>)}</ul>
          <Link href="/bras" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-link underline">Abrir pedidos<ArrowRight className="size-4" aria-hidden /></Link>
        </section>
      ) : null}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section aria-labelledby="mes-t" className="ds-card p-4 lg:col-span-2">
          <h2 id="mes-t" className="font-semibold">Pagos em {mes}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Pedidos", String(o.monthPaid.count)], ["Caixas", String(o.monthPaid.boxes)], ["Vendas das importadoras", formatBRL(o.monthPaid.totalCents)], ["Comissão do mês", formatBRL(o.monthPaid.commissionCents)]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-xl font-bold tabular-nums">{v}</dd></div>)}
          </dl>
          <Link href="/bras/comissoes" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-link underline">Ver comissões<ArrowRight className="size-4" aria-hidden /></Link>
        </section>
        <section aria-labelledby="membros-t" className="ds-card p-4">
          <h2 id="membros-t" className="font-semibold">Membros</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {[["Ativos", o.members.active], ["Novos em 7 dias", o.members.last7], ["Novos em 30 dias", o.members.last30]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-xl font-bold tabular-nums">{v}</dd></div>)}
          </dl>
        </section>
      </div>
      <section aria-labelledby="sit-t" className="ds-card mb-6 p-4">
        <h2 id="sit-t" className="font-semibold">Pedidos por situação</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{BRAS_REQUEST_STATUSES.map((s) => <li key={s} className="rounded-full bg-surface-muted px-3 py-1 text-sm">{BRAS_REQUEST_LABEL[s]}: <b className="tabular-nums">{o.requests[s] ?? 0}</b></li>)}</ul>
      </section>
      <WeekPlan {...semana} now={new Date().toISOString()} />
    </>
  );
}
