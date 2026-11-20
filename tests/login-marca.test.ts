import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BRAND_CODES, brandsFrom, loginInviteFor } from "@/lib/brand";
import { loginPhotoFor } from "@/components/auth/auth-photo";

/** Tela de entrada por marca (2026-10-09): só foto da própria marca; convite certo para cada endereço. */
describe("tela de entrada por marca", () => {
  it("foto só da própria marca (o arquivo existe)", () => {
    for (const c of BRAND_CODES) {
      const p = loginPhotoFor(c);
      if (p) {
        expect(existsSync(join(process.cwd(), "public", p.src))).toBe(true);
        expect(p.src).not.toMatch(/moda-|ace-|casa-/);
      }
    }
    expect(loginPhotoFor("NEXTLEVEL_COMMERCE")?.src).toBe("/portal/nextlevel-ecommerce/v1/home/ec-entrar-1400.webp"); // D165
    // Master (D181): a equipe real da NextLevel, uma foto por dia (a peça 3D da marca-mãe fica de reserva).
    expect(loginPhotoFor("NEXTLEVEL")?.src).toMatch(/^\/portal\/nextlevel\/equipe\/v1\/eq-[a-z-]+-1400\.webp$/);
  });

  it("convite: Master não convida", () => {
    const all = brandsFrom({});
    expect(loginInviteFor(all.NEXTLEVEL)).toBeNull();
  });
});

describe("prévia de link por marca", () => {
  it("Commerce e NextLevel com a arte própria em JPG (redes não leem AVIF)", async () => {
    const { ogImageFor } = await import("@/lib/og-marca");
    const all = brandsFrom({});
    expect(ogImageFor(all.NEXTLEVEL).url).toBe("/marcas/nextlevel/v2/social/og-nextlevel-1200x630.jpg");
    expect(ogImageFor(all.NEXTLEVEL_COMMERCE).url).toBe("/marcas/nextlevel-ecommerce/og-1200x630.jpg");
    expect(existsSync(join(process.cwd(), "src/app/opengraph-image.png"))).toBe(false);
  });
});
