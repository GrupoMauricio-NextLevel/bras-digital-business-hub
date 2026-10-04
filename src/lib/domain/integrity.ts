import { sql } from "drizzle-orm";
import type { Database } from "@/db/client";

/**
 * Relatório SOMENTE-LEITURA de invariantes dos dados (documento 08 §115, §129). Não escreve nada.
 * Cada verificação devolve quantos registros violam a regra e uma amostra de ids para investigar.
 */
export type IntegrityCheck = { key: string; label: string; violations: number; sample: string[] };
export type IntegrityReport = { ok: boolean; checkedAt: string; checks: IntegrityCheck[] };

const CHECKS: { key: string; label: string; query: string }[] = [
  { key: "order-total", label: "Total do pedido diferente de subtotal − desconto + frete", query: "select id from orders where total_cents <> subtotal_cents - discount_cents + shipping_cents" },
  { key: "order-subtotal", label: "Subtotal do pedido diferente da soma dos itens", query: "select o.id from orders o join order_items i on i.order_id = o.id group by o.id, o.subtotal_cents having sum(i.line_total_cents) <> o.subtotal_cents" },
  { key: "item-line", label: "Item com total diferente de quantidade × preço", query: "select id from order_items where line_total_cents <> quantity * unit_price_cents" },
  { key: "order-no-items", label: "Pedido sem nenhum item", query: "select o.id from orders o where not exists (select 1 from order_items i where i.order_id = o.id)" },
  { key: "stock-negative", label: "Estoque físico ou reservado negativo", query: "select variant_id as id from inventory where on_hand < 0 or reserved < 0" },
  { key: "stock-reserved", label: "Reservado maior que o físico", query: "select variant_id as id from inventory where reserved > on_hand" },
  { key: "order-number-dup", label: "Número de pedido repetido na mesma loja", query: "select store_id || '#' || number as id from orders group by store_id, number having count(*) > 1" },
  { key: "payment-ref-dup", label: "Referência de pagamento repetida em mais de um pedido", query: "select payment_reference as id from orders where payment_reference is not null and payment_reference <> '' group by payment_provider, payment_reference having count(*) > 1" },
  { key: "item-no-order", label: "Item de pedido sem pedido (órfão)", query: "select i.id from order_items i where not exists (select 1 from orders o where o.id = i.order_id)" },
];

export async function runIntegrityReport(db: Database, now = new Date()): Promise<IntegrityReport> {
  const checks: IntegrityCheck[] = [];
  for (const c of CHECKS) {
    const res = await db.execute(sql.raw(c.query));
    const rows = ((res as unknown as { rows?: { id: unknown }[] }).rows ?? (res as unknown as { id: unknown }[])) as { id: unknown }[];
    checks.push({ key: c.key, label: c.label, violations: rows.length, sample: rows.slice(0, 5).map((r) => String(r.id)) });
  }
  return { ok: checks.every((c) => c.violations === 0), checkedAt: now.toISOString(), checks };
}
