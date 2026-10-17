import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EC_HOME_BASE, EC_HOME_FOTOS, EC_HOME_PROVISORIAS } from "@/lib/marcas/ecommerce-home-imagens";

/** Home imersiva da E-commerce (D165): imagens do manifesto existem e a home e a entrada usam as fotos novas. */
describe("home imersiva da E-commerce", () => {
  it("cada foto do manifesto tem AVIF e WebP nas duas larguras", () => {
    const faltando: string[] = [];
    for (const [nome, f] of Object.entries(EC_HOME_FOTOS)) for (const w of f.larguras) for (const ext of ["avif", "webp"]) {
      const arq = join(process.cwd(), "public", EC_HOME_BASE, `${nome}-${w}.${ext}`);
      if (!existsSync(arq)) faltando.push(arq);
    }
    expect(faltando).toEqual([]);
    expect(Object.keys(EC_HOME_FOTOS)).toHaveLength(18);
    expect(EC_HOME_PROVISORIAS).toBe(false); // fotos definitivas (D165)
  });

  it("a home da E-commerce é a imersiva e a foto da entrada é a do mesmo ateliê", async () => {
    const portal = readFileSync(join(process.cwd(), "src/app/(portal)/page.tsx"), "utf8");
    expect(portal).toMatch(/<HomeImersivaEc brand=\{brand\} \/>/);
    const { loginPhotoFor } = await import("@/components/auth/auth-photo");
    expect(loginPhotoFor("NEXTLEVEL_COMMERCE")?.src).toBe(`${EC_HOME_BASE}/ec-entrar-1400.webp`);
  });
});
