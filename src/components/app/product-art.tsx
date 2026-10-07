/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Imagem de produto. Aceita URLs http(s) (upload real) ou o descritor
 * "art:<cor1>,<cor2>,<cor3>[,<forma>]" (arte determinística usada no seed e nas demonstrações). Formas: camisa (padrão),
 * pote, caixa, cesto e frasco: ilustrações neutras para produtos sem foto, nunca uma foto aleatória.
 */
const ASSET = /^\/assets\/ast_[a-z0-9]+$/i;
const SRC_WIDTHS = [320, 640, 960];

/** `priority`: imagem principal da página (carrega primeiro, sem atraso). As demais carregam sob demanda. */
export function ProductArt({ images, className, size = "md", alt = "", priority = false }: { images: string[]; className?: string; size?: "sm" | "md" | "lg"; alt?: string; priority?: boolean }) {
  const dims = { sm: "size-10", md: "aspect-square w-full", lg: "aspect-[4/5] w-full" }[size];
  const url = images.find((i) => /^https?:\/\//.test(i) || i.startsWith("data:image") || i.startsWith("/"));
  if (url) {
    return (
      <div className={cn("overflow-hidden rounded-md bg-surface-muted", dims, className)}>
        <img
          src={ASSET.test(url) ? `${url}?w=640` : url}
          srcSet={ASSET.test(url) ? SRC_WIDTHS.map((w) => `${url}?w=${w} ${w}w`).join(", ") : undefined}
          sizes={ASSET.test(url) ? (size === "sm" ? "96px" : "(min-width: 1024px) 25vw, 50vw") : undefined}
          width={size === "lg" ? 800 : 800} height={size === "lg" ? 1000 : 800}
          alt={alt} className="h-full w-full object-cover" decoding="async"
          loading={priority ? "eager" : "lazy"} {...(priority ? { fetchPriority: "high" as const } : {})} />
      </div>
    );
  }
  const descriptor = images.find((i) => i.startsWith("art:")) ?? "art:#111827,#ffffff,#9ca3af";
  const [c1 = "#111827", c2 = "#ffffff", c3 = "#9ca3af", shape = "camisa"] = descriptor.replace("art:", "").split(",");
  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-md bg-surface-muted", dims, className)}>
      <svg viewBox="0 0 120 120" className="h-[78%] w-[78%]" aria-hidden>
        {shape === "pote" ? (<>
          <rect x="34" y="20" width="52" height="14" rx="4" fill={c3} />
          <rect x="30" y="34" width="60" height="70" rx="10" fill={c1} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <rect x="42" y="56" width="36" height="20" rx="3" fill={c2} opacity="0.9" />
        </>) : shape === "caixa" ? (<>
          <path d="M18 44 L60 26 L102 44 L60 62 Z" fill={c2} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <path d="M18 44 L60 62 L60 104 L18 86 Z" fill={c1} />
          <path d="M102 44 L60 62 L60 104 L102 86 Z" fill={c3} />
        </>) : shape === "cesto" ? (<>
          <path d="M42 40 Q60 14 78 40" fill="none" stroke={c3} strokeWidth="5" strokeLinecap="round" />
          <path d="M22 44 L98 44 L90 102 L30 102 Z" fill={c1} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          {[56, 68, 80, 92].map((y) => <path key={y} d={`M${24 + (y - 44) * 0.14} ${y} L${96 - (y - 44) * 0.14} ${y}`} stroke={c3} strokeWidth="2.5" opacity="0.6" />)}
        </>) : shape === "frasco" ? (<>
          <rect x="52" y="12" width="16" height="14" rx="3" fill={c3} />
          <path d="M48 26 L72 26 L76 38 Q90 42 90 56 L90 100 Q90 106 84 106 L36 106 Q30 106 30 100 L30 56 Q30 42 44 38 Z" fill={c1} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <rect x="40" y="62" width="40" height="22" rx="3" fill={c2} opacity="0.9" />
        </>) : (<>
          <path d="M38 18 L52 12 Q60 22 68 12 L82 18 L104 30 L96 52 L84 46 L84 106 L36 106 L36 46 L24 52 L16 30 Z" fill={c1} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <path d="M52 12 Q60 22 68 12 Q60 30 52 12 Z" fill={c2} />
          <rect x="46" y="60" width="28" height="4" rx="2" fill={c2} opacity="0.85" />
          <rect x="46" y="70" width="28" height="4" rx="2" fill={c2} opacity="0.85" />
          <circle cx="72" cy="40" r="5" fill={c3} />
          <path d="M16 30 L24 52 L36 46 L36 40 L28 26 Z" fill={c3} opacity="0.35" />
          <path d="M104 30 L96 52 L84 46 L84 40 L92 26 Z" fill={c3} opacity="0.35" />
        </>)}
      </svg>
    </div>
  );
}
