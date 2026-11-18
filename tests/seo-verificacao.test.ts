import { describe, expect, it } from "vitest";
import { codigoDeVerificacao, verificacaoBuscadores } from "@/lib/seo/verificacao";

/** D342: verificação no Google Search Console e no Bing Webmaster pelo código colado no Render. */
describe("verificação dos buscadores", () => {
  it("aceita a tag inteira ou só o código; recusa lixo", () => {
    expect(codigoDeVerificacao('<meta name="google-site-verification" content="AbC_123-xyz9876" />')).toBe("AbC_123-xyz9876");
    expect(codigoDeVerificacao("  1A2B3C4D5E6F7A8B9C0D  ")).toBe("1A2B3C4D5E6F7A8B9C0D");
    for (const x of ["", undefined, null, "curto", '"><script>', "com espaço no meio"]) expect(codigoDeVerificacao(x)).toBeNull();
  });
  it("monta a verificação do Google e do Bing só com o que estiver preenchido", () => {
    expect(verificacaoBuscadores({})).toBeUndefined();
    expect(verificacaoBuscadores({ GOOGLE_SITE_VERIFICATION: "AbC_123-xyz9876" })).toEqual({ google: "AbC_123-xyz9876" });
    expect(verificacaoBuscadores({ BING_SITE_VERIFICATION: "1A2B3C4D5E6F7A8B9C0D" })).toEqual({ other: { "msvalidate.01": "1A2B3C4D5E6F7A8B9C0D" } });
  });
});
