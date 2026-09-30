import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { brandLeads } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BRAND_CODES, type BrandCode } from "@/lib/brand";
import { emails, sendEmail } from "@/lib/email";
import { isMaster, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

export const leadSchema = z.object({
  brand: z.enum(BRAND_CODES),
  name: z.string().trim().min(3, "Informe o seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(160),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  storeName: z.string().trim().max(120).optional(),
  segment: z.string().trim().max(60).optional(),
  message: z.string().trim().max(600).optional(),
  affiliateRef: z.string().trim().max(60).optional(),
});

/** Interessado numa marca (lista de espera e implantação assistida). Repetir o mesmo e-mail na marca atualiza o pedido em vez de duplicar. */
export async function createBrandLead(db: Database, raw: z.input<typeof leadSchema>) {
  const input = leadSchema.parse(raw);
  const existing = await db.query.brandLeads.findFirst({ where: and(eq(brandLeads.brand, input.brand), eq(brandLeads.email, input.email)) });
  if (existing) {
    await db.update(brandLeads).set({ name: input.name, phone: input.phone, storeName: input.storeName ?? existing.storeName, segment: input.segment ?? existing.segment, message: input.message ?? existing.message, updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, existing.id));
    return { id: existing.id, created: false };
  }
  const id = newId("bld");
  await db.insert(brandLeads).values({ id, brand: input.brand, name: input.name, email: input.email, phone: input.phone, storeName: input.storeName || null, segment: input.segment || null, message: input.message || null, affiliateRef: input.affiliateRef || null });
  await sendEmail(db, { kind: "LEAD_RECEIVED", to: input.email, brand: input.brand, dedupeKey: `LEAD:${id}`, ...emails.leadReceived(input.name.split(" ")[0]!) });
  return { id, created: true };
}

const need = (actor: Actor) => { if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel."); };

export async function listBrandLeads(db: Database, actor: Actor, opts: { brand?: BrandCode } = {}) {
  need(actor);
  return db.select().from(brandLeads).where(opts.brand ? eq(brandLeads.brand, opts.brand) : undefined).orderBy(desc(brandLeads.createdAt));
}

export async function updateBrandLead(db: Database, actor: Actor, id: string, patch: { status?: "NEW" | "CONTACTED" | "WON" | "LOST"; notes?: string }) {
  need(actor);
  const l = await db.query.brandLeads.findFirst({ where: eq(brandLeads.id, id) });
  if (!l) throw new NotFoundError("Interessado não encontrado.");
  if (patch.status && !["NEW", "CONTACTED", "WON", "LOST"].includes(patch.status)) throw new DomainError("STATUS", "Situação inválida.");
  await db.update(brandLeads).set({ ...(patch.status ? { status: patch.status } : {}), ...(patch.notes !== undefined ? { notes: patch.notes.slice(0, 1000) } : {}), updatedAt: new Date().toISOString() }).where(eq(brandLeads.id, id));
}
