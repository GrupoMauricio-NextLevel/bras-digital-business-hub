import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { paletteOf } from "@/lib/brand-palette";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { activeDoor } from "../precos/porta-entrada";

/**
 * Barra do ecossistema (D129, fase P5E do prompt de público e preço): o "fio do grupo" no topo dos painéis e o
 * lançador com as marcas (a sua, as recomendadas para o seu perfil e todas). **Um domínio só** decide o que aparece e
 * com qual benefício; o componente só desenha. Ligado por marca no Master (`ecossistema.barra`), **desligado por
 * padrão**. Nunca aparece na vitrine do lojista, na expedição, no motorista, nos balcões, no checkout nem no pagamento
 * (a barra só existe na casca dos painéis de cliente).
 */
export const ECO_BRANDS = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"] as const;
export type EcoBrand = (typeof ECO_BRANDS)[number];
export const ecoSettingsSchema = z.object({ brands: z.array(z.enum(ECO_BRANDS)).max(ECO_BRANDS.length) });
const KEY = "ecossistema.barra";

export async function getEcoSettings(db: Database) {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = ecoSettingsSchema.safeParse(row?.value);
  return p.success ? p.data : { brands: [] as EcoBrand[] };
}
export async function saveEcoSettings(db: Database, actor: Actor, raw: z.input<typeof ecoSettingsSchema>) {
  requireMaster(actor);
  const before = await getEcoSettings(db);
  const v = ecoSettingsSchema.parse(raw);
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "ECOSYSTEM_SETTINGS", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

/** O que cada marca resolve, numa frase (texto de descoberta, sem promessa de ganho). */
const PITCH: Record<EcoBrand, string> = {
  NEXTLEVEL_COMMERCE: "Loja virtual com a sua marca, tema profissional e Pix",
  SUPERDROP: "Venda sem estoque: o fornecedor separa e envia",
  BRAS_DIGITAL: "Compre caixa fechada direto das importadoras do Brás",
  NEXTLEVEL_CARGAS: "Frete do Brás para a sua cidade, de transportadora ou ônibus",
};
/** Recomendação por perfil (de onde a pessoa vem → para onde faz sentido ir), com o motivo. */
const RECOMMEND: Record<EcoBrand, { brand: EcoBrand; reason: string }[]> = {
  SUPERDROP: [{ brand: "BRAS_DIGITAL", reason: "Para comprar estoque pelo preço do Brás quando quiser ter produto próprio" }, { brand: "NEXTLEVEL_CARGAS", reason: "Para mandar e receber fardos do Brás" }],
  NEXTLEVEL_COMMERCE: [{ brand: "BRAS_DIGITAL", reason: "Para abastecer a loja com caixa fechada do Brás" }, { brand: "NEXTLEVEL_CARGAS", reason: "Para trazer a mercadoria até você" }],
  BRAS_DIGITAL: [{ brand: "NEXTLEVEL_CARGAS", reason: "Para o fardo chegar na sua cidade, de ônibus ou transportadora" }, { brand: "NEXTLEVEL_COMMERCE", reason: "Para vender online o que você compra no Brás" }],
  NEXTLEVEL_CARGAS: [{ brand: "BRAS_DIGITAL", reason: "Onde estão as importadoras que chamam coleta" }],
};

export type EcoItem = { brand: EcoBrand; name: string; pitch: string; color: string; href: string; benefit: string | null; reason?: string; current: boolean };
export type EcoBar = { current: EcoBrand; segments: { brand: EcoBrand; name: string; color: string; current: boolean }[]; mine: EcoItem[]; recommended: EcoItem[]; all: EcoItem[] };

async function benefitOf(db: Database, b: EcoBrand, now: Date): Promise<string | null> {
  if (b === "SUPERDROP" || b === "NEXTLEVEL_COMMERCE") {
    const door = await activeDoor(db, b, now);
    if (door) return door.trialDays ? `${door.trialDays} dias do plano completo grátis, depois segue no grátis` : "Comece grátis";
    return null;
  }
  return "Cadastro grátis";
}
const signupOf = (b: EcoBrand) => (b === "NEXTLEVEL_CARGAS" ? brandByCode(b).baseUrl : `${brandByCode(b).baseUrl}/cadastro`);

/** Barra da marca atual, ou `null` (desligada nesta marca). */
export async function ecosystemBar(db: Database, current: EcoBrand | null, now = new Date()): Promise<EcoBar | null> {
  if (!current || !(await getEcoSettings(db)).brands.includes(current)) return null;
  const live = ECO_BRANDS.filter((b) => b === current || brandByCode(b).live);
  const item = async (b: EcoBrand, reason?: string): Promise<EcoItem> => ({ brand: b, name: brandByCode(b).name, pitch: PITCH[b], color: paletteOf(b).light.signal, href: b === current ? "/" : signupOf(b), benefit: b === current ? null : await benefitOf(db, b, now), reason, current: b === current });
  const recommended = await Promise.all(RECOMMEND[current].filter((r) => live.includes(r.brand)).map((r) => item(r.brand, r.reason)));
  return {
    current,
    segments: live.map((b) => ({ brand: b, name: brandByCode(b).name, color: paletteOf(b).light.signal, current: b === current })),
    mine: [await item(current)],
    recommended,
    all: await Promise.all(live.filter((b) => b !== current).map((b) => item(b))),
  };
}
