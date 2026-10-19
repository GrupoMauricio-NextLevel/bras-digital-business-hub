import type { TestProject } from "vitest/node";
import { gerarMolde } from "./molde";

declare module "vitest" {
  export interface ProvidedContext { molde: { dados: string; seed: string } | null }
}

/** Gera o molde do banco uma vez por execução e entrega o caminho aos testes (D171). */
export default async function setup(project: TestProject) {
  const t0 = Date.now();
  const molde = await gerarMolde().catch((e: unknown) => { console.warn("[molde] falhou, os testes vão migrar e semear do zero:", e); return null; });
  if (molde) console.log(`[molde] banco de teste pronto em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  project.provide("molde", molde);
}
