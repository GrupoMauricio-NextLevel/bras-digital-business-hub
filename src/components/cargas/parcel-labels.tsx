import QRCode from "qrcode";
import { PARCEL_SIZE_LABEL, type ParcelSize } from "@/lib/domain/cargas/regras-excursao";

export type LabelData = { label: string; size: ParcelSize; carrierName: string; tripNumber: number; departAt: string; recipientName: string; cityPoint: string; storeName: string };

/**
 * Etiquetas do fardo (D114) para imprimir e colar: código grande "viagem-seq", QR com o mesmo código (o ajudante bipa
 * ou digita), destino e quem retira. Sem valor, sem telefone, sem documento.
 */
export async function ParcelLabels({ labels }: { labels: LabelData[] }) {
  const qrs = await Promise.all(labels.map((l) => QRCode.toDataURL(l.label, { margin: 1, width: 160, errorCorrectionLevel: "M" })));
  return (
    <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
      {labels.map((l, i) => (
        <li key={l.label} className="flex break-inside-avoid gap-3 rounded-lg border-2 border-dashed border-foreground/40 bg-white p-3 text-black">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor */}
          <img src={qrs[i]} alt={`QR do fardo ${l.label}`} width={112} height={112} className="size-28 shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="font-mono text-3xl font-black leading-none">{l.label}</p>
            <p className="mt-1 font-semibold">{PARCEL_SIZE_LABEL[l.size]} · {l.carrierName}</p>
            <p>Viagem {l.tripNumber} · sai {new Date(l.departAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
            <p>Para: <b>{l.recipientName}</b></p>
            <p className="truncate">Retira em: {l.cityPoint}</p>
            <p className="truncate text-xs">Loja: {l.storeName}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
