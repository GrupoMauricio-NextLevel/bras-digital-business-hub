/**
 * Fotos da página imersiva da Brás Digital Club (gerado por scripts/imagens/imersiva-converter.py; não edite à mão).
 * AVIF e WebP em duas larguras (paisagem 800/1400, retrato 640/960); `cor`: cor média, fundo enquanto a foto carrega.
 */
import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export const BD_HOME_BASE = "/portal/bras/v1/home";
export const BD_HOME_FOTOS = {
  "bd-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#6e6566" },
  "bd-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#6e6362" },
  "bd-jornada-1-descobre-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#7f6b65" },
  "bd-jornada-1-descobre": { larguras: [800, 1400], w: 1400, h: 933, cor: "#8f7c76" },
  "bd-jornada-2-escolhe-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#715c55" },
  "bd-jornada-2-escolhe": { larguras: [800, 1400], w: 1400, h: 933, cor: "#907870" },
  "bd-jornada-3-separa-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#565155" },
  "bd-jornada-3-separa": { larguras: [800, 1400], w: 1400, h: 933, cor: "#766d6f" },
  "bd-jornada-4-embarca-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#5b5b66" },
  "bd-jornada-4-embarca": { larguras: [800, 1400], w: 1400, h: 933, cor: "#716a6c" },
  "bd-jornada-5-chega-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#7d6c67" },
  "bd-jornada-5-chega": { larguras: [800, 1400], w: 1400, h: 933, cor: "#8f7d77" },
  "bd-planos": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5e5355" },
  "bd-porta-importadora": { larguras: [640, 960], w: 960, h: 1440, cor: "#7b685e" },
  "bd-porta-lojista": { larguras: [640, 960], w: 960, h: 1440, cor: "#68544c" },
  "bd-porta-revenda": { larguras: [640, 960], w: 960, h: 1440, cor: "#675147" },
  "bd-porta-transporte": { larguras: [640, 960], w: 960, h: 1440, cor: "#665e5a" },
} as const satisfies Record<string, FotoImersiva>;
export type BdHomeFotoNome = keyof typeof BD_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const BD_HOME_ACERVO: Acervo<BdHomeFotoNome> = { base: BD_HOME_BASE, fotos: BD_HOME_FOTOS };
