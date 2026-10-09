import { beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdImporters, bdRequests, emailOutbox } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasImporterActive, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { balcaoConfirmPickup, balcaoQueue, createBalcaoLink, importerByBalcaoToken, revokeBalcaoLink } from "@/lib/domain/bras/balcao";
import { brasPanelsEnabled } from "@/lib/bras/panels";

/** D106: Balcão da importadora por link privado (sem login), só envio e código, retirada com o código do motorista. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let impA: string; let impB: string; let vA: string; let vB: string;
const envio = { carrier: "Braspress", shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const pago = async (videoId: string) => {
  const { id } = await createBrasRequest(ctx.db, ana, { videoId, boxes: 2, ...envio });
  await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
  await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
  return (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!;
};

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  ana = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  impA = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora A" })).id;
  impB = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora B" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" })).id;
  vB = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "bbbbbbbbbb2", title: "Pote" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 10000, unitsPerBox: 10, boxesAvailable: 50 });
  await setBrasOffer(ctx.db, ctx.actors.master, vB, { importerId: impB, priceBoxCents: 10000, unitsPerBox: 10, boxesAvailable: 50 });
});

describe("link do Balcão", () => {
  it("só Master gera; guarda só o hash; trocar invalida o anterior; revogar desliga; importadora pausada não entra", async () => {
    await expect(createBalcaoLink(ctx.db, ana, impA)).rejects.toThrow();
    await expect(createBalcaoLink(ctx.db, ctx.actors.mantos, impA)).rejects.toThrow();
    const { token, path } = await createBalcaoLink(ctx.db, ctx.actors.master, impA);
    expect(path).toBe(`/balcao/${token}`);
    const row = (await ctx.db.query.bdImporters.findFirst({ where: eq(bdImporters.id, impA) }))!;
    expect(row.balcaoTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain(token);
    expect((await importerByBalcaoToken(ctx.db, token))?.id).toBe(impA);
    const novo = await createBalcaoLink(ctx.db, ctx.actors.master, impA);
    expect(await importerByBalcaoToken(ctx.db, token)).toBeNull();
    expect((await importerByBalcaoToken(ctx.db, novo.token))?.id).toBe(impA);
    await setBrasImporterActive(ctx.db, ctx.actors.master, impA, false);
    expect(await importerByBalcaoToken(ctx.db, novo.token)).toBeNull();
    await setBrasImporterActive(ctx.db, ctx.actors.master, impA, true);
    await revokeBalcaoLink(ctx.db, ctx.actors.master, impA);
    expect(await importerByBalcaoToken(ctx.db, novo.token)).toBeNull();
    expect(await importerByBalcaoToken(ctx.db, "curto")).toBeNull();
    expect(await importerByBalcaoToken(ctx.db, "x".repeat(40))).toBeNull();
  });

  it("chave BRAS_PANELS desligada por padrão (falha fechada)", () => {
    expect(brasPanelsEnabled({})).toBe(false);
    expect(brasPanelsEnabled({ BRAS_PANELS: "true" })).toBe(true);
  });
});

describe("fila e retirada", () => {
  it("só pedidos da importadora do link, separados em confirmados e pagos, só envio e código", async () => {
    const pA = await pago(vA);
    const { id: confA } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, confA, "CONFIRMED");
    await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio }); // Recebido: fica fora
    await pago(vB);
    const { token } = await createBalcaoLink(ctx.db, ctx.actors.master, impA);
    const q = (await balcaoQueue(ctx.db, token))!;
    expect(q.importer.name).toBe("Importadora A");
    expect(q.retirar.map((l) => l.id)).toEqual([pA.id]);
    expect(q.separar.map((l) => l.id)).toEqual([confA]);
    expect(Object.keys(q.retirar[0]!).sort()).toEqual(["boxes", "carrier", "id", "number", "pickupCode", "productTitle", "shipAddress", "shipCity", "shipName", "shipState", "shipZip", "status", "unitsPerBox"]);
    expect(JSON.stringify(q)).not.toMatch(/Ana Utilidades|11222333000181|ana@u\.teste|11988887777|priceBoxCents|totalCents|notes/);
    expect(await balcaoQueue(ctx.db, "y".repeat(40))).toBeNull();
  });

  it("confirmar a retirada exige pedido pago desta importadora e o código certo; avisa o membro", async () => {
    const pA = await pago(vA);
    const pB = await pago(vB);
    const { token } = await createBalcaoLink(ctx.db, ctx.actors.master, impA);
    await expect(balcaoConfirmPickup(ctx.db, token, pB.id, pB.pickupCode!)).rejects.toThrow(/não encontrado/);
    await expect(balcaoConfirmPickup(ctx.db, token, pA.id, "BD-0000")).rejects.toMatchObject({ code: "CODE" });
    const { id: conf } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, conf, "CONFIRMED");
    const c = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, conf) }))!;
    await expect(balcaoConfirmPickup(ctx.db, token, conf, c.pickupCode!)).rejects.toMatchObject({ code: "NOT_PAID" });
    expect(await balcaoConfirmPickup(ctx.db, token, pA.id, ` ${pA.pickupCode!.toLowerCase()} `)).toMatchObject({ ok: true });
    expect((await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, pA.id) }))!.status).toBe("PICKED_UP");
    expect(await ctx.db.select().from(emailOutbox).where(like(emailOutbox.kind, "BRAS_REQUEST_PICKED_UP"))).toHaveLength(1);
    await expect(balcaoConfirmPickup(ctx.db, token, pA.id, pA.pickupCode!)).rejects.toMatchObject({ code: "NOT_PAID" });
    await expect(balcaoConfirmPickup(ctx.db, "z".repeat(40), pA.id, pA.pickupCode!)).rejects.toThrow(/inválido/);
  });
});
