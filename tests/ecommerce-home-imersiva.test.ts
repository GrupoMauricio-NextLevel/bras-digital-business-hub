import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EC_HOME_BASE, EC_HOME_FOTOS, EC_HOME_PROVISORIAS } from "@/lib/marcas/ecommerce-home-imagens";

/** Home imersiva da Commerce (D165): imagens do manifesto existem e a home e a entrada usam as fotos novas. */
describe("home imersiva da Commerce", () => {
  it("cada foto do manifesto tem AVIF e WebP nas duas larguras", () => {
    const faltando: string[] = [];
    for (const [nome, f] of Object.entries(EC_HOME_FOTOS)) for (const w of f.larguras) for (const ext of ["avif", "webp"]) {
      const arq = join(process.cwd(), "public", EC_HOME_BASE, `${nome}-${w}.${ext}`);
      if (!existsSync(arq)) faltando.push(arq);
    }
    expect(faltando).toEqual([]);
    // Toda foto citada na página existe no acervo.
    // Desde a D219 parte das fotos foi da home para /recursos e para a capa: as três juntas formam o site.
    const pagina = ["imersiva/home-imersiva.tsx", "imersiva/recursos-ec.tsx", "capa/heroi-capa.tsx"]
      .map((f) => readFileSync(join(process.cwd(), "src/components/portal/commerce", f), "utf8")).join("\n");
    const citadas = [...new Set(pagina.match(/"ec-[a-z0-9-]+"/g)!.map((n) => n.slice(1, -1)))];
    expect(citadas.length).toBeGreaterThan(10);
    for (const n of citadas) expect(Object.keys(EC_HOME_FOTOS)).toContain(n);
    // Fotos v2 (personagens diferentes). A paisagem da jornada 2 foi refeita em 19/10 (antes a tela do notebook aparecia virada para a câmera).
    expect(Object.keys(EC_HOME_FOTOS)).toContain("ec-jornada-2-loja"); // refeita em 19/10 com a tela virada para a Larissa
    for (const nova of ["ec-jornada-5-rotina", "ec-porta-migrar", "ec-jornada-2-loja", "ec-jornada-2-loja-retrato"]) expect(citadas).toContain(nova);
    expect(EC_HOME_PROVISORIAS).toBe(false); // fotos definitivas (D165)
  });

  it("a home da Commerce é a imersiva e a foto da entrada é a do mesmo ateliê", async () => {
    const portal = readFileSync(join(process.cwd(), "src/app/(portal)/page.tsx"), "utf8");
    expect(portal).toMatch(/<HomeImersivaEc brand=\{brand\} \/>/);
    const { loginPhotoFor } = await import("@/components/auth/auth-photo");
    expect(loginPhotoFor("NEXTLEVEL_COMMERCE")?.src).toBe(`${EC_HOME_BASE}/ec-entrar-1400.webp`);
  });
});
