import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { freshDb } from "./setup";
import { bdRequests } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { getBrasMemberByUser, signupBrasMember } from "@/lib/domain/bras/membros";
import { addBrasVideo } from "@/lib/domain/bras/videos";
import { addBrasImporter, createBrasRequest, setBrasOffer, setBrasRequestStatus } from "@/lib/domain/bras/catalogo";
import { brasCommissionCents, brasCommissionCsv, brasCommissionReport, brasMonthOf, brasMonthRange, brasOverview, getBrasDefaultCommissionBps, setBrasDefaultCommissionBps, settleBrasCommission, undoBrasSettlement, updateBrasImporterDetails } from "@/lib/domain/bras/comissoes";
import { brasRomaneio, brasRomaneioText, getMyBrasPickup } from "@/lib/domain/bras/retirada";

/** D102 (comissões manuais e visão geral) e D103 (código de retirada, comprovante e romaneio). */
let ctx: Awaited<ReturnType<typeof freshDb>>;
let ana: Actor; let videoId: string; let impA: string; let impB: string;
const envio = { carrier: "Braspress", shipName: "Ana Recebimento", shipAddress: "Rua das Flores, 100", shipCity: "Curitiba", shipState: "PR" as const, shipZip: "80010-000" };
const base = { name: "Ana", companyName: "Ana Utilidades LTDA", cnpj: "11222333000181", whatsapp: "11988887777", email: "ana@u.teste", password: "senha-forte-1", acceptTerms: true as const };
const member = async (cnpj: string, email: string, companyName = "Outra Empresa"): Promise<Actor> => {
  const r = await signupBrasMember(ctx.db, { ...base, cnpj, email, companyName });
  const m = (await getBrasMemberByUser(ctx.db, r.userId))!;
  return { userId: r.userId, role: "BRAS_MEMBER", organizationId: m.organizationId, supplierId: null, storeId: null };
};
const pago = async (who: Actor, boxes: number, importerVideo = videoId) => {
  const { id } = await createBrasRequest(ctx.db, who, { videoId: importerVideo, boxes, ...envio });
  await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
  await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
  return id;
};

beforeEach(async () => {
  ctx = await freshDb();
  ana = await member("11222333000181", "ana@u.teste", "Ana Utilidades LTDA");
  videoId = (await addBrasVideo(ctx.db, ctx.actors.master, { url: "aaaaaaaaaa1", title: "Garrafa térmica 1 L" })).id;
  impA = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora A" })).id;
  impB = (await addBrasImporter(ctx.db, ctx.actors.master, { name: "Importadora B" })).id;
  await setBrasOffer(ctx.db, ctx.actors.master, videoId, { importerId: impA, priceBoxCents: 33333, unitsPerBox: 24, boxesAvailable: 50 });
});

describe("percentual", () => {
  it("padrão começa em 0; só Master muda; limites de 0% a 50%", async () => {
    expect(await getBrasDefaultCommissionBps(ctx.db)).toBe(0);
    await expect(setBrasDefaultCommissionBps(ctx.db, ctx.actors.mantos, 500)).rejects.toThrow();
    await expect(setBrasDefaultCommissionBps(ctx.db, ctx.actors.master, 6000)).rejects.toMatchObject({ code: "BPS" });
    await setBrasDefaultCommissionBps(ctx.db, ctx.actors.master, 300);
    expect(await getBrasDefaultCommissionBps(ctx.db)).toBe(300);
    await expect(updateBrasImporterDetails(ctx.db, ana, impA, { pickupAddress: null, commissionPct: 5 })).rejects.toThrow();
  });

  it("arredonda por pedido, meio para cima", () => {
    expect(brasCommissionCents(33333, 250)).toBe(833);
    expect(brasCommissionCents(100, 50)).toBe(1);
    expect(brasCommissionCents(96000, 0)).toBe(0);
  });

  it("congela o percentual no pagamento: mudar depois não reescreve o passado", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: "Rua Barão de Ladário, 100", commissionPct: 2.5 });
    const id = await pago(ana, 3);
    const r = (await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id) }))!;
    expect(r.commissionBps).toBe(250);
    expect(r.paidAt).toBeTruthy();
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: 10 });
    const [line] = await brasCommissionReport(ctx.db, ctx.actors.master);
    expect(line).toMatchObject({ importerId: impA, totalCents: 99999, commissionCents: 2500 });
    // Sem percentual próprio, vale o padrão no momento do pagamento.
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: null });
    await setBrasDefaultCommissionBps(ctx.db, ctx.actors.master, 100);
    const id2 = await pago(ana, 1);
    expect((await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, id2) }))!.commissionBps).toBe(100);
  });
});

describe("relatório e fechamento", () => {
  it("agrupa por importadora e mês; cancelado e não pago ficam fora; só Master", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: 5 });
    await pago(ana, 2);
    const naoPago = await createBrasRequest(ctx.db, ana, { videoId, boxes: 1, ...envio });
    const cancelado = await pago(ana, 1);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, cancelado, "CANCELED");
    const lines = await brasCommissionReport(ctx.db, ctx.actors.master);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.requests.map((r) => r.id)).not.toContain(naoPago.id);
    expect(lines[0]).toMatchObject({ totalCents: 66666, commissionCents: brasCommissionCents(66666, 500) });
    await expect(brasCommissionReport(ctx.db, ctx.actors.mantos)).rejects.toThrow();
    await expect(brasCommissionReport(ctx.db, ctx.actors.master, "2026-13")).rejects.toMatchObject({ code: "MONTH" });
  });

  it("marcar como recebida grava o valor; repetir é recusado; pedido novo não muda o fechamento; desfazer exige motivo", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: 5 });
    await pago(ana, 2);
    const month = brasMonthOf(new Date().toISOString());
    const s = await settleBrasCommission(ctx.db, ctx.actors.master, { importerId: impA, month, note: "Pix de 05/11" });
    expect(s.amountCents).toBe(brasCommissionCents(66666, 500));
    await expect(settleBrasCommission(ctx.db, ctx.actors.master, { importerId: impA, month })).rejects.toMatchObject({ code: "SETTLED" });
    await expect(settleBrasCommission(ctx.db, ctx.actors.master, { importerId: impB, month })).rejects.toMatchObject({ code: "NOTHING" });
    await pago(ana, 1);
    const [line] = await brasCommissionReport(ctx.db, ctx.actors.master, month);
    expect(line!.settlement!.amountCents).toBe(s.amountCents);
    expect(line!.commissionCents).toBeGreaterThan(s.amountCents);
    await expect(undoBrasSettlement(ctx.db, ctx.actors.master, s.id, "  ")).rejects.toMatchObject({ code: "REASON" });
    await undoBrasSettlement(ctx.db, ctx.actors.master, s.id, "valor errado");
    const again = await settleBrasCommission(ctx.db, ctx.actors.master, { importerId: impA, month });
    expect(again.amountCents).toBe(line!.commissionCents);
  });

  it("CSV com ; e vírgula decimal, sem dado do membro", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: 2.5 });
    await pago(ana, 3);
    const csv = brasCommissionCsv(await brasCommissionReport(ctx.db, ctx.actors.master));
    const [head, row] = csv.split("\n");
    expect(head).toBe("Mês;Importadora;Pedido;Produto;Caixas;Valor do pedido (R$);Comissão (%);Comissão (R$);Pago em;Recebida");
    expect(row).toContain(";999,99;2,5;25,00;");
    expect(csv).not.toMatch(/Ana Utilidades|11222333000181|ana@u\.teste|Rua das Flores/);
  });

  it("mês de Brasília", () => {
    expect(brasMonthOf("2026-11-01T02:00:00Z")).toBe("2026-10");
    expect(brasMonthRange("2026-10")).toEqual({ start: "2026-10-01T03:00:00.000Z", end: "2026-11-01T03:00:00.000Z" });
  });
});

describe("visão geral", () => {
  it("membros, situações, mês pago e pedidos parados há mais de 24 h", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: null, commissionPct: 5 });
    await pago(ana, 2);
    const { id } = await createBrasRequest(ctx.db, ana, { videoId, boxes: 1, ...envio });
    await ctx.db.update(bdRequests).set({ createdAt: new Date(Date.now() - 30 * 3600_000).toISOString() }).where(eq(bdRequests.id, id));
    const o = await brasOverview(ctx.db, ctx.actors.master);
    expect(o.members).toMatchObject({ total: 1, active: 1, last7: 1 });
    expect(o.requests).toMatchObject({ PAID: 1, NEW: 1 });
    expect(o.monthPaid).toMatchObject({ count: 1, boxes: 2, totalCents: 66666 });
    expect(o.stalledCount).toBe(1);
    await expect(brasOverview(ctx.db, ctx.actors.mantos)).rejects.toThrow();
  });
});

describe("retirada", () => {
  it("código nasce na confirmação; comprovante só do dono do pedido e só a partir de confirmado", async () => {
    await updateBrasImporterDetails(ctx.db, ctx.actors.master, impA, { pickupAddress: "Rua Barão de Ladário, 100", commissionPct: null });
    const { id } = await createBrasRequest(ctx.db, ana, { videoId, boxes: 2, ...envio });
    await expect(getMyBrasPickup(ctx.db, ana, id)).rejects.toThrow(/não encontrado/);
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "CONFIRMED");
    const p = await getMyBrasPickup(ctx.db, ana, id);
    expect(p.pickupCode).toMatch(/^BD-[A-HJ-KM-NP-Z2-9]{4}$/);
    expect(p).toMatchObject({ importerName: "Importadora A", importerAddress: "Rua Barão de Ladário, 100", boxes: 2 });
    const beto = await member("11444777000161", "beto@d.teste");
    await expect(getMyBrasPickup(ctx.db, beto, id)).rejects.toThrow(/não encontrado/);
    await expect(getMyBrasPickup(ctx.db, ctx.actors.master, id)).rejects.toThrow();
    // O código não muda ao pagar.
    await setBrasRequestStatus(ctx.db, ctx.actors.master, id, "PAID");
    expect((await getMyBrasPickup(ctx.db, ana, id)).pickupCode).toBe(p.pickupCode);
  });

  it("romaneio: só pagos daquela importadora, só envio e código, nada do membro; só Master", async () => {
    const pagoId = await pago(ana, 2);
    await createBrasRequest(ctx.db, ana, { videoId, boxes: 1, ...envio });
    const r = await brasRomaneio(ctx.db, ctx.actors.master, impA);
    expect(r.lines).toHaveLength(1);
    expect(Object.keys(r.lines[0]!).sort()).toEqual(["boxes", "carrier", "number", "pickupCode", "productTitle", "shipAddress", "shipCity", "shipName", "shipState", "shipZip", "status", "unitsPerBox"]);
    expect((await brasRomaneio(ctx.db, ctx.actors.master, impB)).lines).toHaveLength(0);
    const txt = brasRomaneioText("Importadora A", r.lines);
    expect(txt).toContain((await ctx.db.query.bdRequests.findFirst({ where: eq(bdRequests.id, pagoId) }))!.pickupCode!);
    expect(JSON.stringify(r) + txt).not.toMatch(/Ana Utilidades|11222333000181|ana@u\.teste|11988887777|R\$/);
    await expect(brasRomaneio(ctx.db, ctx.actors.mantos, impA)).rejects.toThrow();
    await expect(brasRomaneio(ctx.db, ana, impA)).rejects.toThrow();
  });
});
