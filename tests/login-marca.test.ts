import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BRAND_CODES, brandsFrom, loginInviteFor } from "@/lib/brand";
import { loginPhotoFor } from "@/components/auth/auth-photo";

/** Tela de entrada por marca (2026-10-09): só foto da própria marca; convite certo para cada endereço. */
describe("tela de entrada por marca", () => {
  it("foto só da própria marca (o arquivo existe); Cargas e marcas em breve entram sem foto", () => {
    for (const c of BRAND_CODES) {
      const p = loginPhotoFor(c);
      if (p) {
        expect(existsSync(join(process.cwd(), "public", p.src))).toBe(true);
        expect(p.src).not.toMatch(/moda-|ace-|casa-/);
      }
    }
    expect(loginPhotoFor("SUPERDROP")?.src).toBe("/portal/superdrop/v3/sd-login-lateral.webp");
    expect(loginPhotoFor("NEXTLEVEL_COMMERCE")?.src).toBe("/portal/commerce/v3/cm-login-lateral.webp");
    expect(loginPhotoFor("BRAS_DIGITAL")?.src).toContain("/bras/");
    expect(loginPhotoFor("NEXTLEVEL")?.src).toBe("/portal/nextlevel/v3/nl-login-lateral.webp");
    for (const c of ["NEXTLEVEL_CARGAS", "CREATORS_HUB", "CHINA_HUB"] as const) expect(loginPhotoFor(c)).toBeNull();
  });

  it("convite: Cargas chama a transportadora, Master não convida, Brás cadastra membro, marca em breve leva à lista", () => {
    const all = brandsFrom({ BRAND_SIGNUP_BRAS_DIGITAL: "true" });
    expect(loginInviteFor(all.NEXTLEVEL_CARGAS)).toEqual({ lead: "Ainda não tem cadastro?", label: "Cadastrar minha transportadora", href: "/#cadastro" });
    expect(loginInviteFor(all.NEXTLEVEL)).toBeNull();
    expect(loginInviteFor(all.BRAS_DIGITAL)?.href).toBe("/cadastro");
    expect(loginInviteFor(all.SUPERDROP)?.label).toBe("Criar agora");
    expect(loginInviteFor(all.CREATORS_HUB)?.href).toBe("/quero-minha-loja");
  });
});

describe("prévia de link por marca", () => {
  it("SuperDrop, Commerce, NextLevel e Brás com a arte própria em JPG (redes não leem AVIF); as outras com o cartão gerado da própria marca", async () => {
    const { ogImageFor } = await import("@/lib/og-marca");
    const all = brandsFrom({});
    expect(ogImageFor(all.SUPERDROP).url).toBe("/portal/superdrop/v3/sd-og-portal.jpg");
    expect(ogImageFor(all.NEXTLEVEL).url).toBe("/portal/nextlevel/v3/nl-og-solucoes.jpg");
    expect(ogImageFor(all.BRAS_DIGITAL).url).toMatch(/^\/portal\/bras\/v3\/bd-og-portal\./);
    expect(ogImageFor(all.NEXTLEVEL_CARGAS).url).toBe("/og/nextlevel_cargas.png");
    expect(ogImageFor(all.NEXTLEVEL_COMMERCE).url).toBe("/portal/commerce/v3/cm-og-portal.jpg");
    expect(ogImageFor(all.CREATORS_HUB).url).toBe("/og/creators_hub.png");
    expect(existsSync(join(process.cwd(), "public/og/superdrop.png"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/app/opengraph-image.png"))).toBe(false);
  });
});
