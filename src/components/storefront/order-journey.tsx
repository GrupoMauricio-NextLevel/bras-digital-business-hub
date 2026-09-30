import { Check, PackageCheck, PackageOpen, ReceiptText, Truck, Wallet, type LucideIcon } from "lucide-react";
import { JOURNEY, JOURNEY_LABEL, type JourneyStep, type TrackedOrder } from "@/lib/domain/tracking";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

const ICON: Record<JourneyStep, LucideIcon> = { RECEIVED: ReceiptText, PAID: Wallet, PREPARING: PackageOpen, SHIPPED: Truck, DELIVERED: PackageCheck };

/** Jornada do pedido para o cliente final: cinco etapas, a atual em destaque e o rastreio quando existir. */
export function OrderJourney({ order }: { order: TrackedOrder }) {
  if (order.canceled) return <p role="status" className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">Este pedido foi cancelado. Se você já pagou, fale com a loja.</p>;
  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-5" aria-label="Etapas do pedido">
        {JOURNEY.map((k, i) => {
          const done = i < order.stepIndex, current = i === order.stepIndex; const Icon = ICON[k];
          return (
            <li key={k} aria-current={current ? "step" : undefined} className={cn("flex gap-3 rounded-xl border p-3 sm:flex-col", current ? "border-transparent text-white" : done ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 opacity-60")} style={current ? { background: "var(--sf-primary)", color: "var(--sf-on-primary)" } : undefined}>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", current ? "bg-white/20" : done ? "text-white" : "bg-neutral-100 text-neutral-500")} style={done ? { background: "var(--sf-accent)", color: "var(--sf-on-accent)" } : undefined}>{done ? <Check className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}</span>
              <span><span className="block text-sm font-semibold">{JOURNEY_LABEL[k].title}</span><span className={cn("block text-xs", current ? "opacity-90" : "text-neutral-500")}>{current ? JOURNEY_LABEL[k].text : done ? "Concluído" : "Em breve"}</span></span>
            </li>
          );
        })}
      </ol>
      {order.trackingCode ? <p className="mt-4 rounded-xl border border-neutral-200 p-4 text-sm"><span className="text-neutral-500">Código de rastreio{order.carrier ? ` (${order.carrier})` : ""}: </span><b className="select-all tabular-nums">{order.trackingCode}</b></p> : null}
      {order.timeline.length ? <ol className="mt-5 space-y-2 border-l border-neutral-200 pl-4 text-sm">{order.timeline.map((t) => <li key={t.title} className="relative"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white" style={{ background: "var(--sf-accent)" }} aria-hidden /><span className="font-medium">{t.title}</span> <span className="text-xs text-neutral-500">{formatDateTime(t.at)}</span></li>)}</ol> : null}
    </div>
  );
}
