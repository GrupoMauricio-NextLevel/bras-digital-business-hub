import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { routeHost } from "@/lib/host-routing";
import { GroupPrivacy, GroupTerms } from "@/components/portal/legal-grupo";
import { NAV } from "@/lib/nav";

/** D148: termos e privacidade do grupo em todas as marcas; endereço do grupo só com páginas do grupo; categorias do fornecedor no menu. */
describe("termos e privacidade do grupo", () => {
  it("abrem no endereço do grupo e na Cargas; o resto do Master continua indo para a entrada", () => {
    for (const p of ["/termos", "/privacidade", "/solucoes"]) expect(routeHost({ host: "master.nextlevelgroup.com.br", pathname: p }, {})).toEqual({ kind: "next" });
    expect(routeHost({ host: "master.nextlevelgroup.com.br", pathname: "/planos" }, {})).toEqual({ kind: "redirect", url: "/login" });
    for (const p of ["/termos", "/privacidade"]) expect(routeHost({ host: "cargas.nextlevelgroup.com.br", pathname: p }, {})).toEqual({ kind: "next" });
    expect(routeHost({ host: "cargas.nextlevelgroup.com.br", pathname: "/planos" }, {})).toEqual({ kind: "redirect", url: "/" });
  });
  it("um texto só para o grupo, com a marca no topo, sem promessa de ganho e com os links entre si", () => {
    const t = renderToStaticMarkup(<GroupTerms marca="SuperDrop" />);
    expect(t).toContain("Grupo NextLevel · SuperDrop");
    expect(t).toContain("NextLevel Marketing Ltda.");
    expect(t).toContain("Não são promessa de venda");
    expect(t).toContain('href="/privacidade"');
    const p = renderToStaticMarkup(<GroupPrivacy marca="NextLevel E-commerce" />);
    expect(p).toContain("controladora");
    expect(p).toContain('href="/termos"');
  });
  it("categorias do fornecedor têm caminho pelo menu", () => {
    expect(NAV.SUPPLIER_ADMIN.items.some((i) => i.href === "/supplier/products/categorias")).toBe(true);
  });
});
