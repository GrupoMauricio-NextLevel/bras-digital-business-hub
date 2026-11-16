import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { organizations, stores } from "@/db/schema";
import { activeEntitlementKeys } from "@/lib/domain/entitlements";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import type { Actor } from "@/lib/domain/access";

/**
 * Módulos do negócio (NextLevel Business, NB1, D306/D306): fonte única para menu, telas e ações.
 * - A plataforma continua NextLevel Commerce; "NextLevel Business" é o gerenciador do negócio dentro do painel.
 * - Tudo atrás da chave `BUSINESS_V1` (desligada = painel e vitrine exatamente como antes) e só na marca Commerce.
 * - O formato (LOJA ou SITE) decide a vitrine; módulos extras vêm de direitos (`entitlements`, chave `modulo:<nome>`),
 *   concedidos por plano, adicional ou cortesia (NB8). `portal` existe desde já, desligado (academia, NB10).
 */
export const MODULOS = ["painel", "contatos", "site", "loja", "captacao", "caixa", "meta", "portal"] as const;
export type Modulo = (typeof MODULOS)[number];
export type Formato = "LOJA" | "SITE";

export const MODULO_LABEL: Record<Modulo, string> = {
  painel: "Visão geral do negócio", contatos: "Contatos e orçamentos", site: "Site", loja: "Loja virtual",
  captacao: "Captação", caixa: "Caixa", meta: "Resultados da Meta", portal: "Portal do cliente",
};

/** Chave do direito que liga um módulo extra. */
export const chaveDoModulo = (m: Modulo) => `modulo:${m}`;

/** A chave geral do NextLevel Business. Sem ela, nada muda para ninguém. */
export const businessLigado = (env: Record<string, string | undefined> = process.env) => ["true", "1"].includes((env.BUSINESS_V1 ?? "").trim().toLowerCase());

export type EntradaModulos = { marca: string; formato: Formato; direitos: ReadonlySet<string>; ligado: boolean };
export type ModulosDoNegocio = { business: boolean; formato: Formato; ativos: ReadonlySet<Modulo> };

/** Regra pura (testada): quais módulos o negócio usa agora. */
export function modulosDe(e: EntradaModulos): ModulosDoNegocio {
  const business = e.ligado && e.marca === "NEXTLEVEL_COMMERCE";
  // Desligado (ou outra marca): só a loja, como sempre foi. Mesmo um SITE criado com a chave ligada volta a ser tratado
  // como loja, para nunca deixar uma conta sem painel (reversão segura).
  if (!business) return { business: false, formato: "LOJA", ativos: new Set<Modulo>(["loja"]) };
  const ativos = new Set<Modulo>(["painel", "contatos"]);
  if (e.formato === "SITE" || e.direitos.has(chaveDoModulo("site"))) ativos.add("site");
  if (e.formato === "LOJA" || e.direitos.has(chaveDoModulo("loja"))) ativos.add("loja");
  for (const m of ["captacao", "caixa", "meta", "portal"] as const) if (e.direitos.has(chaveDoModulo(m))) ativos.add(m);
  return { business: true, formato: e.formato, ativos };
}

/** O negócio mostra a vitrine de loja (catálogo, carrinho, checkout)? */
export const temLoja = (m: ModulosDoNegocio) => m.ativos.has("loja");

export async function modulosDoNegocio(db: Database, storeId: string, agora = new Date(), env: Record<string, string | undefined> = process.env): Promise<ModulosDoNegocio> {
  const row = (await db.select({ formato: stores.formato, marca: organizations.brand }).from(stores)
    .innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, storeId)).limit(1))[0];
  if (!row) throw new NotFoundError("Negócio não encontrado.");
  const ligado = businessLigado(env);
  const direitos = ligado ? await activeEntitlementKeys(db, { type: "STORE", storeId }, agora) : new Set<string>();
  return modulosDe({ marca: row.marca, formato: row.formato, direitos, ligado });
}

/** Barreira no servidor: a ação só roda se o negócio do ator usa o módulo. */
export async function requireModulo(db: Database, actor: Actor, modulo: Modulo, agora = new Date()): Promise<ModulosDoNegocio> {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  const m = await modulosDoNegocio(db, actor.storeId, agora);
  if (!m.ativos.has(modulo)) throw new ForbiddenError(`${MODULO_LABEL[modulo]} não está ligado no seu plano.`);
  return m;
}
