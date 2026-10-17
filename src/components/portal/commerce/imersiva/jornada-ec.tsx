"use client";
import * as React from "react";
import { ArrowRight } from "lucide-react";
import { ImmersiveScroll } from "@/components/movimento/movimento";
import { EC_HOME_BASE, EC_HOME_FOTOS, type EcFotoNome } from "@/lib/marcas/ecommerce-home-imagens";
import { FotoEc } from "./foto-ec";

export type PassoEc = { key: string; nome: string; titulo: string; texto: string; links: { label: string; href: string }[]; foto: EcFotoNome; retrato: EcFotoNome };

/**
 * Jornada "a loja que cresce" (home imersiva da E-commerce): o mesmo ateliê em cinco momentos. A seção fica presa na tela e
 * a rolagem troca a foto e o texto (mesmo motor da jornada de Soluções, `ImmersiveScroll`). Régua com os cinco passos
 * (botões; o leitor de tela ouve o passo só quando a pessoa usa a régua). Sem JavaScript ou com menos movimento: os cinco
 * passos em sequência, parados, cada um com a sua foto.
 */
export function JornadaEc({ passos }: { passos: PassoEc[] }) {
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
  const set = (nome: EcFotoNome, ext: string) => EC_HOME_FOTOS[nome].larguras.map((w) => `${EC_HOME_BASE}/${nome}-${w}.${ext} ${w}w`).join(", ");
  return (
    <div ref={ref} className="eci-jor" id="jornada">
      <ImmersiveScroll steps={n} onStep={(s) => setPasso(s)} aria-label="A loja que cresce, em cinco passos" className="eci-jor-scroll" style={{ ["--n" as string]: n }}>
        <div className="eci-jor-palco">
          <div className="eci-jor-quadros" aria-hidden>
            {passos.map((p, k) => (
              <picture key={p.key} className="eci-jor-quadro" style={{ backgroundColor: EC_HOME_FOTOS[p.foto].cor }}>
                <source media="(max-width: 1023px)" type="image/avif" srcSet={set(p.retrato, "avif")} sizes="100vw" />
                <source media="(max-width: 1023px)" type="image/webp" srcSet={set(p.retrato, "webp")} sizes="100vw" />
                <source type="image/avif" srcSet={set(p.foto, "avif")} sizes="100vw" />
                          <img src={`${EC_HOME_BASE}/${p.foto}-${EC_HOME_FOTOS[p.foto].larguras[1]}.webp`} srcSet={set(p.foto, "webp")} sizes="100vw" alt="" width={EC_HOME_FOTOS[p.foto].w} height={EC_HOME_FOTOS[p.foto].h} loading="lazy" fetchPriority={k === 0 ? "auto" : "low"} decoding="async" />
              </picture>
            ))}
          </div>
          <div className="eci-jor-veu" aria-hidden />
          <div className="eci-jor-conteudo">
            <div className="eci-jor-cabeca">
              <p className="eci-eyebrow">Como funciona</p>
              <h2 className="eci-jor-h2">Da primeira foto à rotina de pedidos.</h2>
            </div>
            <div className="eci-jor-passos">
              {passos.map((p, k) => (
                <article key={p.key} id={`passo-${p.key}`} className="eci-jor-passo" aria-current={passo === k ? "step" : undefined}>
                  <FotoEc nome={p.foto} retrato={p.retrato} alt="" sizes="(min-width: 768px) 34rem, 100vw" className="eci-jor-estatica" />
                  <p className="eci-jor-num"><span>{String(k + 1).padStart(2, "0")}</span> {p.nome}</p>
                  <h3 className="eci-jor-titulo">{p.titulo}</h3>
                  <p className="eci-jor-texto">{p.texto}</p>
                  <ul className="eci-jor-links">
                    {p.links.map((l) => <li key={l.href + l.label}><a href={l.href}>{l.label}<ArrowRight className="size-4 shrink-0" aria-hidden /></a></li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <nav className="eci-jor-regua" aria-label="Passos da jornada">
            <ol>
              {passos.map((p, k) => (
                <li key={p.key}><button type="button" onClick={() => ir(k)} aria-current={passo === k ? "step" : undefined}><span className="eci-jor-traco" aria-hidden /><span className="eci-jor-rotulo">{p.nome}</span></button></li>
              ))}
            </ol>
          </nav>
          <p className="sr-only" aria-live="polite">{anuncio}</p>
        </div>
      </ImmersiveScroll>
    </div>
  );
}
