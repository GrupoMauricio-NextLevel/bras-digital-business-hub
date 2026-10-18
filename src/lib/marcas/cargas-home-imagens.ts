/**
 * Fotos da página imersiva do NextLevel Cargas (D167), ainda em produção no GPT: pedido em
 * `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`. Enquanto isso o acervo fica "em espera" (a página reserva o
 * lugar de cada foto) e a jornada só aparece na prévia (`/?previa=imersiva`). Quando as fotos chegarem:
 *   python3 -I scripts/imagens/imersiva-converter.py <pasta-png> public/portal/cargas/v1/home src/lib/marcas/cargas-home-imagens.ts CG_HOME "NextLevel Cargas"
 * regrava este arquivo com as fotos reais e a jornada entra no ar sozinha (acervo completo).
 */
export const CG_HOME_BASE = "/portal/cargas/v1/home";

import { acervoEmEspera, type Acervo } from "@/lib/imersiva/acervo";

const NOMES = [
  "cg-jornada-1-reserva",
  "cg-jornada-1-reserva-retrato",
  "cg-jornada-2-coleta",
  "cg-jornada-2-coleta-retrato",
  "cg-jornada-3-estrada",
  "cg-jornada-3-estrada-retrato",
  "cg-jornada-4-onibus",
  "cg-jornada-4-onibus-retrato",
  "cg-jornada-5-entrega",
  "cg-jornada-5-entrega-retrato",
  "cg-porta-onibus",
  "cg-porta-transportadora",
  "cg-porta-importadora",
  "cg-porta-motorista",
  "cg-entrar",
  "cg-fecho",
] as const;
export const CG_HOME_FOTOS = acervoEmEspera(CG_HOME_BASE, NOMES).fotos;
export type CgHomeFotoNome = keyof typeof CG_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const CG_HOME_ACERVO: Acervo<CgHomeFotoNome> = { base: CG_HOME_BASE, fotos: CG_HOME_FOTOS };
