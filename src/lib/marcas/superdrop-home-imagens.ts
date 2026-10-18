/**
 * Fotos da página imersiva do SuperDrop (D167), ainda em produção no GPT: pedido em
 * `docs/prompts/fotos-imersivas-superdrop-bras-cargas-gpt.md`. Enquanto isso o acervo fica "em espera" (a página reserva o
 * lugar de cada foto) e a jornada só aparece na prévia (`/?previa=imersiva`). Quando as fotos chegarem:
 *   python3 -I scripts/imagens/imersiva-converter.py <pasta-png> public/portal/superdrop/v1/home src/lib/marcas/superdrop-home-imagens.ts SD_HOME "SuperDrop"
 * regrava este arquivo com as fotos reais e a jornada entra no ar sozinha (acervo completo).
 */
export const SD_HOME_BASE = "/portal/superdrop/v1/home";

import { acervoEmEspera, type Acervo } from "@/lib/imersiva/acervo";

const NOMES = [
  "sd-jornada-1-escolhe",
  "sd-jornada-1-escolhe-retrato",
  "sd-jornada-2-divulga",
  "sd-jornada-2-divulga-retrato",
  "sd-jornada-3-vende",
  "sd-jornada-3-vende-retrato",
  "sd-jornada-4-separa",
  "sd-jornada-4-separa-retrato",
  "sd-jornada-5-entrega",
  "sd-jornada-5-entrega-retrato",
  "sd-porta-comecar",
  "sd-porta-revender",
  "sd-porta-central",
  "sd-porta-parceiro",
  "sd-entrar",
  "sd-fecho",
] as const;
export const SD_HOME_FOTOS = acervoEmEspera(SD_HOME_BASE, NOMES).fotos;
export type SdHomeFotoNome = keyof typeof SD_HOME_FOTOS;

/** Acervo no formato da peça única `src/components/imersiva`. */
export const SD_HOME_ACERVO: Acervo<SdHomeFotoNome> = { base: SD_HOME_BASE, fotos: SD_HOME_FOTOS };
