/**
 * Imagens da home imersiva da NextLevel E-commerce (D165): fotografias individuais geradas para o briefing
 * (docs/prompts/ecommerce-home-imersiva-imagens-gpt.md); as 5 com a tela do notebook virada para o lado errado ficaram de fora
 * (e a ec-temas, pelo mesmo motivo); o passo 2 usa ec-planos, o passo 5 ec-fecho, a porta "migrar" e os temas ec-entrar, até a
 * nova geração de fotos (docs/prompts/ecommerce-fotos-v2-personagens-gpt.md). AVIF e WebP em duas
 * larguras (paisagem 800/1400, retrato 640/960), gerados por scripts/imagens/ec-home-converter.py; os PNG originais ficam
 * fora do repositório. `cor`: cor média, usada como fundo enquanto a foto carrega.
 */
export const EC_HOME_BASE = "/portal/nextlevel-ecommerce/v1/home";
export const EC_HOME_PROVISORIAS = false;

import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export type EcFoto = FotoImersiva;
export const EC_HOME_FOTOS = {
  "ec-entrar-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#282b39" },
  "ec-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#1b1c27" },
  "ec-fecho-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#5f483b" },
  "ec-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#685040" },
  "ec-jornada-1-produto-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#534e50" },
  "ec-jornada-1-produto": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4f4a4a" },
  "ec-jornada-3-pedido-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#4f4644" },
  "ec-jornada-3-pedido": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4d4442" },
  "ec-jornada-4-envio-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#564c48" },
  "ec-jornada-4-envio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#544844" },
  "ec-planos-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#523f37" },
  "ec-planos": { larguras: [800, 1400], w: 1400, h: 933, cor: "#564943" },
  "ec-porta-fisica": { larguras: [640, 960], w: 960, h: 1440, cor: "#6c5342" },
  "ec-porta-instagram": { larguras: [640, 960], w: 960, h: 1440, cor: "#67564e" },
  "ec-porta-zero": { larguras: [640, 960], w: 960, h: 1440, cor: "#6e5a50" },
} as const satisfies Record<string, FotoImersiva>;
export type EcHomeFotoNome = keyof typeof EC_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const EC_HOME_ACERVO: Acervo<EcHomeFotoNome> = { base: EC_HOME_BASE, fotos: EC_HOME_FOTOS };
