import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARCAS, iconeMarca, imagemMarca, logoMarca, monogramaMarca, type MarcaSlug } from "@/lib/marcas-visuais";
import { CabecalhoSobreHeroi } from "@/components/portal/superdrop/cabecalho-sobre-heroi";

/**
 * Peças institucionais das marcas (D152), alimentadas por `src/lib/marcas-visuais.ts`. Com kit de imagens: faixa da
 * imagem principal, recursos com ícones, capacidades com foto, prova e chamada final. Sem kit (`assetless`): a mesma
 * estrutura em composição de superfícies navy/off-white, tipografia e cor de assinatura, sem imagem inventada.
 * Todo texto fica em HTML; imagens decorativas com alt vazio.
 */
const acc = (slug: MarcaSlug) => ({ "--mk": MARCAS[slug].accent } as React.CSSProperties);
const btn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

function Foto({ slug, nome, alt, ratio, priority = false, className }: { slug: MarcaSlug; nome: string; alt: string; ratio: string; priority?: boolean; className?: string }) {
  return (
    <picture className={cn("block overflow-hidden rounded-[var(--ds-r-public-card,1.25rem)] bg-[#101B34]", className)} style={{ aspectRatio: ratio }}>
      <source media="(max-width: 767px)" srcSet={imagemMarca(slug, nome, 800)} type="image/webp" />
      <img src={imagemMarca(slug, nome)} alt={alt} width={1600} height={900} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className="size-full object-cover" />
    </picture>
  );
}

/** Logo do kit (sem filtro nem recorte). `escura` = letras claras, para fundo escuro. */
export function LogoMarca({ slug, tom, tier, className, alt }: { slug: MarcaSlug; tom: "clara" | "escura"; tier?: "club-plus" | "club-total"; className?: string; alt?: string }) {
  const m = MARCAS[slug];
  // eslint-disable-next-line @next/next/no-img-element -- WebP estático
  return <img src={logoMarca(slug, tom, tier)} alt={alt ?? m.nome} width={640} height={Math.round(640 / m.logos.ratio)} className={cn("h-12 w-auto object-contain", className)} decoding="async" />;
}

/** Foto de fundo da abertura: imagem do kit do grupo (`public/marcas/nextlevel/imagens`), escolhida pela página. */
export type FotoAbertura = { nome: string; alt: string; posicao?: string };

/**
 * Abertura das marcas do grupo (site do grupo v1, D157): superfície navy que se funde ao cabeçalho
 * (`data-heroi-escuro="nextlevel"`), logo, título e chamadas. Com `foto`, a imagem ocupa a direita no computador
 * (com véu navy por cima) e o topo no celular; sem foto, monograma e faixas em CSS.
 */
export function AberturaMarca({ slug, eyebrow, ctas, titulo, texto, foto, children }: { slug: MarcaSlug; eyebrow?: string; ctas: { href: string; label: string; primary?: boolean; externo?: boolean }[]; titulo?: React.ReactNode; texto?: string; foto?: FotoAbertura; children?: React.ReactNode }) {
  const m = MARCAS[slug];
  const b = foto ? imagemMarca("nextlevel", foto.nome).replace(/-1600\.webp$/, "") : null;
  return (
    <section id="inicio" data-heroi-escuro="nextlevel" className="relative isolate overflow-hidden bg-[#101B34] text-[#F4F1E9]" style={acc(slug)}>
      {foto && b ? (
        <div className="relative aspect-[16/10] w-full md:absolute md:inset-y-0 md:right-0 md:aspect-auto md:w-[62%]">
          {/* eslint-disable-next-line @next/next/no-img-element -- WebP estático com srcset próprio */}
          <img src={`${b}-1600.webp`} srcSet={`${b}-800.webp 800w, ${b}-1600.webp 1600w`} sizes="(min-width: 768px) 62vw, 100vw" alt={foto.alt} width={1600} height={900} loading="eager" fetchPriority="high" decoding="sync" className="size-full object-cover" style={{ objectPosition: foto.posicao ?? "50% 50%" }} />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#101B34] via-transparent to-transparent md:bg-[linear-gradient(90deg,#101B34_0%,rgba(16,27,52,0.6)_30%,transparent_65%)]" />
        </div>
      ) : (
        <>
          <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-full w-2/3 opacity-90" style={{ background: "repeating-linear-gradient(115deg, transparent 0 46px, color-mix(in srgb, var(--mk) 14%, transparent) 46px 50px)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--mk) 22%, transparent)" }} />
        </>
      )}
      <div className={cn("relative mx-auto grid max-w-6xl items-center gap-10 px-4", foto ? "pb-14 pt-2 md:py-28 lg:py-32" : "py-16 md:grid-cols-[1.4fr_1fr] md:py-24")}>
        <div className={foto ? "max-w-xl" : undefined}>
          {m.logos.escura ? <LogoMarca slug={slug} tom="escura" className="mb-7 h-12 md:h-14" /> : null}
          {eyebrow ? <p className=" text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--mk)" }}>{eyebrow}</p> : null}
          <h1 className="nl-display mt-3 max-w-3xl text-[#F4F1E9]">{titulo ?? m.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#F4F1E9]/85">{texto ?? m.apoio}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {ctas.map((c) => {
              const cls = cn(btn, c.primary ? "text-[#101B34] hover:brightness-110 focus-visible:outline-[#F4F1E9]" : "border border-[#F4F1E9]/35 hover:bg-[#F4F1E9]/10 focus-visible:outline-[#F4F1E9]");
              const conteudo = <>{c.label}{c.primary ? <ArrowRight className="size-5" aria-hidden /> : null}</>;
              return c.externo || c.href.startsWith("#")
                ? <a key={c.href + c.label} href={c.href} target={c.externo ? "_blank" : undefined} rel={c.externo ? "noreferrer" : undefined} className={cls} style={c.primary ? { background: "var(--mk)" } : undefined}>{conteudo}</a>
                : <Link key={c.href + c.label} href={c.href} className={cls} style={c.primary ? { background: "var(--mk)" } : undefined}>{conteudo}</Link>;
            })}
          </div>
          {children}
        </div>
        {!foto && m.logos.monograma ? (
          <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-xs place-items-center rounded-[2rem] border border-[#F4F1E9]/15 bg-[#F4F1E9]/5 md:grid">
            {/* eslint-disable-next-line @next/next/no-img-element -- WebP estático */}
            <img src={monogramaMarca(slug, "escuro")} alt="" width={256} height={256} className="w-2/3 object-contain" decoding="async" />
          </div>
        ) : null}
      </div>
      <CabecalhoSobreHeroi alvo="inicio" />
    </section>
  );
}

/** Logo da marca numa faixa (para páginas que já têm abertura própria). */
export function FaixaMarca({ slug }: { slug: MarcaSlug }) {
  const m = MARCAS[slug];
  return (
    <div className="border-b border-border bg-[#101B34]" style={acc(slug)}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5">
        <LogoMarca slug={slug} tom="escura" className="h-10" />
        <p className="text-sm font-semibold text-[#F4F1E9]/85 md:text-base">{m.headline}</p>
      </div>
    </div>
  );
}

/** Logo-assinatura dos níveis do Club, em cartão claro e escuro (subordinados ao Club). */
export function NivelClub({ tier, titulo, preco, itens }: { tier: "club-plus" | "club-total"; titulo: string; preco: string | null; itens: string[] }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-surface p-6" style={acc("nextlevel-club")}>
      <span className="nl-logo-light"><LogoMarca slug="nextlevel-club" tier={tier} tom="clara" alt={titulo} className="h-14" /></span>
      <span className="nl-logo-dark"><LogoMarca slug="nextlevel-club" tier={tier} tom="escura" alt={titulo} className="h-14" /></span>
      <p className="mt-4 text-2xl font-extrabold tabular-nums">{preco ?? "Em breve"}</p>
      <ul className="mt-4 space-y-2 text-sm">{itens.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--mk)" }} aria-hidden />{i}</li>)}</ul>
    </div>
  );
}

/** Depois da abertura: imagem principal (quando há kit), recursos e capacidades. */
export function VitrineMarca({ slug, titulo = "O que você encontra aqui", comFoto = true }: { slug: MarcaSlug; titulo?: string; comFoto?: boolean }) {
  const m = MARCAS[slug];
  return (
    <section className="bg-canvas py-16 md:py-20" style={acc(slug)} aria-labelledby={`vit-${slug}`}>
      <div className="mx-auto max-w-6xl px-4">
        {m.imagens && comFoto ? <Foto slug={slug} nome="hero-key-visual" alt={`${m.nome}: ${m.headline}`} ratio="16 / 9" priority className="mb-14 shadow-xl" /> : null}
        <h2 id={`vit-${slug}`} className="max-w-3xl font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight md:text-4xl">{titulo}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.icones.map((it, n) => (
            <li key={it.titulo} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
              {m.imagens && it.arquivo ? (
                // eslint-disable-next-line @next/next/no-img-element -- ícone decorativo do kit
                <img src={iconeMarca(slug, it.arquivo)} alt="" width={64} height={64} loading="lazy" decoding="async" className="size-14 shrink-0 object-contain" />
              ) : (
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-[#101B34]" style={{ background: "var(--mk)" }}>{n + 1}</span>
              )}
              <div><h3 className="font-bold">{it.titulo}</h3><p className="mt-1 text-sm text-muted-foreground">{it.texto}</p></div>
            </li>
          ))}
        </ul>
        {m.imagens ? (
          <div className="mt-16 grid gap-12">
            {m.capacidades.filter((c) => c.texto).map((c, i) => (
              <div key={c.titulo} className={cn("grid items-center gap-8 md:grid-cols-2", i % 2 ? "md:[&>*:first-child]:order-2" : "")}>
                <Foto slug={slug} nome={`capability-0${i + 1}`} alt={c.titulo} ratio="4 / 3" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "color-mix(in srgb, var(--mk) 70%, var(--color-foreground, #101B34))" }}>{m.nome}</p>
                  <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight md:text-3xl">{c.titulo}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{c.texto}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Sem kit de imagens: as duas capacidades em cartões de texto, sem bloco de imagem vazio.
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {m.capacidades.filter((c) => c.texto).map((c, i) => (
              <div key={c.titulo} className={cn("rounded-[1.25rem] p-6 md:p-8", i === 0 ? "bg-[#101B34] text-[#F4F1E9]" : "border border-border bg-surface")}>
                <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: i === 0 ? "var(--mk)" : "color-mix(in srgb, var(--mk) 70%, var(--color-foreground, #101B34))" }}>{m.nome}</p>
                <h3 className="mt-2 font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight md:text-3xl">{c.titulo}</h3>
                <p className={cn("mt-3 text-lg leading-relaxed", i === 0 ? "text-[#F4F1E9]/85" : "text-muted-foreground")}>{c.texto}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Fechamento: prova (sem números inventados) e chamada final. */
export function FechoMarca({ slug, cta }: { slug: MarcaSlug; cta: { href: string; label: string } }) {
  const m = MARCAS[slug];
  return (
    <section className="bg-canvas pb-20" style={acc(slug)}>
      <div className="mx-auto max-w-6xl px-4">
        {m.prova.pontos.length ? (
          <div className="grid items-center gap-8 rounded-[1.5rem] border border-border bg-surface p-6 md:grid-cols-2 md:p-10">
            {m.imagens ? <Foto slug={slug} nome="proof-editorial" alt={m.prova.titulo} ratio="3 / 2" /> : null}
            <div className={m.imagens ? "" : "md:col-span-2"}>
              <h2 className="font-[family-name:var(--nl-font-display)] text-2xl font-extrabold tracking-tight md:text-3xl">{m.prova.titulo}</h2>
              <ul className="mt-5 space-y-3">{m.prova.pontos.map((p) => <li key={p} className="flex gap-3 text-lg"><Check className="mt-1 size-5 shrink-0" style={{ color: "var(--mk)" }} aria-hidden />{p}</li>)}</ul>
            </div>
          </div>
        ) : null}
        <div className="relative mt-12 grid items-center gap-8 overflow-hidden rounded-[1.5rem] bg-[#101B34] p-8 text-[#F4F1E9] md:grid-cols-2 md:p-12">
          {!m.imagens ? <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "repeating-linear-gradient(115deg, transparent 0 46px, color-mix(in srgb, var(--mk) 14%, transparent) 46px 50px)" }} /> : null}
          <div className="relative">
            <h2 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight md:text-4xl">{m.cta.titulo}</h2>
            <p className="mt-3 text-lg text-[#F4F1E9]/80">{m.cta.texto}</p>
            <Link href={cta.href} className={cn(btn, "mt-6 text-[#101B34] focus-visible:outline-[#F4F1E9]")} style={{ background: "var(--mk)" }}>{cta.label}<ArrowRight className="size-5" aria-hidden /></Link>
          </div>
          {m.imagens ? <Foto slug={slug} nome="cta-moment" alt="" ratio="16 / 9" /> : m.logos.escura ? <div className="relative hidden justify-center md:flex"><LogoMarca slug={slug} tom="escura" alt="" className="h-20" /></div> : null}
        </div>
      </div>
    </section>
  );
}
