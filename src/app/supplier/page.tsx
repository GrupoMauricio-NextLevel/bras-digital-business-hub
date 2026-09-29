import Link from "next/link";
import { ArrowRight, Check, Circle, Truck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EsteiraBoard } from "@/components/dispatch/esteira-board";
import { CutoffBanner } from "@/components/dispatch/cutoff-banner";
import { LiveSync } from "@/components/dispatch/live-sync";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { ESTEIRA_COLUMNS, loadEsteira, supplierOnboarding } from "@/lib/domain/operations";
import { cn } from "@/lib/utils";

export default async function SupplierHome() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const db = await getDb();
  const supplierId = session.supplier!.id;
  const [e, onboarding] = await Promise.all([loadEsteira(db, session.actor), supplierOnboarding(db, supplierId)]);
  const n = (s: string) => e.orders.filter((o) => o.status === s).length;
  const late = e.orders.filter((o) => o.status !== "SHIPPED" && o.status !== "AWAITING_CENTRAL_PAYMENT" && o.ageMinutes > 24 * 60).length;

  return (
    <>
      <PageHeader title="Esteira de pedidos" description={`${session.supplier!.name} · o que precisa sair da Central, em tempo real.`} actions={<div className="flex items-center gap-2"><LiveSync /><Link href="/supplier/dispatch" className={buttonVariants({ variant: "secondary" })}><Truck /> Tela da expedição</Link></div>} />

      {onboarding.doneCount < onboarding.steps.length ? (
        <Card className="mb-5 border-accent/40"><CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Deixe a Central pronta para vender ({onboarding.doneCount}/{onboarding.steps.length})</h2><div className="h-2 w-40 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={onboarding.doneCount} aria-valuemin={0} aria-valuemax={onboarding.steps.length} aria-label="Progresso da configuração"><div className="h-full rounded-full bg-accent" style={{ width: `${(onboarding.doneCount / onboarding.steps.length) * 100}%` }} /></div></div>
          <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {onboarding.steps.map((s) => (
              <li key={s.key}>
                <Link href={s.href} className={cn("flex h-full items-start gap-2.5 rounded-lg border p-3 text-sm transition hover:shadow-md", s.done ? "border-success/30 bg-success-soft/30" : "border-border bg-surface")}>
                  {s.done ? <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span><span className="block font-medium">{s.label}{s.done ? " ✓" : ""}</span><span className="text-xs text-muted-foreground">{s.hint}</span></span>
                  {!s.done ? <ArrowRight className="ml-auto mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
                </Link>
              </li>
            ))}
          </ol>
        </CardContent></Card>
      ) : null}

      <CutoffBanner cutoff={{ state: e.cutoff.state, cutoffAt: e.cutoff.cutoffAt, nextWorkingDate: e.cutoff.nextWorkingDate, nextCutoffAt: e.cutoff.nextCutoffAt, timezone: e.ops.timezone }} className="mb-4" />

      <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Aguardando recarga", n("AWAITING_CENTRAL_PAYMENT"), "text-warning"],
          ["Aguardando etiqueta", n("AWAITING_LABEL"), "text-warning"],
          ["Prontos para separar", n("READY_TO_PICK"), "text-info"],
          ["Em separação", n("PICKING"), "text-accent"],
          ["Conferidos", n("READY_TO_SHIP"), "text-success"],
          ["Atrasados (+24h)", late, late ? "text-danger" : "text-muted-foreground"],
        ].map(([label, value, tone]) => <div key={label as string} className="rounded-lg border border-border bg-surface px-3 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={cn("font-display text-2xl font-semibold tabular-nums", tone as string)}>{value as number}</dd></div>)}
      </dl>

      <EsteiraBoard orders={e.orders} columns={ESTEIRA_COLUMNS} variant="adm" />
    </>
  );
}
