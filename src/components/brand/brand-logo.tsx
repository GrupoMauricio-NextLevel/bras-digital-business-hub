import { cn } from "@/lib/utils";

/**
 * Logos oficiais do kit v1 com a cor de assinatura de cada marca no raio (sistema de cores v2, decisão D79).
 * Arquivos em /public/brand/v2/<marca>/{claro,escuro}/{assinatura-completa,compacta,monograma}.svg.
 * Marcas sem logo oficial (Brás Digital, China Hub) aparecem só com o nome em texto: nenhuma logo é inventada.
 */
const OFICIAIS: Record<string, { id: string; sufixo?: string; ratio: { compacta: number; "assinatura-completa": number; monograma: number } }> = {
  NEXTLEVEL: { id: "nextlevel", ratio: { compacta: 1296 / 384, "assinatura-completa": 1296 / 446, monograma: 371 / 253 } },
  // A versão compacta da Commerce é "NextLevel" com o raio azul: o nome do produto vai ao lado em texto.
  NEXTLEVEL_COMMERCE: { id: "commerce", sufixo: "Commerce", ratio: { compacta: 1315 / 336, "assinatura-completa": 1315 / 381, monograma: 286 / 192 } },
  SUPERDROP: { id: "superdrop", ratio: { compacta: 1495 / 404, "assinatura-completa": 1495 / 404, monograma: 353 / 249 } },
  CREATORS_HUB: { id: "creators", ratio: { compacta: 1200 / 332, "assinatura-completa": 1200 / 381, monograma: 282 / 199 } },
};

export const logoOficial = (code: string | null | undefined) => OFICIAIS[code ?? ""] ?? null;

type Variante = "compacta" | "assinatura-completa" | "monograma";
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
  BRAS_DIGITAL: { src: "/marcas/bras-digital/logos/logo-clara-640.webp", ratio: 1774 / 887 },
};

export function BrandLogo({ brand, tone = "auto", variant = "compacta", className, priority = false }: Props) {
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
  const h = 64, w = Math.round(h * o.ratio[variant]);
  const img = (tema: "claro" | "escuro", extra: string, alt: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático pequeno
    <img src={`/brand/v2/${o.id}/${tema}/${variant}.svg`} width={w} height={h} alt={alt} className={cn("w-auto", className ?? "h-8", extra)} loading={priority ? "eager" : "lazy"} decoding="async" />
  );
  const imgs = tone === "on-dark" ? img("escuro", "", brand.name) : tone === "on-light" ? img("claro", "", brand.name) : <>{img("claro", "nl-logo-light", brand.name)}{img("escuro", "nl-logo-dark", "")}</>;
  if (!o.sufixo || variant !== "compacta") return imgs;
  return (
    <span className="inline-flex items-center gap-2">
      {imgs}
      <span className={cn("font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight", tone === "on-dark" ? "text-white" : "text-foreground")}>{o.sufixo}</span>
    </span>
  );
}

/** Favicons da marca do endereço (marcas sem logo oficial usam os do grupo). */
export function brandIcons(code: string | null | undefined) {
  const id = logoOficial(code)?.id ?? "nextlevel";
  // O raio amarelo do grupo some sobre o off-white: a marca do grupo usa o favicon escuro nos dois temas.
  const claro = id === "nextlevel" ? "escuro" : "claro";
  const base = `/brand/v2/${id}/favicons`;
  return {
    icon: [
      { url: `${base}/escuro/favicon.ico`, sizes: "any" },
      { url: `${base}/${claro}/favicon.svg`, type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: `${base}/escuro/favicon.svg`, type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    apple: `${base}/escuro/apple-touch-icon.png`,
  };
}
