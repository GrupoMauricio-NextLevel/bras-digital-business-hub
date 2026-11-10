import Link from "next/link";
import { FileText } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { contratosDaLoja } from "@/lib/domain/contratos";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratos" };

const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Contratos da loja com a NextLevel (D276). Só o dono da loja vê. */
export default async function ContratosLojaPage() {
  const session = await requireStoreAdmin();
  const lista = await contratosDaLoja(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Loja e ajustes" title="Contratos" description="Os contratos entre a sua loja e a NextLevel. Os que esperam o seu aceite aparecem primeiro." />
      <section className="ds-card p-5">
        {lista.length === 0 ? <EmptyState icon={FileText} title="Nenhum contrato" description="Quando a NextLevel enviar um contrato, ele aparece aqui e você recebe um aviso por e-mail." /> : (
          <ul className="divide-y">
            {lista.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="font-medium"><Link className="underline-offset-2 hover:underline" href={`/merchant/contratos/${c.id}`}>{c.numero}</Link> · {c.titulo}</p><p className="text-xs text-muted-foreground">Recebido em {quando(c.enviadoEm)}{c.aceitoEm ? ` · aceito em ${quando(c.aceitoEm)}` : ""}</p></div>
                {c.status === "ENVIADO" ? <Link href={`/merchant/contratos/${c.id}`} className="rounded-md bg-[#294cdc] px-3 py-2 text-sm font-semibold text-white">Ler e aceitar</Link> : <Badge tone="success">Assinado</Badge>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
