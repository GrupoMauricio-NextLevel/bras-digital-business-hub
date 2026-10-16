import { describe, expect, it } from "vitest";
import { BRAND_CODES, brandByCode, brandForHost, brandHas, brandsFrom, defaultBrandCode } from "@/lib/brand";

describe("marcas do portfólio", () => {
  it("resolve a marca pelo domínio, com subdomínios e porta, e cai na marca padrão para endereços desconhecidos", () => {
    expect(brandForHost("lojas.nextlevelgroup.com.br", {}).code).toBe("NEXTLEVEL_COMMERCE");
    expect(brandForHost("lojas.nextlevelgroup.com.br:443", {}).code).toBe("NEXTLEVEL_COMMERCE");
    expect(brandForHost("app.nextlevelcommerce.com.br", {}).code).toBe("NEXTLEVEL_COMMERCE");
    expect(brandForHost("superdrop.com.br", {}).code).toBe("SUPERDROP");
    expect(brandForHost("loja1.superdrop.com.br", {}).code).toBe("SUPERDROP");
    expect(brandForHost("localhost:3100", {}).code).toBe("SUPERDROP");
    expect(brandForHost(null, {}).code).toBe("SUPERDROP");
    expect(brandForHost("evilnextlevelgroup.com.br", {}).code).toBe("SUPERDROP");
    expect(brandForHost("nextlevelgroup.com.br", {}).code).toBe("NEXTLEVEL"); // Fase 3 (D156): a raiz é o site do grupo, no sistema
  });
  it("domínios e marca padrão vêm de variáveis de ambiente", () => {
    const env = { BRAND_DOMAINS_BRAS_DIGITAL: "brasdigital.com.br, www.brasdigital.com.br", DEFAULT_BRAND: "NEXTLEVEL_COMMERCE" };
    expect(brandForHost("brasdigital.com.br", env).code).toBe("BRAS_DIGITAL");
    expect(brandForHost("qualquer.onrender.com", env).code).toBe("NEXTLEVEL_COMMERCE");
    expect(defaultBrandCode({ DEFAULT_BRAND: "invalida" })).toBe("SUPERDROP");
  });
  it("cada marca tem os seus módulos; nenhum texto de marca está vazio; Brás Digital ainda não está no ar", () => {
    const all = brandsFrom({});
    expect(BRAND_CODES.every((c) => all[c].name && all[c].tagline && all[c].legalLine.includes("NextLevel Marketing Ltda."))).toBe(true);
    expect(brandHas(all.SUPERDROP, "dropship")).toBe(true);
    expect(brandHas(all.NEXTLEVEL_COMMERCE, "dropship")).toBe(false);
    expect(brandHas(all.BRAS_DIGITAL, "marketplace")).toBe(true);
    expect(all.BRAS_DIGITAL.live).toBe(false);
    expect(all.NEXTLEVEL_COMMERCE.signupOpen).toBe(false);
    expect(brandsFrom({ BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true" }).NEXTLEVEL_COMMERCE.signupOpen).toBe(true);
    const bras = brandByCode("BRAS_DIGITAL", {});
    expect(bras.name).toBe("Brás Digital");
    expect(bras.signupOpen).toBe(false);
    expect(bras.description).toMatch(/fechada/i);
    expect(bras.soon?.text).toMatch(/membros aprovados/i);
    expect(brandByCode("xyz", {}).code).toBe("SUPERDROP");
  });
});

describe("marca nos cadastros e nos e-mails", () => {
  it("organizações nascem com a marca do endereço; e-mail usa o nome, as cores e o domínio da marca; lista de espera não duplica", async () => {
    const { freshDb } = await import("./setup");
    const { signupMember } = await import("@/lib/domain/store-access");
    const { registerPartner } = await import("@/lib/domain/partners");
    const { createBrandLead, listBrandLeads } = await import("@/lib/domain/brand-leads");
    const { renderHtml, sendEmail, emails, notifyTenant } = await import("@/lib/email");
    const { organizations, stores, emailOutbox } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const ctx = await freshDb();
    const sup = (await ctx.db.query.suppliers.findFirst())!;
    const r = await signupMember(ctx.db, { storeName: "Loja Commerce", ownerName: "Dona Teste", email: "dona@teste.com", password: "senha-forte-1", taxId: "52998224725", supplierSlug: sup.slug, offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE" });
    const st = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, r.storeId) }))!;
    expect((await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, st.organizationId) }))!.brand).toBe("NEXTLEVEL_COMMERCE");
    const noBrand = await signupMember(ctx.db, { storeName: "Loja Herdada", ownerName: "Outra Pessoa", email: "outra@teste.com", password: "senha-forte-1", taxId: "11144477735", supplierSlug: sup.slug, offer: "STORE_SUBDOMAIN" });
    const st2 = (await ctx.db.query.stores.findFirst({ where: eq(stores.id, noBrand.storeId) }))!;
    expect((await ctx.db.query.organizations.findFirst({ where: eq(organizations.id, st2.organizationId) }))!.brand).toBe("SUPERDROP");
    const p = await registerPartner(ctx.db, { name: "Parceira Marca", email: "parc@teste.com", password: "senha-forte-1", taxId: "39053344705", phone: "11999990000", acceptTerms: true, brand: "NEXTLEVEL_COMMERCE" });
    expect(p.partnerId).toBeTruthy();
    const html = renderHtml({ subject: "Oi", text: "Texto", cta: { label: "Abrir", url: "https://x.com" } }, brandByCode("NEXTLEVEL_COMMERCE", {}));
    expect(html).toContain("NextLevel Commerce"); expect(html).toContain("#2F81F4"); expect(html).not.toContain("SuperDrop");
    await sendEmail(ctx.db, { kind: "T", to: "x@y.com", brand: "NEXTLEVEL_COMMERCE", ...emails.welcomePartner("Ana", "https://x/partner") });
    const sent = (await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "T")))[0]!;
    expect(sent.subject).toContain("NextLevel Commerce"); expect(sent.subject).not.toContain("{marca}");
    // notifyTenant usa a marca da organização do destinatário
    await notifyTenant(ctx.db, { storeId: r.storeId }, { kind: "MARCA_TESTE", ...emails.trialEnding(2, "/merchant") });
    expect((await ctx.db.select().from(emailOutbox).where(eq(emailOutbox.kind, "MARCA_TESTE"))).length).toBe(1);
    const a = await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Lojista Interessado", email: "LOJA@x.com", phone: "(11) 95878-4061", storeName: "Minha Loja" });
    const b = await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "Lojista Interessado", email: "loja@x.com", phone: "11958784061", segment: "moda" });
    expect([a.created, b.created]).toEqual([true, false]);
    const leads = await listBrandLeads(ctx.db, ctx.actors.master, { brand: "NEXTLEVEL_COMMERCE" });
    expect(leads.length).toBe(1); expect(leads[0]!.storeName).toBe("Minha Loja"); expect(leads[0]!.segment).toBe("moda");
    await expect(listBrandLeads(ctx.db, ctx.actors.mantos)).rejects.toThrow(/NextLevel/);
  });
});

import { accountBrandConflict, brandOfHostStrict } from "@/lib/brand";
import { NAV, navForBrand } from "@/lib/nav";

describe("conta presa à marca", () => {
  const commerce = brandOfHostStrict("lojas.nextlevelgroup.com.br")!;
  const superdrop = brandOfHostStrict("superdrop.com.br")!;
  it("endereços técnicos não têm marca estrita (não bloqueiam)", () => {
    expect(brandOfHostStrict("localhost:3100")).toBeNull();
    expect(brandOfHostStrict("superdrop.onrender.com")).toBeNull();
    expect(accountBrandConflict({ role: "STORE_OWNER", brand: "NEXTLEVEL_COMMERCE" }, null)).toBeNull();
  });
  it("lojista de uma marca não entra pelo endereço da outra e recebe o endereço certo", () => {
    const c = accountBrandConflict({ role: "STORE_OWNER", brand: "SUPERDROP" }, commerce);
    expect(c?.message).toMatch(/SuperDrop/); expect(c?.message).toMatch(/superdrop\.com\.br/);
    expect(accountBrandConflict({ role: "STORE_OWNER", brand: "NEXTLEVEL_COMMERCE" }, superdrop)?.message).toMatch(/nextlevelgroup\.com\.br/);
    expect(accountBrandConflict({ role: "STORE_OWNER", brand: "SUPERDROP" }, superdrop)).toBeNull();
  });
  it("a equipe NextLevel (Master) entra pelo Master central; com MASTER_HOST_ONLY=false, em qualquer marca (D149)", () => {
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, commerce, {})?.message).toMatch(/master\.nextlevelgroup\.com\.br/);
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, commerce, { MASTER_HOST_ONLY: "false" })).toBeNull();
  });
});

describe("menu do Master por marca", () => {
  const labels = (code: "NEXTLEVEL_COMMERCE" | "SUPERDROP") => {
    const b = brandOfHostStrict(code === "SUPERDROP" ? "superdrop.com.br" : "lojas.nextlevelgroup.com.br")!;
    return navForBrand(NAV.NEXTLEVEL_MASTER.items, b).map((i) => i.label);
  };
  it("na Commerce não há fornecedores, redes nem catálogo da rede, e há a área da marca", () => {
    const l = labels("NEXTLEVEL_COMMERCE");
    expect(l).toContain("NextLevel Commerce"); expect(l).toContain("Lojas");
    for (const x of ["Fornecedores", "Redes", "Catálogo"]) expect(l).not.toContain(x);
  });
  it("no SuperDrop mantém tudo e não mostra a área da Commerce", () => {
    const l = labels("SUPERDROP");
    for (const x of ["Fornecedores", "Redes", "Catálogo", "Parceiros"]) expect(l).toContain(x);
    expect(l).not.toContain("NextLevel Commerce");
  });
});

describe("ecossistema: um domínio para cada produto", () => {
  const h = (host: string) => brandForHost(host, {}).code;
  it("cada endereço cai no seu produto; o mais específico vence", () => {
    expect(h("superdrop.com.br")).toBe("SUPERDROP");
    expect(h("office.superdrop.com.br")).toBe("SUPERDROP");
    expect(h("bras.nextlevelgroup.com.br")).toBe("BRAS_DIGITAL");
    // D96: endereço provisório da Brás no domínio do grupo, sem se confundir com o Master nem com a Commerce.
    expect(h("master.nextlevelgroup.com.br")).toBe("NEXTLEVEL");
    expect(h("lojas.nextlevelgroup.com.br")).toBe("NEXTLEVEL_COMMERCE");
    expect(h("lojas.nextlevelgroup.com.br")).toBe("NEXTLEVEL_COMMERCE");
    expect(h("hubcreators.nextlevelgroup.com.br")).toBe("CREATORS_HUB");
    expect(h("master.nextlevelgroup.com.br")).toBe("NEXTLEVEL");
    expect(h("chinahubglobal.com.br")).toBe("CHINA_HUB");
    expect(h("www.chinahubglobal.com.br")).toBe("CHINA_HUB");
  });
  it("produtos novos estão marcados como 'em breve' e a holding não vende nada", () => {
    const all = brandsFrom({});
    for (const c of ["BRAS_DIGITAL", "CREATORS_HUB", "CHINA_HUB"] as const) { expect(all[c].soon?.headline).toBeTruthy(); expect(all[c].signupOpen).toBe(false); expect(all[c].live).toBe(false); }
    expect(all.SUPERDROP.soon).toBeNull(); expect(all.NEXTLEVEL_COMMERCE.soon).toBeNull(); expect(all.NEXTLEVEL.signupOpen).toBe(false);
    expect(all.CHINA_HUB.soon?.zh?.headline).toBeTruthy();
  });
  it("Master só entra pelo endereço central (padrão desde D149; MASTER_HOST_ONLY=false desliga); os demais perfis não entram nele", () => {
    const central = brandByCode("NEXTLEVEL", {}); const sd = brandByCode("SUPERDROP", {});
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, sd, { MASTER_HOST_ONLY: "false" })).toBeNull();
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, sd, {})?.message).toMatch(/master\.nextlevelgroup\.com\.br/);
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, sd, { MASTER_HOST_ONLY: "true" })?.message).toMatch(/master\.nextlevelgroup\.com\.br/);
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, central, { MASTER_HOST_ONLY: "true" })).toBeNull();
    expect(accountBrandConflict({ role: "STORE_OWNER", brand: "SUPERDROP" }, central, {})?.message).toMatch(/só da equipe/);
    expect(accountBrandConflict({ role: "NEXTLEVEL_MASTER", brand: "SUPERDROP" }, null, { MASTER_HOST_ONLY: "true" })).toBeNull(); // endereço técnico nunca tranca
  });
});
