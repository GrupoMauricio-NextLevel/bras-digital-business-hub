/**
 * Acervo de fotos de uma página imersiva de marca (D165): a pasta pública e, por foto, as duas larguras geradas (AVIF e
 * WebP), o tamanho da maior e a cor média (fundo enquanto carrega). Cada marca tem o seu, gerado por
 * `scripts/imagens/imersiva-converter.py`; a peça visual (`src/components/imersiva`) só lê daqui.
 */
export type FotoImersiva = { larguras: readonly [number, number]; w: number; h: number; cor: string; /** Foto ainda não entregue: a página reserva o lugar (mesma proporção) na cor da marca. */ espera?: true };
export type Acervo<N extends string = string> = { base: string; fotos: Record<N, FotoImersiva> };

/** `srcset` de uma foto do acervo num formato ("avif" ou "webp"). */
export function srcSetDe<N extends string>(acervo: Acervo<N>, nome: N, ext: "avif" | "webp"): string {
  return acervo.fotos[nome].larguras.map((w) => `${acervo.base}/${nome}-${w}.${ext} ${w}w`).join(", ");
}
/** Arquivo WebP da maior largura (o `src` de reserva). */
export const maiorDe = <N extends string>(acervo: Acervo<N>, nome: N) => `${acervo.base}/${nome}-${acervo.fotos[nome].larguras[1]}.webp`;

/**
 * Acervo de uma marca cujas fotos ainda estão sendo produzidas (D167): mesmos nomes e proporções que o conversor vai gerar
 * (paisagem 3:2, retrato 2:3), marcados como "em espera". Quando o conversor roda, o arquivo da marca é regravado com as fotos
 * reais e a página passa a usá-las sem mudar código.
 */
export function acervoEmEspera<N extends string>(base: string, nomes: readonly N[]): Acervo<N> {
  const fotos = {} as Record<N, FotoImersiva>;
  for (const n of nomes) {
    const retrato = n.endsWith("-retrato") || n.includes("-porta-");
    fotos[n] = retrato ? { larguras: [640, 960], w: 960, h: 1440, cor: "transparent", espera: true } : { larguras: [800, 1400], w: 1400, h: 933, cor: "transparent", espera: true };
  }
  return { base, fotos };
}

/** Todas as fotos do acervo já existem (nenhuma em espera): a página da marca pode ir ao ar. */
export const acervoCompleto = (acervo: Acervo) => Object.values<FotoImersiva>(acervo.fotos).every((f) => !f.espera);
