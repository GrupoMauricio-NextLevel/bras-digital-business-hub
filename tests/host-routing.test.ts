import { describe, it, expect } from "vitest";
import { routeHost, isPanelPath, panelUrl, groupLinkFor, storeOwnerBase } from "@/lib/host-routing";
import { brandPreviewAllowed } from "@/lib/brand";

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
    expect(go("www.superdrop.com.br", "/merchant/orders", env, "?q=a")).toEqual({ kind: "redirect", url: "https://office.superdrop.com.br/merchant/orders?q=a" });
    expect(go("lojas.nextlevelgroup.com.br", "/merchant")).toEqual({ kind: "redirect", url: "https://office.nextlevelgroup.com.br/merchant" });
  });
  it("as páginas públicas, vitrines, rastreio e API ficam no endereço público", () => {
    for (const p of ["/", "/planos", "/faq", "/cadastro", "/f/mantos-shop", "/store/mantos-shop", "/r/abc"]) expect(go("superdrop.com.br", p)).toEqual({ kind: "next" });
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
    for (const p of ["/login", "/supplier/orders", "/merchant", "/partner", "/account/password", "/theme-editor", "/esqueci-senha"]) expect(go("office.superdrop.com.br", p)).toEqual({ kind: "next" });
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
  it("o /master dos produtos leva ao endereço central, mantendo o caminho (MASTER_HOST_ONLY=false desliga)", () => {
    const e = {};
    expect(go("superdrop.com.br", "/master/orders", e, "?a=1")).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master/orders?a=1" });
    expect(go("lojas.nextlevelgroup.com.br", "/master", e)).toEqual({ kind: "redirect", url: "https://master.nextlevelgroup.com.br/master" });
    expect(go("superdrop.com.br", "/master", { MASTER_HOST_ONLY: "false" })).toEqual({ kind: "next" });
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
    for (const p of ["/", "/cadastro", "/termos", "/privacidade", "/d/bdv_abc123def", "/balcao/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "/balcao-club/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "/login", "/meu-bras", "/meu-bras/videos", "/esqueci-senha", "/api/health", "/r/abc", "/c/ABC123", "/meu-bras/club", "/meu-bras/fretes"]) expect(go("bras.nextlevelgroup.com.br", p, aberta)).toEqual({ kind: "next" });
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

describe("reorganização dos endereços (D149)", () => {
  const sd = "superdrop.com.br", cm = "lojas.nextlevelgroup.com.br", bd = "bras.nextlevelgroup.com.br", cg = "cargas.nextlevelgroup.com.br";
  const master = "https://master.nextlevelgroup.com.br";
  const e = { BRAND_SIGNUP_BRAS_DIGITAL: "true" };
  it("painéis da equipe (Master, Admin Commerce, Estúdio Brás) só no Master, mantendo caminho e busca", () => {
    expect(go(sd, "/commerce/stores", e, "?x=1")).toEqual({ kind: "redirect", url: `${master}/commerce/stores?x=1` });
    expect(go(bd, "/bras/videos", e)).toEqual({ kind: "redirect", url: `${master}/bras/videos` });
    expect(go(bd, "/master/bras", e)).toEqual({ kind: "redirect", url: `${master}/master/bras` });
    expect(go("office.superdrop.com.br", "/master")).toEqual({ kind: "redirect", url: `${master}/master` });
    expect(go("master.nextlevelgroup.com.br", "/bras", e)).toEqual({ kind: "next" });
    // localhost e endereços técnicos não mudam
    expect(go("localhost:3100", "/master", e)).toEqual({ kind: "next" });
    // não confunde com caminhos parecidos
    expect(go(sd, "/brasil", e)).toEqual({ kind: "next" });
  });
  it("painéis dos clientes ficam no endereço da marca deles; no de outra marca, vão para o certo", () => {
    for (const p of ["/merchant", "/supplier/orders", "/partner", "/theme-editor"]) { expect(go(sd, p, e)).toEqual({ kind: "next" }); expect(go(cm, p, e)).toEqual({ kind: "next" }); }
    expect(go(sd, "/meu-bras/club", e, "?a=1")).toEqual({ kind: "redirect", url: "https://bras.nextlevelgroup.com.br/meu-bras/club?a=1" });
    expect(go(cm, "/importadora", e)).toEqual({ kind: "redirect", url: "https://bras.nextlevelgroup.com.br/importadora" });
    expect(go(sd, "/transportadora/fretes", e)).toEqual({ kind: "redirect", url: "https://cargas.nextlevelgroup.com.br/transportadora/fretes" });
    expect(go(bd, "/meu-bras", e)).toEqual({ kind: "next" });
  });
  it("Soluções e Loja NextLevel moram no site do grupo (GROUP_SITE_URL quando ligado)", () => {
    expect(go(sd, "/solucoes", e)).toEqual({ kind: "redirect", url: `${master}/solucoes` });
    expect(go(cm, "/solucoes/loja-virtual", e)).toEqual({ kind: "redirect", url: `${master}/solucoes/loja-virtual` });
    expect(go(sd, "/loja-nextlevel/pedido/ABC", e)).toEqual({ kind: "redirect", url: `${master}/loja-nextlevel/pedido/ABC` });
    expect(go(sd, "/loja-nextlevel", { ...e, GROUP_SITE_URL: "https://nextlevelgroup.com.br/" })).toEqual({ kind: "redirect", url: "https://nextlevelgroup.com.br/loja-nextlevel" });
    expect(go("master.nextlevelgroup.com.br", "/loja-nextlevel/pedido/ABC", e)).toEqual({ kind: "next" });
    expect(go("master.nextlevelgroup.com.br", "/solucoes", e)).toEqual({ kind: "next" });
  });
  it("páginas do SuperDrop abertas na Commerce vão para o SuperDrop", () => {
    expect(go(cm, "/f/mantos-shop", {})).toEqual({ kind: "redirect", url: "https://superdrop.com.br/f/mantos-shop" });
    expect(go(cm, "/seja-fornecedor", {})).toEqual({ kind: "redirect", url: "https://superdrop.com.br/seja-fornecedor" });
    expect(go(cm, "/fornecedores", {})).toEqual({ kind: "redirect", url: "https://superdrop.com.br/fornecedores" });
    expect(go(sd, "/f/mantos-shop", {})).toEqual({ kind: "next" });
    expect(go(sd, "/seja-fornecedor", {})).toEqual({ kind: "next" });
  });
  it("termos e privacidade abrem em todas as marcas", () => {
    for (const h of [sd, cm, cg, "master.nextlevelgroup.com.br"]) for (const p of ["/termos", "/privacidade"]) expect(go(h, p, e)).toEqual({ kind: "next" });
  });
});

describe("links e vitrines na marca certa (D149)", () => {
  it("links para Soluções e Loja NextLevel: diretos no site do grupo a partir das marcas; relativos no grupo e na demonstração", () => {
    expect(groupLinkFor("/solucoes", "SUPERDROP", {})).toBe("https://master.nextlevelgroup.com.br/solucoes");
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
    // Sem GROUP_SITE_URL (antes da Fase 3) nada muda no Master.
    expect(go("master.nextlevelgroup.com.br", "/club", {})).toEqual({ kind: "next" });
  });
  it("loja SuperDrop aberta na Commerce (e o contrário) vai para a marca dona; demonstração de tema fica", () => {
    expect(storeOwnerBase("NEXTLEVEL_COMMERCE", "SUPERDROP", false, {})).toBe("https://superdrop.com.br");
    expect(storeOwnerBase("SUPERDROP", "NEXTLEVEL_COMMERCE", false, {})).toBe("https://lojas.nextlevelgroup.com.br");
    expect(storeOwnerBase("SUPERDROP", "SUPERDROP", false, {})).toBeNull();
    expect(storeOwnerBase("SUPERDROP", "NEXTLEVEL_COMMERCE", true, {})).toBeNull();
    expect(storeOwnerBase(null, "NEXTLEVEL_COMMERCE", false, {})).toBeNull(); // demonstração, localhost, domínio próprio
    expect(storeOwnerBase("NEXTLEVEL", "SUPERDROP", false, {})).toBeNull(); // Master (suporte)
  });
  it("atalho /lojas só na demonstração; robots e sitemap passam em qualquer endereço", () => {
    expect(brandPreviewAllowed({ NEXT_PUBLIC_DEMO_MODE: "true" })).toBe(true);
    expect(brandPreviewAllowed({})).toBe(false);
    for (const h of ["superdrop.com.br", "master.nextlevelgroup.com.br", "bras.nextlevelgroup.com.br", "cargas.nextlevelgroup.com.br", "hubcreators.nextlevelgroup.com.br"]) for (const p of ["/robots.txt", "/sitemap.xml"]) expect(go(h, p, {})).toEqual({ kind: "next" });
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

