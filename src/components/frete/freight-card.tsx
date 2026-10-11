import Link from "next/link";
import { Bus, CheckCircle2, Circle, MessageCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FREIGHT_STATUS_TONE, FREIGHT_STEP_HINT, FREIGHT_STEP_LABEL } from "@/lib/frete/situacao";
import type { FreightView } from "@/lib/domain/frete/painel";
import { formatBRL } from "@/lib/money";
import { CancelParcelButton, ParcelInvoiceForm } from "@/components/cargas/excursao-forms";
import { NotaEmDia } from "@/components/fiscal/nota-forms";

const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const wa = (phone: string) => `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}`;

/** Cartão de frete (D113): o mesmo para transportadora e ônibus, com a linha do tempo unificada. */
export function FreightCard({ f, receiptHref }: { f: FreightView; receiptHref?: string }) {
  return (
    <li className="ds-card p-4 text-sm" aria-labelledby={`fr-${f.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`fr-${f.id}`} className="text-base font-bold">{f.what}</h3>
          <p className="text-muted-foreground">{f.parcel ? <>Etiqueta <b className="font-mono">{f.parcel.label}</b> · viagem {f.parcel.tripNumber} · sai {when(f.parcel.departAt)} · {formatBRL(f.parcel.priceCents)}</> : <>Pedido {f.code} · {f.boxes} caixa(s) → {f.destination}{f.importerName ? ` · retirada na ${f.importerName}` : ""}</>}</p>
        </div>
        <Badge tone={FREIGHT_STATUS_TONE[f.status]}>{FREIGHT_STEP_LABEL[f.status]}</Badge>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{f.mode === "ONIBUS" ? <Bus className="mr-1 inline size-4 align-[-3px] text-[var(--brand-primary)]" aria-hidden /> : <Truck className="mr-1 inline size-4 align-[-3px] text-[var(--brand-primary)]" aria-hidden />}<b>{f.carrier.name}</b> <span className="text-muted-foreground">{f.mode === "ONIBUS" ? "· ônibus de excursão" : f.mode === "TRANSPORTADORA" ? "· transportadora da NextLevel Cargas" : "· transportadora informada por você"}</span></span>
        {f.carrier.phone ? <a href={wa(f.carrier.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-link underline"><MessageCircle className="size-4" aria-hidden />WhatsApp</a> : null}
        {f.loadNumber ? <span className="text-muted-foreground">· coleta {f.loadNumber}</span> : null}
      </p>
      {f.status !== "CANCELADO" ? (
        <ol className="mt-3 grid grid-cols-5 gap-1" aria-label="Linha do tempo do frete">
          {f.steps.map((s) => (
            <li key={s.key} className="flex flex-col items-center text-center text-[11px] leading-tight">
              {s.done ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <Circle className="size-5 text-muted-foreground" aria-hidden />}
              <span className={s.done ? "mt-1 font-semibold" : "mt-1 text-muted-foreground"}>{s.label}</span>
              {s.at ? <span className="text-muted-foreground">{when(s.at)}</span> : null}
              <span className="sr-only">{s.done ? "concluído" : "pendente"}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-2 text-muted-foreground">{f.parcel?.note ?? FREIGHT_STEP_HINT[f.status]}</p>
      {f.parcel ? (
        <div className="mt-2 space-y-1">
          <p>Retire em: {f.parcel.cityPoint}. Seu código: <span className="rounded bg-surface-muted px-2 py-0.5 font-mono font-bold tracking-wider">{f.parcel.deliveryCode}</span></p>
          <p className="text-muted-foreground">Coleta na loja {f.parcel.storeName}; embarque no Brás: {f.parcel.brasPoint}</p>
          {f.status !== "CANCELADO" && !f.parcel.hasInvoice ? <><p className="font-semibold text-warning">Sem nota: o fardo não embarca sem a chave da nota da loja.</p><ParcelInvoiceForm parcelId={f.id.replace(/^trp-/, "")} /><NotaEmDia parcelId={f.id.replace(/^trp-/, "")} storeName={f.parcel.storeName} hint="Sem a chave da nota? Peça para a loja (com o Nota Fácil ela emite em minutos) ou resolva agora com o Meu Contador." /></> : f.parcel.hasInvoice ? <p className="text-success">Nota registrada.</p> : null}
          {f.parcel.canCancel ? <CancelParcelButton parcelId={f.id.replace(/^trp-/, "")} /> : null}
        </div>
      ) : null}
      {f.pickupCode && receiptHref ? <p className="mt-2">Código de retirada: <span className="rounded bg-surface-muted px-2 py-0.5 font-mono font-bold tracking-wider">{f.pickupCode}</span> · <Link href={receiptHref} className="font-semibold text-link underline">Comprovante</Link></p> : null}
    </li>
  );
}
