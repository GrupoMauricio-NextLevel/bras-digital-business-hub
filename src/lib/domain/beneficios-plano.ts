import { and, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings, products, users } from "@/db/schema";
import { requireMasterFn, type Actor } from "./access";
import { recordAudit } from "./audit";
import { subscriptionOf } from "./commerce-plans";
import { DomainError } from "./errors";
import { getIaConfig } from "./ia";
import { brandCodeOfStore } from "@/lib/store-brand";
import { stores } from "@/db/schema";

/**
 * Benefícios por plano da NextLevel Commerce (D247, PV6): UMA tabela, editável no Master, que alimenta a página de
 * planos, o checkout, o placar e as travas. Valores aprovados na D226. `produtos: null` = sem limite.
 * Trava sem tirar nada de ninguém: quem já tem mais do que o limite continua vendendo tudo; só não cadastra novos.
 * Os usos de IA vêm das cotas do Maurício (D243/D244), para não haver dois números.
 */
export const PLANOS_BENEFICIO = ["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE"] as const;
export type PlanoBeneficio = (typeof PLANOS_BENEFICIO)[number];
const KEY = "ecommerce.beneficios-plano";
const linha = z.object({
  produtos: z.number().int().positive().nullable(),
  pessoas: z.number().int().min(1).max(100),
  temaPago: z.boolean(),
  suporte: z.string().trim().min(2).max(60),
  migracao: z.string().trim().min(2).max(60),
});
export const beneficiosSchema = z.object({ COMMERCE_START: linha, COMMERCE_PRO: linha, COMMERCE_SCALE: linha });
export type Beneficios = z.infer<typeof beneficiosSchema>;
export type BeneficioComIa = z.infer<typeof linha> & { ia: number };

export const BENEFICIOS_PADRAO: Beneficios = {
  COMMERCE_START: { produtos: 300, pessoas: 3, temaPago: false, suporte: "Chat e WhatsApp", migracao: "Paga à parte" },
  COMMERCE_PRO: { produtos: 1000, pessoas: 6, temaPago: true, suporte: "Prioritário, em até 4 h", migracao: "50% de desconto" },
  COMMERCE_SCALE: { produtos: null, pessoas: 12, temaPago: true, suporte: "Gerente de conta", migracao: "Inclusa" },
};
export const NOME_PLANO_BENEFICIO: Record<PlanoBeneficio, string> = { COMMERCE_START: "Start", COMMERCE_PRO: "Pro", COMMERCE_SCALE: "Scale" };

export async function beneficiosPorPlano(db: Database): Promise<Record<PlanoBeneficio, BeneficioComIa>> {
  const [row, ia] = await Promise.all([db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) }), getIaConfig(db)]);
  const p = beneficiosSchema.safeParse(row?.value);
  const b = p.success ? p.data : BENEFICIOS_PADRAO;
  return Object.fromEntries(PLANOS_BENEFICIO.map((k) => [k, { ...b[k], ia: ia.cotas[k] ?? 0 }])) as Record<PlanoBeneficio, BeneficioComIa>;
}

export async function salvarBeneficios(db: Database, actor: Actor, raw: unknown) {
  requireMasterFn(actor, ["FINANCEIRO", "COMERCIAL"]);
  const value = beneficiosSchema.parse(raw);
  const before = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "ECOMMERCE_BENEFICIOS_POR_PLANO", entityType: "platform_setting", entityId: KEY, before: (before?.value ?? BENEFICIOS_PADRAO) as Record<string, unknown>, after: value as Record<string, unknown> });
  return value;
}

/** Plano que vale para os limites (sem plano ativo = Start). */
export async function planoDaLoja(db: Database, storeId: string): Promise<PlanoBeneficio> {
  const sub = await subscriptionOf(db, storeId);
  const k = sub && ["active", "trial", "past_due"].includes(sub.status) ? sub.productKey : null;
  return (PLANOS_BENEFICIO as readonly string[]).includes(k ?? "") ? (k as PlanoBeneficio) : "COMMERCE_START";
}

export type UsoDoPlano = { plano: PlanoBeneficio; nome: string; produtos: { usados: number; limite: number | null }; pessoas: { usadas: number; limite: number } };
/** Uso atual da loja (produtos não arquivados e pessoas ativas na equipe, contando o dono). */
export async function usoDoPlano(db: Database, storeId: string): Promise<UsoDoPlano> {
  const [plano, tabela, prodRows, genteRows] = await Promise.all([
    planoDaLoja(db, storeId), beneficiosPorPlano(db),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(and(eq(products.storeId, storeId), notInArray(products.status, ["ARCHIVED", "DELETED"]))),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(eq(users.storeId, storeId), sql`${users.disabledAt} is null`)),
  ]);
  const b = tabela[plano];
  const prod = prodRows[0]?.n ?? 0, gente = genteRows[0]?.n ?? 0;
  return { plano, nome: NOME_PLANO_BENEFICIO[plano], produtos: { usados: Number(prod), limite: b.produtos }, pessoas: { usadas: Number(gente), limite: b.pessoas } };
}

/** Trava do cadastro de produto (só lojas da Commerce; quem chama decide). */
export async function exigirVagaDeProduto(db: Database, storeId: string, novos = 1) {
  const u = await usoDoPlano(db, storeId);
  if (u.produtos.limite !== null && u.produtos.usados + novos > u.produtos.limite) {
    throw new DomainError("PLAN_LIMIT_PRODUCTS", `O plano ${u.nome} tem até ${u.produtos.limite.toLocaleString("pt-BR")} produtos e sua loja já tem ${u.produtos.usados.toLocaleString("pt-BR")}. Arquive produtos que não vende mais ou mude de plano para cadastrar mais.`);
  }
}
/** Trava do convite da equipe (o dono conta como 1 pessoa). */
export async function exigirVagaDePessoa(db: Database, storeId: string) {
  const u = await usoDoPlano(db, storeId);
  if (u.pessoas.usadas + 1 > u.pessoas.limite) throw new DomainError("PLAN_LIMIT_PEOPLE", `O plano ${u.nome} tem até ${u.pessoas.limite} pessoas no painel (contando você). Mude de plano para convidar mais.`);
}

/** A trava só vale para lojas da NextLevel Commerce (o SuperDrop segue as regras dele). */
export async function ehLojaEcommerce(db: Database, storeId: string): Promise<boolean> {
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { organizationId: true } });
  return !!s && (await brandCodeOfStore(db, s)) === "NEXTLEVEL_COMMERCE";
}
