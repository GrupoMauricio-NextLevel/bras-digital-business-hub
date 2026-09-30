import { beforeAll, describe, expect, it } from "vitest";
import { periodOf } from "@/lib/domain/finance";
import { storeOrderControl, supplierOrderControl } from "@/lib/domain/master-control";
import { nextlevelOffice } from "@/lib/domain/nextlevel-office";
import { freshDb } from "./setup";

let ctx: Awaited<ReturnType<typeof freshDb>>;
beforeAll(async () => { ctx = await freshDb(); });
const period = periodOf(new Date());

describe("controle de comissões do Master", () => {
  it("só a NextLevel acessa", async () => {
    await expect(supplierOrderControl(ctx.db, ctx.actors.supplier, period)).rejects.toThrow(/NextLevel/);
    await expect(storeOrderControl(ctx.db, ctx.actors.mantos, period)).rejects.toThrow(/NextLevel/);
    await expect(nextlevelOffice(ctx.db, ctx.actors.arena)).rejects.toThrow(/NextLevel/);
  });
  it("pedidos dos fornecedores: comissão é a taxa do contrato sobre a base paga à Central", async () => {
    const r = await supplierOrderControl(ctx.db, ctx.actors.master, period);
    expect(r.rows.length).toBeGreaterThan(0);
    for (const row of r.rows) {
      const percent = Math.round((row.baseCents * row.volumeFeeBps) / 10_000);
      expect(row.nextlevelFeeCents).toBeGreaterThanOrEqual(percent);
    }
    expect(r.totals.fee).toBe(r.rows.reduce((t, x) => t + x.nextlevelFeeCents, 0));
  });
  it("pedidos das lojas: margem = venda − custo e totais fecham com as linhas", async () => {
    const r = await storeOrderControl(ctx.db, ctx.actors.master, period);
    for (const row of r.rows) expect(row.marginCents).toBe(row.salesCents - row.costCents);
    expect(r.totals.sales).toBe(r.rows.reduce((t, x) => t + x.salesCents, 0));
  });
  it("escritório virtual separa assinaturas, ativações e serviços", async () => {
    const o = await nextlevelOffice(ctx.db, ctx.actors.master);
    expect(o.subscriptions.stores.length).toBeGreaterThan(0);
    expect(o.subscriptions.supplierMrrCents).toBeGreaterThanOrEqual(0);
    expect(o.activations.paidCents).toBe(o.activations.rows.filter((r) => r.status === "PAID").reduce((t, r) => t + r.amountCents, 0));
    expect(o.services.open).toBeGreaterThanOrEqual(0);
  });
});
