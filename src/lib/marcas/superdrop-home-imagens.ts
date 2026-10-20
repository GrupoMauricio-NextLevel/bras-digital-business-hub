/**
 * Fotos da página imersiva da SuperDrop (gerado por scripts/imagens/imersiva-converter.py; não edite à mão).
 * AVIF e WebP em duas larguras (paisagem 800/1400, retrato 640/960); `cor`: cor média, fundo enquanto a foto carrega.
 */
import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export const SD_HOME_BASE = "/portal/superdrop/v1/home";
export const SD_HOME_FOTOS = {
  "sd-entrar": { larguras: [800, 1400], w: 1400, h: 933, cor: "#533c27" },
  "sd-fecho": { larguras: [800, 1400], w: 1400, h: 933, cor: "#947a6f" },
  "sd-jornada-1-escolhe-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#6b4f41" },
  "sd-jornada-1-escolhe": { larguras: [800, 1400], w: 1400, h: 933, cor: "#715044" },
  "sd-jornada-2-divulga-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#775e51" },
  "sd-jornada-2-divulga": { larguras: [800, 1400], w: 1400, h: 933, cor: "#966c5d" },
  "sd-jornada-3-vende-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#705e51" },
  "sd-jornada-3-vende": { larguras: [800, 1400], w: 1400, h: 933, cor: "#79675b" },
  "sd-jornada-4-separa-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#7e6e62" },
  "sd-jornada-4-separa": { larguras: [800, 1400], w: 1400, h: 933, cor: "#837165" },
  "sd-jornada-5-entrega-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#755b4a" },
  "sd-jornada-5-entrega": { larguras: [800, 1400], w: 1400, h: 933, cor: "#8c6c58" },
  "sd-porta-central": { larguras: [640, 960], w: 960, h: 1440, cor: "#918781" },
  "sd-porta-comecar": { larguras: [640, 960], w: 960, h: 1440, cor: "#7c6452" },
  "sd-porta-parceiro": { larguras: [640, 960], w: 960, h: 1440, cor: "#615444" },
  "sd-porta-revender": { larguras: [640, 960], w: 960, h: 1440, cor: "#736254" },
} as const satisfies Record<string, FotoImersiva>;
export type SdHomeFotoNome = keyof typeof SD_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const SD_HOME_ACERVO: Acervo<SdHomeFotoNome> = { base: SD_HOME_BASE, fotos: SD_HOME_FOTOS };
