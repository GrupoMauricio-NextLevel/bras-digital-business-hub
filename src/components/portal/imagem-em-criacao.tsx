import { statSync } from "node:fs";
import { join } from "node:path";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/lib/auth";

export type Marca = "superdrop" | "commerce" | "bras" | "nextlevel";
const FORMATOS = ["avif", "webp", "png"] as const;
type Formato = (typeof FORMATOS)[number];

// Em produção os arquivos de /public não mudam: guarda a conferência por processo. Em desenvolvimento confere a cada vez.
const cache = new Map<string, Formato[]>();
/** Formatos disponíveis de uma imagem v3. Arquivo vazio (0 byte) não conta: o navegador escolheria o formato e mostraria imagem quebrada. */
export function formatosDisponiveis(marca: Marca, nome: string): Formato[] {
  const key = `${marca}/${nome}`;
  const hit = process.env.NODE_ENV === "production" ? cache.get(key) : undefined;
  if (hit) return hit;
  const found = FORMATOS.filter((ext) => {
    try { return statSync(join(process.cwd(), "public", "portal", marca, "v3", `${nome}.${ext}`)).size > 0; } catch { return false; }
  });
  cache.set(key, found);
  return found;
}

/** `<picture>` com AVIF e WebP e, por último, o formato mais compatível que existir. O navegador baixa só um deles. */
function Foto({ base, formatos, alt, priority, posicao, className, style }: { base: string; formatos: Formato[]; alt: string; priority: boolean; posicao: string; className?: string; style?: React.CSSProperties }) {
  const fallback = formatos.includes("png") ? "png" : formatos.includes("webp") ? "webp" : "avif";
  return (
    <picture className={className} style={style} data-img={base.split("/").pop()}>
      {formatos.includes("avif") && fallback !== "avif" ? <source srcSet={`${base}.avif`} type="image/avif" /> : null}
      {formatos.includes("webp") && fallback !== "webp" ? <source srcSet={`${base}.webp`} type="image/webp" /> : null}
      <img src={`${base}.${fallback}`} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className="size-full object-cover" style={{ objectPosition: posicao }} />
    </picture>
  );
}

/**
 * Foto de direção de arte das páginas públicas (/public/portal/<marca>/v3/<nome>.avif|webp|png).
 * Sem arquivo válido, mostra o quadro "Imagem em criação" com a MESMA proporção (sem salto de layout).
 * `posicao` é o ponto de foco (object-position) que mantém o assunto no recorte do celular.
 * Lista e cenas: public/portal/<marca>/v3/MANIFESTO.md.
 */
export function ImagemEmCriacao({ marca, nome, alt, ratio = "16 / 9", posicao = "50% 50%", className, priority = false }: { marca: Marca; nome: string; alt: string; ratio?: string; posicao?: string; className?: string; priority?: boolean }) {
  const formatos = formatosDisponiveis(marca, nome);
  if (formatos.length) {
    return <Foto base={`/portal/${marca}/v3/${nome}`} formatos={formatos} alt={alt} priority={priority} posicao={posicao} className={cn("block overflow-hidden rounded-[var(--ds-r-public-card)]", className)} style={{ aspectRatio: ratio }} />;
  }
  return (
    <figure role="img" aria-label={`${alt} (imagem em criação)`} data-img-slot={nome} className={cn("ds-img-slot", className)} style={{ aspectRatio: ratio }}>
      <span className="ds-img-slot-in"><ImageIcon className="size-6" aria-hidden /><span>Imagem em criação</span>{isDemoMode() ? <code>{nome}</code> : null}</span>
    </figure>
  );
}

/**
 * Foto opcional (mesma pasta e mesmo `<picture>` da `ImagemEmCriacao`): sem arquivo válido, não aparece nada. Para lugares
 * que já funcionam sem imagem (páginas de erro, cartões, aberturas novas), onde o quadro "Imagem em criação" pareceria falha.
 */
export function FotoOpcional({ marca, nome, alt, ratio = "16 / 9", posicao = "50% 50%", className, priority = false }: { marca: Marca; nome: string; alt: string; ratio?: string | null; posicao?: string; className?: string; priority?: boolean }) {
  const formatos = formatosDisponiveis(marca, nome);
  if (!formatos.length) return null;
  // ratio null: a proporção vem das classes (ex.: mais baixa no computador que no celular).
  return <Foto base={`/portal/${marca}/v3/${nome}`} formatos={formatos} alt={alt} priority={priority} posicao={posicao} className={cn("block overflow-hidden rounded-[var(--ds-r-public-card)]", className)} style={ratio ? { aspectRatio: ratio } : undefined} />;
}

/**
 * Textura decorativa de fundo de seção (alt vazio, fora da leitura de tela). Entra em tons de cinza com mistura "luz suave":
 * dá relevo sem trocar a cor da marca da seção; sem arquivo, simplesmente não aparece (é só ornamento).
 */
export function TexturaDeFundo({ marca, nome, opacidade = 0.5, posicao = "50% 50%" }: { marca: Marca; nome: string; opacidade?: number; posicao?: string }) {
  const formatos = formatosDisponiveis(marca, nome);
  if (!formatos.length) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light grayscale" style={{ opacity: opacidade }}>
      <Foto base={`/portal/${marca}/v3/${nome}`} formatos={formatos} alt="" priority={false} posicao={posicao} className="block size-full" />
    </div>
  );
}
