import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { customer, freshDb } from "./setup";
import { financeInvoices, nlSubscriptions, productVariants, storeProducts, users } from "@/db/schema";
import { signupMember } from "@/lib/domain/store-access";
import { catalogOwner } from "@/lib/domain/independent";
import { createProduct } from "@/lib/domain/products";
import { createOrder } from "@/lib/domain/orders";
import { actorFromUser, type Actor } from "@/lib/domain/access";
import { closeStoreFees, markInvoicePaid, periodOf, storeOrderFeeFor } from "@/lib/domain/finance";
import { economiaDoAnual } from "@/lib/domain/commerce-plans";
import { nomeDaCompetencia, TAXA_NAO_ENTRA, taxaDoMes } from "@/lib/domain/taxa-transparente";
import {
  bilheteSegundaEtapa, confirmarDuasEtapas, conferirSegundaEtapa, desligarDuasEtapas, iniciarDuasEtapas, lerBilheteSegundaEtapa,
  sairDosOutrosAparelhos, versaoDaSessaoValida,
} from "@/lib/domain/seguranca-conta";
import { base32, codigoTotp, confereTotp } from "@/lib/security/totp";
import { signSession, verifySession } from "@/lib/security/crypto";
import { novidadesDa } from "@/lib/domain/novidades";

/** W0 das melhorias (D182/D183): taxa transparente, economia do anual, segurança da conta e novidades. */
let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeEach(async () => { ctx = await freshDb(); });

async function lojaComTaxa(bps = 200) {
  const r = await signupMember(ctx.db, { storeName: "Ateliê Taxa", ownerName: "Rita Teste", email: "rita@atelie.com.br", password: "senha-segura-1", taxId: "529.982.247-25", offer: "STORE_SUBDOMAIN", brand: "NEXTLEVEL_COMMERCE", independent: true } as never);
  const user = (await ctx.db.query.users.findFirst({ where: eq(users.id, r.userId) }))!;
  const owner: Actor = actorFromUser(user);
  const plan = (await ctx.db.select().from(financeInvoices).where(eq(financeInvoices.storeId, r.storeId)))[0]!;
  await markInvoicePaid(ctx.db, plan.id);
  await ctx.db.update(nlSubscriptions).set({ platformFeeBps: bps, feeHolidayUntil: null }).where(eq(nlSubscriptions.storeId, r.storeId));
  const { productId } = await createProduct(ctx.db, await catalogOwner(ctx.db, owner), { name: "Vestido", sku: "VE-1", categoryName: "Vestidos", costCents: 5000, suggestedPriceCents: 10000, minimumPriceCents: 9000, sizes: [{ size: "M", initialStock: 20 }] });
  await ctx.db.insert(storeProducts).values({ storeId: r.storeId, productId, priceCents: 10000, packPriceCents: null, active: true, featured: false })
    .onConflictDoUpdate({ target: [storeProducts.storeId, storeProducts.productId], set: { priceCents: 10000, active: true } });
  const variantId = (await ctx.db.select().from(productVariants).where(eq(productVariants.productId, productId)))[0]!.id;
  return { storeId: r.storeId, owner, user, productId, variantId };
}

describe("Sua taxa: a mesma conta do fechamento do mês", () => {
  it("mostra o mesmo valor que o fechamento cobra; frete e pedido não pago ficam fora", async () => {
    const l = await lojaComTaxa(200);
    const items = [{ productId: l.productId, variantId: l.variantId, quantity: 2 }];
    await createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PAID", shipping: { costCents: 2500, address: "Rua A, 1", city: "São Paulo", state: "SP", zip: "01001-000" } }, { paymentProvider: "MANUAL" });
    await createOrder(ctx.db, { storeId: l.storeId, customer, items, customerPaymentStatus: "PENDING" }, { paymentProvider: "MANUAL" });
    const t = await taxaDoMes(ctx.db, l.owner, l.storeId);
    const fechamento = await storeOrderFeeFor(ctx.db, l.storeId, periodOf(new Date()));
    expect(t.taxaCents).toBe(fechamento.feeCents);
    expect(t.baseCents).toBe(20000);
    expect(t.taxaCents).toBe(400);
    expect(t.pedidos).toBe(1);
    expect(TAXA_NAO_ENTRA).toContain("Frete");
    // Fechado o mês, a fatura aparece no histórico com o mesmo valor.
    await closeStoreFees(ctx.db, t.competencia);
    const depois = await taxaDoMes(ctx.db, l.owner, l.storeId);
    expect(depois.historico[0]).toMatchObject({ competencia: t.competencia, taxaCents: 400, situacao: "Em aberto" });
  });

  it("só a própria loja (dono) e o Master veem", async () => {
    const l = await lojaComTaxa();
    await expect(taxaDoMes(ctx.db, { ...l.owner, storeRole: "STAFF" }, l.storeId)).rejects.toThrow();
    await expect(taxaDoMes(ctx.db, ctx.actors.arena, l.storeId)).rejects.toThrow();
    await expect(taxaDoMes(ctx.db, ctx.actors.master, l.storeId)).resolves.toMatchObject({ bps: 200 });
  });

  it("loja do SuperDrop continua com a mesma taxa de antes (a tela só lê)", async () => {
    const arena = ctx.seed.stores.arena.id;
    const t = await taxaDoMes(ctx.db, ctx.actors.arena, arena);
    expect(t.taxaCents).toBe((await storeOrderFeeFor(ctx.db, arena, periodOf(new Date()))).feeCents);
  });

  it("nome da competência em português", () => {
    expect(nomeDaCompetencia("2026-10")).toBe("Outubro de 2026");
  });
});

describe("economia do plano anual", () => {
  it("compara com 12 mensalidades e some quando o anual não compensa", () => {
    expect(economiaDoAnual(9900, 99000)).toEqual({ anualCents: 99000, economiaCents: 19800, porMesCents: 8250 });
    expect(economiaDoAnual(9900, 118800)).toBeNull();
    expect(economiaDoAnual(null, 99000)).toBeNull();
  });
});

describe("sair dos outros aparelhos", () => {
  it("a versão sobe e a sessão antiga deixa de valer", async () => {
    const l = await lojaComTaxa();
    const antiga = verifySession(signSession({ uid: l.user.id, exp: Date.now() + 60_000, sv: 0 }))!;
    expect(versaoDaSessaoValida(antiga.sv, 0)).toBe(true);
    const nova = await sairDosOutrosAparelhos(ctx.db, l.user.id);
    expect(nova).toBe(1);
    expect(versaoDaSessaoValida(antiga.sv, nova)).toBe(false);
    expect(versaoDaSessaoValida(undefined, nova)).toBe(false);
    expect(versaoDaSessaoValida(1, nova)).toBe(true);
  });
});

describe("verificação em duas etapas", () => {
  it("código igual ao do padrão (RFC 6238) e tolera 30 s de relógio", () => {
    const s = base32(Buffer.from("12345678901234567890"));
    expect(codigoTotp(s, 59_000)).toBe("287082");
    expect(codigoTotp(s, 1_111_111_109_000)).toBe("081804");
    expect(confereTotp(s, "287082", 59_000 + 30_000)).toBe(true);
    expect(confereTotp(s, "287082", 59_000 + 90_000)).toBe(false);
    expect(confereTotp(s, "12345", 59_000)).toBe(false);
  });

  it("Master liga com o código, entra com o código ou um código de recuperação (que vale uma vez) e desliga", async () => {
    const master = (await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.actors.master.userId) }))!;
    const { segredo } = await iniciarDuasEtapas(ctx.db, master);
    const guardado = (await ctx.db.query.users.findFirst({ where: eq(users.id, master.id) }))!;
    expect(guardado.totpSecret).not.toContain(segredo);
    expect(guardado.totpEnabledAt).toBeNull();
    const agora = new Date();
    await expect(confirmarDuasEtapas(ctx.db, master, "000000", agora)).rejects.toThrow(/incorreto/);
    const codigos = await confirmarDuasEtapas(ctx.db, master, codigoTotp(segredo, agora.getTime()), agora);
    expect(codigos).toHaveLength(8);
    const ligado = (await ctx.db.query.users.findFirst({ where: eq(users.id, master.id) }))!;
    expect(ligado.totpRecovery!.join()).not.toContain(codigos[0]!);
    await expect(iniciarDuasEtapas(ctx.db, ligado)).rejects.toThrow(/já está ligada/);
    expect(await conferirSegundaEtapa(ctx.db, master.id, codigoTotp(segredo, agora.getTime()), agora)).toBe(true);
    expect(await conferirSegundaEtapa(ctx.db, master.id, "999999", agora)).toBe(false);
    expect(await conferirSegundaEtapa(ctx.db, master.id, codigos[0]!, agora)).toBe(true);
    expect(await conferirSegundaEtapa(ctx.db, master.id, codigos[0]!, agora)).toBe(false);
    await desligarDuasEtapas(ctx.db, ligado, codigoTotp(segredo, agora.getTime()), agora);
    expect((await ctx.db.query.users.findFirst({ where: eq(users.id, master.id) }))!.totpEnabledAt).toBeNull();
  });

  it("lojista também liga (W6a, D188), fornecedor ainda não; o bilhete da entrada só vale para a segunda etapa", async () => {
    const l = await lojaComTaxa();
    const { segredo } = await iniciarDuasEtapas(ctx.db, l.user);
    expect(await confirmarDuasEtapas(ctx.db, l.user, codigoTotp(segredo))).toHaveLength(8);
    const fornecedor = (await ctx.db.query.users.findFirst({ where: eq(users.id, ctx.actors.supplier.userId) }))!;
    await expect(iniciarDuasEtapas(ctx.db, fornecedor)).rejects.toThrow(/ainda não está disponível/);
    expect(lerBilheteSegundaEtapa(bilheteSegundaEtapa(l.user.id))).toBe(l.user.id);
    expect(lerBilheteSegundaEtapa(bilheteSegundaEtapa(l.user.id, Date.now() - 10 * 60_000))).toBeNull();
    expect(lerBilheteSegundaEtapa(signSession({ uid: l.user.id, exp: Date.now() + 60_000 }))).toBeNull();
  });
});

describe("o que mudou", () => {
  it("cada marca vê só as novidades dela", () => {
    const ec = novidadesDa("NEXTLEVEL_COMMERCE").map((n) => n.titulo);
    const sd = novidadesDa("NEXTLEVEL").map((n) => n.titulo);
    expect(ec).toContain("Cartão em até 6 vezes na sua loja");
    expect(sd).not.toContain("Cartão em até 6 vezes na sua loja");
    expect(sd).toContain("Veja a conta da sua taxa");
    for (const n of novidadesDa("NEXTLEVEL_COMMERCE")) expect(`${n.titulo} ${n.texto}`).not.toMatch(/ganh|lucr|garant|fatur/i);
  });
});
