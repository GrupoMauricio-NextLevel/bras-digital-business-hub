import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EC_HOME_BASE, EC_HOME_FOTOS, EC_HOME_PROVISORIAS } from "@/lib/marcas/ecommerce-home-imagens";

/** Prévia da home imersiva da E-commerce: imagens do manifesto existem e a rota fica atrás da chave. */
describe("home imersiva da E-commerce (prévia)", () => {
  it("cada foto do manifesto tem AVIF e WebP nas duas larguras", () => {
    const faltando: string[] = [];
    for (const [nome, f] of Object.entries(EC_HOME_FOTOS)) for (const w of f.larguras) for (const ext of ["avif", "webp"]) {
      const arq = join(process.cwd(), "public", EC_HOME_BASE, `${nome}-${w}.${ext}`);
      if (!existsSync(arq)) faltando.push(arq);
    }
    expect(faltando).toEqual([]);
    expect(Object.keys(EC_HOME_FOTOS)).toHaveLength(18);
    expect(EC_HOME_PROVISORIAS).toBe(true);
  });

  it("a rota de prévia só existe com a chave e não é indexada; a home atual não usa a prévia", () => {
    const rota = readFileSync(join(process.cwd(), "src/app/(portal)/previa-home/page.tsx"), "utf8");
    expect(rota).toMatch(/EC_HOME_IMERSIVA_PREVIA !== "true"\) notFound\(\)/);
    expect(rota).toMatch(/index: false/);
    const portal = readFileSync(join(process.cwd(), "src/app/(portal)/page.tsx"), "utf8");
    expect(portal).not.toMatch(/HomeImersivaEc/);
  });
});
