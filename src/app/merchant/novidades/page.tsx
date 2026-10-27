import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { brandOfStore } from "@/lib/store-brand";
import { novidadesDa } from "@/lib/domain/novidades";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** O que mudou no sistema (W0, D183), só o que vale para a marca da loja. */
export default async function NovidadesPage() {
  const session = await requireRole("STORE_OWNER");
  const marca = (await brandOfStore(await getDb(), session.store!)).code;
  const lista = novidadesDa(marca);
  return (
    <>
      <PageHeader title="O que mudou" description="As novidades do sistema, das mais novas para as mais antigas." />
      <ol className="max-w-2xl space-y-3">
        {lista.map((n) => (
          <li key={n.titulo} className="ds-card">
            <p className="text-xs text-muted-foreground">{formatDate(`${n.data}T12:00:00Z`)}</p>
            <h2 className="mt-1 font-semibold">{n.titulo}</h2>
            <p className="mt-1 text-sm text-body">{n.texto}</p>
            {n.href ? <Link href={n.href} className="mt-2 inline-block text-sm font-medium underline underline-offset-2">Ver</Link> : null}
          </li>
        ))}
      </ol>
    </>
  );
}
