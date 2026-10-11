import { describe, it, expect } from "vitest";
import { routeHost, isPanelPath, panelUrl } from "@/lib/host-routing";

const env = { BRAND_DOMAINS_NEXTLEVEL_COMMERCE: "lojas.nextlevelgroup.com.br,office.nextlevelgroup.com.br", BRAND_OFFICE_SUPERDROP: "https://office.superdrop.com.br", BRAND_OFFICE_NEXTLEVEL_COMMERCE: "https://office.nextlevelgroup.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://lojas.nextlevelgroup.com.br" };
const go = (host: string, pathname: string, e: Record<string, string | undefined> = env, search = "") => routeHost({ host, pathname, search }, e);

describe("endereço público × endereço dos painéis", () => {
  it("sem escritório configurado nada muda (painéis no endereço público)", () => {
    expect(go("superdrop.com.br", "/login", {})).toEqual({ kind: "next" });
    expect(go("superdrop.com.br", "/merchant/orders", {})).toEqual({ kind: "next" });
    expect(go("superdrop.com.br", "/planos", {})).toEqual({ kind: "next" });
  });
  it("endereços técnicos e localhost nunca são redirecionados", () => {
    expect(go("localhost:3100", "/login")).toEqual({ kind: "next" });
    expect(go("superdrop.onrender.com", "/master")).toEqual({ kind: "next" });
  });
  it("no endereço público, os painéis vão para o escritório da mesma marca, mantendo caminho e busca", () => {
    expect(go("superdrop.com.br", "/login")).toEqual({ kind: "redirect", url: "https://office.superdrop.com.br/login" });
    expect(go("www.superdrop.com.br", "/master/stores", env, "?q=a")).toEqual({ kind: "redirect", url: "https://office.superdrop.com.br/master/stores?q=a" });
    expect(go("lojas.nextlevelgroup.com.br", "/merchant")).toEqual({ kind: "redirect", url: "https://office.nextlevelgroup.com.br/merchant" });
  });
  it("as páginas públicas, vitrines, rastreio e API ficam no endereço público", () => {
    for (const p of ["/", "/planos", "/faq", "/cadastro", "/f/mantos-shop", "/store/mantos-shop", "/r/abc", "/loja-nextlevel"]) expect(go("superdrop.com.br", p)).toEqual({ kind: "next" });
    expect(go("superdrop.com.br", "/api/webhooks/mercadopago")).toEqual({ kind: "next" });
  });
  it("/loja/<nome> é apelido da vitrine no endereço público", () => {
    expect(go("superdrop.com.br", "/loja/arena-10")).toEqual({ kind: "rewrite", path: "/store/arena-10" });
    expect(go("superdrop.com.br", "/loja/arena-10/produto/x")).toEqual({ kind: "rewrite", path: "/store/arena-10/produto/x" });
    expect(go("localhost:3100", "/loja/arena-10", {})).toEqual({ kind: "rewrite", path: "/store/arena-10" });
  });
  it("no escritório: raiz e atalhos de convite levam ao login; painéis e API passam; público volta ao endereço público", () => {
    expect(go("office.superdrop.com.br", "/")).toEqual({ kind: "redirect", url: "/login" });
    expect(go("office.superdrop.com.br", "/f/mantos-shop")).toEqual({ kind: "redirect", url: "/login?area=fornecedor&nome=mantos-shop" });
    expect(go("office.superdrop.com.br", "/loja/arena-10")).toEqual({ kind: "redirect", url: "/login?area=loja&nome=arena-10" });
    expect(go("office.superdrop.com.br", "/afiliado")).toEqual({ kind: "redirect", url: "/login?area=afiliado" });
    for (const p of ["/login", "/master", "/supplier/orders", "/merchant", "/partner", "/account/password", "/theme-editor", "/esqueci-senha"]) expect(go("office.superdrop.com.br", p)).toEqual({ kind: "next" });
    expect(go("office.superdrop.com.br", "/api/cron/x")).toEqual({ kind: "next" });
    expect(go("office.superdrop.com.br", "/planos")).toEqual({ kind: "redirect", url: "https://superdrop.com.br/planos" });
    expect(go("office.superdrop.com.br", "/store/arena-10/cart")).toEqual({ kind: "redirect", url: "https://superdrop.com.br/store/arena-10/cart" });
  });
  it("cada marca só fala do próprio escritório (o escritório de uma não é o da outra)", () => {
    expect(go("office.nextlevelgroup.com.br", "/planos")).toEqual({ kind: "redirect", url: "https://lojas.nextlevelgroup.com.br/planos" });
    expect(go("office.nextlevelgroup.com.br", "/login")).toEqual({ kind: "next" });
  });
  it("detecta caminho de painel e monta o endereço", () => {
    expect(isPanelPath("/merchant")).toBe(true); expect(isPanelPath("/merchantx")).toBe(false); expect(isPanelPath("/store/x")).toBe(false);
    expect(panelUrl({ baseUrl: "https://a.com", officeUrl: "https://o.a.com" }, "/login")).toBe("https://o.a.com/login");
    expect(panelUrl({ baseUrl: "https://a.com", officeUrl: null }, "/login")).toBe("https://a.com/login");
  });
});

describe("Master central e produtos em breve", () => {
  it("no Master central só há login e painéis; o resto volta ao login", () => {
    expect(go("master.nextlevelgroup.com.br", "/login", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/master/stores", {})).toEqual({ kind: "next" });
    // Console Commerce é painel do Master: abre no endereço central (antes voltava ao login e ao /master)
    expect(go("master.nextlevelgroup.com.br", "/commerce", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/commerce/stores", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/planos", {})).toEqual({ kind: "redirect", url: "/login" });
    expect(go("master.nextlevelgroup.com.br", "/", {})).toEqual({ kind: "redirect", url: "/login" });
  });
  it("com MASTER_HOST_ONLY o /master dos produtos leva ao endereço central, mantendo o caminho", () => {
    const e = { MASTER_HOST_ONLY: "true" };
    expect(go("superdrop.com.br", "/master/orders", e, "?a=1")).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master/orders?a=1" });
    expect(go("lojas.nextlevelgroup.com.br", "/master", e)).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master" });
    expect(go("superdrop.com.br", "/master", {})).toEqual({ kind: "next" });
  });
  it("produto em breve mostra só a página inicial e a lista de espera", () => {
    for (const host of ["bras.nextlevelgroup.com.br", "hubcreators.nextlevelgroup.com.br", "chinahubglobal.com.br"]) {
      expect(go(host, "/", {})).toEqual({ kind: "next" });
      expect(go(host, "/quero-minha-loja", {})).toEqual({ kind: "next" });
      expect(go(host, "/planos", {})).toEqual({ kind: "redirect", url: "/" });
      expect(go(host, "/login", {})).toEqual({ kind: "next" });
    }
  });
});

describe("Brás Digital aberta (D92): só apresentação, cadastro e painéis", () => {
  const aberta = { BRAND_SIGNUP_BRAS_DIGITAL: "true" };
  it("páginas da Brás e painéis seguem; páginas das outras marcas voltam para o início", () => {
    for (const p of ["/", "/cadastro", "/termos", "/privacidade", "/d/bdv_abc123def", "/balcao/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "/balcao-club/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "/login", "/meu-bras", "/meu-bras/videos", "/master/bras", "/bras", "/bras/videos", "/esqueci-senha", "/api/health", "/r/abc", "/c/ABC123", "/meu-bras/club", "/meu-bras/fretes"]) expect(go("bras.nextlevelgroup.com.br", p, aberta)).toEqual({ kind: "next" });
    for (const p of ["/balcao/curto", "/balcao-club/curto", "/d/../planos", "/d/bdv_x/extra", "/planos", "/temas", "/como-funciona", "/seja-fornecedor", "/f/importadora", "/store/mantos-shop", "/loja/mantos-shop", "/solucoes"]) expect(go("bras.nextlevelgroup.com.br", p, aberta)).toEqual({ kind: "redirect", url: "/" });
  });
  it("as outras marcas não mudam", () => {
    expect(go("superdrop.com.br", "/planos", aberta)).toEqual({ kind: "next" });
    expect(isPanelPath("/meu-bras")).toBe(true);
    expect(isPanelPath("/bras/membros")).toBe(true);
    expect(isPanelPath("/brasil")).toBe(false);
  });
});


describe("arquivos estáticos fora do proxy (D107)", () => {
  it("imagens AVIF, WebP, PNG e JPG não passam pelo roteamento por endereço (senão a marca fechada as redireciona)", async () => {
    const { config } = await import("@/proxy");
    const re = new RegExp(`^${config.matcher[0]!}$`);
    for (const f of ["/portal/bras/v3/bd-corredor-caixas.avif", "/portal/bras/v3/bd-corredor-caixas.webp", "/portal/bras/v3/bd-og-portal.jpg", "/temas/lume-desktop-3.webp", "/brand/x.png"]) expect(re.test(f)).toBe(false);
    for (const p of ["/", "/cadastro", "/bras/visao", "/d/bdv_abc123"]) expect(re.test(p)).toBe(true);
  });
});
