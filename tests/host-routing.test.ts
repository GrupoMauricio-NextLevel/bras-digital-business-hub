import { describe, it, expect } from "vitest";
import { routeHost, isPanelPath, panelUrl } from "@/lib/host-routing";

const env = { BRAND_OFFICE_SUPERDROP: "https://office.superdrop.com.br", BRAND_OFFICE_NEXTLEVEL_COMMERCE: "https://office.nextlevelgroup.com.br", BRAND_URL_NEXTLEVEL_COMMERCE: "https://lojas.nextlevelgroup.com.br" };
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
