import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { paletteOf } from "@/lib/brand-palette";
import { type Actor, requireMasterFn } from "../access";
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
export const ecoSettingsSchema = z.object({
  brands: z.array(z.enum(ECO_BRANDS)).max(ECO_BRANDS.length),
  /** Fio do grupo e selo do Club nas páginas de captação (cadastro, entrada, ativação, senha) — D132. */
  capture: z.boolean().default(false),
  /** Rodapé do grupo nos e-mails transacionais — D132. */
  emailFooter: z.boolean().default(false),
  /** Faixa "Parte do Grupo NextLevel" e rodapé da família nas páginas públicas — D133. */
  publicPages: z.boolean().default(false),
});
const KEY = "ecossistema.barra";

export async function getEcoSettings(db: Database) {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = ecoSettingsSchema.safeParse(row?.value);
  return p.success ? p.data : { brands: [] as EcoBrand[], capture: false, emailFooter: false, publicPages: false };
}
/** Grava só o que veio (as outras chaves continuam como estavam). */
export async function saveEcoSettings(db: Database, actor: Actor, raw: Partial<z.input<typeof ecoSettingsSchema>>) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const before = await getEcoSettings(db);
  const v = ecoSettingsSchema.parse({ ...before, ...raw });
  await db.insert(platformSettings).values({ key: KEY, value: v, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value: v, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "ECOSYSTEM_SETTINGS", entityType: "platform_settings", entityId: KEY, before, after: v }, { force: true });
  return v;
}

/**
 * Marcas que nunca aparecem no contexto de outra (decisão do dono, 2026-10-17, D164): a NextLevel Commerce não mostra o
 * SuperDrop em nenhum ponto (fio, lançador, rodapé da família, selo do Club), porque o lojista de loja própria não tem
 * fornecedor nem saldo e o nome confunde.
 */
const OCULTAS_EM: Partial<Record<EcoBrand, EcoBrand[]>> = { NEXTLEVEL_COMMERCE: ["SUPERDROP"] };
const visivelEm = (b: EcoBrand, current: string | null | undefined) => !(isEcoBrandCode(current) && OCULTAS_EM[current]?.includes(b));

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
/** Leva à página de ativação da outra marca (D130), dizendo de onde a pessoa vem. */
const activationOf = (b: EcoBrand, from: EcoBrand) => `${brandByCode(b).baseUrl}/ativar?de=${from}`;

/** Barra da marca atual, ou `null` (desligada nesta marca). */
export async function ecosystemBar(db: Database, current: EcoBrand | null, now = new Date(), userId?: string): Promise<EcoBar | null> {
  if (!current || !(await getEcoSettings(db)).brands.includes(current)) return null;
  const live = ECO_BRANDS.filter((b) => b === current || (brandByCode(b).live && visivelEm(b, current)));
  const item = async (b: EcoBrand, reason?: string): Promise<EcoItem> => ({ brand: b, name: brandByCode(b).name, pitch: PITCH[b], color: paletteOf(b).light.signal, href: b === current ? "/" : activationOf(b, current), benefit: b === current ? null : await benefitOf(db, b, now), reason, current: b === current });
  // Conta do grupo (D141): marcas em que a pessoa já tem perfil ligado vão para "Suas marcas" e levam à troca de perfil.
  const own = new Set<EcoBrand>();
  if (userId) { const { groupProfiles } = await import("../conta-grupo"); for (const p of await groupProfiles(db, userId)) if (p.brand !== current && isEcoBrandCode(p.brand) && live.includes(p.brand)) own.add(p.brand); }
  const ownItem = async (b: EcoBrand): Promise<EcoItem> => ({ ...(await item(b)), href: "/account/marcas", benefit: "Você já tem perfil aqui" });
  const recommended = await Promise.all(RECOMMEND[current].filter((r) => live.includes(r.brand) && !own.has(r.brand)).map((r) => item(r.brand, r.reason)));
  return {
    current,
    segments: live.map((b) => ({ brand: b, name: brandByCode(b).name, color: paletteOf(b).light.signal, current: b === current })),
    mine: [await item(current), ...(await Promise.all([...own].map(ownItem)))],
    recommended,
    all: await Promise.all(live.filter((b) => b !== current && !own.has(b)).map((b) => item(b))),
  };
}

/** Segmentos do fio para páginas sem marca "atual" de painel (captação, e-mail, páginas públicas): só marcas abertas. */
export function groupSegments(current?: string | null) {
  return ECO_BRANDS.filter((b) => b === current || (brandByCode(b).live && visivelEm(b, current))).map((b) => ({ brand: b, name: brandByCode(b).name, color: paletteOf(b).light.signal, current: b === current }));
}
export const isEcoBrandCode = (v: string | null | undefined): v is EcoBrand => !!v && (ECO_BRANDS as readonly string[]).includes(v);
