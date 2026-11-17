import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getDb } from "@/db/client";
import { AreaTheme } from "@/design-system/components/area-theme";
import { NotFoundError } from "@/lib/domain/errors";
import { agenciasLigado } from "@/lib/agencias/acesso";
import { paginaDeCaptacao } from "@/lib/agencias/captacao";
import { PedirOrcamento } from "./formulario";

export const dynamic = "force-dynamic";

async function dados(slug: string) {
  if (!agenciasLigado()) notFound();
  return paginaDeCaptacao(await getDb(), slug).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await dados((await params).slug);
  return { title: `Fale com a ${p.nome}`, description: p.texto || p.titulo };
}

/** Página de captação da agência (D322): o site e as páginas de vendas da agência apontam para cá. */
export default async function Orcamento({ params }: { params: Promise<{ slug: string }> }) {
  const p = await dados((await params).slug);
  return (
    <>
      <AreaTheme theme="nextlevel" brand="NEXTLEVEL" />
      <main className="mx-auto min-h-screen max-w-[760px] space-y-5 bg-background px-4 py-6 sm:py-12">
        <header className="ds-hero ds-enter px-5 py-7 sm:px-10 sm:py-9">
          <div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">{p.nome}</p>
            <h1 className="mt-2 text-[clamp(1.6rem,4.5vw,2.5rem)] font-semibold leading-[1.08] tracking-[-.035em]">{p.titulo}</h1>
            {p.texto ? <p className="mt-3 max-w-[52ch] text-muted-foreground">{p.texto}</p> : null}
            {p.servicos.length ? <ul className="mt-4 flex flex-wrap gap-2" aria-label="Serviços">{p.servicos.map((s) => <li key={s} className="rounded-full border border-border bg-surface/70 px-3 py-1 text-sm">{s}</li>)}</ul> : null}
          </div>
        </header>
        <section className="ds-card p-5 sm:p-7" aria-label="Pedir contato">
          <PedirOrcamento slug={p.slug} servicos={p.servicos} />
        </section>
        {p.whatsapp ? <p className="text-center text-sm"><a href={`https://wa.me/${p.whatsapp.length >= 12 ? p.whatsapp : `55${p.whatsapp}`}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-link underline underline-offset-4"><MessageCircle className="size-4" aria-hidden />Prefere o WhatsApp? Fale direto</a></p> : null}
        <p className="pb-6 text-center text-xs text-muted-foreground">{p.nome} · com tecnologia NextLevel</p>
      </main>
    </>
  );
}
