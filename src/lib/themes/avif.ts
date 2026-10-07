import map from "./pacotes/avif.json";

/** Versão AVIF de uma imagem dos pacotes visuais (o WebP continua de reserva para navegadores sem AVIF). */
const AVIF = map as Record<string, string>;
export const avifOf = (src: string): string | null => AVIF[src] ?? null;
