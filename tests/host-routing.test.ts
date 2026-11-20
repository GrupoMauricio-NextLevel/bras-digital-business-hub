import { describe, it, expect } from "vitest";
import { routeHost, isPanelPath, panelUrl, groupLinkFor, storeOwnerBase } from "@/lib/host-routing";
import { brandPreviewAllowed } from "@/lib/brand";

const env = { BRAND_DOMAINS_NEXTLEVEL_COMMERCE: "lojas.nextlevelgroup.com.br,office.nextlevelgroup.com.br", BRAND_OFFICE_NEXTLEVEL_COMMERCE: "https://office.nextlevelgroup.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://lojas.nextlevelgroup.com.br" };
const go = (host: string, pathname: string, e: Record<string, string | undefined> = env, search = "") => routeHost({ host, pathname, search }, e);

describe("endereço público × endereço dos painéis", () => {
  it("sem escritório configurado nada muda (painéis no endereço público)", () => {
    expect(go("lojas.nextlevelgroup.com.br", "/login", {})).toEqual({ kind: "next" });
    expect(go("lojas.nextlevelgroup.com.br", "/merchant/orders", {})).toEqual({ kind: "next" });
    expect(go("lojas.nextlevelgroup.com.br", "/planos", {})).toEqual({ kind: "next" });
  });
  it("endereços técnicos e localhost nunca são redirecionados", () => {
    expect(go("localhost:3100", "/login")).toEqual({ kind: "next" });
    expect(go("superdrop.onrender.com", "/master")).toEqual({ kind: "next" });
  });
  it("no endereço público, os painéis vão para o escritório da mesma marca, mantendo caminho e busca", () => {
    expect(go("lojas.nextlevelgroup.com.br", "/login")).toEqual({ kind: "redirect", url: "https://office.nextlevelgroup.com.br/login" });
    expect(go("www.lojas.nextlevelgroup.com.br", "/merchant/orders", env, "?q=a")).toEqual({ kind: "redirect", url: "https://office.nextlevelgroup.com.br/merchant/orders?q=a" });
  });
  it("as páginas públicas, vitrines, rastreio e API ficam no endereço público", () => {
    for (const p of ["/", "/planos", "/faq", "/cadastro", "/f/mantos-shop", "/store/mantos-shop", "/r/abc"]) expect(go("lojas.nextlevelgroup.com.br", p, {})).toEqual({ kind: "next" });
    expect(go("lojas.nextlevelgroup.com.br", "/api/webhooks/mercadopago", {})).toEqual({ kind: "next" });
  });
  it("/loja/<nome> é apelido da vitrine no endereço público", () => {
    expect(go("lojas.nextlevelgroup.com.br", "/loja/arena-10", {})).toEqual({ kind: "rewrite", path: "/store/arena-10" });
    expect(go("lojas.nextlevelgroup.com.br", "/loja/arena-10/produto/x", {})).toEqual({ kind: "rewrite", path: "/store/arena-10/produto/x" });
    expect(go("localhost:3100", "/loja/arena-10", {})).toEqual({ kind: "rewrite", path: "/store/arena-10" });
  });
  it("no escritório: raiz e atalhos de convite levam ao login; painéis e API passam; público volta ao endereço público", () => {
    expect(go("office.nextlevelgroup.com.br", "/")).toEqual({ kind: "redirect", url: "/login" });
    expect(go("office.nextlevelgroup.com.br", "/f/mantos-shop")).toEqual({ kind: "redirect", url: "/login?area=fornecedor&nome=mantos-shop" });
    expect(go("office.nextlevelgroup.com.br", "/loja/arena-10")).toEqual({ kind: "redirect", url: "/login?area=loja&nome=arena-10" });
    expect(go("office.nextlevelgroup.com.br", "/afiliado")).toEqual({ kind: "redirect", url: "/login?area=afiliado" });
    for (const p of ["/login", "/supplier/orders", "/merchant", "/partner", "/account/password", "/theme-editor", "/esqueci-senha"]) expect(go("office.nextlevelgroup.com.br", p)).toEqual({ kind: "next" });
    expect(go("office.nextlevelgroup.com.br", "/api/cron/x")).toEqual({ kind: "next" });
    expect(go("office.nextlevelgroup.com.br", "/planos")).toEqual({ kind: "redirect", url: "https://lojas.nextlevelgroup.com.br/planos" });
    expect(go("office.nextlevelgroup.com.br", "/store/arena-10/cart")).toEqual({ kind: "redirect", url: "https://lojas.nextlevelgroup.com.br/store/arena-10/cart" });
  });
  it("detecta caminho de painel e monta o endereço", () => {
    expect(isPanelPath("/merchant")).toBe(true); expect(isPanelPath("/merchantx")).toBe(false); expect(isPanelPath("/store/x")).toBe(false);
    expect(panelUrl({ baseUrl: "https://a.com", officeUrl: "https://o.a.com" }, "/login")).toBe("https://o.a.com/login");
    expect(panelUrl({ baseUrl: "https://a.com", officeUrl: null }, "/login")).toBe("https://a.com/login");
  });
});

describe("Master central", () => {
  it("no Master central só há login e painéis; o resto volta ao login", () => {
    expect(go("master.nextlevelgroup.com.br", "/login", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/master/stores", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/commerce", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/commerce/stores", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/planos", {})).toEqual({ kind: "redirect", url: "/login" });
    expect(go("master.nextlevelgroup.com.br", "/", {})).toEqual({ kind: "redirect", url: "/login" });
  });
  it("a vitrine abre no Master: é a prévia do editor de temas quando a equipe age em nome do cliente", () => {
    expect(go("master.nextlevelgroup.com.br", "/store/vestiario-das-lendas", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/store/vestiario-das-lendas/catalog", {})).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/storefront", {})).toEqual({ kind: "redirect", url: "/login" });
    expect(go("master.nextlevelgroup.com.br", "/assets/ast_abc123", {})).toEqual({ kind: "next" });
  });
  it("o /master dos produtos leva ao endereço central, mantendo o caminho (MASTER_HOST_ONLY=false desliga)", () => {
    const e = {};
    expect(go("lojas.nextlevelgroup.com.br", "/master/orders", e, "?a=1")).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master/orders?a=1" });
    expect(go("lojas.nextlevelgroup.com.br", "/master", e)).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master" });
    expect(go("lojas.nextlevelgroup.com.br", "/master", { MASTER_HOST_ONLY: "false" })).toEqual({ kind: "next" });
  });
});

describe("arquivos estáticos fora do proxy (D107)", () => {
  it("imagens AVIF, WebP, PNG e JPG não passam pelo roteamento por endereço", async () => {
    const { config } = await import("@/proxy");
    const re = new RegExp(`^${config.matcher[0]!}$`);
    for (const f of ["/portal/bras/v3/bd-corredor-caixas.avif", "/portal/bras/v3/bd-corredor-caixas.webp", "/portal/bras/v3/bd-og-portal.jpg", "/temas/lume-desktop-3.webp", "/brand/x.png"]) expect(re.test(f)).toBe(false);
    for (const p of ["/", "/cadastro", "/d/bdv_abc123"]) expect(re.test(p)).toBe(true);
  });
});

describe("reorganização dos endereços (D149)", () => {
  const cm = "lojas.nextlevelgroup.com.br";
  const master = "https://master.nextlevelgroup.com.br";
  const e = {};
  it("painéis da equipe (Master, Admin Commerce) só no Master, mantendo caminho e busca", () => {
    expect(go(cm, "/commerce/stores", e, "?x=1")).toEqual({ kind: "redirect", url: `${master}/commerce/stores?x=1` });
    expect(go("office.nextlevelgroup.com.br", "/master")).toEqual({ kind: "redirect", url: `${master}/master` });
    expect(go("localhost:3100", "/master", e)).toEqual({ kind: "next" });
    expect(go(cm, "/brasil", e)).toEqual({ kind: "next" });
  });
  it("painéis dos clientes ficam no endereço da marca deles", () => {
    for (const p of ["/merchant", "/supplier/orders", "/partner", "/theme-editor"]) expect(go(cm, p, e)).toEqual({ kind: "next" });
  });
  it("Soluções e Loja NextLevel moram no site do grupo (GROUP_SITE_URL quando ligado)", () => {
    expect(go(cm, "/solucoes", e)).toEqual({ kind: "redirect", url: `${master}/solucoes` });
    expect(go(cm, "/solucoes/loja-virtual", e)).toEqual({ kind: "redirect", url: `${master}/solucoes/loja-virtual` });
    expect(go(cm, "/loja-nextlevel/pedido/ABC", e)).toEqual({ kind: "redirect", url: `${master}/loja-nextlevel/pedido/ABC` });
    expect(go(cm, "/loja-nextlevel", { ...e, GROUP_SITE_URL: "https://nextlevelgroup.com.br/" })).toEqual({ kind: "redirect", url: "https://nextlevelgroup.com.br/loja-nextlevel" });
    expect(go("master.nextlevelgroup.com.br", "/loja-nextlevel/pedido/ABC", e)).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/solucoes", e)).toEqual({ kind: "next" });
  });
  it("termos e privacidade abrem em todas as marcas", () => {
    for (const h of [cm, "master.nextlevelgroup.com.br"]) for (const p of ["/termos", "/privacidade"]) expect(go(h, p, e)).toEqual({ kind: "next" });
  });
});

describe("links e vitrines na marca certa (D149)", () => {
  it("links para Soluções e Loja NextLevel: diretos no site do grupo a partir das marcas; relativos no grupo e na demonstração", () => {
    expect(groupLinkFor("/solucoes", "NEXTLEVEL_COMMERCE", {})).toBe("https://master.nextlevelgroup.com.br/solucoes");
    expect(groupLinkFor("/loja-nextlevel", "NEXTLEVEL_COMMERCE", { GROUP_SITE_URL: "https://nextlevelgroup.com.br" })).toBe("https://nextlevelgroup.com.br/loja-nextlevel");
    expect(groupLinkFor("/solucoes", "NEXTLEVEL", {})).toBe("/solucoes");
    expect(groupLinkFor("/solucoes", null, {})).toBe("/solucoes");
  });
  it("no endereço próprio do grupo, a página inicial é a de Soluções; no Master, o login", () => {
    const g = { GROUP_SITE_URL: "https://nextlevelgroup.com.br", BRAND_DOMAINS_NEXTLEVEL: "master.nextlevelgroup.com.br,nextlevelgroup.com.br" };
    expect(go("nextlevelgroup.com.br", "/", g, "?ref=AB")).toEqual({ kind: "redirect", url: "/solucoes?ref=AB" });
    expect(go("master.nextlevelgroup.com.br", "/", g)).toEqual({ kind: "redirect", url: "/login" });
  });
  it("Fase 3 (D156): www vai ao principal; no site do grupo só as páginas do grupo; login e painéis no Master", () => {
    const g = { GROUP_SITE_URL: "https://nextlevelgroup.com.br" };
    expect(go("www.nextlevelgroup.com.br", "/club", g, "?x=1")).toEqual({ kind: "redirect", url: "https://nextlevelgroup.com.br/club?x=1" });
    for (const p of ["/solucoes", "/solucoes/white-label", "/club", "/meu-contador", "/loja-nextlevel", "/termos", "/privacidade", "/api/health", "/r/ABC"]) expect(go("nextlevelgroup.com.br", p, g), p).toEqual({ kind: "next" });
    expect(go("nextlevelgroup.com.br", "/login", g)).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/login" });
    expect(go("nextlevelgroup.com.br", "/master/financeiro", g)).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master/financeiro" });
    expect(go("nextlevelgroup.com.br", "/qualquer", g)).toEqual({ kind: "redirect", url: "/solucoes" });
    expect(go("master.nextlevelgroup.com.br", "/club", {})).toEqual({ kind: "next" });
  });
  it("vitrine de loja fica no endereço da própria marca; demonstração de tema fica", () => {
    expect(storeOwnerBase("NEXTLEVEL_COMMERCE", "NEXTLEVEL_COMMERCE", false, {})).toBeNull();
    expect(storeOwnerBase("NEXTLEVEL_COMMERCE", "NEXTLEVEL_COMMERCE", true, {})).toBeNull();
    expect(storeOwnerBase(null, "NEXTLEVEL_COMMERCE", false, {})).toBeNull();
    expect(storeOwnerBase("NEXTLEVEL", "NEXTLEVEL_COMMERCE", false, {})).toBeNull();
  });
  it("atalho /lojas só na demonstração; robots e sitemap passam em qualquer endereço", () => {
    expect(brandPreviewAllowed({ NEXT_PUBLIC_DEMO_MODE: "true" })).toBe(true);
    expect(brandPreviewAllowed({})).toBe(false);
    for (const h of ["lojas.nextlevelgroup.com.br", "master.nextlevelgroup.com.br"]) for (const p of ["/robots.txt", "/sitemap.xml"]) expect(go(h, p, {})).toEqual({ kind: "next" });
  });
});

describe("domínio principal da Commerce (D281)", () => {
  const novo = { BRAND_DOMAINS_NEXTLEVEL_COMMERCE: "lojas.nextlevelgroup.com.br,nextlevelcommerce.com.br,www.nextlevelcommerce.com.br,office.nextlevelgroup.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://nextlevelcommerce.com.br", BRAND_OFFICE_NEXTLEVEL_COMMERCE: "https://office.nextlevelgroup.com.br", EC_DOMINIO_PRINCIPAL: "1" };
  it("endereço antigo e www levam ao novo, mesmo caminho, de forma permanente", () => {
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/planos", search: "?ref=abc" }, novo)).toEqual({ kind: "redirect", url: "https://nextlevelcommerce.com.br/planos?ref=abc", permanente: true });
    expect(routeHost({ host: "www.nextlevelcommerce.com.br", pathname: "/" }, novo)).toEqual({ kind: "redirect", url: "https://nextlevelcommerce.com.br/", permanente: true });
  });
  it("avisos do Mercado Pago, formulários e o endereço dos painéis não são redirecionados", () => {
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/api/webhooks/mercadopago", method: "POST" }, novo)).not.toMatchObject({ permanente: true });
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/api/qualquer" }, novo)).not.toMatchObject({ permanente: true });
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/cadastro", method: "POST" }, novo)).not.toMatchObject({ permanente: true });
    expect(routeHost({ host: "office.nextlevelgroup.com.br", pathname: "/merchant" }, novo)).not.toMatchObject({ permanente: true });
    expect(routeHost({ host: "nextlevelcommerce.com.br", pathname: "/planos" }, novo)).toEqual({ kind: "next" });
  });
  it("sem a chave ligada nenhum endereço redireciona (nem o novo para o antigo)", () => {
    const hoje = { BRAND_DOMAINS_NEXTLEVEL_COMMERCE: "lojas.nextlevelgroup.com.br,nextlevelcommerce.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://lojas.nextlevelgroup.com.br" };
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/planos" }, hoje)).toEqual({ kind: "next" });
    expect(routeHost({ host: "nextlevelcommerce.com.br", pathname: "/planos" }, hoje)).toEqual({ kind: "next" });
    expect(routeHost({ host: "lojas.nextlevelgroup.com.br", pathname: "/planos" }, { ...novo, EC_DOMINIO_PRINCIPAL: undefined })).toEqual({ kind: "next" });
  });
});

describe("endereço das agências (D315)", () => {
  const ag = { AGENCIAS_URL: "https://painel.nextlevelcommerce.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://nextlevelcommerce.com.br" };
  it("sem AGENCIAS_URL nada muda", () => {
    expect(go("lojas.nextlevelgroup.com.br", "/agencia", {})).toEqual({ kind: "next" });
  });
  it("no endereço das agências: início vai ao login; login, senha e painel abrem; o resto vai para a Commerce", () => {
    expect(go("painel.nextlevelcommerce.com.br", "/", ag)).toEqual({ kind: "redirect", url: "/login" });
    for (const p of ["/login", "/agencia", "/agencia/producao/agpc_x", "/account/password", "/esqueci-senha", "/redefinir-senha", "/api/x"]) expect(go("painel.nextlevelcommerce.com.br", p, ag)).toEqual({ kind: "next" });
    expect(go("painel.nextlevelcommerce.com.br", "/planos", ag, "?a=1")).toEqual({ kind: "redirect", url: "https://nextlevelcommerce.com.br/planos?a=1" });
    expect(go("painel.nextlevelcommerce.com.br", "/merchant", ag)).toEqual({ kind: "redirect", url: "https://nextlevelcommerce.com.br/merchant" });
  });
  it("nos endereços das marcas, /agencia vai para o endereço das agências; endereço técnico não muda", () => {
    expect(go("lojas.nextlevelgroup.com.br", "/agencia/clientes", ag, "?situacao=ATIVO")).toEqual({ kind: "redirect", url: "https://painel.nextlevelcommerce.com.br/agencia/clientes?situacao=ATIVO" });
    expect(go("master.nextlevelgroup.com.br", "/agencia", ag)).toEqual({ kind: "redirect", url: "https://painel.nextlevelcommerce.com.br/agencia" });
    expect(go("superdrop.onrender.com", "/agencia", ag)).toEqual({ kind: "next" });
    expect(go("lojas.nextlevelgroup.com.br", "/agencias", ag)).not.toEqual({ kind: "redirect", url: "https://painel.nextlevelcommerce.com.br/agencias" });
  });
});
