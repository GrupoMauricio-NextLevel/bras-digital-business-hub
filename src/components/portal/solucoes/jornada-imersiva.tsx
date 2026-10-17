"use client";
import * as React from "react";
import { ArrowRight } from "lucide-react";
import { ImmersiveScroll } from "@/components/movimento/movimento";
import "./solucoes.css";

export type FaseJornada = { key: string; nome: string; titulo: string; objetivo: string; itens: { key: string; nome: string; preco: string; href: string }[] };
export type QuadroJornada = { base: string; retrato?: string; foto: boolean };

/**
 * Jornada imersiva (D162): o mesmo lugar em cinco momentos (fotos do lote 1; até lá, as peças 3D da marca). A seção fica
 * presa na tela e a rolagem troca o quadro, o título e as soluções da fase, como o destaque do tema Pódio. Régua com as
 * cinco fases (clique leva ao passo; o leitor de tela ouve a fase só quando a pessoa usa a régua). Sem JavaScript ou com
 * menos movimento: as cinco fases em sequência, paradas, com as soluções de cada uma.
 */
export function JornadaImersiva({ fases, quadros }: { fases: FaseJornada[]; quadros: QuadroJornada[] }) {
  const n = fases.length;
  const ref = React.useRef<HTMLDivElement>(null);
  const [passo, setPasso] = React.useState(0);
  const [anuncio, setAnuncio] = React.useState("");
  const ir = (k: number) => {
    const el = ref.current?.querySelector<HTMLElement>("[data-immersive]");
    if (!el || el.dataset.immersive !== "on") { document.getElementById(`fase-${fases[k]!.key}`)?.scrollIntoView({ behavior: "smooth" }); return; }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (run * (k + 0.5)) / n, behavior: "smooth" });
    setAnuncio(`Fase ${k + 1} de ${n}: ${fases[k]!.nome}`);
  };
  const img = (q: QuadroJornada, k: number, cls: string, prioridade = false) => (
    <picture key={k} className={cls}>
      {q.retrato ? <source media="(max-width: 767px)" srcSet={`${q.retrato}-800.webp`} type="image/webp" /> : null}
      <source srcSet={`${q.base}-800.avif 800w, ${q.base}-1600.avif 1600w`} sizes="100vw" type="image/avif" />
      { }
      <img src={`${q.base}-1600.webp`} srcSet={`${q.base}-800.webp 800w, ${q.base}-1600.webp 1600w`} sizes="100vw" alt="" width={1600} height={900} loading={prioridade ? "eager" : "lazy"} decoding="async" />
    </picture>
  );
  return (
    <div ref={ref} className="sol-jor" id="jornada">
      <ImmersiveScroll steps={n} onStep={(s) => setPasso(s)} aria-label="Jornada em cinco fases" className="sol-jor-scroll" style={{ ["--n" as string]: n }}>
        <div className="sol-jor-palco">
          <div className="sol-jor-quadros" aria-hidden>{quadros.map((q, k) => img(q, k, `sol-jor-quadro${q.foto ? "" : " sol-jor-quadro--peca"}`, k === 0))}</div>
          <div className="sol-jor-veu" aria-hidden />
          <div className="sol-jor-conteudo">
            <div className="sol-jor-cabeca">
              <p className="sol-eyebrow">Método NextLevel</p>
              <h2 className="sol-jor-h2">Seu negócio, fase por fase.</h2>
            </div>
            <div className="sol-jor-passos">
              {fases.map((f, k) => (
                <article key={f.key} id={`fase-${f.key}`} className="sol-jor-passo" data-k={k} aria-current={passo === k ? "step" : undefined}>
                  <p className="sol-jor-fase"><span>{String(k + 1).padStart(2, "0")}</span> {f.nome}</p>
                  <h3 className="sol-jor-titulo">{f.titulo}</h3>
                  <p className="sol-jor-objetivo">{f.objetivo}</p>
                  {f.itens.length ? (
                    <ul className="sol-jor-itens">
                      {f.itens.slice(0, 4).map((i) => <li key={i.key}><a href={i.href}><span>{i.nome}</span><em>{i.preco}</em><ArrowRight className="size-4 shrink-0" aria-hidden /></a></li>)}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
          <nav className="sol-jor-regua" aria-label="Fases da jornada">
            <ol>
              {fases.map((f, k) => (
                <li key={f.key}><button type="button" onClick={() => ir(k)} aria-current={passo === k ? "step" : undefined}><span className="sol-jor-traco" aria-hidden /><span className="sol-jor-rotulo">{f.nome}</span></button></li>
              ))}
            </ol>
          </nav>
          <p className="sr-only" aria-live="polite">{anuncio}</p>
        </div>
      </ImmersiveScroll>
    </div>
  );
}
