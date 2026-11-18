import Link from "next/link";
import { ArrowRight, Globe, Handshake, LayoutDashboard, Store } from "lucide-react";
import { FRENTES, pontes, type ChaveFrente, type Frente } from "@/lib/marcas/frentes";

const ICONES = { Store, Globe, LayoutDashboard, Handshake } as const;

/** Endereço da frente: Soluções mora no site do grupo (D149); as outras, na Commerce. */
export const hrefDaFrente = (f: Frente, solucoesHref: string, base = "") => (f.chave === "solucoes" ? solucoesHref : `${base}${f.href}`);

/**
 * Ponte entre as frentes (D336): no fim de cada página, as outras três, com o mesmo cartão. `atual = null` mostra as quatro
 * (home da Commerce: "Quatro portas, um painel").
 */
export function TambemDaNextLevel({ atual, solucoesHref, titulo, className = "bg-surface", base = "" }: { atual: ChaveFrente | null; solucoesHref: string; titulo?: string; className?: string; /** Endereço da Commerce quando a página está em outro site (Soluções no site do grupo). */ base?: string }) {
  const lista = atual ? pontes(atual) : Object.values(FRENTES);
  return (
    <section aria-labelledby={`tambem-${atual ?? "todas"}`} className={`px-4 py-14 md:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">Uma casa, quatro portas, um painel</p>
        <h2 id={`tambem-${atual ?? "todas"}`} className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{titulo ?? "Também da NextLevel"}</h2>
        <p className="mt-3 max-w-2xl text-body">Tudo se liga na mesma conta e no mesmo painel, o Meu negócio. Comece por uma porta e ligue as outras quando quiser.</p>
        <ul className={`mt-8 grid gap-4 sm:grid-cols-2 ${lista.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {lista.map((f) => {
            const Icone = ICONES[f.icone];
            return (
              <li key={f.chave} className="ec-cartao flex flex-col !p-6">
                <span className="ec-icone grid size-11 place-items-center rounded-xl"><Icone className="size-5" aria-hidden /></span>
                <h3 className="mt-4 text-lg font-semibold">{f.nome}</h3>
                <p className="mt-1 flex-1 text-sm text-body">{f.linha}</p>
                <Link href={hrefDaFrente(f, solucoesHref, base)} className="mt-5 inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4">
                  Conhecer {f.nome}<ArrowRight className="size-4" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
