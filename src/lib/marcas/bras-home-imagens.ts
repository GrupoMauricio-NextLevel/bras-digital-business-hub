/**
 * Fotos da página imersiva do Brás Digital Club (D167), ainda em produção no GPT: pedido em
 * `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`. Enquanto isso o acervo fica "em espera" (a página reserva o
 * lugar de cada foto) e a jornada só aparece na prévia (`/?previa=imersiva`). Quando as fotos chegarem:
 *   python3 -I scripts/imagens/imersiva-converter.py <pasta-png> public/portal/bras/v1/home src/lib/marcas/bras-home-imagens.ts BD_HOME "Brás Digital Club"
 * regrava este arquivo com as fotos reais e a jornada entra no ar sozinha (acervo completo).
 */
export const BD_HOME_BASE = "/portal/bras/v1/home";

import { acervoEmEspera, type Acervo } from "@/lib/imersiva/acervo";

const NOMES = [
  "bd-jornada-1-descobre",
  "bd-jornada-1-descobre-retrato",
  "bd-jornada-2-escolhe",
  "bd-jornada-2-escolhe-retrato",
  "bd-jornada-3-separa",
  "bd-jornada-3-separa-retrato",
  "bd-jornada-4-embarca",
  "bd-jornada-4-embarca-retrato",
  "bd-jornada-5-chega",
  "bd-jornada-5-chega-retrato",
  "bd-porta-lojista",
  "bd-porta-revenda",
  "bd-porta-importadora",
  "bd-porta-transporte",
  "bd-planos",
  "bd-entrar",
  "bd-fecho",
] as const;
export const BD_HOME_FOTOS = acervoEmEspera(BD_HOME_BASE, NOMES).fotos;
export type BdHomeFotoNome = keyof typeof BD_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const BD_HOME_ACERVO: Acervo<BdHomeFotoNome> = { base: BD_HOME_BASE, fotos: BD_HOME_FOTOS };
