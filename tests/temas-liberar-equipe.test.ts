import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { entitlements, financeInvoices, storeThemes, themes, users } from "@/db/schema";
import { markInvoicePaid } from "@/lib/domain/finance";
import { actorFromUser } from "@/lib/domain/access";
import { signupMember } from "@/lib/domain/store-access";
import { buyTheme } from "@/lib/themes/install";
import { editingContextFor } from "@/lib/themes/license";
import { liberarTemaPelaEquipe, temasParaLiberar } from "@/lib/themes/liberar-equipe";
import { structureRights } from "@/lib/themes/policy";
import { resolveTemplate, saveTemplateDraft, publishAllDrafts } from "@/lib/themes/store";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
const AGORA = new Date("2026-11-17T15:00:00Z");
beforeAll(async () => { ctx = await freshDb(); }, 120_000);

let n = 0;
async function novaLoja() {
  n++;
  const r = await signupMember(ctx.db, { storeName: `Loja Equipe ${n}`, ownerName: "Ana", email: `equipe${n}@exemplo.com`, password: "senha-forte-123", taxId: ["111.444.777-35", "529.982.247-25", "390.533.447-05", "168.995.350-09", "935.411.347-80", "123.456.789-09", "714.602.380-01", "248.438.034-80"][n - 1]!, offer: "STORE_SUBDOMAIN", independent: true, brand: "NEXTLEVEL_COMMERCE" });
  for (const inv of await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId))) await markInvoicePaid(ctx.db, inv.id);
  return { storeId: r.storeId, owner: actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!) };
}
const operador = () => ({ operatorId: ctx.actors.master.userId, operatorName: "Equipe NextLevel" });
const ativo = async (storeId: string) => (await ctx.db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, storeId)))[0]?.key;

describe("liberação de tema pela equipe (D329)", () => {
  it("cortesia: licença sem custo, sem fatura, e o tema instalado na hora", async () => {
    const { storeId } = await novaLoja();
    const r = await liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "editorial", modo: "CORTESIA", nota: "Site Express", instalar: true }, AGORA);
    expect(r).toMatchObject({ jaTinha: false, invoiceId: null, instalado: true });
    const ent = await ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, storeId), eq(entitlements.key, "THEME_EDITORIAL")));
    expect(ent).toHaveLength(1); expect(ent[0]!.source).toBe("COURTESY"); expect(ent[0]!.endsAt).toBeNull(); expect(ent[0]!.note).toContain("Site Express");
    expect(await ctx.db.select().from(financeInvoices).where(and(eq(financeInvoices.storeId, storeId), eq(financeInvoices.kind, "ADDON")))).toHaveLength(0);
    expect(await ativo(storeId)).toBe("editorial");
    expect((await temasParaLiberar(ctx.db, storeId, AGORA)).temas.find((t) => t.key === "editorial")).toMatchObject({ owned: true, active: true });
  });

  it("pago por fora: a fatura do tema nasce paga (entra no caixa) com a forma e o valor informados, e libera a licença", async () => {
    const { storeId } = await novaLoja();
    const r = await liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "lume", modo: "PAGO_FORA", forma: "DINHEIRO", valorCents: 10000, instalar: false }, AGORA);
    const inv = (await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, r.invoiceId!) }))!;
    expect(inv).toMatchObject({ status: "PAID", amountCents: 10000, kind: "ADDON", payerType: "STORE" });
    expect(inv.description).toContain("Dinheiro");
    const ent = await ctx.db.select().from(entitlements).where(and(eq(entitlements.storeId, storeId), eq(entitlements.key, "THEME_LUME")));
    expect(ent).toHaveLength(1); expect(ent[0]!.source).toBe("ADD_ON");
    expect(await ativo(storeId)).not.toBe("lume");
  });

  it("fatura que o lojista deixou aberta: no pagamento por fora é ela que recebe a baixa; na cortesia é cancelada", async () => {
    const a = await novaLoja();
    const aberta = await buyTheme(ctx.db, a.owner, "lume", "PIX", AGORA);
    const r = await liberarTemaPelaEquipe(ctx.db, { storeId: a.storeId, ...operador(), item: "lume", modo: "PAGO_FORA", forma: "PIX", instalar: false }, AGORA);
    expect(r.invoiceId).toBe(aberta.invoiceId);
    expect((await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, aberta.invoiceId) }))!.status).toBe("PAID");

    const b = await novaLoja();
    const outra = await buyTheme(ctx.db, b.owner, "lume", "PIX", AGORA);
    await liberarTemaPelaEquipe(ctx.db, { storeId: b.storeId, ...operador(), item: "lume", modo: "CORTESIA", instalar: false }, AGORA);
    expect((await ctx.db.query.financeInvoices.findFirst({ where: eq(financeInvoices.id, outra.invoiceId) }))!.status).toBe("CANCELED");
  });

  it("Edição completa: soma todas as funções do editor ao tema ativo (grátis inclusive)", async () => {
    const { storeId } = await novaLoja();
    const store = (await ctx.db.query.stores.findFirst({ where: (t, { eq: e }) => e(t.id, storeId) }))!;
    expect(structureRights(await editingContextFor(ctx.db, store)).add).not.toBe("any");
    await expect(liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "editor-completo", modo: "CORTESIA", instalar: true }, AGORA)).rejects.toMatchObject({ code: "INVALID" });
    await liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "editor-completo", modo: "CORTESIA", instalar: false }, AGORA);
    const c = await editingContextFor(ctx.db, store);
    expect(c.level).toBe(4); expect(structureRights(c).add).toBe("any"); expect(structureRights(c).reorder).toBe(true);
    expect((await temasParaLiberar(ctx.db, storeId)).editorCompleto).toBe(true);
  });

  it("Manto Premium (exclusivo da equipe): libera, instala, mantém os banners da loja e abre a edição N4", async () => {
    const { storeId, owner } = await novaLoja();
    const store = (await ctx.db.query.stores.findFirst({ where: (t, { eq: e }) => e(t.id, storeId) }))!;
    expect((await temasParaLiberar(ctx.db, storeId)).temas.find((t) => t.key === "manto")).toMatchObject({ release: "draft", owned: false });
    // A loja tinha um banner próprio no destaque.
    const home = (await resolveTemplate(ctx.db, store, "home")).template;
    const heroId = home.order.find((id) => home.sections[id]!.type === "hero-banner");
    expect(heroId).toBeTruthy();
    const h = home.sections[heroId!]!; const b0 = h.blockOrder[0]!;
    h.blocks[b0]!.settings = { ...h.blocks[b0]!.settings, image: "/demos/x/banner1.webp", imageMobile: "/demos/x/banner1m.webp" };
    await saveTemplateDraft(ctx.db, owner, storeId, "home", home, { skipPolicy: true });
    await publishAllDrafts(ctx.db, owner, storeId, "teste");
    await liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "manto", modo: "CORTESIA", instalar: true }, AGORA);
    expect(await ativo(storeId)).toBe("manto");
    const novo = (await resolveTemplate(ctx.db, store, "home")).template;
    expect(novo.order.map((id) => novo.sections[id]!.type)).toContain("image-tiles");
    const hero = Object.values(novo.sections).find((x) => x.type === "hero-banner")!;
    expect(hero.blocks[hero.blockOrder[0]!]!.settings).toMatchObject({ image: "/demos/x/banner1.webp", imageMobile: "/demos/x/banner1m.webp" });
    const c = await editingContextFor(ctx.db, store);
    expect(c.level).toBe(4); expect(structureRights(c).add).toBe("any");
  });

  it("tema grátis não precisa de liberação", async () => {
    const { storeId } = await novaLoja();
    await expect(liberarTemaPelaEquipe(ctx.db, { storeId, ...operador(), item: "trama", modo: "CORTESIA", instalar: false }, AGORA)).rejects.toMatchObject({ code: "FREE_THEME" });
  });
});
