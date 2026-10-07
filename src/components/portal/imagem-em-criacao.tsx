import { existsSync } from "node:fs";
import { join } from "node:path";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/auth";

/**
 * Espaço reservado para uma foto de direção de arte das páginas públicas.
 * Quando o arquivo existe em /public/portal/<marca>/v3/<nome>.(avif|webp|png), a foto aparece sozinha;
 * enquanto não existe, mostra um quadro discreto "Imagem em criação" com a MESMA proporção (sem salto de layout).
 * A lista de imagens esperadas fica em public/portal/<marca>/v3/MANIFESTO.md (prompt: docs/prompts/imagens-paginas-publicas-gpt.md).
 */
export function ImagemEmCriacao({ marca, nome, alt, ratio = "16 / 9", className, priority = false, sizes = "(min-width: 1024px) 50vw, 100vw" }: { marca: "superdrop" | "commerce"; nome: string; alt: string; ratio?: string; className?: string; priority?: boolean; sizes?: string }) {
  const base = `/portal/${marca}/v3/${nome}`;
  const has = (ext: string) => existsSync(join(process.cwd(), "public", `${base}.${ext}`));
  const avif = has("avif"), webp = has("webp"), png = has("png");
  if (avif || webp || png) {
    return (
      <picture className={cn("block overflow-hidden rounded-[var(--ds-r-public-card)]", className)} style={{ aspectRatio: ratio }}>
        {avif ? <source srcSet={`${base}.avif`} type="image/avif" /> : null}
        {webp ? <source srcSet={`${base}.webp`} type="image/webp" /> : null}
        <img src={`${base}.${png ? "png" : webp ? "webp" : "avif"}`} alt={alt} sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className="size-full object-cover" />
      </picture>
    );
  }
  return (
    <figure role="img" aria-label={`${alt} (imagem em criação)`} className={cn("ds-img-slot", className)} style={{ aspectRatio: ratio }}>
      <span className="ds-img-slot-in"><ImageIcon className="size-6" aria-hidden /><span>Imagem em criação</span>{isDemoMode() ? <code>{nome}</code> : null}</span>
    </figure>
  );
}
