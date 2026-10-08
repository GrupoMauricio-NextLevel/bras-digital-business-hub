import { describe, it, expect, beforeEach } from "vitest";
import { freshDb } from "./setup";
import { signupMember } from "@/lib/domain/store-access";
import { createBrandLead } from "@/lib/domain/brand-leads";
import { getBrandHub } from "@/lib/domain/commerce-hub";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });
const CPF = "529.982.247-25";
const env = { DATABASE_URL: "postgres://x", BRAND_SIGNUP_NEXTLEVEL_COMMERCE: "true", BRAND_URL_NEXTLEVEL_COMMERCE: "https://lojas.nextlevelgroup.com.br", RESEND_API_KEY: "k", EMAIL_FROM: "a@b.com", NEXT_PUBLIC_SUPPORT_WHATSAPP: "5511999990000", NEXT_PUBLIC_SUPPORT_EMAIL: "a@b.com" };

describe("hub da marca no Master", () => {
  it("conta só as lojas e interessados da marca, e separa conta simples", async () => {
    await signupMember(ctx.db, { storeName: "Moda Brás", ownerName: "Maria Souza", email: "maria@modabras.com.br", password: "senha-segura-1", taxId: CPF, brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
    await createBrandLead(ctx.db, { brand: "NEXTLEVEL_COMMERCE", name: "João Lojista", email: "joao@x.com.br", phone: "11958784061" } as never);
    await createBrandLead(ctx.db, { brand: "SUPERDROP", name: "Outro", email: "o@x.com.br", phone: "11958784061" } as never);
    const hub = await getBrandHub(ctx.db, ctx.actors.master, "NEXTLEVEL_COMMERCE", env);
    expect(hub.kpis.stores).toBe(1); expect(hub.kpis.independent).toBe(1);
    // D90: cliente novo da Commerce entra na oferta de entrada (3 dias grátis), não direto no bloqueio.
    expect(hub.kpis.trial).toBe(1); expect(hub.kpis.awaitingPayment).toBe(0); expect(hub.kpis.paying).toBe(0);
    expect(hub.kpis.leadsTotal).toBe(1); expect(hub.kpis.leadsNew).toBe(1);
    expect(hub.stores[0]).toMatchObject({ name: "Moda Brás", independent: true });
  });
  it("lista do que falta: demonstração no banco, Mercado Pago e cadastro fechado bloqueiam", async () => {
    const hub = await getBrandHub(ctx.db, ctx.actors.master, "NEXTLEVEL_COMMERCE", { DATABASE_URL: "pglite://memory", NEXT_PUBLIC_DEMO_MODE: "true" });
    const by = Object.fromEntries(hub.checks.map((c) => [c.key, c]));
    expect(by.demo!.ok).toBe(false);       // o banco de teste tem usuários .demo e a demonstração está ligada
    expect(by.mp!.ok).toBe(false);
    expect(by.signup!.ok).toBe(false);
    expect(by.db!.ok).toBe(false);
    expect(hub.ready).toBe(false);
  });
  it("conta de demonstração no banco com a demonstração desligada fica bloqueada no login (item verde)", async () => {
    const hub = await getBrandHub(ctx.db, ctx.actors.master, "NEXTLEVEL_COMMERCE", { DATABASE_URL: "pglite://memory" });
    expect(hub.checks.find((c) => c.key === "demo")!.ok).toBe(true);
  });
  it("variáveis completas deixam os itens de ambiente verdes", async () => {
    const hub = await getBrandHub(ctx.db, ctx.actors.master, "NEXTLEVEL_COMMERCE", env);
    const by = Object.fromEntries(hub.checks.map((c) => [c.key, c]));
    expect(by.signup!.ok && by.domain!.ok && by.email!.ok && by.support!.ok && by.db!.ok).toBe(true);
  });
  it("só o Master enxerga", async () => {
    await expect(getBrandHub(ctx.db, ctx.actors.mantos, "NEXTLEVEL_COMMERCE", env)).rejects.toThrow();
    await expect(getBrandHub(ctx.db, ctx.actors.supplier, "NEXTLEVEL_COMMERCE", env)).rejects.toThrow();
  });
});
