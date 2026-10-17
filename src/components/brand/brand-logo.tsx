import { cn } from "@/lib/utils";
import { BDC, BDC_ICONES, BDC_LOGOS } from "@/lib/marcas/bras-digital-club";
import { NL, NL_ICONES, NL_LOGOS } from "@/lib/marcas/nextlevel";

/**
 * Logos oficiais do kit v1 com a cor de assinatura de cada marca no raio (sistema de cores v2, decisão D79).
 * Arquivos em /public/brand/v2/<marca>/{claro,escuro}/{assinatura-completa,compacta,monograma}.svg.
 * Brás Digital Club (D158) e a marca-mãe NextLevel v2 (D161) usam os PNG oficiais dos pacotes próprios (`PNG_OFICIAIS`); o SVG
 * antigo da NextLevel (raio amarelo, `/brand/v2/nextlevel/`) fica arquivado, sem uso. Marcas sem logo oficial (China Hub)
 * aparecem só com o nome em texto: nenhuma logo é inventada.
 */
const OFICIAIS: Record<string, { id: string; sufixo?: string; ratio: { compacta: number; "assinatura-completa": number; monograma: number } }> = {
  // A versão compacta da Commerce é "NextLevel" com o raio azul: o nome do produto vai ao lado em texto.
  NEXTLEVEL_COMMERCE: { id: "commerce", sufixo: "Commerce", ratio: { compacta: 1315 / 336, "assinatura-completa": 1315 / 381, monograma: 286 / 192 } },
  SUPERDROP: { id: "superdrop", ratio: { compacta: 1495 / 404, "assinatura-completa": 1495 / 404, monograma: 353 / 249 } },
  CREATORS_HUB: { id: "creators", ratio: { compacta: 1200 / 332, "assinatura-completa": 1200 / 381, monograma: 282 / 199 } },
};

export const logoOficial = (code: string | null | undefined) => OFICIAIS[code ?? ""] ?? null;

/**
 * `compacta`: assinatura horizontal (na NextLevel, só o nome, para cabeçalhos e rodapés); `assinatura-completa`: com a linha
 * de apoio ou o slogan; `prisma`: o acabamento de marca para áreas amplas (login, herói), onde existir (NextLevel); nas
 * outras marcas vale a assinatura completa. `monograma`: o símbolo.
 */
type Variante = "compacta" | "assinatura-completa" | "monograma" | "prisma";
type Props = {
  brand: { code?: string; name: string; wordmark?: string };
  /** `auto` acompanha o tema; `on-dark`/`on-light` fixam a versão para fundos que não mudam de cor. */
  tone?: "auto" | "on-dark" | "on-light";
  variant?: Variante;
  /** Altura via classe (ex.: `h-8`); a largura acompanha a proporção. */
  className?: string;
  priority?: boolean;
};

/**
 * Logos do pacote de marcas (D152) para marcas sem SVG oficial. Só a versão clara tem fundo transparente; a escura veio
 * com fundo sólido, então no tema escuro e sobre fundo escuro a marca aparece em texto (pendência registrada).
 */
const PNG_CLARA: Record<string, { src: string; ratio: number }> = {
  NEXTLEVEL_CARGAS: { src: "/marcas/nextlevel-cargas/logos/logo-clara-640.webp", ratio: 2172 / 724 },
};

type Arquivo = { src: string; src2x?: string; w: number; h: number };
/**
 * Logos oficiais em PNG/WebP com as duas versões transparentes (clara para fundo claro, escura com lettering off-white para
 * fundo escuro). A troca é de arquivo, nunca filtro de cor. `compacta` = assinatura horizontal; `assinatura-completa` = com slogan.
 * Altura mínima de leitura (`min-h-11`, 44 px: o lettering tem duas linhas): abaixo disso use o monograma.
 */
const PNG_OFICIAIS: Record<string, Partial<Record<Variante, { claro: Arquivo; escuro: Arquivo }>> & Record<"compacta" | "assinatura-completa" | "monograma", { claro: Arquivo; escuro: Arquivo }>> = {
  [BDC.code]: {
    compacta: { claro: BDC_LOGOS.clara, escuro: BDC_LOGOS.escura },
    "assinatura-completa": { claro: BDC_LOGOS.claraSlogan, escuro: BDC_LOGOS.escuraSlogan },
    monograma: { claro: BDC_LOGOS.monogramaClaro, escuro: BDC_LOGOS.monogramaEscuro },
  },
  // NextLevel v2 (D161): nome sem a linha de apoio em espaço pequeno (a linha some abaixo de ~240 px), versão de interface
  // (flat) com a linha de apoio em espaço médio, Prisma Digital em área ampla, monograma flat (vale nos dois fundos).
  [NL.code]: {
    compacta: { claro: NL_LOGOS.nomeClara, escuro: NL_LOGOS.nomeEscura },
    "assinatura-completa": { claro: NL_LOGOS.interfaceClara, escuro: NL_LOGOS.interfaceEscura },
    prisma: { claro: NL_LOGOS.prismaClara, escuro: NL_LOGOS.prismaEscura },
    monograma: { claro: NL_LOGOS.monograma, escuro: NL_LOGOS.monograma },
  },
};
export const temLogoPng = (code: string | null | undefined) => !!PNG_OFICIAIS[code ?? ""];

export function BrandLogo({ brand, tone = "auto", variant = "compacta", className, priority = false }: Props) {
  const oficial = PNG_OFICIAIS[brand.code ?? ""];
  if (oficial) {
    const v = oficial[variant] ?? oficial["assinatura-completa"];
    // Brás: lettering em duas linhas, 44 px de altura mínima. NextLevel: o nome lê bem a partir de 24 px de altura.
    const minimo = variant === "monograma" || brand.code === NL.code ? "" : "min-h-11";
    const img = (tema: "claro" | "escuro", extra: string, alt: string) => (
      // eslint-disable-next-line @next/next/no-img-element -- WebP estático com proporção do PNG oficial
      <img src={v[tema].src} srcSet={v[tema].src2x ? `${v[tema].src} 1x, ${v[tema].src2x} 2x` : undefined} width={Math.round((64 * v[tema].w) / v[tema].h)} height={64} alt={alt} className={cn("bdc-logo w-auto object-contain", className ?? "h-8", minimo, extra)} loading={priority ? "eager" : "lazy"} decoding="async" />
    );
    if (tone === "on-dark") return img("escuro", "", brand.name);
    if (tone === "on-light") return img("claro", "", brand.name);
    return <>{img("claro", "nl-logo-light", brand.name)}{img("escuro", "nl-logo-dark", "")}</>;
  }
  const png = PNG_CLARA[brand.code ?? ""];
  if (png && variant !== "monograma") {
    const texto = (extra: string) => <span className={cn("inline-flex items-center font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight", tone === "on-dark" ? "text-white" : "text-foreground", extra)}>{brand.name}</span>;
    // eslint-disable-next-line @next/next/no-img-element -- WebP estático
    const img = <img src={png.src} width={Math.round(64 * png.ratio)} height={64} alt={brand.name} className={cn("w-auto", className ?? "h-8", tone === "auto" ? "nl-logo-light" : "")} loading={priority ? "eager" : "lazy"} decoding="async" />;
    if (tone === "on-dark") return texto("");
    if (tone === "on-light") return img;
    return <>{img}{texto("nl-logo-dark")}</>;
  }
  const o = logoOficial(brand.code);
  if (!o) {
    return <span className={cn("inline-flex items-center font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight", tone === "on-dark" ? "text-white" : "text-foreground")}>{brand.name}</span>;
  }
  const sv: Exclude<Variante, "prisma"> = variant === "prisma" ? "assinatura-completa" : variant;
  const h = 64, w = Math.round(h * o.ratio[sv]);
  const img = (tema: "claro" | "escuro", extra: string, alt: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático pequeno
    <img src={`/brand/v2/${o.id}/${tema}/${sv}.svg`} width={w} height={h} alt={alt} className={cn("w-auto", className ?? "h-8", extra)} loading={priority ? "eager" : "lazy"} decoding="async" />
  );
  const imgs = tone === "on-dark" ? img("escuro", "", brand.name) : tone === "on-light" ? img("claro", "", brand.name) : <>{img("claro", "nl-logo-light", brand.name)}{img("escuro", "nl-logo-dark", "")}</>;
  if (!o.sufixo || sv !== "compacta") return imgs;
  return (
    <span className="inline-flex items-center gap-2">
      {imgs}
      <span className={cn("font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight", tone === "on-dark" ? "text-white" : "text-foreground")}>{o.sufixo}</span>
    </span>
  );
}

/** Favicons da marca do endereço. Marcas sem favicon próprio (China Hub, Cargas) usam os da marca-mãe NextLevel v2. */
export function brandIcons(code: string | null | undefined) {
  if (code === BDC.code) {
    return {
      icon: [{ url: BDC_ICONES.ico, sizes: "any" }, ...BDC_ICONES.png.map((p) => ({ ...p, type: "image/png" }))],
      apple: BDC_ICONES.apple,
    };
  }
  const o = logoOficial(code);
  if (!o) {
    return {
      icon: [{ url: NL_ICONES.ico, sizes: "any" }, ...NL_ICONES.png.map((p) => ({ ...p, type: "image/png" }))],
      apple: NL_ICONES.apple,
    };
  }
  const base = `/brand/v2/${o.id}/favicons`;
  return {
    icon: [
      { url: `${base}/escuro/favicon.ico`, sizes: "any" },
      { url: `${base}/claro/favicon.svg`, type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: `${base}/escuro/favicon.svg`, type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    apple: `${base}/escuro/apple-touch-icon.png`,
  };
}
