import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getMyBrasPickup } from "@/lib/domain/bras/retirada";
import { NotFoundError } from "@/lib/domain/errors";
import { PrintButton } from "@/components/portal/bras/print-button";

export const dynamic = "force-dynamic";

/** Comprovante de retirada (D103): o membro imprime ou manda ao motorista. Só o dono do pedido abre. */
export default async function Retirada({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const { id } = await params;
  let p;
  try { p = await getMyBrasPickup(await getDb(), session.actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const pago = p.status === "PAID" || p.status === "PICKED_UP";
  const texto = `Retirada Brás Digital Club · pedido ${p.number} · código ${p.pickupCode ?? "—"}\n${p.boxes} caixa(s) de ${p.productTitle}\nImportadora: ${p.importerName}${p.importerAddress ? `, ${p.importerAddress}` : ""}\nEnviar para: ${p.shipName}, ${p.shipAddress}, ${p.shipCity}/${p.shipState}, CEP ${p.shipZip}`;
  return (
    <article className="bd-comprovante mx-auto max-w-2xl pb-24 md:pb-0" aria-labelledby="ret-t">
      <p className="bd-no-print mb-4"><Link href="/meu-bras/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-link underline"><ArrowLeft className="size-4" aria-hidden />Meus pedidos</Link></p>
      <div className="ds-card p-6">
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--bd-acao)]">Brás Digital Club · comprovante de retirada</p>
        <h1 id="ret-t" className="mt-1 text-2xl font-bold">Pedido {p.number}</h1>
        <p className="mt-4 text-sm text-muted-foreground">Código de retirada</p>
        <p className="font-mono text-5xl font-extrabold tracking-widest">{p.pickupCode ?? "—"}</p>
        {!pago ? <p role="note" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">Retirada liberada depois do pagamento combinado com a equipe.</p> : null}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Produto</dt><dd className="font-semibold">{p.boxes} caixa(s) de {p.productTitle}</dd><dd className="text-sm">{p.unitsPerBox} unidades por caixa</dd></div>
          <div><dt className="text-xs text-muted-foreground">Retirar na importadora</dt><dd className="font-semibold">{p.importerName}</dd><dd className="text-sm">{p.importerAddress ?? "A equipe envia o endereço pelo WhatsApp."}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Transportadora</dt><dd className="font-semibold">{p.carrier}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Enviar para</dt><dd className="text-sm">{p.shipName}<br />{p.shipAddress}<br />{p.shipCity}/{p.shipState} · CEP {p.shipZip}</dd></div>
        </dl>
        <p className="mt-6 text-sm">O motorista apresenta o código <b>{p.pickupCode}</b> na importadora e confere a quantidade de caixas na retirada. Qualquer ocorrência, fale com a equipe do Brás Digital Club.</p>
      </div>
      <div className="bd-no-print mt-4 flex flex-wrap gap-3">
        <PrintButton />
        <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="ds-btn ds-btn--secondary">Mandar ao motorista pelo WhatsApp</a>
      </div>
    </article>
  );
}
