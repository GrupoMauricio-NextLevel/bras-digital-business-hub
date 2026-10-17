import Link from "next/link";
import { H2 } from "@/components/portal/commerce/sections";
import { MockWindow } from "@/components/portal/mock-window";

/**
 * Bloco de prova da home da NextLevel E-commerce: lojas de demonstração montadas no próprio sistema. A home em si é a
 * imersiva (`commerce/imersiva/home-imersiva.tsx`, D165); a home anterior (v2) saiu do código e fica no histórico do git.
 */
/** Lojas de demonstração fotografadas do próprio sistema (mesmas capturas da home SuperDrop v4). */
const LOJAS = [
  { arquivo: "loja-1", nome: "Trama Urbana", segmento: "moda", tema: "atelier", temaNome: "Atelier" },
  { arquivo: "loja-2", nome: "Linha de Jogo", segmento: "esporte", tema: "podio", temaNome: "Pódio" },
  { arquivo: "loja-3", nome: "Casa em Ordem", segmento: "casa", tema: "varanda", temaNome: "Varanda" },
] as const;

/** Prova: lojas de demonstração montadas no próprio sistema. */
export function LojasExemplo({ cta, className }: { cta: string; className?: string }) {
  return (
    <section id="exemplos" aria-labelledby="exemplos-t" className={className}>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-link">Lojas de exemplo</p>
        <h2 id="exemplos-t" className={`${H2} mt-3 max-w-2xl text-foreground`}>Lojas de verdade, montadas aqui.</h2>
        <p className="mt-4 max-w-2xl text-lg text-body">Moda, esporte e casa, com temas que você pode usar hoje. Produtos e preços de demonstração.</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {LOJAS.map((l) => (
            <li key={l.arquivo}>
              <Link href={`/temas/${l.tema}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <MockWindow title={`Loja de demonstração · tema ${l.temaNome}`} className="transition group-hover:-translate-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- captura estática da loja */}
                  <img src={`/portal/commerce/v4/${l.arquivo}.webp`} alt={`Página inicial da loja de demonstração ${l.nome}`} width={1200} height={662} loading="lazy" decoding="async" className="block aspect-[16/10] w-full object-cover object-top" />
                </MockWindow>
                <p className="mt-3 font-semibold text-foreground">{l.nome} <span className="font-normal text-muted-foreground">· {l.segmento}, tema {l.temaNome}</span></p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8"><Link href={cta} className="font-semibold text-link underline underline-offset-4">Quero uma loja assim →</Link></p>
      </div>
    </section>
  );
}
