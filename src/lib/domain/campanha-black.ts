import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { catalogPriceVersions, catalogProducts, platformSettings } from "@/db/schema";
import { newId } from "@/lib/ids";
import { PRECOS_D220, descontoAnualBps } from "@/lib/finance/revisao-d220";
import { PRECOS_D228, REF_D228 } from "@/lib/finance/revisao-d228";
import { type Actor, requireMasterFn } from "./access";
import { recordAudit } from "./audit";

/**
 * Black Friday NextLevel 2026 (D227/D228/D229). UMA configuração para o site, os painéis e a cobrança:
 *  - vai até 30/11/2026 às 23h59 (horário de Brasília); a contagem regressiva de todo canto lê este fim;
 *  - durante a Black, o anual sai com 2 meses grátis (paga 10, leva 12) e o preço fica travado na assinatura;
 *  - no fim, a versão de preço D228 (agendada para o mesmo instante) entra sozinha: R$ 67 / 167 / 397.
 * O Master liga, desliga ou prorroga. Versões de preço são só de inserção: prorrogar acrescenta uma cópia do preço da Black
 * vigente a partir do fim antigo e uma nova D228 a partir do fim novo (a contagem e a virada de preço nunca se separam).
 */
export const CHAVE_BLACK = "campanha.black-2026";
/** 30/11/2026 23:59:59 em Brasília (UTC−3) = 01/12/2026 02:59:59 UTC. */
export const FIM_BLACK_PADRAO = "2026-12-01T02:59:59.000Z";
export const MESES_GRATIS_ANUAL_BLACK = 2;

export const campanhaSchema = z.object({
  ativa: z.boolean(),
  inicio: z.string().datetime(),
  fim: z.string().datetime(),
  /** Fim original, para mostrar "Prorrogada até…" quando o Master estender. */
  fimOriginal: z.string().datetime(),
  chamada: z.string().min(3).max(140),
});
export type CampanhaBlack = z.infer<typeof campanhaSchema>;

export const BLACK_PADRAO: CampanhaBlack = {
  ativa: true,
  inicio: "2026-11-03T03:00:00.000Z",
  fim: FIM_BLACK_PADRAO,
  fimOriginal: FIM_BLACK_PADRAO,
  chamada: "Anual com 2 meses grátis e preço travado enquanto você for cliente",
};

export type EstadoBlack = { ativa: boolean; fim: string; restanteMs: number; ultimaHora: boolean; prorrogada: boolean; chamada: string };

/** Estado da campanha num instante (puro). Fora do período ou desligada: `ativa: false`. */
export function estadoBlack(c: CampanhaBlack, agora = new Date()): EstadoBlack {
  const t = agora.getTime();
  const fim = Date.parse(c.fim);
  const ativa = c.ativa && t >= Date.parse(c.inicio) && t <= fim;
  const restanteMs = ativa ? fim - t : 0;
  return { ativa, fim: c.fim, restanteMs, ultimaHora: ativa && restanteMs <= 3_600_000, prorrogada: Date.parse(c.fim) > Date.parse(c.fimOriginal), chamada: c.chamada };
}

/** Anual na Black: paga 10 meses e leva 12 (o valor fica congelado na assinatura e vale nas renovações). */
export const anualBlackCents = (anualCents: number) => Math.round((anualCents * (12 - MESES_GRATIS_ANUAL_BLACK)) / 12);

export async function campanhaBlack(db: Database): Promise<CampanhaBlack> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, CHAVE_BLACK) });
  const p = campanhaSchema.safeParse(row?.value);
  return p.success ? p.data : BLACK_PADRAO;
}

export async function blackAgora(db: Database, agora = new Date()) {
  return estadoBlack(await campanhaBlack(db), agora);
}

/**
 * Master liga, desliga ou prorroga. O fim nunca volta para antes do original (não se encurta uma promessa já anunciada)
 * e a vigência da versão de preço D228 acompanha o fim, para o preço novo entrar exatamente quando a contagem acaba.
 */
export async function salvarCampanhaBlack(db: Database, actor: Actor, raw: { ativa: boolean; fim: string; chamada: string }) {
  requireMasterFn(actor, ["FINANCEIRO", "COMERCIAL"]);
  const antes = await campanhaBlack(db);
  const fim = new Date(raw.fim);
  if (Number.isNaN(fim.getTime())) throw new Error("Data de fim inválida.");
  const fimIso = new Date(Math.max(fim.getTime(), Date.parse(antes.fimOriginal))).toISOString();
  const value = campanhaSchema.parse({ ...antes, ativa: raw.ativa, fim: fimIso, chamada: raw.chamada.trim() });
  await db.insert(platformSettings).values({ key: CHAVE_BLACK, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  if (Date.parse(fimIso) > Date.parse(antes.fim)) await reagendarPrecoDepois(db, antes.fim, fimIso);
  await recordAudit(db, actor, { action: "CAMPANHA_BLACK", entityType: "platform_setting", entityId: CHAVE_BLACK, before: antes, after: value });
  return value;
}

/** Prorrogação: preço da Black de novo a partir do fim antigo e preço D228 a partir do fim novo (versões novas, nada se apaga). */
async function reagendarPrecoDepois(db: Database, fimAntigo: string, fimNovo: string) {
  const deAntigo = new Date(Date.parse(fimAntigo) + 1000).toISOString();
  const deNovo = new Date(Date.parse(fimNovo) + 1000).toISOString();
  const prods = await db.select({ id: catalogProducts.id, key: catalogProducts.key }).from(catalogProducts).where(inArray(catalogProducts.key, Object.keys(PRECOS_D228)));
  for (const p of prods) {
    const versoes = await db.select().from(catalogPriceVersions).where(eq(catalogPriceVersions.productId, p.id)).orderBy(desc(catalogPriceVersions.version));
    for (const cycle of ["MONTHLY", "ANNUAL"] as const) {
      const ult = versoes.find((v) => v.cycle === cycle);
      if (!ult) continue;
      const base = { productId: p.id, cycle, platformFeeBps: 0, methods: ult.methods, pixDiscountBps: ult.pixDiscountBps, cardMaxInstallments: ult.cardMaxInstallments, cardMarkupBps: ult.cardMarkupBps };
      const black = PRECOS_D220[p.key]!, depois = PRECOS_D228[p.key]!;
      await db.insert(catalogPriceVersions).values({ ...base, id: newId("cpv"), version: ult.version + 1, amountCents: cycle === "MONTHLY" ? black.mensal : black.anual, annualDiscountBps: cycle === "ANNUAL" ? descontoAnualBps(black) : null, effectiveFrom: deAntigo, reason: `Black NextLevel prorrogada até ${fimNovo} (D229)`, approvalRef: `${REF_D228}-prorrogacao` });
      await db.insert(catalogPriceVersions).values({ ...base, id: newId("cpv"), version: ult.version + 2, amountCents: cycle === "MONTHLY" ? depois.mensal : depois.anual, annualDiscountBps: cycle === "ANNUAL" ? descontoAnualBps(depois) : null, effectiveFrom: deNovo, reason: "Preço depois da Black NextLevel, meio-termo (D228, após prorrogação)", approvalRef: REF_D228 });
    }
  }
}
