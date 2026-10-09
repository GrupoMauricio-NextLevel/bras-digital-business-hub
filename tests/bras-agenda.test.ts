import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdVideos, platformSettings } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter, createBrasRequest, listBrasFeed, setBrasOffer } from "@/lib/domain/bras/catalogo";
import { addBrasVideo, brasDiscoveryStats, brasWeekPlan, brasWeekStart, getPublicBrasVideo, listPublicBrasVideos, setBrasVideoPublishAt, setBrasVideoActive } from "@/lib/domain/bras/videos";

/** D101: agenda das descobertas (regra de leitura), página pública de cada descoberta e cadastros/pedidos por descoberta. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let videoId: string;
const ana = { name: "Ana", companyName: "Ana Utilidades", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true as const };
const envio = { carrier: "Braspress", shipName: "Ana", shipAddress: "Rua A, 1", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };

beforeEach(async () => {
  ctx = await freshDb();
  videoId = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica 1 L", summary: "Achei no Brás" })).id;
});

describe("agenda", () => {
  it("agendada no futuro não aparece para visitante, membro, página da descoberta nem pedido; aparece na hora marcada", async () => {
    const r = await signupBrasMember(ctx.db, ana);
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    const member: Actor = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
    const imp = await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora Piloto" });
    await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId: imp.id, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10 });
    const futuro = new Date(Date.now() + 2 * 86400_000);
    await setBrasVideoPublishAt(ctx.db, ctx.actors.master, videoId, futuro.toISOString());
    expect(await listPublicBrasVideos(ctx.db)).toHaveLength(0);
    expect(await listBrasFeed(ctx.db, "MEMBER")).toHaveLength(0);
    expect(await getPublicBrasVideo(ctx.db, videoId)).toBeNull();
    await expect(createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio })).rejects.toMatchObject({ code: "OFFER" });
    const depois = new Date(futuro.getTime() + 60_000);
    expect(await listPublicBrasVideos(ctx.db, 12, depois)).toHaveLength(1);
    expect(await listBrasFeed(ctx.db, "MEMBER", 60, depois)).toHaveLength(1);
    expect(await getPublicBrasVideo(ctx.db, videoId, depois)).not.toBeNull();
    // Publicar já: volta a aparecer agora.
    await setBrasVideoPublishAt(ctx.db, ctx.actors.master, videoId, null);
    expect(await listPublicBrasVideos(ctx.db)).toHaveLength(1);
  });

  it("só o Master agenda; data inválida é recusada; horário de Brasília vira UTC", async () => {
    await expect(setBrasVideoPublishAt(ctx.db, ctx.actors.mantos, videoId, null)).rejects.toThrow();
    await expect(setBrasVideoPublishAt(ctx.db, ctx.actors.master, videoId, "amanhã cedo")).rejects.toMatchObject({ code: "PUBLISH_AT" });
    const r = await setBrasVideoPublishAt(ctx.db, ctx.actors.master, videoId, "2026-10-10T18:00:00-03:00");
    expect(r.publishAt).toBe("2026-10-10T21:00:00.000Z");
  });

  it("a semana começa na segunda 00:00 de Brasília", () => {
    // Quinta 08/10 às 23:00 em Brasília (sexta 02:00 UTC) → segunda 05/10 00:00 BRT = 03:00 UTC.
    expect(brasWeekStart(new Date("2026-10-09T02:00:00Z")).toISOString()).toBe("2026-10-05T03:00:00.000Z");
    // Domingo 23:59 BRT ainda é a mesma semana; segunda 00:00 BRT é a próxima.
    expect(brasWeekStart(new Date("2026-10-12T02:59:00Z")).toISOString()).toBe("2026-10-05T03:00:00.000Z");
    expect(brasWeekStart(new Date("2026-10-12T03:00:00Z")).toISOString()).toBe("2026-10-12T03:00:00.000Z");
  });

  it("semana: conta as ativas da semana, agendadas pela agenda; meta vem de platform_settings (padrão 4)", async () => {
    const now = new Date();
    const plan = await brasWeekPlan(ctx.db, ctx.actors.master, now);
    expect(plan.goal).toBe(4);
    expect(plan.items.map((i) => i.id)).toEqual([videoId]);
    expect(plan.missing).toBe(3);
    const v2 = await addBrasVideo(ctx.db, ctx.actors.master, { url: "bbbbbbbbbb2", title: "Pote hermético" });
    const proxSemana = new Date(new Date(plan.end).getTime() + 3600_000).toISOString();
    await setBrasVideoPublishAt(ctx.db, ctx.actors.master, v2.id, proxSemana);
    await setBrasVideoActive(ctx.db, ctx.actors.master, videoId, false);
    await ctx.db.insert(platformSettings).values({ key: "bras.weekly_goal", value: 2 });
    const p2 = await brasWeekPlan(ctx.db, ctx.actors.master, now);
    expect(p2.items).toHaveLength(0);
    expect(p2).toMatchObject({ goal: 2, missing: 2 });
    await expect(brasWeekPlan(ctx.db, ctx.actors.mantos, now)).rejects.toThrow();
  });
});

describe("página pública da descoberta", () => {
  it("só campos públicos; id estranho, inexistente ou pausado = null", async () => {
    await ctx.db.update(bdVideos).set({ verdict: "Produto certo", score: 9, analysis: { trend: "segredo" } }).where(eq(bdVideos.id, videoId));
    const v = (await getPublicBrasVideo(ctx.db, videoId))!;
    expect(Object.keys(v).sort()).toEqual(["id", "summary", "title", "trendSignal", "youtubeId"]);
    expect(JSON.stringify(v)).not.toMatch(/Produto certo|segredo/);
    expect(await getPublicBrasVideo(ctx.db, "../../etc")).toBeNull();
    expect(await getPublicBrasVideo(ctx.db, "bdv_naoexiste1")).toBeNull();
    await setBrasVideoActive(ctx.db, ctx.actors.master, videoId, false);
    expect(await getPublicBrasVideo(ctx.db, videoId)).toBeNull();
  });
});

describe("resultado por descoberta", () => {
  it("conta cadastros que vieram da descoberta e pedidos feitos nela; só Master", async () => {
    const r = await signupBrasMember(ctx.db, { ...ana, videoId });
    await signupBrasMember(ctx.db, { ...ana, cnpj: "11444777000161", email: "b@u.teste" });
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    const imp = await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora Piloto" });
    await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId: imp.id, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10 });
    await createBrasRequest(ctx.db, { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null }, { videoId, boxes: 1, ...envio });
    expect(await brasDiscoveryStats(ctx.db, ctx.actors.master)).toEqual({ [videoId]: { signups: 1, requests: 1 } });
    await expect(brasDiscoveryStats(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });
});
