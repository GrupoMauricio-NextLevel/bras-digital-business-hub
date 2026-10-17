import { ArrowRight, Check } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { CabecalhoSobreHeroi } from "@/components/portal/superdrop/cabecalho-sobre-heroi";
import { NL, NL_HEROI } from "@/lib/marcas/nextlevel";

/**
 * Herói institucional da marca-mãe (D161): marinho, assinatura Prisma Digital (logo escura), título, texto e botões em HTML,
 * e a peça 3D `02-metal-anodizado-sem-texto`, que deixa o lado direito livre. No computador a peça ocupa a área inteira com
 * o símbolo à esquerda e o texto à direita (véu marinho só sob o texto); no celular, o recorte quadrado com o símbolo
 * inteiro vem antes do texto, sem cortar o símbolo. A peça é decorativa (alt vazio): o nome da marca está na logo.
 */
export function HeroiNextLevel({ titulo, texto, ctas, pontos }: {
  titulo: React.ReactNode; texto: string; ctas: { href: string; label: string; primary?: boolean }[]; pontos: string[];
}) {
  return (
    <section id="inicio" data-heroi-escuro="nextlevel" aria-labelledby="nl-h1" className="nl-heroi relative isolate overflow-hidden bg-[var(--nlg-marinho)] text-[var(--nlg-gelo)]">
      <picture className="pointer-events-none mx-auto block w-full max-w-[26rem] px-4 pt-4 md:absolute md:inset-0 md:max-w-none md:p-0">
        <source media="(min-width: 768px)" type="image/avif" srcSet={`${NL_HEROI.base}-800.avif 800w, ${NL_HEROI.base}-1600.avif 1600w`} sizes="100vw" />
        <source media="(min-width: 768px)" type="image/webp" srcSet={`${NL_HEROI.base}-800.webp 800w, ${NL_HEROI.base}-1600.webp 1600w`} sizes="100vw" />
        { }
        <img src={NL_HEROI.mobile} alt="" width={800} height={800} fetchPriority="high" decoding="async"
          className="aspect-square w-full rounded-[1.5rem] object-cover md:aspect-auto md:h-full md:rounded-none md:object-[22%_50%] lg:object-[0%_50%]" />
      </picture>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] bg-[linear-gradient(270deg,var(--nlg-marinho)_0%,var(--nlg-marinho)_45%,color-mix(in_srgb,var(--nlg-marinho)_55%,transparent)_75%,transparent_100%)] md:block" />
      <div className="relative mx-auto grid max-w-6xl px-4 pb-14 pt-8 md:min-h-[42rem] md:grid-cols-[1fr_minmax(0,34rem)] md:items-center md:py-24">
        <div className="md:col-start-2">
          <BrandLogo brand={{ code: NL.code, name: `${NL.name}, ${NL.supportLine.toLowerCase()}` }} tone="on-dark" variant="prisma" className="h-16 sm:h-20" priority />
          <h1 id="nl-h1" className="nl-display mt-8 text-white">{titulo}</h1>
          <div aria-hidden className="mt-6 h-1 w-24 rounded-full" style={{ background: "var(--nlg-filete)" }} />
          <p className="mt-6 text-lg leading-relaxed text-[var(--nlg-texto-suave)] md:text-xl">{texto}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {ctas.map((c) => (
              <a key={c.href} href={c.href} className={c.primary
                ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--nlg-royal)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--nlg-acao)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nlg-luminoso)]"
                : "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--nlg-gelo)]/35 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nlg-luminoso)]"}>
                {c.label}{c.primary ? <ArrowRight className="size-5" aria-hidden /> : null}
              </a>
            ))}
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--nlg-texto-suave)]">
            {pontos.map((t) => <li key={t} className="flex items-center gap-2"><Check className="size-4 text-[var(--nlg-turquesa)]" aria-hidden />{t}</li>)}
          </ul>
        </div>
      </div>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--nlg-filete)" }} />
      <CabecalhoSobreHeroi alvo="inicio" />
    </section>
  );
}
