import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { NL_HEROI, NL_PECAS_3D } from "@/lib/marcas/nextlevel";
import type { PortaKey, VitrineSolucoes } from "@/lib/solucoes/vitrine";
import { JornadaImersiva, type QuadroJornada } from "./jornada-imersiva";
import { BuscaSolucoes } from "./busca-solucoes";
import { BotaoSelecao } from "./selecao";
import "./solucoes.css";

/**
 * Seções da vitrine imersiva de Soluções (D162): jornada, portas, cardápio com busca, campanha da vez e temas. Fotos do
 * pacote de imagens (`public/portal/nextlevel/v4/solucoes`, ver MANIFESTO) quando existirem; até lá, as peças 3D da marca
 * e as fotos das famílias. Nenhum preço fixo aqui: tudo vem da projeção do catálogo (`projetarVitrine`).
 */
export const SOL_FOTOS = "/portal/nextlevel/v4/solucoes";
const foto = (nome: string) => (existsSync(join(process.cwd(), "public", `${SOL_FOTOS}/${nome}-1600.webp`)) ? `${SOL_FOTOS}/${nome}` : null);
const H2 = "font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl";

/** Títulos de cada fase (copy da vitrine); o objetivo vem da configuração da jornada no Master. */
const TITULO_FASE: Record<string, string> = {
  FUNDACAO: "Antes da primeira venda, a estrutura.",
  LANCAMENTO: "Loja no ar, vitrine pronta para vender.",
  AQUISICAO: "Gente certa chegando todos os dias.",
  OTIMIZACAO: "Vender mais para quem já conhece você.",
  ESCALA: "Uma operação que acompanha o crescimento.",
};
const NOME_FOTO_FASE = ["fundacao", "lancamento", "aquisicao", "otimizacao", "escala"];
const PECAS_RESERVA = [`${NL_PECAS_3D[0]!.replace("01-vidro-optico", "00-master-flat")}`, NL_PECAS_3D[0]!, NL_PECAS_3D[1]!, NL_PECAS_3D[2]!, NL_HEROI.base];
const FOTO_FAMILIA_V3: Record<string, string> = { COMMERCE_PLAN: "nl-familia-planos", MIGRACAO: "nl-familia-migracao", MARKETING: "nl-familia-marketing", WHITE_LABEL: "nl-familia-white-label", LOJA_PRONTA: "nl-familia-loja-pronta", CONSULTORIA: "nl-familia-consultoria", TEMA: "nl-familia-temas" };
const PORTA_FOTO: Record<PortaKey, string> = { COMECAR: "sol-porta-comecar", MIGRAR: "sol-porta-migrar", VENDER_MAIS: "sol-porta-vender-mais", PLATAFORMA: "sol-porta-minha-plataforma" };
const FAMILIA_FOTO: Record<string, string> = { COMMERCE_PLAN: "sol-familia-plataforma", SUPERDROP: "sol-familia-superdrop", LOJA_PRONTA: "sol-familia-loja-pronta", MIGRACAO: "sol-familia-migracao", MARKETING: "sol-familia-marketing", CONSULTORIA: "sol-familia-consultoria", WHITE_LABEL: "sol-familia-white-label" };

function Img({ base, alt = "", className, sizes = "(min-width: 768px) 50vw, 100vw", v3 }: { base: string; alt?: string; className?: string; sizes?: string; v3?: boolean }) {
  // Fotos novas (v4) têm 800/1600 em WebP; as das famílias (v3) têm um arquivo WebP só.
  // eslint-disable-next-line @next/next/no-img-element -- foto estática com versões próprias
  return v3 ? <img src={`${base}.webp`} alt={alt} width={1600} height={900} loading="lazy" decoding="async" className={className} />
    // eslint-disable-next-line @next/next/no-img-element -- foto estática com versões próprias
    : <img src={`${base}-1600.webp`} srcSet={`${base}-800.webp 800w, ${base}-1600.webp 1600w`} sizes={sizes} alt={alt} width={1600} height={900} loading="lazy" decoding="async" className={className} />;
}
function FotoFamilia({ familia, className }: { familia: string; className?: string }) {
  const nova = FAMILIA_FOTO[familia] ? foto(FAMILIA_FOTO[familia]!) : null;
  if (nova) return <Img base={nova} className={className} />;
  const v3 = FOTO_FAMILIA_V3[familia];
  if (v3) return <Img base={`/portal/nextlevel/v3/${v3}`} v3 className={className} />;
  return <Img base={NL_PECAS_3D[1]!} className={className} />;
}

export function VitrineSecoes({ v, porta, previa = false }: { v: VitrineSolucoes; porta: PortaKey | null; /** Prévia do Master (chave desligada): os filtros mantêm `previa=v2` no endereço. */ previa?: boolean }) {
  const qp = previa ? "previa=v2&" : "";
  const quadros: QuadroJornada[] = NOME_FOTO_FASE.slice(0, v.fases.length).map((n, k) => {
    const f = foto(`sol-jornada-${k + 1}-${n}`);
    return f ? { base: f, retrato: foto(`sol-jornada-${k + 1}-${n}-retrato`) ?? undefined, foto: true } : { base: PECAS_RESERVA[k]!, foto: false };
  });
  const fases = v.fases.map((f) => ({ key: f.key, nome: f.nome, titulo: TITULO_FASE[f.key] ?? f.objetivo, objetivo: f.objetivo, itens: f.itens.map((i) => ({ key: i.key, nome: i.nome, preco: i.preco.linha, href: `#sol-${i.slug}` })) }));
  const ativa = porta ? v.portas.find((p) => p.key === porta) ?? null : null;
  const familias = ativa ? v.familias.filter((f) => ativa.familias.includes(f.key)) : v.familias;
  return (
    <>
      <JornadaImersiva fases={fases} quadros={quadros} />

      {/* Portas: por onde começar (filtra o cardápio sem JavaScript, pelo endereço). */}
      <section aria-labelledby="portas-t" className="bg-canvas px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-link">Escolha o seu ponto de partida</p>
          <h2 id="portas-t" className={`${H2} mt-3 max-w-3xl`}>Por onde você quer começar?</h2>
          <ul className="mt-10 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {v.portas.map((p) => {
              const f = foto(PORTA_FOTO[p.key]);
              return (
                <li key={p.key}>
                  <Link href={`/solucoes?${qp}porta=${p.key}#cardapio`} scroll={false} aria-current={porta === p.key ? "true" : undefined} className="sol-porta">
                    {f ? <Img base={f} sizes="(min-width: 1024px) 25vw, 50vw" /> : <FotoFamilia familia={p.foto} />}
                    <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
                      <span className="font-[family-name:var(--nl-font-display)] text-2xl font-extrabold leading-tight tracking-tight text-white">{p.titulo}</span>
                      <span className="text-sm text-[var(--nlg-texto-suave)]">{p.texto}</span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-white">Ver soluções <ArrowRight className="size-4" aria-hidden /></span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Cardápio: barra fixa das famílias, busca por intenção e mosaico (uma peça grande e as demais) por família. */}
      <section id="cardapio" aria-labelledby="cardapio-t" className="scroll-mt-16 bg-surface px-4 pb-16 pt-14 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 id="cardapio-t" className={`${H2} max-w-3xl`}>O cardápio completo, com o preço na mesa.</h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">Preço publicado quando é fixo; proposta por escrito quando depende do seu cenário. Pix com desconto e cartão parcelado onde o produto permite.</p>
          <div className="mt-8"><BuscaSolucoes itens={v.busca} /></div>
          {ativa ? (
            <p className="mt-6 flex flex-wrap items-center gap-3 text-sm"><span className="rounded-full bg-[var(--ds-soft)] px-3 py-1.5 font-semibold text-foreground">Mostrando: {ativa.titulo}</span><Link href={`/solucoes${previa ? "?previa=v2" : ""}#cardapio`} scroll={false} className="font-semibold text-link underline underline-offset-4">Ver tudo</Link></p>
          ) : null}
        </div>
        <nav aria-label="Famílias de soluções" className="sol-familias mt-6 border-y border-border bg-[var(--ds-glass-solid)] px-4 backdrop-blur">
          <ul className="mx-auto max-w-6xl">
            {familias.map((f) => <li key={f.key}><a href={f.key === "TEMA" ? "#temas" : `#fam-${f.key}`}>{f.rotulo}</a></li>)}
          </ul>
        </nav>
        <div className="mx-auto mt-10 grid max-w-6xl gap-14">
          {familias.filter((f) => f.itens.length).map((f) => {
            const [primeiro, ...resto] = f.itens;
            return (
              <section key={f.key} id={`fam-${f.key}`} aria-labelledby={`fam-${f.key}-t`} className="scroll-mt-36">
                <div className="flex items-end justify-between gap-4"><h3 id={`fam-${f.key}-t`} className="font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight md:text-3xl">{f.rotulo}</h3></div>
                <div className="sol-filete mt-3 w-16" aria-hidden />
                <div className={`mt-6 grid gap-4 ${resto.length ? "lg:grid-cols-[1.15fr_1fr]" : ""}`}>
                  <article id={`sol-${primeiro!.slug}`} className="sol-item flex flex-col overflow-hidden rounded-[1.25rem] border border-border bg-surface md:flex-row lg:flex-col">
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--nlg-marinho)] md:w-1/2 lg:w-full"><FotoFamilia familia={f.key} className="size-full object-cover" /></div>
                    <ItemCorpo item={primeiro!} grande />
                  </article>
                  {resto.length ? (
                    <div className="grid content-start gap-4">
                      {resto.map((i) => <article key={i.key} id={`sol-${i.slug}`} className="sol-item rounded-[1.25rem] border border-border bg-surface"><ItemCorpo item={i} /></article>)}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      {/* Campanha da vez: só com oferta ativa no Master. */}
      {v.campanhas.length ? (
        <section aria-labelledby="campanha-t" className="bg-canvas px-4 py-14">
          <div className="mx-auto max-w-6xl">
            {v.campanhas.map((c) => {
              const f = foto("sol-campanha-commerce");
              return (
                <div key={c.key} className="ds-tema-escuro relative isolate grid min-h-[22rem] items-center overflow-hidden rounded-[1.5rem] bg-[var(--nlg-marinho)] p-8 text-[var(--nlg-gelo)] md:p-12">
                  <div aria-hidden className="absolute inset-0 -z-10"><Img base={f ?? NL_PECAS_3D[2]!} className="size-full object-cover object-right opacity-90" sizes="100vw" /><div className="absolute inset-0 bg-[linear-gradient(90deg,var(--nlg-marinho)_0%,color-mix(in_srgb,var(--nlg-marinho)_80%,transparent)_45%,transparent_85%)]" /></div>
                  <div className="max-w-xl">
                    <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--nlg-luminoso)]"><Sparkles className="size-4" aria-hidden />Condição da vez</p>
                    <h2 id="campanha-t" className="mt-3 font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight text-white md:text-4xl">{c.titulo}</h2>
                    <p className="mt-3 text-lg text-[var(--nlg-texto-suave)]">{c.texto}</p>
                    <a href={c.href} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--nlg-royal)] px-6 font-semibold text-white hover:bg-[var(--nlg-acao)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nlg-luminoso)]">{c.rotulo}<ArrowRight className="size-5" aria-hidden /></a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Temas em exposição: compra única, com loja de demonstração. */}
      <section id="temas" aria-labelledby="temas-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-link">Temas</p>
          <h2 id="temas-t" className={`${H2} mt-3 max-w-3xl`}>Temas que vendem pela primeira impressão.</h2>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">Compra única, sem mensalidade. Abra a loja de demonstração e navegue antes de comprar. Esta página usa a mesma tecnologia de movimento do tema Pódio.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {v.temas.slice(0, 6).map((t) => (
              <li key={t.key} id={`tema-${t.key}`} className="sol-item flex flex-col rounded-[1.25rem] border border-border bg-surface p-5">
                <span aria-hidden className="h-1.5 w-12 rounded-full" style={{ background: t.cor }} />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nível {t.nivel} · {t.nicho}</p>
                <h3 className="mt-1 text-xl font-bold">{t.nome}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{t.resumo}</p>
                <p className="mt-4 text-lg font-extrabold tabular-nums">{formatBRL(t.precoCents)}</p>
                <a href={t.demoHref} className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-link underline underline-offset-4">Ver a loja de demonstração<span className="sr-only"> do tema {t.nome}</span><ArrowRight className="size-4" aria-hidden /></a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function ItemCorpo({ item, grande = false }: { item: VitrineSolucoes["itens"][number]; grande?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col ${grande ? "p-6 md:p-7" : "p-5"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fase: {item.faseRotulo}</p>
      <h4 className={`mt-1 font-bold ${grande ? "text-2xl" : "text-lg"}`}>{item.nome}</h4>
      <p className="mt-1 text-muted-foreground">{item.resumo}</p>
      <p className="mt-3 text-lg font-extrabold tabular-nums">{item.preco.linha}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={item.contratar.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--ds-primary)] px-4 text-sm font-semibold text-[var(--ds-primary-contrast)] hover:bg-[var(--ds-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-ring)]">{item.contratar.rotulo}<span className="sr-only">: {item.nome}</span></a>
        <BotaoSelecao item={item} />
        {item.contratar.href !== item.detalheHref ? <a href={item.detalheHref} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link underline underline-offset-4">Detalhes<span className="sr-only"> de {item.nome}</span></a> : null}
      </div>
    </div>
  );
}
