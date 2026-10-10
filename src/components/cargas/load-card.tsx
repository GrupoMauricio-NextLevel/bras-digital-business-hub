import { MapPin, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { CARGAS_LOAD_STATUS_LABEL, CARGAS_LOAD_STATUS_TONE, cargasDay } from "@/lib/cargas/rotulos";
import type { LoadView } from "@/lib/domain/cargas/cargas";

/**
 * Cartão de uma coleta da NextLevel Cargas (D111), igual para importadora, transportadora, motorista e Master.
 * O que cada um vê já vem filtrado do servidor (código só depois do aceite; frete nunca para a importadora).
 */
export function LoadCard({ load: l, who, actions, showEvents = true }: { load: LoadView; who: "importadora" | "transportadora" | "motorista" | "master"; actions?: React.ReactNode; showEvents?: boolean }) {
  const codes = l.requests.some((r) => r.pickupCode);
  return (
    <li className="ds-card p-4 text-sm" aria-labelledby={`load-${l.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={`load-${l.id}`} className="text-base font-bold">Coleta {l.number} · {cargasDay(l.pickupDate, l.period)}</h3>
          <p className="text-muted-foreground">{who === "importadora" ? l.carrierName : who === "master" ? `${l.importerName} → ${l.carrierName}` : l.importerName}</p>
        </div>
        <Badge tone={CARGAS_LOAD_STATUS_TONE[l.status]}>{CARGAS_LOAD_STATUS_LABEL[l.status]}</Badge>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1"><Package className="size-4" aria-hidden />{l.boxes} caixa(s){l.volumeLiters ? ` · ${(l.volumeLiters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m³` : ""}{l.weightKg ? ` · ${l.weightKg} kg` : ""}</span>
        <span className="inline-flex items-center gap-1"><Truck className="size-4" aria-hidden />Destino: {l.destinations}</span>
      </p>
      {l.warehouse ? <p className="mt-1 flex items-start gap-1"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /><span><b>{l.warehouse.name}:</b> {l.warehouse.address}{l.warehouse.hours ? ` · ${l.warehouse.hours}` : ""}{l.warehouse.rules ? <span className="block text-muted-foreground">{l.warehouse.rules}</span> : null}</span></p> : null}
      {l.notes ? <p className="mt-1 text-muted-foreground">Observação: {l.notes}</p> : null}
      {(who === "transportadora" || who === "master") && l.freightCents !== null ? <p className="mt-1">Frete: <b className="tabular-nums">{formatBRL(l.freightCents)}</b>{l.commissionCents !== null ? <span className="text-muted-foreground"> · comissão NextLevel {formatBRL(l.commissionCents)}</span> : null}</p> : null}
      {l.refuseReason ? <p className="mt-1 text-danger">Motivo da recusa: {l.refuseReason}</p> : null}
      <details className="mt-3" open={who === "motorista"}>
        <summary className="cursor-pointer font-semibold">{l.requests.length} pedido(s){codes ? " e códigos de retirada" : ""}</summary>
        <ul className="mt-2 space-y-2">{l.requests.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-2">
            <p className="flex flex-wrap items-center justify-between gap-2"><b>Pedido {r.number} · {r.boxes} cx</b>{r.pickupCode ? <span className="rounded bg-surface-muted px-2 py-0.5 font-mono font-bold tracking-wider">{r.pickupCode}</span> : null}</p>
            <p className="text-muted-foreground">{r.productTitle}</p>
            <p>Entregar: {r.shipName ? `${r.shipName}, ` : ""}{r.shipAddress ? `${r.shipAddress}, ` : ""}{r.shipCity}/{r.shipState}{r.shipZip ? ` · CEP ${r.shipZip}` : ""}</p>
          </li>
        ))}</ul>
        {!codes && who === "transportadora" && l.status === "CHAMADA" ? <p className="mt-2 text-muted-foreground">Os códigos de retirada aparecem depois que você aceitar.</p> : null}
      </details>
      {showEvents && l.events.length ? (
        <details className="mt-2"><summary className="cursor-pointer text-muted-foreground">Histórico</summary>
          <ol className="mt-1 space-y-0.5 text-muted-foreground">{l.events.map((e, i) => <li key={i}>{new Date(e.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {CARGAS_LOAD_STATUS_LABEL[e.kind as keyof typeof CARGAS_LOAD_STATUS_LABEL] ?? e.kind} · {e.actor}{e.note ? ` · ${e.note}` : ""}</li>)}</ol>
        </details>
      ) : null}
      {actions}
    </li>
  );
}
