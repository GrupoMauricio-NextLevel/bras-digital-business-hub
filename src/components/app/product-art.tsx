/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Imagem de produto. Aceita URLs http(s) (upload real) ou o descritor
 * "art:<cor1>,<cor2>,<cor3>" (arte determinística usada no seed).
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
  const [c1 = "#111827", c2 = "#ffffff", c3 = "#9ca3af"] = descriptor.replace("art:", "").split(",");
  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-md bg-surface-muted", dims, className)}>
      <svg viewBox="0 0 120 120" className="h-[78%] w-[78%]" aria-hidden>
        <path d="M38 18 L52 12 Q60 22 68 12 L82 18 L104 30 L96 52 L84 46 L84 106 L36 106 L36 46 L24 52 L16 30 Z" fill={c1} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
        <path d="M52 12 Q60 22 68 12 Q60 30 52 12 Z" fill={c2} />
        <rect x="46" y="60" width="28" height="4" rx="2" fill={c2} opacity="0.85" />
        <rect x="46" y="70" width="28" height="4" rx="2" fill={c2} opacity="0.85" />
        <circle cx="72" cy="40" r="5" fill={c3} />
        <path d="M16 30 L24 52 L36 46 L36 40 L28 26 Z" fill={c3} opacity="0.35" />
        <path d="M104 30 L96 52 L84 46 L84 40 L92 26 Z" fill={c3} opacity="0.35" />
      </svg>
    </div>
  );
}
