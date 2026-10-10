import { Bell, MapPin, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { PARCEL_SIZE_LABEL, type ParcelSize } from "@/lib/domain/cargas/regras-excursao";
import { CollectByLabel, DeliverParcel, ParcelCallActions, TripActions } from "./excursao-forms";

type Parcel = { id: string; label: string; size: ParcelSize; units: number; status: string; storeName: string; storeAddress: string | null; recipientName: string; priceCents: number | null; hasInvoice: boolean };
export type BoardTrip = { id: string; number: number; status: string; routeName: string; brasPoint: string; cityPoint: string; arriveBrasAt: string; departAt: string; arriveCityAt: string | null; capacityUnits: number; usedUnits: number; freightCents: number | null; parcels: Parcel[] };

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const TRIP_LABEL: Record<string, string> = { ABERTA: "Recebendo fardos", LOTADA: "Pedidos fechados", EM_VIAGEM: "Em viagem", CHEGOU: "Chegou na cidade" };

/**
 * A viagem como um app de corrida (D114): medidor do bagageiro, chamadas em cartões com Aceitar/Recusar, coleta no
 * Brás por código da etiqueta e entrega com o código do cliente. `token` = ajudante pelo link (sem valores, sem aceitar).
 */
export function ExcursionBoard({ trips, token }: { trips: BoardTrip[]; token?: string }) {
  if (!trips.length) return <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">{token ? "Nenhuma viagem em andamento." : "Nenhuma viagem aberta. Abra a próxima em Rotas e viagens."}</p>;
  return (
    <div className="space-y-10">
      {trips.map((t) => {
        const pct = Math.min(100, Math.round((t.usedUnits / Math.max(1, t.capacityUnits)) * 100));
        const calls = t.parcels.filter((p) => p.status === "SOLICITADO" || p.status === "ESPERA");
        const toCollect = t.parcels.filter((p) => p.status === "ACEITO" || p.status === "PRONTO");
        const onBoard = t.parcels.filter((p) => p.status === "COLETADO" || p.status === "EM_VIAGEM");
        const toDeliver = t.parcels.filter((p) => p.status === "CHEGOU");
        const delivered = t.parcels.filter((p) => p.status === "ENTREGUE").length;
        const stores = [...new Set(toCollect.map((p) => p.storeName))];
        return (
          <section key={t.id} aria-labelledby={`trip-${t.id}`} className="space-y-4">
            <div className="ds-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 id={`trip-${t.id}`} className="text-xl font-bold">Viagem {t.number}</h2>
                  <p className="text-sm text-muted-foreground">{t.routeName}</p>
                </div>
                <Badge tone={t.status === "ABERTA" ? "success" : t.status === "EM_VIAGEM" ? "info" : "warning"}>{TRIP_LABEL[t.status] ?? t.status}</Badge>
              </div>
              <p className="mt-2 text-sm">Chega ao Brás {fmt(t.arriveBrasAt)} · sai {fmt(t.departAt)}{t.arriveCityAt ? ` · chega na cidade ${fmt(t.arriveCityAt)}` : ""}</p>
              <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />Embarque: {t.brasPoint}</p>
              <div className="mt-3">
                <div className="flex justify-between text-sm font-semibold"><span>Bagageiro</span><span className="tabular-nums">{t.usedUnits} de {t.capacityUnits} ({pct}%)</span></div>
                <div className="mt-1 h-4 overflow-hidden rounded-full bg-surface-muted" role="meter" aria-label="Ocupação do bagageiro" aria-valuemin={0} aria-valuemax={t.capacityUnits} aria-valuenow={t.usedUnits}><div className={`h-full ${pct >= 90 ? "bg-warning" : "bg-[var(--brand-primary)]"}`} style={{ width: `${pct}%` }} /></div>
                {t.freightCents !== null ? <p className="mt-2 text-sm">Frete desta viagem: <b className="tabular-nums">{formatBRL(t.freightCents)}</b> · {delivered} entregue(s)</p> : null}
              </div>
              {!token ? <div className="mt-4"><TripActions tripId={t.id} status={t.status} /></div> : null}
            </div>

            {!token && calls.length ? (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-bold"><Bell className="size-5 text-[var(--brand-primary)]" aria-hidden />Chamadas <span className="rounded-full bg-[var(--brand-primary)]/15 px-2 tabular-nums">{calls.length}</span></h3>
                <ul className="grid gap-3 md:grid-cols-2">{calls.map((p) => (
                  <li key={p.id} className="ds-card p-4 text-sm">
                    <div className="flex items-start justify-between gap-2"><p className="text-lg font-bold">{PARCEL_SIZE_LABEL[p.size]}</p>{p.priceCents !== null ? <p className="text-xl font-black tabular-nums">{formatBRL(p.priceCents)}</p> : null}</div>
                    <p>Loja: <b>{p.storeName}</b>{p.storeAddress ? ` · ${p.storeAddress}` : ""}</p>
                    <p className="text-muted-foreground">Para {p.recipientName} · etiqueta {p.label} · ocupa {p.units}</p>
                    <p className="mt-1">{p.hasInvoice ? <Badge tone="success">Com nota</Badge> : <Badge tone="warning">Sem nota ainda</Badge>}{p.status === "ESPERA" ? <> <Badge tone="neutral">Lista de espera</Badge></> : null}</p>
                    <ParcelCallActions parcelId={p.id} />
                  </li>
                ))}</ul>
              </div>
            ) : null}

            {(t.status === "ABERTA" || t.status === "LOTADA") ? (
              <div className="ds-card p-4">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold"><PackageCheck className="size-5 text-[var(--brand-primary)]" aria-hidden />Coletar no Brás <span className="rounded-full bg-[var(--brand-primary)]/15 px-2 tabular-nums">{toCollect.length}</span></h3>
                <p className="mb-3 text-sm text-muted-foreground">Digite ou bipe o código da etiqueta de cada fardo. Fardo sem nota não embarca.</p>
                <CollectByLabel token={token} />
                {stores.length ? <ul className="mt-4 space-y-3">{stores.map((s) => (
                  <li key={s}><p className="font-semibold">{s}</p><ul className="mt-1 flex flex-wrap gap-2">{toCollect.filter((p) => p.storeName === s).map((p) => <li key={p.id} className="rounded border border-border px-2 py-1 font-mono text-sm">{p.label} · {p.size}{p.hasInvoice ? "" : " · sem nota"}</li>)}</ul></li>
                ))}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nada para coletar agora.</p>}
              </div>
            ) : null}

            {onBoard.length ? <div className="ds-card p-4 text-sm"><h3 className="mb-2 flex items-center gap-2 text-lg font-bold"><Truck className="size-5 text-[var(--brand-primary)]" aria-hidden />No ônibus ({onBoard.length})</h3><p className="flex flex-wrap gap-2">{onBoard.map((p) => <span key={p.id} className="rounded border border-border px-2 py-1 font-mono">{p.label}</span>)}</p></div> : null}

            {toDeliver.length ? (
              <div className="ds-card p-4">
                <h3 className="mb-1 text-lg font-bold">Entregar na cidade ({toDeliver.length})</h3>
                <p className="mb-3 text-sm text-muted-foreground">Retirada: {t.cityPoint}. Peça o código do fardo ao cliente.</p>
                <ul className="space-y-3">{toDeliver.map((p) => <li key={p.id} className="rounded-lg border border-border p-3 text-sm"><p><b className="font-mono">{p.label}</b> · {PARCEL_SIZE_LABEL[p.size]} · para {p.recipientName}</p><DeliverParcel parcelId={p.id} token={token} /></li>)}</ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
