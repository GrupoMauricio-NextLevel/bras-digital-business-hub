import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdProducts, bdRequests, bdStockMovements, users } from "@/db/schema";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, listBrasFeed, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import {
  applyStockSheet, brasBoxLiters, brasStaffCan, brasTierPrice, confirmRequestAvailability, createImporterAccess, importerConfirmPickup, importerToday,
  listImporterAccess, listImporterProducts, listImporterRequests, markRequestSeparated, moveImporterStock, myImporter, previewStockSheet,
  revokeImporterAccess, saveImporterProduct, saveWarehouse, updateImporterProfile,
} from "@/lib/domain/bras/importadora";
import { brasImporter360, brasImporterHealth, brasImporterOpportunities } from "@/lib/domain/bras/importadora-360";
import { brasEffectiveBoxes, brasStockAge } from "@/lib/domain/bras/estoque";

/** D110: painel da importadora com login, produtos de caixa fechada, estoque em caixas e a ficha 360. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let impA: string; let impB: string; let vA: string;
const envio = { carrier: "Braspress", shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const produto = { sku: "gt-48", title: "Garrafa térmica inox 1 L", unitsPerBox: 24, boxLengthMm: 500, boxWidthMm: 400, boxHeightMm: 300, grossWeightG: 12_000, priceTiers: [{ minBoxes: 1, priceBoxCents: 30_000 }, { minBoxes: 10, priceBoxCents: 27_000 }], minBoxes: 1, status: "ATIVO" as const };
const loginComo = async (userId: string) => actorFromUser((await ctx.db.query.users.findFirst({ where: eq(users.id, userId) }))!);
const acessoDe = async (importerId: string, email: string, staffRole: "DONO" | "BALCAO" | "COMERCIAL" | "ESTOQUE" | "FINANCEIRO" = "DONO") =>
  loginComo((await createImporterAccess(ctx.db, ctx.actors.master, importerId, { name: "Pessoa", email, password: "senha-forte-1", staffRole })).userId);

beforeEach(async () => {
  ctx = await freshDb();
  const r = await signupBrasMember(ctx.db, { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  ana = { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
  impA = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "XDX Importadora" })).id;
  impB = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Outra Importadora" })).id;
  vA = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa" })).id;
});

describe("acesso e funções", () => {
  it("Master cria o login (senha provisória, troca no 1º acesso); a pessoa só vê a própria importadora", async () => {
    const dono = await acessoDe(impA, "dono@xdx.teste");
    expect(dono.role).toBe("BRAS_IMPORTER");
    const u = (await ctx.db.query.users.findFirst({ where: eq(users.id, dono.userId) }))!;
    expect(u.mustChangePassword).toBe(true);
    expect((await myImporter(ctx.db, dono)).importer.id).toBe(impA);
    await expect(createImporterAccess(ctx.db, ana, impA, { name: "X", email: "x@x.teste", password: "senha-forte-1" })).rejects.toThrow();
    await expect(createImporterAccess(ctx.db, ctx.actors.master, impA, { name: "Xavier", email: "dono@xdx.teste", password: "senha-forte-1" })).rejects.toThrow(/e-mail/);
    // O dono convida a equipe, mas não outro dono; não encerra o próprio acesso.
    await expect(createImporterAccess(ctx.db, dono, null, { name: "Yara", email: "y@xdx.teste", password: "senha-forte-1", staffRole: "DONO" })).rejects.toThrow(/dono/);
    const balcao = await loginComo((await createImporterAccess(ctx.db, dono, null, { name: "Bia", email: "bia@xdx.teste", password: "senha-forte-1", staffRole: "BALCAO" })).userId);
    expect((await listImporterAccess(ctx.db, dono, null)).map((x) => x.staffRole).sort()).toEqual(["BALCAO", "DONO"]);
    await expect(revokeImporterAccess(ctx.db, dono, null, dono.userId)).rejects.toThrow(/próprio/);
    // Balcão não cadastra produto nem mexe na ficha.
    await expect(saveImporterProduct(ctx.db, balcao, null, null, produto)).rejects.toThrow(/função/);
    await expect(updateImporterProfile(ctx.db, balcao, null, { description: "x" })).rejects.toThrow();
    await revokeImporterAccess(ctx.db, dono, null, balcao.userId);
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, balcao.userId) }))!.disabledAt).not.toBeNull();
  });

  it("matriz de funções", () => {
    expect(brasStaffCan("DONO", "equipe")).toBe(true);
    expect(brasStaffCan("BALCAO", "pedidos_balcao")).toBe(true);
    expect(brasStaffCan("BALCAO", "estoque")).toBe(false);
    expect(brasStaffCan("ESTOQUE", "estoque")).toBe(true);
    expect(brasStaffCan("COMERCIAL", "produtos")).toBe(true);
    expect(brasStaffCan("FINANCEIRO", "pedidos_balcao")).toBe(false);
  });

  it("isolamento: importadora B não vê nem mexe em produto ou pedido da A", async () => {
    const a = await acessoDe(impA, "a@xdx.teste");
    const b = await acessoDe(impB, "b@outra.teste");
    const { id } = await saveImporterProduct(ctx.db, a, null, null, produto);
    expect(await listImporterProducts(ctx.db, b, null)).toEqual([]);
    await expect(moveImporterStock(ctx.db, b, null, { productId: id, kind: "ENTRADA", boxes: 5 })).rejects.toThrow();
    await expect(saveImporterProduct(ctx.db, b, impA, null, produto)).rejects.toThrow();
    await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 10 });
    const { id: rid } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio });
    expect(await listImporterRequests(ctx.db, b)).toEqual([]);
    await expect(confirmRequestAvailability(ctx.db, b, rid)).rejects.toThrow();
    await expect(myImporter(ctx.db, ana)).rejects.toThrow();
  });
});

describe("produtos de caixa fechada", () => {
  it("valida faixas de preço, calcula cubagem e preço por quantidade; SKU único por importadora", async () => {
    const a = await acessoDe(impA, "a@xdx.teste");
    await expect(saveImporterProduct(ctx.db, a, null, null, { ...produto, priceTiers: [{ minBoxes: 2, priceBoxCents: 100 }] })).rejects.toThrow(/1 caixa/);
    await expect(saveImporterProduct(ctx.db, a, null, null, { ...produto, priceTiers: [{ minBoxes: 1, priceBoxCents: 100 }, { minBoxes: 5, priceBoxCents: 200 }] })).rejects.toThrow(/mais caro/);
    const { id } = await saveImporterProduct(ctx.db, a, null, null, produto);
    const p = (await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, id) }))!;
    expect(p.sku).toBe("GT-48");
    expect(p.status).toBe("ESGOTADO"); // ativo sem caixa nasce esgotado
    expect(brasBoxLiters(p)).toBe(60);
    expect(brasTierPrice(p.priceTiers, 3)).toBe(30_000);
    expect(brasTierPrice(p.priceTiers, 12)).toBe(27_000);
    await expect(saveImporterProduct(ctx.db, a, null, null, { ...produto, title: "Outro" })).rejects.toThrow(/GT-48/);
    // Outra importadora pode usar o mesmo SKU.
    const b = await acessoDe(impB, "b@outra.teste");
    await saveImporterProduct(ctx.db, b, null, null, produto);
  });
});

describe("estoque em caixas", () => {
  it("entrada, saída, ajuste com motivo, contagem; nunca negativo; esgotado e ativo automáticos; movimentos registrados", async () => {
    const a = await acessoDe(impA, "a@xdx.teste");
    const { id } = await saveImporterProduct(ctx.db, a, null, null, produto);
    expect((await moveImporterStock(ctx.db, a, null, { productId: id, kind: "ENTRADA", boxes: 10 })).balance).toBe(10);
    expect((await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, id) }))!.status).toBe("ATIVO");
    await expect(moveImporterStock(ctx.db, a, null, { productId: id, kind: "SAIDA", boxes: 11 })).rejects.toThrow(/Só há 10/);
    await expect(moveImporterStock(ctx.db, a, null, { productId: id, kind: "AJUSTE", boxes: -2 })).rejects.toThrow(/motivo/);
    expect((await moveImporterStock(ctx.db, a, null, { productId: id, kind: "AJUSTE", boxes: -2, note: "2 avariadas" })).balance).toBe(8);
    expect((await moveImporterStock(ctx.db, a, null, { productId: id, kind: "CONTAGEM", boxes: 0 })).balance).toBe(0);
    expect((await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, id) }))!.status).toBe("ESGOTADO");
    const movs = await ctx.db.select().from(bdStockMovements).where(eq(bdStockMovements.productId, id));
    expect(movs.map((m) => [m.kind, m.boxes, m.balanceAfter])).toEqual([["ENTRADA", 10, 10], ["AJUSTE", -2, 8], ["CONTAGEM", -8, 0]]);
    // Modo Bling: ajuste manual bloqueado (só o Master muda o modo; Bling entra na F7).
    await expect(updateImporterProfile(ctx.db, ctx.actors.master, impA, { stockMode: "BLING" })).rejects.toThrow(/F7/);
  });

  it("saldo do membro: produto ligado em dia; velho vira consultar; rascunho e alto mar zeram", () => {
    const now = new Date("2026-10-09T12:00:00Z");
    expect(brasEffectiveBoxes(10, null, 72, now)).toBe(10);
    expect(brasEffectiveBoxes(10, { stockBoxes: 4, stockUpdatedAt: "2026-10-09T10:00:00Z", status: "ATIVO" }, 72, now)).toBe(4);
    expect(brasEffectiveBoxes(10, { stockBoxes: 4, stockUpdatedAt: "2026-10-01T10:00:00Z", status: "ATIVO" }, 72, now)).toBeNull();
    expect(brasEffectiveBoxes(10, { stockBoxes: 4, stockUpdatedAt: "2026-10-09T10:00:00Z", status: "ALTO_MAR" }, 72, now)).toBe(0);
    expect(brasStockAge("2026-10-09T11:48:00Z", now)).toBe("atualizado há 12 min");
  });

  it("pedido com produto ligado: confirmar baixa as caixas; a última caixa disputada vai para um só; cancelar devolve", async () => {
    const a = await acessoDe(impA, "a@xdx.teste");
    const { id: pid } = await saveImporterProduct(ctx.db, a, null, null, produto);
    await moveImporterStock(ctx.db, a, null, { productId: pid, kind: "ENTRADA", boxes: 3 });
    await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: null, productId: pid });
    expect((await listBrasFeed(ctx.db, "MEMBER")).find((v) => v.id === vA)?.offer?.boxesAvailable).toBe(3);
    await expect(createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 4, ...envio })).rejects.toThrow(/3 caixa/);
    const r1 = (await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, ...envio })).id;
    const r2 = (await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio })).id;
    const r3 = (await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 1, ...envio })).id;
    await setBrasRequestStatus(ctx.db, ctx.actors.master, r1, "CONFIRMED");
    const res = await Promise.allSettled([setBrasRequestStatus(ctx.db, ctx.actors.master, r2, "CONFIRMED"), setBrasRequestStatus(ctx.db, ctx.actors.master, r3, "CONFIRMED")]);
    expect(res.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(String((res.find((x) => x.status === "rejected") as PromiseRejectedResult).reason)).toMatch(/Sem caixas/);
    const perdeu = res[0]!.status === "rejected" ? r2 : r3;
    expect((await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, perdeu) }))!.status).toBe("NEW");
    expect((await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, pid) }))!.stockBoxes).toBe(0);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, r1, "CANCELED");
    expect((await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, pid) }))!.stockBoxes).toBe(2);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, perdeu, "CONFIRMED");
    expect((await ctx.db.query.bdProducts.findFirst({ where: eq(bdProducts.id, pid) }))!.stockBoxes).toBe(1);
  });

  it("planilha: prévia não grava; aplicar cria, atualiza e conta; linhas com erro ficam de fora", async () => {
    const a = await acessoDe(impA, "a@xdx.teste");
    await saveImporterProduct(ctx.db, a, null, null, produto);
    const sheet = [
      ["SKU", "Produto", "Unidades por caixa", "Preço da caixa (R$)", "Comprimento (cm)", "Largura (cm)", "Altura (cm)", "Peso (kg)", "Mínimo de caixas", "Categoria", "Caixas em estoque"],
      ["GT-48", "", "", "", "", "", "", "", "", "", "12"],
      ["PT-5", "Kit 5 potes de vidro", "12", "189,90", "40", "30", "25", "8,5", "1", "Cozinha", "7"],
      ["", "Sem código", "10", "50", "", "", "", "", "", "", "1"],
      ["XX-1", "", "", "", "", "", "", "", "", "", "3"],
    ];
    const prev = await previewStockSheet(ctx.db, a, null, sheet);
    expect(prev.map((l) => [l.sku, l.action])).toEqual([["GT-48", "ATUALIZAR"], ["PT-5", "CRIAR"], ["", "IGNORAR"], ["XX-1", "IGNORAR"]]);
    expect(prev[1]!.input?.priceTiers).toEqual([{ minBoxes: 1, priceBoxCents: 18_990 }]);
    expect(await ctx.db.select().from(bdStockMovements)).toHaveLength(0);
    const r = await applyStockSheet(ctx.db, a, null, sheet);
    expect(r).toEqual({ created: 1, updated: 1, counted: 2, ignored: 2 });
    const all = await listImporterProducts(ctx.db, a, null);
    expect(Object.fromEntries(all.map((p) => [p.sku, p.stockBoxes]))).toEqual({ "GT-48": 12, "PT-5": 7 });
    expect(all.find((p) => p.sku === "PT-5")).toMatchObject({ boxLengthMm: 400, grossWeightG: 8500, status: "ATIVO" });
  });
});

describe("pedidos no painel da importadora", () => {
  it("vê só o envio (nada do comprador nem o código); confere, separa e entrega com o código do motorista", async () => {
    const dono = await acessoDe(impA, "a@xdx.teste");
    await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 10 });
    const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes: 2, ...envio, notes: "Ligar antes" });
    const lista = await listImporterRequests(ctx.db, dono);
    const txt = JSON.stringify(lista);
    for (const segredo of ["11222333000181", "ana@u.teste", "11988887777", "Ana Utilidades", "Ligar antes", "totalCents", "priceBoxCents", "pickupCode"]) expect(txt).not.toContain(segredo);
    expect(lista[0]).toMatchObject({ number: 1001, boxes: 2, shipCity: "Curitiba", shipState: "PR" });
    await confirmRequestAvailability(ctx.db, dono, id);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    expect((await importerToday(ctx.db, dono)).separar.map((x) => x.id)).toEqual([id]);
    await markRequestSeparated(ctx.db, dono, id);
    await expect(importerConfirmPickup(ctx.db, dono, id, "BD-XXXX")).rejects.toThrow(/pago/);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    await expect(importerConfirmPickup(ctx.db, dono, id, "BD-ERRADO")).rejects.toThrow(/não confere/);
    const code = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!.pickupCode!;
    await importerConfirmPickup(ctx.db, dono, id, code.toLowerCase());
    const r = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!;
    expect(r.status).toBe("PICKED_UP");
    expect(r.pickedUpAt).not.toBeNull();
    expect((await listImporterRequests(ctx.db, dono, { status: "RETIRADOS" })).map((x) => x.id)).toEqual([id]);
  });
});

describe("Importadora 360", () => {
  it("saúde explicável e reproduzível; oportunidades com premissa", () => {
    const base = { activeProducts: 4, freshProducts: 2, warehouses: 1, avgAvailabilityHours: 4, pickups: 4, pickupsOnTime: 3, discoveriesLast30: 1, profile: { legalName: true, cnpj: true, description: false, contacts: true, paymentMethods: false } };
    const h = brasImporterHealth(base);
    expect(h).toEqual(brasImporterHealth(base));
    expect(h.factors.map((f) => f.weight).reduce((a, b) => a + b, 0)).toBe(100);
    expect(h.score).toBe(Math.round(12.5 + 10 + 20 + 15 + 7.5 + 6));
    expect(brasImporterHealth({ ...base, activeProducts: 0, freshProducts: 0, warehouses: 0, avgAvailabilityHours: null, pickups: 0, pickupsOnTime: 0, discoveriesLast30: 0, profile: { legalName: false, cnpj: false, description: false, contacts: false, paymentMethods: false } }).score).toBe(20);
    const ops = brasImporterOpportunities({ warehouses: 0, staleProducts: 2, soldOut: 1, discoveriesLast30: 0, plan: "GRATIS", paidOrders30: 25, hasAccess: false, activeProducts: 3 });
    expect(ops.map((o) => o.title)).toEqual(["Criar o acesso da importadora", "Cadastrar o galpão", "2 produto(s) com estoque desatualizado", "1 produto(s) esgotado(s)", "Nenhuma descoberta em 30 dias", "Oferecer o plano Pro"]);
  });

  it("ficha: Master edita tudo (CNPJ conferido, auditado); a importadora edita o comercial mas não o plano", async () => {
    await expect(updateImporterProfile(ctx.db, ctx.actors.master, impA, { cnpj: "11.222.333/0001-82" })).rejects.toThrow(/CNPJ/);
    await updateImporterProfile(ctx.db, ctx.actors.master, impA, { legalName: "XDX Comércio Ltda", cnpj: "11.444.777/0001-61", plan: "PRO", paymentMethods: ["PIX"] });
    const dono = await acessoDe(impA, "a@xdx.teste");
    await updateImporterProfile(ctx.db, dono, null, { description: "Utilidades e cozinha", plan: "PREMIUM", prepDays: 1 });
    const v = await brasImporter360(ctx.db, ctx.actors.master, impA);
    expect(v.importer).toMatchObject({ legalName: "XDX Comércio Ltda", cnpj: "11444777000161", plan: "PRO", description: "Utilidades e cozinha", prepDays: 1 });
    await expect(brasImporter360(ctx.db, dono, impA)).rejects.toThrow();
  });

  it("receita de 12 meses bate com a soma dos pedidos pagos e a comissão congelada", async () => {
    await saveWarehouse(ctx.db, ctx.actors.master, impA, null, { name: "Galpão Oriente", address: "Rua Oriente, 500, Brás" });
    await setBrasOffer(ctx.db, ctx.actors.master, vA, { importerId: impA, priceBoxCents: 30_000, unitsPerBox: 24, boxesAvailable: 10 });
    await updateImporterProfile(ctx.db, ctx.actors.master, impA, {});
    const { setBrasImporterCommission } = await import("@/lib/domain/bras/comissoes");
    await setBrasImporterCommission(ctx.db, ctx.actors.master, impA, 500);
    for (const boxes of [2, 3]) {
      const { id } = await createBrasRequest(ctx.db, ana, { videoId: vA, boxes, ...envio });
      await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
      await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    }
    const v = await brasImporter360(ctx.db, ctx.actors.master, impA);
    expect(v.revenue.salesCents).toBe(150_000);
    expect(v.revenue.commissionCents).toBe(7_500);
    expect(v.revenue.months).toHaveLength(12);
    expect(v.revenue.months.at(-1)!.salesCents).toBe(150_000);
    expect(v.warehouses).toHaveLength(1);
    expect(v.importer.pickupAddress).toBe("Rua Oriente, 500, Brás");
    expect(v.health.factors.find((f) => f.key === "galpao")!.points).toBe(10);
  });
});
