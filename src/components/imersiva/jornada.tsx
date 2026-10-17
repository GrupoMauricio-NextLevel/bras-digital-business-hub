"use client";
import * as React from "react";
import { ArrowRight } from "lucide-react";
import { ImmersiveScroll } from "@/components/movimento/movimento";
import { maiorDe, srcSetDe, type Acervo } from "@/lib/imersiva/acervo";
import { FotoImersiva } from "./foto";
import "./imersiva.css";

export type PassoMarca<N extends string = string> = { key: string; nome: string; titulo: string; texto: string; links: { label: string; href: string }[]; foto: N; retrato: N };

/**
 * Jornada imersiva de marca (D162 Soluções, D165 E-commerce; peça única para todas as marcas): o mesmo lugar em cinco
 * momentos. A seção fica presa na tela e a rolagem troca a foto e o texto (`ImmersiveScroll`). Computador: foto emoldurada à
 * esquerda e texto à direita; celular e tablet em pé: foto em pé ao fundo e texto em cima. Régua com os passos (botões; o
 * leitor de tela ouve o passo só quando a pessoa usa a régua). Sem JavaScript ou com menos movimento: passos em sequência,
 * parados, cada um com a sua foto. As cores vêm da classe `.im-tema-<marca>` de quem envolve a página.
 */
export function JornadaMarca<N extends string>({ acervo, passos, eyebrow, titulo, rotulo }: { acervo: Acervo<N>; passos: PassoMarca<N>[]; eyebrow: string; titulo: string; /** Nome da seção para o leitor de tela. */ rotulo: string }) {
  const n = passos.length;
  const ref = React.useRef<HTMLDivElement>(null);
  const [passo, setPasso] = React.useState(0);
  const [anuncio, setAnuncio] = React.useState("");
  const ir = (k: number) => {
    const el = ref.current?.querySelector<HTMLElement>("[data-immersive]");
    if (!el || el.dataset.immersive !== "on") { document.getElementById(`passo-${passos[k]!.key}`)?.scrollIntoView({ behavior: "smooth" }); return; }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (run * (k + 0.5)) / n, behavior: "smooth" });
    setAnuncio(`Passo ${k + 1} de ${n}: ${passos[k]!.nome}`);
  };
  return (
    <div ref={ref} className="im-jor" id="jornada">
      <ImmersiveScroll steps={n} onStep={(s) => setPasso(s)} aria-label={rotulo} className="im-jor-scroll" style={{ ["--n" as string]: n }}>
        <div className="im-jor-palco">
          <div className="im-jor-quadros" aria-hidden>
            {passos.map((p, k) => (
              <picture key={p.key} className="im-jor-quadro" style={{ backgroundColor: acervo.fotos[p.foto].cor }}>
                <source media="(max-width: 1023px)" type="image/avif" srcSet={srcSetDe(acervo, p.retrato, "avif")} sizes="100vw" />
                <source media="(max-width: 1023px)" type="image/webp" srcSet={srcSetDe(acervo, p.retrato, "webp")} sizes="100vw" />
                <source type="image/avif" srcSet={srcSetDe(acervo, p.foto, "avif")} sizes="100vw" />
                <img src={maiorDe(acervo, p.foto)} srcSet={srcSetDe(acervo, p.foto, "webp")} sizes="100vw" alt="" width={acervo.fotos[p.foto].w} height={acervo.fotos[p.foto].h} loading="lazy" fetchPriority={k === 0 ? "auto" : "low"} decoding="async" />
              </picture>
            ))}
          </div>
          <div className="im-jor-veu" aria-hidden />
          <div className="im-jor-conteudo">
            <div className="im-jor-cabeca">
              <p className="im-eyebrow">{eyebrow}</p>
              <h2 className="im-jor-h2">{titulo}</h2>
            </div>
            <div className="im-jor-passos">
              {passos.map((p, k) => (
                <article key={p.key} id={`passo-${p.key}`} className="im-jor-passo" aria-current={passo === k ? "step" : undefined}>
                  <FotoImersiva acervo={acervo} nome={p.foto} retrato={p.retrato} alt="" sizes="(min-width: 768px) 34rem, 100vw" className="im-jor-estatica" />
                  <p className="im-jor-num"><span>{String(k + 1).padStart(2, "0")}</span> {p.nome}</p>
                  <h3 className="im-jor-titulo">{p.titulo}</h3>
                  <p className="im-jor-texto">{p.texto}</p>
                  <ul className="im-jor-links">
                    {p.links.map((l) => <li key={l.href + l.label}><a href={l.href}>{l.label}<ArrowRight className="size-4 shrink-0" aria-hidden /></a></li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <nav className="im-jor-regua" aria-label="Passos da jornada">
            <ol>
              {passos.map((p, k) => (
                <li key={p.key}><button type="button" onClick={() => ir(k)} aria-current={passo === k ? "step" : undefined}><span className="im-jor-traco" aria-hidden /><span className="im-jor-rotulo">{p.nome}</span></button></li>
              ))}
            </ol>
          </nav>
          <p className="sr-only" aria-live="polite">{anuncio}</p>
        </div>
      </ImmersiveScroll>
    </div>
  );
}
