import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brandByCode } from "@/lib/brand";
import { caminhosCommerce, metadadosCommerce, PAGINAS_COMMERCE, tituloCompleto } from "@/lib/seo/paginas";
import { ROBOS_DE_IA, sitemapPaths } from "@/lib/seo-marca";
import { faqCommerce, faqJsonLd, type FatosFaq } from "@/lib/seo/faq-commerce";
import { entidadeCommerce, perfisOficiais } from "@/lib/seo/entidade";
import { CHAVE_INDEXNOW } from "@/lib/seo/indexnow";

/** Plano de busca v3, fase S0 (D290): metadados centrais, sitemap, robôs de IA, perguntas frequentes e entidade. */
const VENCIDO = /em breve|7 dias|setup|feita para quem vende moda|em constru[cç][aã]o/i;
const arquivoDa = (c: string) => (c === "/" ? "src/app/(portal)/page.tsx" : c === "/cadastro" ? "src/app/cadastro/page.tsx" : `src/app/(portal)${c}/page.tsx`);
const img = { url: "/og.jpg", width: 1200, height: 630, alt: "NextLevel Commerce" };

describe("tabela central das páginas públicas da Commerce", () => {
  it("cada página tem título e descrição únicos, no tamanho certo e sem texto vencido", () => {
    const caminhos = PAGINAS_COMMERCE.map((p) => p.caminho);
    expect(new Set(caminhos).size).toBe(caminhos.length);
    const titulos = PAGINAS_COMMERCE.map(tituloCompleto);
    expect(new Set(titulos).size).toBe(titulos.length);
    expect(new Set(PAGINAS_COMMERCE.map((p) => p.descricao)).size).toBe(PAGINAS_COMMERCE.length);
    for (const p of PAGINAS_COMMERCE) {
      expect(tituloCompleto(p).length, p.caminho).toBeLessThanOrEqual(65);
      expect(p.descricao.length, p.caminho).toBeGreaterThanOrEqual(70);
      expect(p.descricao.length, p.caminho).toBeLessThanOrEqual(160);
      expect(`${tituloCompleto(p)} ${p.descricao}`, p.caminho).not.toMatch(VENCIDO);
      expect(p.descricao, "preço só na página, vindo do sistema").not.toMatch(/R\$/);
      expect(p.revisadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("toda linha aponta para uma página que existe, e toda página que usa a tabela tem linha", () => {
    for (const p of PAGINAS_COMMERCE) expect(existsSync(arquivoDa(p.caminho)), p.caminho).toBe(true);
    const usados: string[] = [];
    const varre = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const f = join(dir, n);
        if (statSync(f).isDirectory()) varre(f);
        else if (n === "page.tsx") for (const m of readFileSync(f, "utf8").matchAll(/metadadosDaPagina\("([^"]+)"/g)) usados.push(m[1]!);
      }
    };
    varre("src/app");
    expect(usados.length).toBeGreaterThan(15);
    for (const c of usados) expect(PAGINAS_COMMERCE.some((p) => p.caminho === c), c).toBe(true);
  });

  it("metadados trazem canonical, descrição e prévia de link com a imagem da marca", () => {
    const m = metadadosCommerce("/planos", img);
    expect(m.alternates?.canonical).toBe("/planos");
    expect(m.title).toBe("Planos e preços");
    expect(m.openGraph).toMatchObject({ url: "/planos", title: "Planos e preços · NextLevel Commerce", images: [img] });
    expect(metadadosCommerce("/", img).title).toEqual({ absolute: "NextLevel Commerce · Loja virtual para varejo e atacado" });
    expect(() => metadadosCommerce("/nao-existe", img)).toThrow();
  });

  it("a frase da marca não fala mais em 'em breve, atacado' nem só em moda", () => {
    const b = brandByCode("NEXTLEVEL_COMMERCE", {});
    expect(`${b.tagline} ${b.description}`).not.toMatch(VENCIDO);
    expect(b.description).toMatch(/atacado em todos os planos/);
  });
});

describe("sitemap e robots da Commerce", () => {
  const opts = { themes: ["trama"], solutions: [], publicSolutions: false };
  it("lista as páginas da tabela conforme o que está ligado", () => {
    const aberto = sitemapPaths(brandByCode("NEXTLEVEL_COMMERCE", { BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true" }), opts);
    expect(aberto).toEqual(expect.arrayContaining(["/", "/planos", "/cadastro", "/comparativo", "/recursos", "/integracoes", "/ferramentas", "/faq", "/clientes", "/temas", "/temas/trama", "/parceiros/indique", "/parceiros/comissoes", "/termos"]));
    expect(new Set(aberto).size).toBe(aberto.length);
    const fechado = sitemapPaths(brandByCode("NEXTLEVEL_COMMERCE", { BRAND_PARTNERS_NEXTLEVEL_COMMERCE: "false" }), opts);
    expect(fechado).not.toContain("/cadastro");
    expect(fechado.filter((c) => c.startsWith("/parceiros"))).toEqual([]);
    expect(caminhosCommerce({ signupOpen: true, partnersOpen: true, modules: [] })).not.toContain("/temas");
  });

  it("robots cita os robôs de busca e de IA por nome", () => {
    for (const r of ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "meta-externalagent"]) expect(ROBOS_DE_IA).toContain(r);
  });

  it("IndexNow: a chave publicada é a mesma do código e do script", () => {
    expect(readFileSync(`public/${CHAVE_INDEXNOW}.txt`, "utf8").trim()).toBe(CHAVE_INDEXNOW);
    expect(readFileSync("scripts/indexnow.mjs", "utf8")).toContain(`"${CHAVE_INDEXNOW}"`);
  });
});

describe("perguntas frequentes da Commerce", () => {
  const fatos: FatosFaq = {
    diasDeTeste: 3,
    planos: [
      { nome: "Start", mensalCents: 5700, taxaBps: 0, suporte: "Chat e WhatsApp", migracao: "Paga à parte", faixasAtacado: 3, produtos: 300 },
      { nome: "Pro", mensalCents: 14700, taxaBps: 0, suporte: "Prioritário, em até 4 h", migracao: "50% de desconto", faixasAtacado: 5, produtos: 1000 },
      { nome: "Scale", mensalCents: 34700, taxaBps: 0, suporte: "Gerente de conta", migracao: "Inclusa", faixasAtacado: 5, produtos: null },
    ],
  };
  it("os números saem dos fatos do sistema e não há texto vencido", () => {
    const faq = faqCommerce(fatos);
    const tudo = faq.map((f) => `${f.q} ${f.a}`).join(" ");
    expect(tudo).not.toMatch(VENCIDO);
    expect(tudo).toContain("3 dias grátis");
    expect(tudo).toMatch(/Start R\$\s?57,00/);
    expect(tudo).toContain("de 3 a 5 faixas de preço");
    expect(tudo).toContain("Scale: sem limite");
    expect(faq.some((f) => /taxa sobre as minhas vendas/.test(f.q))).toBe(true);
    expect(new Set(faq.map((f) => f.q)).size).toBe(faq.length);
  });
  it("sem taxa zero, sem teste ou sem preço, a resposta correspondente não aparece (nunca afirma o que não vale)", () => {
    const faq = faqCommerce({ diasDeTeste: null, planos: fatos.planos.map((p) => ({ ...p, taxaBps: 150 })) });
    expect(faq.some((f) => /taxa sobre as minhas vendas/.test(f.q))).toBe(false);
    expect(faq.some((f) => /testar antes/.test(f.q))).toBe(false);
    expect(faq.map((f) => f.a).join(" ")).not.toMatch(/não cobra tarifa/);
    expect(faqCommerce({ diasDeTeste: 3, planos: fatos.planos.map((p) => ({ ...p, mensalCents: null })) }).some((f) => f.q === "Quanto custa?")).toBe(false);
  });
  it("os dados estruturados repetem exatamente as perguntas visíveis", () => {
    const faq = faqCommerce(fatos);
    const ld = faqJsonLd(faq);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(faq.map((f) => [f.q, f.a]));
  });
});

describe("entidade NextLevel Commerce (dados estruturados da home)", () => {
  it("empresa, contato, site e planos em reais; perfis só com endereço https", () => {
    const [org, site, app] = entidadeCommerce({ baseUrl: "https://nextlevelcommerce.com.br", whatsapp: "5511940862144", email: "contato@nextlevelcommerce.com.br", perfis: [], planos: [{ nome: "Start", mensalCents: 5700 }, { nome: "Sob consulta", mensalCents: null }] });
    expect(org).toMatchObject({ "@type": "Organization", name: "NextLevel Commerce", parentOrganization: { legalName: "NextLevel Marketing Ltda", taxID: "51.392.006/0001-92" } });
    expect(org).not.toHaveProperty("sameAs");
    expect(org!.contactPoint).toHaveLength(2);
    expect(site).toMatchObject({ "@type": "WebSite", inLanguage: "pt-BR" });
    expect(app!.offers).toEqual([{ "@type": "Offer", name: "Plano Start (mensal)", price: "57.00", priceCurrency: "BRL", url: "https://nextlevelcommerce.com.br/planos" }]);
    expect(perfisOficiais("https://instagram.com/nextlevel, http://inseguro.com, nada, https://www.linkedin.com/company/x")).toEqual(["https://instagram.com/nextlevel", "https://www.linkedin.com/company/x"]);
  });
});
