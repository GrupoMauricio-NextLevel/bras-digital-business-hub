import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, organizations, stores } from "@/db/schema";
import { appUrl, emails, sendEmail } from "@/lib/email";

/** E-mails ao cliente final da loja: pagamento confirmado e pedido enviado. Envio único por pedido e tipo; nunca lança. */
export async function emailOrderCustomer(db: Database, orderId: string, kind: "PAID" | "SHIPPED") {
  try {
    const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!o?.customerEmail) return;
    const st = await db.query.stores.findFirst({ where: eq(stores.id, o.storeId) });
    if (!st) return;
    const org = await db.query.organizations.findFirst({ where: eq(organizations.id, st.organizationId) });
    const track = `${appUrl(org?.brand)}/store/${st.slug}/acompanhar`;
    const m = kind === "PAID" ? emails.customerOrderPaid(st.name, o.number, o.totalCents, track) : emails.customerOrderShipped(st.name, o.number, o.shippingCarrier, o.shippingLabelCode, track);
    await sendEmail(db, { kind: kind === "PAID" ? "ORDER_PAID" : "ORDER_SHIPPED", to: o.customerEmail, brand: org?.brand, dedupeKey: `ORDER_${kind}:${o.id}`, ...m });
  } catch (e) { console.error("[order email]", e); }
}
