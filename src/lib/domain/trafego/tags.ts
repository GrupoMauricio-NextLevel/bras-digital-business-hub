import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { type Actor, requireMasterFn } from "../access";
import { recordAudit } from "../audit";

/**
 * Tags de anúncio do site da NextLevel (TR4, D295): Pixel da Meta, Google Ads (conversão) e Google Analytics 4. Os números
 * são públicos (vão no código da página), por isso ficam em platform_settings sem criptografia; nada de token aqui (o
 * token da API de conversões entra na TR5, criptografado). Só carregam no navegador de quem aceitou "Anúncios" (D290).
 */
const KEY = "trafego.tags";
const opc = (re: RegExp, msg: string) => z.string().trim().max(60).optional().nullable().transform((v) => v || null).refine((v) => !v || re.test(v), msg);
export const tagsSchema = z.object({
  metaPixelId: opc(/^\d{10,20}$/, "O número do Pixel tem só algarismos (de 10 a 20), como aparece no Gerenciador de Eventos da Meta."),
  googleAdsId: opc(/^AW-\d{6,15}$/, "O código do Google Ads começa com AW- seguido de números (ex.: AW-1234567890)."),
  googleAdsLeadLabel: opc(/^[\w-]{6,40}$/, "O rótulo da conversão de contato é o texto depois da barra no \"send_to\" (ex.: AbC-dEfGhIj)."),
  ga4Id: opc(/^G-[A-Z0-9]{6,15}$/, "O código do Google Analytics 4 começa com G- (ex.: G-ABC123XYZ)."),
});
export type TagsAnuncio = z.output<typeof tagsSchema>;
const VAZIO: TagsAnuncio = { metaPixelId: null, googleAdsId: null, googleAdsLeadLabel: null, ga4Id: null };

export async function getTagsAnuncio(db: Database): Promise<TagsAnuncio> {
  try {
    const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
    const p = tagsSchema.safeParse(row?.value ?? {});
    return p.success ? { ...VAZIO, ...p.data } : VAZIO;
  } catch { return VAZIO; }
}

export async function salvarTagsAnuncio(db: Database, actor: Actor, raw: z.input<typeof tagsSchema>): Promise<TagsAnuncio> {
  requireMasterFn(actor, ["COMERCIAL"]);
  const before = await getTagsAnuncio(db);
  const v = tagsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "TAGS_ANUNCIO", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

/** O que o navegador precisa para carregar as tags (só números públicos). */
export type ConfigTagsNavegador = { meta: string | null; googleAds: string | null; leadSendTo: string | null; ga4: string | null };
export const configNavegador = (t: TagsAnuncio): ConfigTagsNavegador | null => {
  const c = { meta: t.metaPixelId, googleAds: t.googleAdsId, leadSendTo: t.googleAdsId && t.googleAdsLeadLabel ? `${t.googleAdsId}/${t.googleAdsLeadLabel}` : null, ga4: t.ga4Id };
  return c.meta || c.googleAds || c.ga4 ? c : null;
};
