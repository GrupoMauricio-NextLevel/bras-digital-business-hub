/**
 * Fotos da página imersiva da equipe NextLevel (fotos reais na sede em São Paulo, D179) (gerado por scripts/imagens/imersiva-converter.py; não edite à mão).
 * AVIF e WebP em duas larguras (paisagem 800/1400, retrato 640/960); `cor`: cor média, fundo enquanto a foto carrega.
 */
import type { Acervo, FotoImersiva } from "@/lib/imersiva/acervo";

export const EQUIPE_BASE = "/portal/nextlevel/equipe/v1";
export const EQUIPE_FOTOS = {
  "eq-analise-tela": { larguras: [800, 1400], w: 1400, h: 933, cor: "#615b5a" },
  "eq-boas-vindas": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4f4847" },
  "eq-edicao-gravacao": { larguras: [800, 1400], w: 1400, h: 933, cor: "#5c5553" },
  "eq-escritorio-estudio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#575963" },
  "eq-gravacao-produto": { larguras: [800, 1400], w: 1400, h: 933, cor: "#3b2e27" },
  "eq-gravacao": { larguras: [800, 1400], w: 1400, h: 933, cor: "#3c3638" },
  "eq-loja-com-cliente": { larguras: [800, 1400], w: 1400, h: 933, cor: "#696361" },
  "eq-mauricio-bancada": { larguras: [800, 1400], w: 1400, h: 933, cor: "#2a1f18" },
  "eq-mauricio-escritorio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#544d4d" },
  "eq-mauricio-retrato": { larguras: [640, 960], w: 960, h: 1440, cor: "#766359" },
  "eq-mesas-logo": { larguras: [640, 960], w: 960, h: 1440, cor: "#908b89" },
  "eq-premio-equipe": { larguras: [800, 1400], w: 1400, h: 933, cor: "#322d2f" },
  "eq-relatorio-cliente": { larguras: [800, 1400], w: 1400, h: 933, cor: "#8f847c" },
  "eq-reuniao-criativa": { larguras: [800, 1400], w: 1400, h: 933, cor: "#4a3c34" },
  "eq-reuniao-mesa-2": { larguras: [800, 1400], w: 1400, h: 933, cor: "#655950" },
  "eq-reuniao-mesa": { larguras: [800, 1400], w: 1400, h: 933, cor: "#665c53" },
  "eq-tour-escritorio": { larguras: [800, 1400], w: 1400, h: 933, cor: "#635b5a" },
} as const satisfies Record<string, FotoImersiva>;
export type EquipeFotoNome = keyof typeof EQUIPE_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const EQUIPE_ACERVO: Acervo<EquipeFotoNome> = { base: EQUIPE_BASE, fotos: EQUIPE_FOTOS };
