import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdMembers, bdVideos } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { BRAS_TERMS_VERSION, brasMembersActivity, brasMembersCsv, getBrasMemberByUser, listBrasMembers, signupBrasMember, touchBrasMemberSeen } from "@/lib/domain/bras/membros";
import { addBrasVideo, countNewBrasDiscoveries, setBrasVideoPublishAt } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";

/** D104: membros no Estúdio (pedidos por membro, origem, termos, CSV) e início do Meu Brás (novas desde a última visita). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
const base = { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true as const };
const envio = { carrier: "Braspress", shipName: "Ana", shipAddress: "Rua A, 1", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };

beforeEach(async () => { ctx = await freshDb(); });

describe("membros no Estúdio", () => {
  it("pedidos e valor pago por membro; lista traz origem e termos; só Master", async () => {
    const v = await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" });
    const r = await signupBrasMember(ctx.db, { ...base, videoId: v.id });
    await signupBrasMember(ctx.db, { ...base, cnpj: "11444777000161", email: "b@u.teste", companyName: "Beto" });
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    const ana: Actor = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
    const imp = await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora A" });
    await setBrasOffer(ctx.db, ctx.actors.master, v.id, { importerId: imp.id, priceBoxCents: 10000, unitsPerBox: 10, boxesAvailable: 50 });
    const p1 = await createBrasRequest(ctx.db, ana, { videoId: v.id, boxes: 2, ...envio });
    await createBrasRequest(ctx.db, ana, { videoId: v.id, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, p1.id, "CONFIRMED");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, p1.id, "PAID");
    const act = await brasMembersActivity(ctx.db, ctx.actors.master);
    expect(act[m.id]).toMatchObject({ requests: 2, paidCents: 20000 });
    expect(act[m.id]!.lastRequestAt).toBeTruthy();
    const list = await listBrasMembers(ctx.db, ctx.actors.master);
    expect(list.find((x) => x.id === m.id)).toMatchObject({ sourceVideoId: v.id, source: "descoberta", termsVersion: BRAS_TERMS_VERSION });
    const csv = brasMembersCsv(list, act);
    expect(csv.split("\n")[0]).toBe("Empresa;CNPJ;Contato;E-mail;WhatsApp;Situação;Cadastro;Origem;Termos aceitos;Pedidos;Pago (R$)");
    expect(csv).toContain("Ana Utilidades LTDA;11.222.333/0001-81;Ana;ana@u.teste;11988887777;Ativo;");
    expect(csv).toContain(`;descoberta;${BRAS_TERMS_VERSION};2;200,00`);
    await expect(brasMembersActivity(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(brasMembersActivity(ctx.db, ana)).rejects.toThrow();
  });
});

describe("início do Meu Brás", () => {
  it("última visita grava no máximo uma vez por hora", async () => {
    const r = await signupBrasMember(ctx.db, base);
    const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
    const t0 = new Date("2026-10-09T12:00:00Z");
    expect(await touchBrasMemberSeen(ctx.db, m.id, null, t0)).toBe(true);
    const seen = (await ctx.db.query.bdMembers.findFirst({ where: eq(bdMembers.id, m.id) }))!.lastSeenAt!;
    expect(await touchBrasMemberSeen(ctx.db, m.id, seen, new Date(t0.getTime() + 30 * 60_000))).toBe(false);
    expect(await touchBrasMemberSeen(ctx.db, m.id, seen, new Date(t0.getTime() + 61 * 60_000))).toBe(true);
  });

  it("descobertas novas desde a última visita: só publicadas depois dela", async () => {
    const antes = new Date(Date.now() - 3600_000).toISOString();
    expect(await countNewBrasDiscoveries(ctx.db, null)).toBe(0);
    const v1 = await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" });
    const v2 = await addBrasVideo(ctx.db, ctx.actors.master, { url: "bbbbbbbbbb2", title: "Pote" });
    await setBrasVideoPublishAt(ctx.db, ctx.actors.master, v2.id, new Date(Date.now() + 86400_000).toISOString());
    expect(await countNewBrasDiscoveries(ctx.db, antes)).toBe(1);
    await ctx.db.update(bdVideos).set({ createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() }).where(eq(bdVideos.id, v1.id));
    expect(await countNewBrasDiscoveries(ctx.db, antes)).toBe(0);
  });
});
