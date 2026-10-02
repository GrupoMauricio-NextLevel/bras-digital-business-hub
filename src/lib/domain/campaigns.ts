import { and, asc, desc, eq, gt, lte } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { storeCampaigns } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, NotFoundError } from "./errors";

/** Só caminho da própria loja ("/...") ou https. Nada de javascript:, data:, // (protocolo relativo) etc. */
export const isSafeLink = (url: string) => (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) || /^https:\/\/[^\s]+$/i.test(url);

const schema = z.object({
  text: z.string().trim().min(3, "Escreva o aviso (mínimo 3 letras)").max(140, "Máximo de 140 letras"),
  linkUrl: z.string().trim().optional().transform((v) => v || null),
  startsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data de início inválida"),
  endsAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data de fim inválida"),
});

export async function createCampaign(db: Database, storeId: string, raw: z.input<typeof schema>) {
  const d = schema.parse(raw);
  if (d.linkUrl && !isSafeLink(d.linkUrl)) throw new DomainError("UNSAFE_LINK", "Use um link começando com / (página da loja) ou https://.");
  const startsAt = new Date(d.startsAt).toISOString(), endsAt = new Date(d.endsAt).toISOString();
  if (endsAt <= startsAt) throw new DomainError("INVALID_PERIOD", "O fim precisa ser depois do início.");
  const id = newId("cmp");
  await db.insert(storeCampaigns).values({ id, storeId, text: d.text, linkUrl: d.linkUrl, startsAt, endsAt });
  return { id };
}

export async function listCampaigns(db: Database, storeId: string) {
  return db.select().from(storeCampaigns).where(eq(storeCampaigns.storeId, storeId)).orderBy(desc(storeCampaigns.startsAt)).limit(100);
}

export async function deleteCampaign(db: Database, storeId: string, id: string) {
  const done = await db.delete(storeCampaigns).where(and(eq(storeCampaigns.id, id), eq(storeCampaigns.storeId, storeId))).returning({ id: storeCampaigns.id });
  if (done.length === 0) throw new NotFoundError("Campanha não encontrada.");
}

/** Campanha vigente agora (a que começou primeiro). Só público: início ≤ agora < fim e ativa. */
export async function currentCampaign(db: Database, storeId: string, now = new Date()) {
  const iso = now.toISOString();
  const [c] = await db.select().from(storeCampaigns).where(and(eq(storeCampaigns.storeId, storeId), eq(storeCampaigns.active, true), lte(storeCampaigns.startsAt, iso), gt(storeCampaigns.endsAt, iso))).orderBy(asc(storeCampaigns.startsAt)).limit(1);
  return c ?? null;
}
