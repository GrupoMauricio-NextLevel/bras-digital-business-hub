import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { myParcels } from "@/lib/domain/cargas/excursao";
import { ParcelLabels } from "@/components/cargas/parcel-labels";
import { PrintButton } from "@/components/cargas/print-button";

export const dynamic = "force-dynamic";

/** Etiquetas dos meus fardos (D114): imprimir e mandar para a loja colar no fardo. */
export default async function Etiquetas() {
  const session = await requireRole("BRAS_MEMBER");
  const parcels = (await myParcels(await getDb(), session.actor)).filter((p) => ["SOLICITADO", "ESPERA", "ACEITO", "PRONTO"].includes(p.status)).sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { numeric: true }));
  return (
    <>
      <PageHeader eyebrow="Meu Brás · Fretes" title="Etiquetas dos fardos" backHref="/meu-bras/fretes" description="Imprima e mande para a loja colar uma etiqueta em cada fardo. Sem impressora, a loja escreve o código grande com caneta." actions={parcels.length ? <PrintButton /> : undefined} />
      {parcels.length ? <ParcelLabels labels={parcels.map((p) => ({ label: p.label, size: p.size, carrierName: p.carrierName, tripNumber: p.tripNumber, departAt: p.departAt, recipientName: p.recipientName, cityPoint: p.cityPoint, storeName: p.storeName }))} />
        : <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum fardo esperando coleta.</p>}
    </>
  );
}
