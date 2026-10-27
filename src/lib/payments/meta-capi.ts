import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { orders, stores } from "@/db/schema";
import { decryptSecret } from "@/lib/security/crypto";
import { timeoutSignal } from "@/lib/http-timeout";

/**
 * Compra para a API de conversões da Meta (W4, D187), só depois do pagamento conferido no Mercado Pago. O número do
 * pedido vai como `event_id`, o mesmo do Pixel no navegador: a Meta junta os dois e não conta a venda duas vezes.
 * O e-mail vai só como resumo SHA-256 (exigência da Meta); o token nunca sai do servidor. Nunca lança.
 */
export async function enviarCompraMeta(db: Database, orderId: string, fetchImpl: typeof fetch = fetch): Promise<"ENVIADO" | "SEM_PIXEL" | "FALHOU"> {
  try {
    const o = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!o || o.customerPaymentStatus !== "PAID" || o.paymentProvider !== "MERCADO_PAGO") return "SEM_PIXEL";
    const st = await db.query.stores.findFirst({ where: eq(stores.id, o.storeId), columns: { metaPixelId: true, metaCapiTokenEnc: true } });
    const token = decryptSecret(st?.metaCapiTokenEnc);
    if (!st?.metaPixelId || !token) return "SEM_PIXEL";
    const corpo = { data: [{
      event_name: "Purchase", event_time: Math.floor(Date.now() / 1000), event_id: o.id, action_source: "website",
      user_data: { em: [createHash("sha256").update(o.customerEmail.trim().toLowerCase()).digest("hex")] },
      custom_data: { currency: "BRL", value: o.totalCents / 100, order_id: String(o.number) },
    }] };
    const r = await fetchImpl(`https://graph.facebook.com/v19.0/${st.metaPixelId}/events?access_token=${encodeURIComponent(token)}`, { method: "POST", signal: timeoutSignal(), headers: { "content-type": "application/json" }, body: JSON.stringify(corpo) });
    return r.ok ? "ENVIADO" : "FALHOU";
  } catch { return "FALHOU"; }
}
