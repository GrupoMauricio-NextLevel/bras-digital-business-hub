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
    // Toda foto citada na página existe no acervo.
    const pagina = readFileSync(join(process.cwd(), "src/components/portal/commerce/imersiva/home-imersiva.tsx"), "utf8");
    const citadas = [...new Set(pagina.match(/"ec-[a-z0-9-]+"/g)!.map((n) => n.slice(1, -1)))];
    expect(citadas.length).toBeGreaterThan(10);
    for (const n of citadas) expect(Object.keys(EC_HOME_FOTOS)).toContain(n);
    // Fotos v2 (personagens diferentes). A paisagem da jornada 2 (tela do notebook virada para a câmera) não vai ao ar.
    expect(Object.keys(EC_HOME_FOTOS)).not.toContain("ec-jornada-2-loja");
    for (const nova of ["ec-jornada-5-rotina", "ec-porta-migrar", "ec-temas", "ec-jornada-2-loja-retrato"]) expect(citadas).toContain(nova);
    expect(EC_HOME_PROVISORIAS).toBe(false); // fotos definitivas (D165)
  });

  it("a home da E-commerce é a imersiva e a foto da entrada é a do mesmo ateliê", async () => {
    const portal = readFileSync(join(process.cwd(), "src/app/(portal)/page.tsx"), "utf8");
    expect(portal).toMatch(/<HomeImersivaEc brand=\{brand\} \/>/);
    const { loginPhotoFor } = await import("@/components/auth/auth-photo");
    expect(loginPhotoFor("NEXTLEVEL_COMMERCE")?.src).toBe(`${EC_HOME_BASE}/ec-entrar-1400.webp`);
  });
});
