/**
 * Imagens da nova home imersiva da NextLevel E-commerce (prévia, branch de revisão).
 * PROVISÓRIAS: recortes ampliados de um único storyboard gerado por IA (pacote "nextlevel-ecommerce-pacote-claude-code",
 * MANIFESTO status PROTOTIPO_VISUAL_NAO_APROVADO_PARA_PUBLICACAO). Faixas do storyboard cortadas, proporção 3:2 (paisagem)
 * ou 2:3 (retrato), AVIF e WebP em duas larguras sem ampliar além do original. Substituir por gerações individuais antes de
 * publicar (lista em docs/design/ecommerce-home-imersiva-previa.md). `cor`: cor média, usada como fundo enquanto carrega.
 */
export const EC_HOME_BASE = "/portal/nextlevel-ecommerce/v1/home";
export const EC_HOME_PROVISORIAS = true;

export type EcFoto = { larguras: readonly [number, number]; w: number; h: number; cor: string };
export const EC_HOME_FOTOS = {
  "ec-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#7b5a52" },
  "ec-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#59403c" },
  "ec-jornada-1-produto-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#7c666a" },
  "ec-jornada-1-produto": { larguras: [800, 1400], w: 1400, h: 933, cor: "#745c60" },
  "ec-jornada-2-loja-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#534446" },
  "ec-jornada-2-loja": { larguras: [800, 1400], w: 1400, h: 933, cor: "#504146" },
  "ec-jornada-3-pedido-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#6b4f4a" },
  "ec-jornada-3-pedido": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5a3c37" },
  "ec-jornada-4-envio-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#6c4c42" },
  "ec-jornada-4-envio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5b3e38" },
  "ec-jornada-5-rotina-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#644741" },
  "ec-jornada-5-rotina": { larguras: [800, 1400], w: 1400, h: 933, cor: "#604039" },
  "ec-planos": { larguras: [800, 1400], w: 1400, h: 933, cor: "#776970" },
  "ec-porta-fisica": { larguras: [640, 960], w: 960, h: 1440, cor: "#835845" },
  "ec-porta-instagram": { larguras: [640, 960], w: 960, h: 1440, cor: "#8c6157" },
  "ec-porta-migrar": { larguras: [640, 960], w: 960, h: 1440, cor: "#624646" },
  "ec-porta-zero": { larguras: [640, 960], w: 960, h: 1440, cor: "#5f4442" },
  "ec-temas": { larguras: [800, 1400], w: 1400, h: 933, cor: "#776c75" },
} as const satisfies Record<string, EcFoto>;
export type EcFotoNome = keyof typeof EC_HOME_FOTOS;
