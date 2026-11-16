import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Megaphone, Rocket } from "lucide-react";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { anunciosDaLoja, ETAPAS_ANUNCIO, ROTULO_STATUS } from "@/lib/domain/anuncios";
import { novoAnuncioAction } from "@/app/actions/anuncios";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anúncios na Meta" };

const COMO = [
  { I: ClipboardList, t: "Diagnóstico", d: "Você responde umas perguntas sobre a loja, o público e a verba. Leva uns 5 minutos." },
  { I: FileText, t: "Proposta", d: "Um especialista analisa e manda a proposta aqui mesmo. Você aceita com um clique." },
  { I: Megaphone, t: "Montagem", d: "A equipe monta públicos, anúncios e textos na sua conta da Meta. Você acompanha cada passo." },
  { I: Rocket, t: "No ar", d: "Os números chegam aqui, e as vendas da loja vindas da campanha aparecem sozinhas." },
];

/** Anúncios na Meta com a equipe NextLevel (D299). */
export default async function AnunciosPage() {
  const s = await requireStoreAdmin();
  const lista = await anunciosDaLoja(await getDb(), s.actor);
  const abertas = lista.filter((a) => !["CANCELADA", "ENCERRADA"].includes(a.status));
  return (
    <>
      <PageHeader title="Anúncios no Instagram e Facebook" description="Campanhas na Meta montadas e acompanhadas pela equipe de anúncios da NextLevel, na sua conta de anúncios." actions={<form action={novoAnuncioAction}><button type="submit" className="ds-btn gap-1">{lista.some((a) => a.status === "RASCUNHO") ? "Continuar o diagnóstico" : "Nova campanha"}<ArrowRight className="size-4" aria-hidden /></button></form>} />
      {abertas.length ? (
        <section aria-labelledby="minhas-t" className="mb-8">
          <h2 id="minhas-t" className="mb-3 text-lg font-bold">Suas campanhas</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.map((a) => {
              const i = ETAPAS_ANUNCIO.findIndex((e) => e.status === a.status);
              return (
                <li key={a.id}>
                  <Link href={`/merchant/anuncios/${a.id}`} className="ds-card block hover:border-[var(--ds-primary)]">
                    <div className="flex flex-wrap items-center justify-between gap-2"><b className="min-w-0 break-words">{a.nome}</b><Badge tone={a.status === "NO_AR" ? "success" : a.status === "RASCUNHO" ? "warning" : "info"} dot>{ROTULO_STATUS[a.status]}</Badge></div>
                    {i >= 0 ? <div className="mt-3 flex gap-1" aria-label={`Etapa ${i + 1} de ${ETAPAS_ANUNCIO.length}`} role="img">{ETAPAS_ANUNCIO.map((e, n) => <span key={e.status} className={`h-1.5 flex-1 rounded-full ${n <= i ? "bg-[color:var(--ds-primary)]" : "bg-surface-muted"}`} />)}</div> : null}
                    <p className="mt-2 text-sm text-muted-foreground">{a.status === "RASCUNHO" ? "Termine o diagnóstico para a equipe começar." : `${a.pendencias.filter((p) => p.quem === "LOJISTA" && !p.feitoEm).length} passo(s) seu(s) em aberto · atualizada em ${formatDate(a.updatedAt)}`}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="como-t">
        <h2 id="como-t" className="mb-3 text-lg font-bold">Como funciona</h2>
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COMO.map((c, i) => <li key={c.t} className="ds-card"><span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><c.I className="size-4 text-link" aria-hidden />Passo {i + 1}</span><p className="mt-1 font-bold">{c.t}</p><p className="mt-1 text-sm text-muted-foreground">{c.d}</p></li>)}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">O diagnóstico é grátis. A taxa de gestão vem na proposta, e a verba dos anúncios vai direto para a Meta, na sua conta. Resultado de anúncio não é garantido: depende do produto, do preço e da concorrência.</p>
        {!lista.length ? <form action={novoAnuncioAction} className="mt-5"><button type="submit" className="ds-btn gap-1">Começar o diagnóstico<ArrowRight className="size-4" aria-hidden /></button></form> : null}
      </section>
    </>
  );
}
