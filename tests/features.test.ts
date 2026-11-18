import { describe, expect, it } from "vitest";
import { canUse, minOfferFor, requireFeature } from "@/lib/features";
import { enderecoDeTeste, slugFromHost, storeUrl } from "@/lib/store-url";

describe("gates por oferta", () => {
  it("Drop manual não tem vitrine nem domínio; Loja própria libera tudo", () => {
    expect(canUse("DROP_MANUAL", "storefront")).toBe(false);
    expect(canUse("DROP_MANUAL", "manualOrders")).toBe(true);
    expect(canUse("STORE_SUBDOMAIN", "storefront")).toBe(true);
    expect(canUse("STORE_SUBDOMAIN", "customDomain")).toBe(false);
    expect(canUse("STORE_OWN", "customDomain")).toBe(true);
    expect(minOfferFor("analytics")).toBe("STORE_OWN");
    expect(minOfferFor("storefront")).toBe("STORE_SUBDOMAIN");
  });
  it("requireFeature explica onde liberar", () => {
    expect(() => requireFeature("STORE_SUBDOMAIN", "customDomain")).toThrow(/Loja própria/);
    expect(() => requireFeature("STORE_OWN", "customDomain")).not.toThrow();
  });
});

describe("subdomínio da loja", () => {
  it("extrai o slug apenas de slug.dominio-raiz", () => {
    expect(slugFromHost("mantos.superdrop.com.br", "superdrop.com.br")).toBe("mantos");
    expect(slugFromHost("MANTOS.superdrop.com.br:443", "superdrop.com.br")).toBe("mantos");
    expect(slugFromHost("superdrop.com.br", "superdrop.com.br")).toBeNull();
    expect(slugFromHost("www.superdrop.com.br", "superdrop.com.br")).toBeNull();
    expect(slugFromHost("a.b.superdrop.com.br", "superdrop.com.br")).toBeNull();
    expect(slugFromHost("evil.com", "superdrop.com.br")).toBeNull();
    expect(slugFromHost("x.superdrop.com.br.evil.com", "superdrop.com.br")).toBeNull();
    // Endereço de teste da Commerce (slug.nextlevelcommerce.com.br): subdomínios da plataforma nunca viram loja.
    expect(slugFromHost("vestiario-das-lendas.nextlevelcommerce.com.br", ["", "nextlevelcommerce.com.br"])).toBe("vestiario-das-lendas");
    for (const sub of ["www", "painel", "master", "api"]) expect(slugFromHost(`${sub}.nextlevelcommerce.com.br`, ["superdrop.com.br", "nextlevelcommerce.com.br"])).toBeNull();
    expect(enderecoDeTeste("vestiario-das-lendas", "nextlevelcommerce.com.br")).toBe("https://vestiario-das-lendas.nextlevelcommerce.com.br");
    expect(enderecoDeTeste("x", "")).toBeNull();
    expect(slugFromHost("mantos.localhost", "")).toBeNull();
  });
  it("cai no caminho /store/[slug] sem domínio raiz configurado", () => {
    expect(storeUrl("mantos", "STORE_SUBDOMAIN")).toBe("/store/mantos");
    expect(storeUrl("mantos", "STORE_OWN", "loja.com", "CONNECTED")).toBe("https://loja.com");
  });
});
