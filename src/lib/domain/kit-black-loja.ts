import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings, storeDiscounts } from "@/db/schema";
import { campanhaBlack } from "./campanha-black";
import { createDiscount, normalizeCode } from "./discounts";
import { DomainError } from "./errors";

/**
 * Kit Black da loja do lojista (D242, fase BF4): com 1 clique o lojista liga, na vitrine dele,
 *  - a faixa "Black Friday" com contagem regressiva até a data que ele escolher (some sozinha no fim);
 *  - um cupom de desconto real (cupons da loja, com as regras de sempre: nunca abaixo do custo);
 *  - o selo "Black" nos cartões de produto.
 * A configuração fica em `platform_settings` (chave por loja). O cupom é um cupom normal: aparece em Cupons.
 */
const chave = (storeId: string) => `loja.kit-black.${storeId}`;
const kitSchema = z.object({ ativo: z.boolean(), fim: z.string(), percentual: z.number().int().min(5).max(70), codigo: z.string(), minimoCents: z.number().int().min(0).default(0) });
export type KitBlack = z.infer<typeof kitSchema>;
export type KitBlackAgora = KitBlack & { noAr: boolean; restanteMs: number };

export async function kitBlackDaLoja(db: Database, storeId: string, agora = new Date()): Promise<KitBlackAgora | null> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, chave(storeId)) });
  const p = kitSchema.safeParse(row?.value);
  if (!p.success) return null;
  const restanteMs = Math.max(0, Date.parse(p.data.fim) - agora.getTime());
  return { ...p.data, noAr: p.data.ativo && restanteMs > 0, restanteMs };
}

const entrada = z.object({
  percentual: z.number().int().min(5, "Mínimo de 5%").max(70, "Máximo de 70%"),
  fim: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data de fim inválida"),
  codigo: z.string().trim().max(24).optional(),
  minimoCents: z.number().int().min(0).optional(),
});

/** Sugestão do painel: fim da Black NextLevel e 10% com o código BLACK10. */
export async function sugestaoKitBlack(db: Database) {
  const c = await campanhaBlack(db);
  return { percentual: 10, fim: c.fim, codigo: "BLACK10" };
}

/** Liga (ou atualiza) o kit: cria ou ajusta o cupom e grava a configuração. */
export async function ligarKitBlack(db: Database, storeId: string, raw: z.input<typeof entrada>, agora = new Date()) {
  const d = entrada.parse(raw);
  const fim = new Date(d.fim).toISOString();
  if (Date.parse(fim) <= agora.getTime()) throw new DomainError("INVALID_PERIOD", "A data de fim precisa estar no futuro.");
  const codigo = normalizeCode(d.codigo || `BLACK${d.percentual}`);
  const existe = await db.query.storeDiscounts.findFirst({ where: and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, codigo)) });
  if (existe) await db.update(storeDiscounts).set({ kind: "PERCENT", value: d.percentual, minSubtotalCents: d.minimoCents ?? 0, expiresAt: fim, active: true }).where(eq(storeDiscounts.id, existe.id));
  else await createDiscount(db, storeId, { code: codigo, kind: "PERCENT", value: d.percentual, minSubtotalCents: d.minimoCents ?? 0, startsAt: agora.toISOString(), expiresAt: fim });
  const value: KitBlack = { ativo: true, fim, percentual: d.percentual, codigo, minimoCents: d.minimoCents ?? 0 };
  await db.insert(platformSettings).values({ key: chave(storeId), value }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: agora.toISOString() } });
  return value;
}

/** Desliga o kit e o cupom dele (o histórico do cupom continua em Cupons). */
export async function desligarKitBlack(db: Database, storeId: string, agora = new Date()) {
  const k = await kitBlackDaLoja(db, storeId, agora);
  if (!k) return;
  await db.update(storeDiscounts).set({ active: false }).where(and(eq(storeDiscounts.storeId, storeId), eq(storeDiscounts.code, k.codigo)));
  const value: KitBlack = { ativo: false, fim: k.fim, percentual: k.percentual, codigo: k.codigo, minimoCents: k.minimoCents };
  await db.update(platformSettings).set({ value, updatedAt: agora.toISOString() }).where(eq(platformSettings.key, chave(storeId)));
}
