import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { brasRomaneio, brasRomaneioText } from "@/lib/domain/bras/retirada";
import { NotFoundError } from "@/lib/domain/errors";
import { EmptyState } from "@/components/app/empty-state";
import { PrintButton } from "@/components/portal/bras/print-button";
import { CopyText } from "./copy-text";
import "@/components/portal/bras/bras.css";

export const dynamic = "force-dynamic";

/** Romaneio da importadora (D103): pedidos pagos para retirar, só com o envio e o código. Nada do membro. */
export default async function Romaneio({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const { id } = await params;
  let r;
  try { r = await brasRomaneio(await getDb(), session.actor, id); } catch (e) { if (e instanceof NotFoundError) notFound(); throw e; }
  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <article className="bd-comprovante" aria-labelledby="rom-t">
      <p className="bd-no-print mb-4"><Link href="/bras/importadoras" className="inline-flex items-center gap-1 text-sm font-semibold text-link underline"><ArrowLeft className="size-4" aria-hidden />Importadoras</Link></p>
      <h1 id="rom-t" className="text-2xl font-bold">Romaneio · {r.importer.name}</h1>
      <p className="text-sm text-muted-foreground">{hoje} · {r.lines.length} pedido(s) pago(s) para retirar{r.importer.pickupAddress ? ` · ${r.importer.pickupAddress}` : ""}</p>
      <p className="bd-no-print mt-2 text-sm">A importadora recebe só o que retirar e para onde enviar. Nome da empresa, CNPJ, telefone e e-mail do membro não aparecem aqui.</p>
      {r.lines.length === 0 ? <div className="mt-6"><EmptyState icon={PackageOpen} title="Nada para retirar" description="Quando você marcar um pedido desta importadora como pago, ele aparece aqui." /></div> : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Pedido</th><th>Código</th><th>Caixas</th><th>Produto</th><th>Transportadora</th><th>Enviar para</th></tr></thead>
              <tbody>{r.lines.map((l) => <tr key={l.number} className="border-t border-border align-top"><td className="py-2 tabular-nums">{l.number}</td><td className="font-mono font-bold">{l.pickupCode ?? "—"}</td><td className="tabular-nums">{l.boxes} × {l.unitsPerBox} un.</td><td>{l.productTitle}</td><td>{l.carrier}</td><td>{l.shipName}<br />{l.shipAddress}<br />{l.shipCity}/{l.shipState} · {l.shipZip}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="bd-no-print mt-6 flex flex-wrap gap-3"><PrintButton /><CopyText text={brasRomaneioText(r.importer.name, r.lines)} /></div>
        </>
      )}
    </article>
  );
}
