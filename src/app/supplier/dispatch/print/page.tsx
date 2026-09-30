import Link from "next/link";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listWaves } from "@/lib/domain/operations";
import { DispatchNav } from "@/components/dispatch/dispatch-nav";
import { EmptyState } from "@/components/app/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Printer } from "lucide-react";

export default async function PrintWavesPage() {
  const session = await requireRole(["SUPPLIER_ADMIN", "SUPPLIER_DISPATCH"]);
  const waves = await listWaves(await getDb(), session.actor, 30);
  return (
    <div className="nl-touch">
      <DispatchNav active="/supplier/dispatch/print" adm={session.user.role === "SUPPLIER_ADMIN"} />
      <p className="mb-4 text-base text-muted-foreground">Para criar uma onda, selecione os pedidos na fila de expedição e toque em “Criar onda e imprimir”. Aqui você reimprime ondas anteriores.</p>
      {waves.length === 0 ? <EmptyState icon={Printer} title="Nenhuma onda ainda" description="As ondas criadas aparecem aqui para reimpressão." action={<Link href="/supplier/dispatch" className="inline-flex h-12 items-center rounded-lg bg-accent px-5 font-semibold text-on-accent">Ir para a fila</Link>} /> : (
        <ul className="space-y-3">
          {waves.map(({ wave, n }) => (
            <li key={wave.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
              <div><div className="text-lg font-semibold">Onda {wave.number}</div><div className="text-sm text-muted-foreground">{n} pedido(s) · {formatDateTime(wave.createdAt)}</div></div>
              <div className="flex gap-2">
                <a href={`/api/labels/batch?wave=${wave.id}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-lg border border-border px-4 font-semibold hover:bg-surface-muted">Etiquetas (PDF)</a>
                <Link href={`/supplier/dispatch/wave/${wave.id}`} className="inline-flex h-12 items-center rounded-lg bg-accent px-4 font-semibold text-on-accent">Abrir onda</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
