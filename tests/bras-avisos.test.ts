import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { freshDb } from "./setup";
import { emailOutbox, platformSettings, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { brasTeamEmails, notifyBrasRequestStatus } from "@/lib/domain/bras/avisos";

/** D100: e-mails da Brás ao membro (cadastro e cada situação do pedido) e à equipe (novo membro, novo pedido). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let member: Actor; let videoId: string;
const envio = { carrier: "Braspress", shipName: "Ana Lojista", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const ana = { name: "Ana Lojista", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@utilidades.teste", password: "senha-forte-1", acceptTerms: true as const };
const outbox = (k: string) => ctx.db.select().from(emailOutbox).where(like(emailOutbox.kind, k));

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, ana);
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  member = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  videoId = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica 1 L" })).id;
  const importerId = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora Piloto" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId, priceBoxCents: 48000, unitsPerBox: 24, boxesAvailable: 10 });
});

describe("cadastro", () => {
  it("boas-vindas ao membro e aviso de novo membro à equipe (Master), com a marca da Brás", async () => {
    const [w] = await outbox("BRAS_WELCOME");
    expect(w).toMatchObject({ toEmail: "ana@utilidades.teste", subject: "Bem-vindo ao Brás Digital Club" });
    expect(w!.body).toContain("Ana Utilidades LTDA");
    const masters = (await ctx.db.select({ email: users.email }).from(users).where(eq(users.role, "NEXTLEVEL_MASTER"))).map((u) => u.email.toLowerCase());
    const team = await outbox("BRAS_TEAM_NEW_MEMBER");
    expect(team.map((t) => t.toEmail).sort()).toEqual([...new Set(masters)].sort());
    expect(team[0]!.body).toContain("11.222.333/0001-81");
  });

  it("a lista da equipe em platform_settings vale no lugar dos Masters (e-mail inválido é descartado)", async () => {
    await ctx.db.insert(platformSettings).values({ key: "bras.team_emails", value: ["Equipe@Bras.teste", "não-é-email"] });
    expect(await brasTeamEmails(ctx.db)).toEqual(["equipe@bras.teste"]);
  });
});

describe("pedido", () => {
  it("pedido novo: confirmação ao membro e aviso à equipe; cada situação manda um e-mail ao membro, uma vez só", async () => {
    const { id } = await createBrasRequest(ctx.db, member, { videoId, boxes: 2, ...envio });
    const [novo] = await outbox("BRAS_REQUEST_NEW");
    expect(novo).toMatchObject({ toEmail: "ana@utilidades.teste" });
    expect(novo!.subject).toMatch(/^Recebemos o seu pedido \d+$/);
    expect(novo!.body).toMatch(/R\$\s960,00/);
    // A importadora não aparece para o membro antes da confirmação.
    expect(novo!.body).not.toContain("Importadora Piloto");
    expect((await outbox("BRAS_TEAM_NEW_REQUEST")).length).toBeGreaterThan(0);

    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    const [conf] = await outbox("BRAS_REQUEST_CONFIRMED");
    expect(conf!.body).toContain("Importadora Piloto");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PICKED_UP");
    for (const k of ["BRAS_REQUEST_PAID", "BRAS_REQUEST_PICKED_UP"]) expect(await outbox(k)).toHaveLength(1);
    // Repetir o aviso da mesma situação não reenvia.
    await notifyBrasRequestStatus(ctx.db, id, "PAID");
    expect(await outbox("BRAS_REQUEST_PAID")).toHaveLength(1);
  });

  it("cancelamento avisa o membro", async () => {
    const { id } = await createBrasRequest(ctx.db, member, { videoId, boxes: 1, ...envio });
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CANCELED");
    const [c] = await outbox("BRAS_REQUEST_CANCELED");
    expect(c!.subject).toMatch(/cancelado$/);
  });

  it("e-mails de pedido de um membro nunca vão para outro membro", async () => {
    const r2 = await signupBrasMember(ctx.db, { ...ana, cnpj: "11444777000161", email: "beto@dist.teste", companyName: "Beto Distribuidora" });
    const m2 = (await getBrasMemberByUser(ctx.db, r2.userId))!;
    const beto: Actor = { userId: r2.userId, role: "BRAS_MEMBER", organizationId: m2.organizationId, supplierId: null, storeId: null };
    await createBrasRequest(ctx.db, beto, { videoId, boxes: 1, ...envio });
    const pedidos = await outbox("BRAS_REQUEST_%");
    expect(pedidos.map((p) => p.toEmail)).toEqual(["beto@dist.teste"]);
  });

  it("falha no aviso é registrada e engolida: nunca derruba a ação", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const quebrado = { query: { bdRequests: { findFirst: () => { throw new Error("banco fora"); } } } } as unknown as typeof ctx.db;
    await expect(notifyBrasRequestStatus(quebrado, "bdr_x", "PAID")).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

});
