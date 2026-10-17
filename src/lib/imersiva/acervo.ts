/**
 * Acervo de fotos de uma página imersiva de marca (D165): a pasta pública e, por foto, as duas larguras geradas (AVIF e
 * WebP), o tamanho da maior e a cor média (fundo enquanto carrega). Cada marca tem o seu, gerado por
 * `scripts/imagens/imersiva-converter.py`; a peça visual (`src/components/imersiva`) só lê daqui.
 */
export type FotoImersiva = { larguras: readonly [number, number]; w: number; h: number; cor: string };
export type Acervo<N extends string = string> = { base: string; fotos: Record<N, FotoImersiva> };

/** `srcset` de uma foto do acervo num formato ("avif" ou "webp"). */
export function srcSetDe<N extends string>(acervo: Acervo<N>, nome: N, ext: "avif" | "webp"): string {
  return acervo.fotos[nome].larguras.map((w) => `${acervo.base}/${nome}-${w}.${ext} ${w}w`).join(", ");
}
/** Arquivo WebP da maior largura (o `src` de reserva). */
export const maiorDe = <N extends string>(acervo: Acervo<N>, nome: N) => `${acervo.base}/${nome}-${acervo.fotos[nome].larguras[1]}.webp`;
