import { beforeEach, describe, expect, it } from "vitest";
import { freshDb } from "./setup";
import type { Actor } from "@/lib/domain/access";
import { addBrasVideo, listPublicBrasVideos } from "@/lib/domain/bras/videos";
import { getBrasMemberByUser, setBrasMemberStatus, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter, createBrasRequest, listBrasFeed, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { brasAccessFor, brasMarginRange, getBrasAnalysisSettings, grantBrasAccess, revokeBrasAccess, saveBrasAnalysisSettings, setBrasDiscovery } from "@/lib/domain/bras/descobertas";

/** D94: descoberta pública, veredito e trecho para o membro, análise completa para quem tem acesso. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let member: Actor; let memberId: string; let videoId: string; let sess: { user: { id: string; role: string } };
const envio = { carrier: "Braspress", shipName: "Ana", shipAddress: "Rua A, 1", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010000" };
const analise = { trendSignal: "Buscas subindo", verdict: "Produto certo para quem vende no Mercado Livre", score: 8, teaserUrl: "https://youtu.be/tttttttttt1", analysisUrl: "https://www.youtube.com/watch?v=aaaaaaaaan1",
  analysis: { trend: "Volta às aulas puxa a procura", competition: "Poucos vendedores com estoque", risks: "Frete pesado", howToSell: "Kit com 2", salePriceMinCents: 3990, salePriceMaxCents: 5490 } };

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana Utilidades", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1" });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  memberId = m.id; sess = { user: { id: r.userId, role: "BRAS_MEMBER" } };
  member = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  videoId = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "https://youtube.com/shorts/sssssssssh1", title: "Garrafa térmica 1 L", summary: "Achei no Brás" })).id;
  await setBrasDiscovery(ctx.db, ctx.actors.master, videoId, analise);
  const imp = await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora Piloto" });
  await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId: imp.id, priceBoxCents: 24000, unitsPerBox: 24, boxesAvailable: 20 });
});

const level = async (s: { user: { id: string; role: string } } | null = sess, now?: Date) => (await brasAccessFor(ctx.db, s, now));

describe("camadas da descoberta", () => {
  it("lançamento (padrão): análise aberta a todo membro ativo; visitante e bloqueado não", async () => {
    expect((await getBrasAnalysisSettings(ctx.db)).mode).toBe("OPEN");
    expect(await level()).toMatchObject({ level: "ANALYST", reason: "OPEN" });
    expect((await level(null)).level).toBe("VISITOR");
    expect((await level({ user: { id: ctx.actors.mantos.userId, role: "STORE_OWNER" } })).level).toBe("VISITOR");
    await setBrasMemberStatus(ctx.db, ctx.actors.master, memberId, "BLOCKED", "teste");
    expect((await level()).level).toBe("VISITOR");
  });

  it("visitante recebe só o Shorts, gancho e sinal; o público nunca vê veredito, trecho, análise ou preço", async () => {
    const [v] = await listBrasFeed(ctx.db, "VISITOR");
    expect(v).toMatchObject({ trendSignal: "Buscas subindo", member: null, offer: null, analysis: null });
    const pub = JSON.stringify(await listPublicBrasVideos(ctx.db));
    for (const segredo of ["Produto certo", "tttttttttt1", "aaaaaaaaan1", "Volta às aulas", "24000"]) {
      expect(JSON.stringify(v)).not.toContain(segredo);
      expect(pub).not.toContain(segredo);
    }
  });

  it("membro sem acesso vê veredito, nota, trecho e preço; nunca o vídeo nem os dados da análise", async () => {
    const [v] = await listBrasFeed(ctx.db, "MEMBER");
    expect(v!.member).toEqual({ verdict: analise.verdict, score: 8, teaserYoutubeId: "tttttttttt1", hasAnalysis: true });
    expect(v!.offer).toEqual({ priceBoxCents: 24000, unitsPerBox: 24, boxesAvailable: 20 });
    expect(v!.analysis).toBeNull();
    for (const segredo of ["aaaaaaaaan1", "Volta às aulas", "Frete pesado", "Importadora Piloto"]) expect(JSON.stringify(v)).not.toContain(segredo);
  });

  it("com acesso: vídeo completo, dados e margem bruta estimada", async () => {
    const [v] = await listBrasFeed(ctx.db, "ANALYST");
    expect(v!.analysis).toMatchObject({ analysisYoutubeId: "aaaaaaaaan1", data: { trend: "Volta às aulas puxa a procura" }, margin: { unitCostCents: 1000, minPct: 75, maxPct: 82 } });
  });
});

describe("cobrança da análise: assinatura e volume de compra (os dois)", () => {
  beforeEach(async () => { await saveBrasAnalysisSettings(ctx.db, ctx.actors.master, { mode: "PAID", monthlyPriceCents: 9700, volumeThresholdCents: 100000, volumeWindowDays: 30 }); });

  it("para cobrar é preciso preço, volume ou os dois; só o Master configura", async () => {
    await expect(saveBrasAnalysisSettings(ctx.db, ctx.actors.master, { mode: "PAID", monthlyPriceCents: null, volumeThresholdCents: null, volumeWindowDays: 30 })).rejects.toThrow(/defina/);
    await expect(saveBrasAnalysisSettings(ctx.db, member, { mode: "OPEN", monthlyPriceCents: null, volumeThresholdCents: null, volumeWindowDays: 30 })).rejects.toThrow();
    expect(await level()).toMatchObject({ level: "MEMBER", reason: null });
  });

  it("assinatura liberada pelo Master vale até a data, renova somando e pode ser revogada", async () => {
    const now = new Date("2026-10-08T12:00:00Z");
    const g = await grantBrasAccess(ctx.db, ctx.actors.master, { memberId, kind: "SUBSCRIPTION", days: 30 }, now);
    expect(await level(sess, now)).toMatchObject({ level: "ANALYST", reason: "SUBSCRIPTION" });
    const g2 = await grantBrasAccess(ctx.db, ctx.actors.master, { memberId, kind: "SUBSCRIPTION", days: 30 }, now);
    expect(new Date(g2.validUntil).getTime() - new Date(g.validUntil).getTime()).toBe(30 * 86_400_000);
    expect((await level(sess, new Date("2026-12-20T12:00:00Z"))).level).toBe("MEMBER");
    await revokeBrasAccess(ctx.db, ctx.actors.master, g.id);
    await revokeBrasAccess(ctx.db, ctx.actors.master, g2.id);
    expect((await level(sess, now)).level).toBe("MEMBER");
    await expect(grantBrasAccess(ctx.db, member, { memberId, kind: "COURTESY", days: 7 })).rejects.toThrow();
  });

  it("compras pagas no período acima do volume liberam; pedido não pago não conta", async () => {
    const r1 = await createBrasRequest(ctx.db, member, { videoId, boxes: 3, ...envio });
    expect((await level()).level).toBe("MEMBER");
    for (const s of ["CONFIRMED", "PAID"] as const) await setBrasRequestStatus(ctx.db, ctx.actors.master, r1.id, s);
    expect(await level()).toMatchObject({ level: "MEMBER", volumeCents: 72000 });
    const r2 = await createBrasRequest(ctx.db, member, { videoId, boxes: 2, ...envio });
    for (const s of ["CONFIRMED", "PAID", "PICKED_UP"] as const) await setBrasRequestStatus(ctx.db, ctx.actors.master, r2.id, s);
    expect(await level()).toMatchObject({ level: "ANALYST", reason: "VOLUME", volumeCents: 120000 });
    // Passada a janela de 30 dias, as compras deixam de contar.
    expect((await level(sess, new Date(Date.now() + 31 * 86_400_000))).level).toBe("MEMBER");
  });
});

describe("edição da análise no Estúdio", () => {
  it("só o Master; sinal público sem números; análise nunca é o Shorts nem o trecho", async () => {
    await expect(setBrasDiscovery(ctx.db, member, videoId, analise)).rejects.toThrow();
    await expect(setBrasDiscovery(ctx.db, ctx.actors.master, videoId, { ...analise, trendSignal: "Buscas +300%" })).rejects.toMatchObject({ code: "TREND_NUMBERS" });
    await expect(setBrasDiscovery(ctx.db, ctx.actors.master, videoId, { ...analise, analysisUrl: "https://youtube.com/shorts/sssssssssh1" })).rejects.toMatchObject({ code: "SAME_VIDEO" });
    await expect(setBrasDiscovery(ctx.db, ctx.actors.master, videoId, { ...analise, teaserUrl: analise.analysisUrl })).rejects.toMatchObject({ code: "SAME_VIDEO" });
    await expect(setBrasDiscovery(ctx.db, ctx.actors.master, videoId, { ...analise, teaserUrl: "https://vimeo.com/1" })).rejects.toMatchObject({ code: "VIDEO_URL" });
    await expect(setBrasDiscovery(ctx.db, ctx.actors.master, videoId, { ...analise, analysis: { salePriceMinCents: 5000, salePriceMaxCents: 4000 } })).rejects.toThrow(/mínimo/);
  });

  it("margem estimada só com a faixa de preço completa", () => {
    expect(brasMarginRange(24000, 24, { salePriceMinCents: 2000 })).toBeNull();
    expect(brasMarginRange(24000, 24, { salePriceMinCents: 2000, salePriceMaxCents: 4000 })).toEqual({ unitCostCents: 1000, minPct: 50, maxPct: 75 });
  });
});
