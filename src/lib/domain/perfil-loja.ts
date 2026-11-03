import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings, type Store } from "@/db/schema";
import type { BrandCode } from "@/lib/brand";
import { FEATURES, OFFER_FEATURES, type FeatureKey } from "@/lib/features";
import type { OfferKey } from "@/lib/finance/price-book";
import { brandCodeOfStore } from "@/lib/store-brand";
import { type Actor, requireMasterFn } from "./access";
import { recordAudit } from "./audit";
import { subscriptionOf } from "./commerce-plans";
import { activeEntitlementKeys } from "./entitlements";
import { storeModality, type StoreModality } from "./order-policy";

/**
 * Perfil da loja (D172): UMA resposta para "que loja é esta e o que ela pode usar", calculada uma vez por requisição e lida
 * por todas as telas. Fim das decisões soltas "é E-commerce?" espalhadas pelas telas, origem dos vazamentos do SuperDrop.
 * - SuperDrop: o que a loja pode usar continua vindo da oferta dela (`OFFER_FEATURES`), sem mudança nenhuma.
 * - NextLevel E-commerce: não tem ofertas do SuperDrop. O que pode usar vem do PLANO (Start, Pro, Scale), numa tabela editável
 *   no Master (`ecommerce.recursos-por-plano`); padrão aprovado pelo dono em 19/10: tudo liberado nos três planos.
 * Direitos comprados à parte (entitlements) somam, nunca tiram.
 */
export type PerfilLoja = {
  storeId: string;
  marca: BrandCode;
  modalidade: StoreModality;
  independente: boolean;
  ecommerce: boolean;
  /** Oferta do SuperDrop. Nula na E-commerce (lá vale o plano). */
  oferta: OfferKey | null;
  plano: { productKey: string; status: string } | null;
  pode: Record<FeatureKey, boolean>;
  vocabulario: Vocabulario;
};
export type Vocabulario = { produto: string; quemPrepara: string; custo: string; custoDebitado: string | null };

/** Recursos que só existem no SuperDrop (saldo para a Central e etiqueta da Central): nunca na E-commerce. */
export const SO_SUPERDROP: readonly FeatureKey[] = ["wallet", "labels"];
export const RECURSOS_ECOMMERCE = FEATURES.filter((f) => !SO_SUPERDROP.includes(f));
export const PLANOS_ECOMMERCE = ["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE"] as const;
export type PlanoEcommerce = (typeof PLANOS_ECOMMERCE)[number];

/** Nome de cada recurso na língua da E-commerce (o `FEATURE_INFO` fala a do SuperDrop: "Catálogo da Central"). */
export const ROTULO_ECOMMERCE: Record<(typeof RECURSOS_ECOMMERCE)[number], string> = {
  manualOrders: "Pedidos manuais (WhatsApp, Instagram, balcão)", catalog: "Catálogo de produtos", customers: "Clientes", financeBasic: "Financeiro da loja",
  services: "Serviços e módulos extras", storefront: "Loja virtual", appearanceBasic: "Aparência (logo, cores, textos)", templatesStarter: "Modelos de loja básicos",
  templatesPremium: "Modelos de loja premium", appearanceAdvanced: "Editor avançado da loja", customDomain: "Domínio próprio", analytics: "Análise de vendas",
  team: "Equipe da loja", reportsExport: "Relatórios em planilha (CSV)",
} as Record<(typeof RECURSOS_ECOMMERCE)[number], string>;

const KEY = "ecommerce.recursos-por-plano";
const recursoSchema = z.enum(RECURSOS_ECOMMERCE as [FeatureKey, ...FeatureKey[]]);
export const tabelaSchema = z.object(Object.fromEntries(PLANOS_ECOMMERCE.map((p) => [p, z.array(recursoSchema)])) as Record<PlanoEcommerce, z.ZodArray<typeof recursoSchema>>);
export type TabelaRecursos = z.infer<typeof tabelaSchema>;
/** Padrão (dono, 19/10/2026): os três planos liberam tudo o que existe na E-commerce. */
export const TABELA_PADRAO: TabelaRecursos = Object.fromEntries(PLANOS_ECOMMERCE.map((p) => [p, [...RECURSOS_ECOMMERCE]])) as TabelaRecursos;

export async function tabelaRecursos(db: Database): Promise<TabelaRecursos> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = tabelaSchema.safeParse(row?.value);
  return p.success ? p.data : TABELA_PADRAO;
}
export async function salvarTabelaRecursos(db: Database, actor: Actor, raw: unknown) {
  requireMasterFn(actor, ["FINANCEIRO"]);
  const value = tabelaSchema.parse(raw);
  const before = await tabelaRecursos(db);
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
  await recordAudit(db, actor, { action: "ECOMMERCE_RECURSOS_POR_PLANO", entityType: "platform_setting", entityId: KEY, before, after: value });
  return value;
}

const VOC_SUPERDROP: Vocabulario = { produto: "SuperDrop", quemPrepara: "Central", custo: "Custo à Central", custoDebitado: "Custo debitado do saldo" };
const VOC_ECOMMERCE: Vocabulario = { produto: "NextLevel E-commerce", quemPrepara: "Sua loja", custo: "Custo dos produtos", custoDebitado: null };

/** Mapa de recursos da loja da E-commerce para um plano (sem plano = Start). Puro. */
export function recursosDoPlano(tabela: TabelaRecursos, productKey: string | null | undefined): Record<FeatureKey, boolean> {
  const plano = (PLANOS_ECOMMERCE as readonly string[]).includes(productKey ?? "") ? (productKey as PlanoEcommerce) : "COMMERCE_START";
  const on = new Set(tabela[plano]);
  return Object.fromEntries(FEATURES.map((f) => [f, on.has(f) && !SO_SUPERDROP.includes(f)])) as Record<FeatureKey, boolean>;
}

/** Monta o perfil a partir dos fatos (puro: serve o servidor e os testes). */
export function montarPerfil(f: { store: Pick<Store, "id" | "offer">; marca: BrandCode; modalidade: StoreModality; plano: PerfilLoja["plano"]; tabela: TabelaRecursos; direitos: Set<string> }): PerfilLoja {
  const ecommerce = f.marca === "NEXTLEVEL_COMMERCE";
  const base = ecommerce ? recursosDoPlano(f.tabela, f.plano?.productKey) : { ...OFFER_FEATURES[f.store.offer] };
  // Direito comprado à parte soma (chave do entitlement = nome do recurso).
  for (const k of FEATURES) if (f.direitos.has(k) && !(ecommerce && SO_SUPERDROP.includes(k))) base[k] = true;
  // D234: domínio próprio é de todo lojista E-commerce, em qualquer plano (não depende da tabela do Master).
  if (ecommerce) base.customDomain = true;
  return {
    storeId: f.store.id, marca: f.marca, modalidade: f.modalidade, independente: f.modalidade === "INDEPENDENT", ecommerce,
    oferta: ecommerce ? null : f.store.offer, plano: f.plano, pode: base, vocabulario: ecommerce ? VOC_ECOMMERCE : VOC_SUPERDROP,
  };
}

export async function perfilDaLoja(db: Database, store: Store): Promise<PerfilLoja> {
  const [marca, modalidade, sub, tabela, direitos] = await Promise.all([
    brandCodeOfStore(db, store), storeModality(db, store.id), subscriptionOf(db, store.id), tabelaRecursos(db), activeEntitlementKeys(db, { type: "STORE", storeId: store.id }),
  ]);
  return montarPerfil({ store, marca, modalidade, plano: sub ? { productKey: sub.productKey, status: sub.status } : null, tabela, direitos });
}

export const podeUsar = (perfil: PerfilLoja, recurso: FeatureKey) => perfil.pode[recurso];
