import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { customers, marketingConsents, storeCustomers, storeDiscounts, stores } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";
import { normalizeCode } from "./discounts";
import { storeModality } from "./order-policy";

/**
 * Cupom de boas-vindas da loja (seção "welcome-coupon", D88). A janela só oferece um cupom que existe, está ativo,
 * no prazo e com usos sobrando; o código só é revelado depois que o visitante deixa o e-mail e aceita receber ofertas
 * (consentimento registrado em `marketing_consents`). Loja de demonstração de tema mostra o código sem gravar nada.
 */
export type WelcomeOffer = { label: string; minText: string | null };

const TAG = "cupom-boas-vindas";

async function activeDiscount(db: Database, storeId: string, rawCode: string, now = new Date()) {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  const d = await db.query.storeDiscounts.findFirst({ where: and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, code)) });
  if (!d || !d.active) return null;
  const iso = now.toISOString();
  if ((d.startsAt && d.startsAt > iso) || (d.expiresAt && d.expiresAt <= iso)) return null;
  if (d.maxRedemptions !== null && d.redemptions >= d.maxRedemptions) return null;
  if ((await storeModality(db, storeId)) === "NETWORK") return null;
  return d;
}

const labelOf = (d: { kind: "PERCENT" | "FIXED"; value: number }) => (d.kind === "PERCENT" ? `${d.value}% de desconto` : `${formatBRL(d.value)} de desconto`);

/** O que a janela pode prometer (sem revelar o código). Null = não mostrar a janela. */
export async function welcomeOffer(db: Database, storeId: string, rawCode: string, now = new Date()): Promise<WelcomeOffer | null> {
  const d = await activeDiscount(db, storeId, rawCode, now);
  if (!d) return null;
  return { label: labelOf(d), minText: d.minSubtotalCents > 0 ? `Em compras a partir de ${formatBRL(d.minSubtotalCents)}.` : null };
}

export const claimSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160),
  consent: z.literal(true, { message: "Para receber o cupom, aceite receber ofertas por e-mail." }),
});

/** Entrega o código ao visitante e registra o contato com consentimento (sem duplicar). */
export async function claimWelcomeCoupon(db: Database, storeId: string, rawCode: string, raw: z.input<typeof claimSchema>, now = new Date()): Promise<{ code: string; label: string; demo: boolean }> {
  const input = claimSchema.parse(raw);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const d = await activeDiscount(db, storeId, rawCode, now);
  if (!d) throw new DomainError("DISCOUNT_INVALID", "Este cupom não está mais disponível.");
  // Loja de demonstração: mostra como funciona, sem guardar contato de ninguém.
  if (store.showcaseTheme) return { code: d.code, label: labelOf(d), demo: true };

  let customer = await db.query.customers.findFirst({ where: eq(customers.email, input.email) });
  if (!customer) {
    const id = newId("cus");
    await db.insert(customers).values({ id, name: input.email.split("@")[0]!, email: input.email });
    customer = (await db.query.customers.findFirst({ where: eq(customers.id, id) }))!;
  }
  let sc = await db.query.storeCustomers.findFirst({ where: and(eq(storeCustomers.storeId, storeId), eq(storeCustomers.customerId, customer.id)) });
  if (!sc) {
    const id = newId("sc");
    await db.insert(storeCustomers).values({ id, storeId, customerId: customer.id, ordersCount: 0, totalSpentCents: 0, tags: [TAG] });
    sc = (await db.query.storeCustomers.findFirst({ where: eq(storeCustomers.id, id) }))!;
  } else if (!sc.tags.includes(TAG)) {
    await db.update(storeCustomers).set({ tags: [...sc.tags, TAG] }).where(eq(storeCustomers.id, sc.id));
  }
  const consent = await db.query.marketingConsents.findFirst({ where: and(eq(marketingConsents.storeCustomerId, sc.id), eq(marketingConsents.purpose, "EMAIL_MARKETING"), isNull(marketingConsents.revokedAt)) });
  if (!consent) await db.insert(marketingConsents).values({ id: newId("mc"), storeCustomerId: sc.id, purpose: "EMAIL_MARKETING", source: "WELCOME_COUPON", grantedAt: now.toISOString() });
  return { code: d.code, label: labelOf(d), demo: false };
}
