/**
 * Imagens da home imersiva da NextLevel E-commerce (D165): fotografias individuais geradas para o briefing
 * (docs/prompts/ecommerce-home-imersiva-imagens-gpt.md); as 5 com a tela do notebook virada para o lado errado ficaram de fora
 * (e a ec-temas, pelo mesmo motivo); o passo 2 usa a ec-jornada-2-loja refeita em 19/10 (tela virada para a Larissa), o passo 5 ec-fecho, a porta "migrar" e os temas ec-entrar, até a
 * nova geração de fotos (docs/prompts/ecommerce-fotos-v2-personagens-gpt.md). AVIF e WebP em duas
 * larguras (paisagem 800/1400, retrato 640/960), gerados por scripts/imagens/ec-home-converter.py; os PNG originais ficam
 * fora do repositório. `cor`: cor média, usada como fundo enquanto a foto carrega.
 */
export const EC_HOME_BASE = "/portal/nextlevel-ecommerce/v1/home";
export const EC_HOME_PROVISORIAS = false;

import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export type EcFoto = FotoImersiva;
export const EC_HOME_FOTOS = {
  "ec-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#0e1822" },
  "ec-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#533e2b" },
  "ec-jornada-1-produto-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#99765d" },
  "ec-jornada-1-produto": { larguras: [800, 1400], w: 1400, h: 933, cor: "#756b63" },
  "ec-jornada-2-loja": { larguras: [800, 1400], w: 1400, h: 933, cor: "#705c4e" },
  "ec-jornada-2-loja-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#946f54" },
  "ec-jornada-3-pedido-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#956e52" },
  "ec-jornada-3-pedido": { larguras: [800, 1400], w: 1400, h: 933, cor: "#807065" },
  "ec-jornada-4-envio-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#95694b" },
  "ec-jornada-4-envio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#857164" },
  "ec-jornada-5-rotina-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#83674c" },
  "ec-jornada-5-rotina": { larguras: [800, 1400], w: 1400, h: 933, cor: "#926f58" },
  "ec-planos": { larguras: [800, 1400], w: 1400, h: 933, cor: "#564b3d" },
  "ec-porta-fisica": { larguras: [640, 960], w: 960, h: 1440, cor: "#8a7b71" },
  "ec-porta-instagram": { larguras: [640, 960], w: 960, h: 1440, cor: "#655952" },
  "ec-porta-migrar": { larguras: [640, 960], w: 960, h: 1440, cor: "#746b68" },
  "ec-porta-zero": { larguras: [640, 960], w: 960, h: 1440, cor: "#897e79" },
  "ec-temas": { larguras: [800, 1400], w: 1400, h: 933, cor: "#48403a" },
} as const satisfies Record<string, FotoImersiva>;
export type EcHomeFotoNome = keyof typeof EC_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const EC_HOME_ACERVO: Acervo<EcHomeFotoNome> = { base: EC_HOME_BASE, fotos: EC_HOME_FOTOS };
