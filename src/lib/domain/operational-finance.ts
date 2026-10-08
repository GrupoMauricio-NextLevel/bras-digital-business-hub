import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, stores, walletRecharges } from "@/db/schema";
import type { Actor } from "./access";
import { ForbiddenError } from "./errors";
import { OPERATIONAL, recordFinancialAudit } from "./fin-audit";

/**
 * Financeiro OPERACIONAL de cada negócio (`tenant_operational_finance`, D90): cada um exporta só o próprio.
 * Fornecedor: recargas recebidas na conta Mercado Pago dele. Lojista: vendas recebidas na conta dele.
 */
const cell = (v: unknown) => { const s = v === null || v === undefined ? "" : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const money = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\n");

export async function operationalExportCsv(db: Database, actor: Actor, kind: "recargas" | "vendas") {
  if (kind === "recargas") {
    if (actor.role !== "SUPPLIER_ADMIN" || !actor.supplierId) throw new ForbiddenError("Exportação disponível só para o fornecedor.");
    const rows = await db.select({ r: walletRecharges, store: stores.name }).from(walletRecharges).innerJoin(stores, eq(stores.id, walletRecharges.storeId)).where(eq(walletRecharges.supplierId, actor.supplierId)).orderBy(desc(walletRecharges.createdAt)).limit(5000);
    await recordFinancialAudit(db, actor, { domain: OPERATIONAL, action: "EXPORT_RECHARGES", entityType: "wallet_recharges", supplierId: actor.supplierId, after: { rows: rows.length } });
    return csv(["Data", "Loja", "Valor (R$)", "Situação", "Pago em", "Referência Mercado Pago", "Destino"], rows.map(({ r, store }) => [r.createdAt, store, money(r.amountCents), r.status, r.paidAt ?? "", r.mpPaymentId ?? "", "Conta Mercado Pago do fornecedor"]));
  }
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Exportação disponível só para o dono da loja.");
  const rows = await db.select().from(orders).where(eq(orders.storeId, actor.storeId)).orderBy(desc(orders.createdAt)).limit(5000);
  await recordFinancialAudit(db, actor, { domain: OPERATIONAL, action: "EXPORT_SALES", entityType: "orders", storeId: actor.storeId, after: { rows: rows.length } });
  return csv(["Data", "Pedido", "Situação", "Pagamento do cliente", "Produtos (R$)", "Frete (R$)", "Desconto (R$)", "Total (R$)", "Custo (R$)", "Margem (R$)", "Destino"], rows.map((o) => [o.createdAt, o.number, o.status, o.customerPaymentStatus, money(o.subtotalCents), money(o.shippingCents), money(o.discountCents), money(o.totalCents), money(o.costTotalCents), money(o.subtotalCents - o.costTotalCents), "Conta Mercado Pago da loja"]));
}
