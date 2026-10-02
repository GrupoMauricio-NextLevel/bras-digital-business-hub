import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Circle, Package, Printer, Truck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ActionQueue, type ActionQueueItem } from "@/components/app/action-queue";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EsteiraBoard } from "@/components/dispatch/esteira-board";
import { CutoffBanner } from "@/components/dispatch/cutoff-banner";
import { LiveSync } from "@/components/dispatch/live-sync";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { ServiceSpotlight } from "@/components/services/spotlight";
import { getServicesHub } from "@/lib/queries/services-hub";
import { StockHolds } from "@/components/dispatch/stock-holds";
import { ESTEIRA_COLUMNS, loadEsteira, stockHolds, supplierOnboarding } from "@/lib/domain/operations";
import { cn } from "@/lib/utils";

export default async function SupplierHome() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const db = await getDb();
  const supplierId = session.supplier!.id;
  const [e, onboarding, holds] = await Promise.all([loadEsteira(db, session.actor), supplierOnboarding(db, supplierId), stockHolds(db, supplierId)]);
  const hub = await getServicesHub(session);
  const n = (s: string) => e.orders.filter((o) => o.status === s).length;
  const late = e.orders.filter((o) => o.status !== "SHIPPED" && o.status !== "AWAITING_CENTRAL_PAYMENT" && o.ageMinutes > 24 * 60).length;
  const awaitingFunds = n("AWAITING_CENTRAL_PAYMENT");
  const awaitingLabel = n("AWAITING_LABEL");
  const ready = n("READY_TO_PICK");
  const picking = n("PICKING");
  const readyToShip = n("READY_TO_SHIP");

  const queue: ActionQueueItem[] = [
    ready > 0 ? { id: "ready", title: "Separar pedidos liberados", description: "Pedidos pagos, com etiqueta e prontos para entrar na bancada.", count: ready, tone: "info", icon: Package, href: "/supplier/dispatch", actionLabel: "Abrir expedição" } : null,
    readyToShip > 0 ? { id: "ship", title: "Despachar pedidos conferidos", description: "A separação terminou e estes pedidos já podem sair da Central.", count: readyToShip, tone: "success", icon: Truck, href: "/supplier/dispatch", actionLabel: "Despachar" } : null,
    awaitingLabel > 0 ? { id: "labels", title: "Acompanhar etiquetas pendentes", description: "Os lojistas ainda precisam anexar o arquivo de envio.", count: awaitingLabel, tone: "warning", icon: Printer, href: "/supplier/orders?status=AWAITING_LABEL", actionLabel: "Ver pedidos" } : null,
    awaitingFunds > 0 ? { id: "funds", title: "Pedidos aguardando recarga", description: "O cliente já avançou, mas o saldo do lojista ainda não liberou a Central.", count: awaitingFunds, tone: "warning", icon: Wallet, href: "/supplier/wallets", actionLabel: "Ver recargas" } : null,
    late > 0 ? { id: "late", title: "Revisar pedidos atrasados", description: "Pedidos operacionais parados há mais de 24 horas.", count: late, tone: "danger", icon: AlertTriangle, href: "/supplier/orders", actionLabel: "Revisar" } : null,
  ].filter((item): item is ActionQueueItem => Boolean(item));

  return (
    <>
      <PageHeader title="Operação de hoje" description={session.supplier!.name + " · o que precisa da sua atenção agora."} actions={<div className="flex items-center gap-2"><LiveSync /><Link href="/supplier/dispatch" className={buttonVariants({ variant: "secondary" })}><Truck /> Abrir expedição</Link></div>} />

      <OperationalPulse
        className="mb-5"
        items={[
          { label: "Prontos para separar", value: ready, icon: Package, tone: ready ? "info" : "neutral", hint: "pagos + etiqueta pronta", href: "/supplier/dispatch" },
          { label: "Em separação", value: picking, icon: Truck, tone: picking ? "info" : "neutral", hint: "na bancada agora" },
          { label: "Aguardando etiqueta", value: awaitingLabel, icon: Printer, tone: awaitingLabel ? "warning" : "neutral", hint: "dependem do lojista", href: "/supplier/orders?status=AWAITING_LABEL" },
          { label: "Atrasados", value: late, icon: AlertTriangle, tone: late ? "danger" : "success", hint: late ? "mais de 24h" : "operação em dia", href: late ? "/supplier/orders" : undefined },
        ]}
      />

      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <ActionQueue items={queue} description="Prioridades ordenadas pelo impacto na operação." />
        <CutoffBanner cutoff={{ state: e.cutoff.state, cutoffAt: e.cutoff.cutoffAt, nextWorkingDate: e.cutoff.nextWorkingDate, nextCutoffAt: e.cutoff.nextCutoffAt, timezone: e.ops.timezone }} />
      </div>

      {onboarding.doneCount < onboarding.steps.length ? (
        <Card className="mb-5 border-accent/40"><CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Deixe a Central pronta para vender ({onboarding.doneCount}/{onboarding.steps.length})</h2><div className="h-2 w-40 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuenow={onboarding.doneCount} aria-valuemin={0} aria-valuemax={onboarding.steps.length} aria-label="Progresso da configuração"><div className="h-full rounded-full bg-accent" style={{ width: String((onboarding.doneCount / onboarding.steps.length) * 100) + "%" }} /></div></div>
          <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {onboarding.steps.map((s) => (
              <li key={s.key}>
                <Link href={s.href} className={cn("flex h-full items-start gap-2.5 rounded-lg border p-3 text-sm transition hover:bg-surface-hover", s.done ? "border-success/30 bg-success-soft/30" : "border-border bg-surface")}>
                  {s.done ? <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  <span><span className="block font-medium">{s.label}{s.done ? " ✓" : ""}</span><span className="text-xs text-muted-foreground">{s.hint}</span></span>
                  {!s.done ? <ArrowRight className="ml-auto mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
                </Link>
              </li>
            ))}
          </ol>
        </CardContent></Card>
      ) : null}

      <StockHolds holds={holds} />
      <div className="mb-5"><ServiceSpotlight hub={hub} base="/supplier" /></div>

      <div className="mb-3">
        <h2 className="text-base font-semibold">Esteira completa</h2>
        <p className="text-sm text-muted-foreground">A fila operacional continua abaixo para acompanhamento e gestão detalhada.</p>
      </div>
      <EsteiraBoard orders={e.orders} columns={ESTEIRA_COLUMNS} variant="adm" />
    </>
  );
}
