/**
 * Imagens da home imersiva da NextLevel E-commerce (D165): 18 fotografias individuais geradas para o briefing
 * (docs/prompts/ecommerce-home-imersiva-imagens-gpt.md), mesmo ateliê e mesmo ângulo na jornada. AVIF e WebP em duas
 * larguras (paisagem 800/1400, retrato 640/960), gerados por scripts/imagens/ec-home-converter.py; os PNG originais ficam
 * fora do repositório. `cor`: cor média, usada como fundo enquanto a foto carrega.
 */
export const EC_HOME_BASE = "/portal/nextlevel-ecommerce/v1/home";
export const EC_HOME_PROVISORIAS = false;

export type EcFoto = { larguras: readonly [number, number]; w: number; h: number; cor: string };
export const EC_HOME_FOTOS = {
  "ec-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#1b1c27" },
  "ec-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#685040" },
  "ec-jornada-1-produto-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#534e50" },
  "ec-jornada-1-produto": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4f4a4a" },
  "ec-jornada-2-loja-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#4e4646" },
  "ec-jornada-2-loja": { larguras: [800, 1400], w: 1400, h: 933, cor: "#504847" },
  "ec-jornada-3-pedido-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#4f4644" },
  "ec-jornada-3-pedido": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4d4442" },
  "ec-jornada-4-envio-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#564c48" },
  "ec-jornada-4-envio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#544844" },
  "ec-jornada-5-rotina-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#4c403a" },
  "ec-jornada-5-rotina": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5c493d" },
  "ec-planos": { larguras: [800, 1400], w: 1400, h: 933, cor: "#564943" },
  "ec-porta-fisica": { larguras: [640, 960], w: 960, h: 1440, cor: "#6c5342" },
  "ec-porta-instagram": { larguras: [640, 960], w: 960, h: 1440, cor: "#67564e" },
  "ec-porta-migrar": { larguras: [640, 960], w: 960, h: 1440, cor: "#6a5a54" },
  "ec-porta-zero": { larguras: [640, 960], w: 960, h: 1440, cor: "#6e5a50" },
  "ec-temas": { larguras: [800, 1400], w: 1400, h: 933, cor: "#524845" },
} as const satisfies Record<string, EcFoto>;
export type EcFotoNome = keyof typeof EC_HOME_FOTOS;
