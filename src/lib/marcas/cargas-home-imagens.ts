/**
 * Fotos da página imersiva da NextLevel Cargas (gerado por scripts/imagens/imersiva-converter.py; não edite à mão).
 * AVIF e WebP em duas larguras (paisagem 800/1400, retrato 640/960); `cor`: cor média, fundo enquanto a foto carrega.
 */
import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export const CG_HOME_BASE = "/portal/cargas/v1/home";
export const CG_HOME_FOTOS = {
  "cg-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#283152" },
  "cg-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5c4b44" },
  "cg-jornada-1-reserva-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#453f43" },
  "cg-jornada-1-reserva": { larguras: [800, 1400], w: 1400, h: 933, cor: "#504748" },
  "cg-jornada-2-coleta-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#484143" },
  "cg-jornada-2-coleta": { larguras: [800, 1400], w: 1400, h: 933, cor: "#665853" },
  "cg-jornada-3-estrada-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#39302b" },
  "cg-jornada-3-estrada": { larguras: [800, 1400], w: 1400, h: 933, cor: "#564e49" },
  "cg-jornada-4-onibus-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#504b4f" },
  "cg-jornada-4-onibus": { larguras: [800, 1400], w: 1400, h: 933, cor: "#665953" },
  "cg-jornada-5-entrega-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#584c51" },
  "cg-jornada-5-entrega": { larguras: [800, 1400], w: 1400, h: 933, cor: "#64595c" },
  "cg-porta-importadora": { larguras: [640, 960], w: 960, h: 1440, cor: "#6f635e" },
  "cg-porta-motorista": { larguras: [640, 960], w: 960, h: 1440, cor: "#665146" },
  "cg-porta-onibus": { larguras: [640, 960], w: 960, h: 1440, cor: "#67605e" },
  "cg-porta-transportadora": { larguras: [640, 960], w: 960, h: 1440, cor: "#746660" },
} as const satisfies Record<string, FotoImersiva>;
export type CgHomeFotoNome = keyof typeof CG_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const CG_HOME_ACERVO: Acervo<CgHomeFotoNome> = { base: CG_HOME_BASE, fotos: CG_HOME_FOTOS };
