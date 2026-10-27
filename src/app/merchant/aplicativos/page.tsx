import Link from "next/link";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/app/page-header";
import { requireIndependent } from "@/lib/require-independent";
import { getDb } from "@/db/client";
import { storeRedirects } from "@/db/schema";
import { aplicativosDaLoja, type App } from "@/lib/domain/aplicativos";

export const dynamic = "force-dynamic";

const SELO: Record<App["estado"], { texto: string; cls: string }> = {
  ligado: { texto: "Ligado", cls: "bg-success-soft text-success" },
  desligado: { texto: "Desligado", cls: "bg-surface-muted text-muted-foreground" },
  "em-breve": { texto: "Em breve", cls: "bg-surface-muted text-muted-foreground" },
};

/** Central de aplicativos (W5, D188): tudo o que a loja tem, ligado ou não, e onde configurar. */
export default async function AplicativosPage() {
  const { session } = await requireIndependent();
  const db = await getDb();
  const redir = await db.select({ n: storeRedirects.fromPath }).from(storeRedirects).where(eq(storeRedirects.storeId, session.store!.id)).limit(1);
  const apps = aplicativosDaLoja(session.store!, { redirecionamentos: redir.length });
  const grupos = [...new Set(apps.map((a) => a.categoria))];
  return (
    <>
      <PageHeader title="Aplicativos" description="O que a sua loja já tem, o que está ligado e onde configurar. O que ainda está em construção aparece como em breve." />
      <div className="space-y-8">
        {grupos.map((g) => (
          <section key={g} aria-labelledby={`app-${g}`}>
            <h2 id={`app-${g}`} className="mb-3 text-base font-semibold">{g}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {apps.filter((a) => a.categoria === g).map((a) => (
                <li key={a.key} className="ds-card flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2"><span className="font-semibold">{a.nome}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SELO[a.estado].cls}`}>{SELO[a.estado].texto}</span></div>
                  <p className="text-sm text-muted-foreground">{a.descricao}</p>
                  {a.href ? <Link href={a.href} className="mt-auto text-sm font-semibold underline underline-offset-2">{a.estado === "desligado" ? "Ligar" : "Configurar"}<span className="sr-only"> {a.nome}</span></Link> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
