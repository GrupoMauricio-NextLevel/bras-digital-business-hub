import { describe, expect, it } from "vitest";
import { brandByCode, brandsFrom } from "@/lib/brand";
import { robotsPlan, sitemapPaths } from "@/lib/seo-marca";

/** D149: cada marca publica o próprio robots.txt e sitemap.xml, só com as páginas dela. */
const opts = { themes: ["lume"], solutions: ["migracao-lite"], publicSolutions: true };

describe("sitemap por marca", () => {
  it("SuperDrop, Commerce, grupo, Brás e Cargas listam só as páginas delas", () => {
    const sd = sitemapPaths(brandByCode("SUPERDROP", {}), opts);
    expect(sd).toEqual(expect.arrayContaining(["/", "/como-funciona", "/seja-fornecedor", "/parceiros", "/temas/lume", "/termos", "/privacidade", "/cadastro"]));
    expect(sd).not.toContain("/solucoes");
    const cm = sitemapPaths(brandByCode("NEXTLEVEL_COMMERCE", {}), opts);
    expect(cm).toEqual(expect.arrayContaining(["/", "/planos", "/temas", "/quero-minha-loja", "/parceiros"])); // programa de parceiros (D220)
    for (const x of ["/seja-fornecedor", "/como-funciona", "/loja-nextlevel"]) expect(cm).not.toContain(x);
    expect(sitemapPaths(brandByCode("NEXTLEVEL_COMMERCE", { BRAND_PARTNERS_NEXTLEVEL_COMMERCE: "false" }), opts)).not.toContain("/parceiros");
    expect(sitemapPaths(brandByCode("NEXTLEVEL_COMMERCE", { BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true" }), opts)).toContain("/cadastro");
    expect(sitemapPaths(brandByCode("NEXTLEVEL", {}), opts)).toEqual(["/solucoes", "/solucoes/migracao-lite", "/loja-nextlevel", "/club", "/meu-contador", "/termos", "/privacidade"]);
    expect(sitemapPaths(brandByCode("NEXTLEVEL_CARGAS", {}), opts)).toEqual(["/", "/termos", "/privacidade"]);
    expect(sitemapPaths(brandsFrom({ BRAND_SIGNUP_BRAS_DIGITAL: "true" }).BRAS_DIGITAL, opts)).toEqual(["/", "/cadastro", "/termos", "/privacidade"]);
    expect(sitemapPaths(brandByCode("CREATORS_HUB", {}), opts)).toEqual([]);
  });
});

describe("robots por endereço", () => {
  it("demonstração, escritório e marca em breve ficam fora da busca; painéis e links privados nunca entram", () => {
    expect(robotsPlan({ brand: null, office: false })).toEqual({ index: false });
    expect(robotsPlan({ brand: brandByCode("SUPERDROP", {}), office: true })).toEqual({ index: false });
    expect(robotsPlan({ brand: brandByCode("CREATORS_HUB", {}), office: false })).toEqual({ index: false });
    const sd = robotsPlan({ brand: brandByCode("SUPERDROP", {}), office: false });
    expect(sd.index && sd.disallow).toEqual(expect.arrayContaining(["/master", "/merchant", "/api/", "/r/", "/loja-nextlevel/pedido/"]));
    const g = robotsPlan({ brand: brandByCode("NEXTLEVEL", {}), office: false });
    expect(g).toEqual({ index: true, allow: ["/solucoes", "/loja-nextlevel", "/club", "/meu-contador", "/termos", "/privacidade"], disallow: ["/", "/loja-nextlevel/pedido/"] });
  });
});
