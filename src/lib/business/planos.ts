import type { Database } from "@/db/client";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { grantEntitlement } from "@/lib/domain/entitlements";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { addonViewsFor, buyAddon } from "@/lib/domain/nextlevel-billing";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { chaveDoModulo, modulosDoNegocio, type ModulosDoNegocio } from "./modulos";

/**
 * Plano e pacotes do negócio (NextLevel Business, NB8, D308/D310, corrigido na D311).
 * - Os planos Start, Pro e Scale são os planos da loja virtual e ficam **intactos** (preço e funções).
 * - Quem entra pelo caminho Site assina um desses planos: a loja virtual já está paga e liga sem cobrança extra.
 * - O único adicional novo é o **Site** (`MODULO_SITE`), para quem já é lojista, com preço na tabela do Master.
 */
export type Pacote = "BUSINESS" | "BUSINESS_SITE" | "BUSINESS_LOJA" | "BUSINESS_SITE_LOJA";

export function pacoteDe(m: Pick<ModulosDoNegocio, "ativos">): Pacote {
  const site = m.ativos.has("site"); const loja = m.ativos.has("loja");
  return site && loja ? "BUSINESS_SITE_LOJA" : site ? "BUSINESS_SITE" : loja ? "BUSINESS_LOJA" : "BUSINESS";
}

export const PACOTE_ROTULO: Record<Pacote, string> = {
  BUSINESS: NOME_GERENCIADOR.nome,
  BUSINESS_SITE: `${NOME_GERENCIADOR.nome} + Site`,
  BUSINESS_LOJA: `${NOME_GERENCIADOR.nome} + Loja virtual`,
  BUSINESS_SITE_LOJA: `${NOME_GERENCIADOR.nome} + Site + Loja virtual`,
};

/** O que o negócio tem: o pacote, o adicional Site (preço da tabela) e se a loja virtual pode ser ligada sem custo. */
export async function planoDoNegocio(db: Database, actor: Actor) {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  const m = await modulosDoNegocio(db, actor.storeId);
  const site = (await addonViewsFor(db, actor, { modulos: true })).find((a) => a.key === chaveDoModulo("site")) ?? null;
  return {
    business: m.business, pacote: pacoteDe(m),
    temSite: m.ativos.has("site"), siteIncluido: m.formato === "SITE", adicionalSite: m.formato === "SITE" ? null : site,
    temLoja: m.ativos.has("loja"), podeLigarLoja: m.business && !m.ativos.has("loja"),
  };
}

/** Contrata o site (só para quem entrou pela loja): gera a fatura; o site liga quando o pagamento é confirmado. */
export async function contratarModulo(db: Database, actor: Actor, chave: string, ciclo: "MONTHLY" | "ANNUAL") {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  if (actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono do negócio contrata.");
  if (chave !== chaveDoModulo("site")) throw new DomainError("MODULO", "Módulo não encontrado.");
  const m = await modulosDoNegocio(db, actor.storeId);
  if (!m.business) throw new DomainError("BUSINESS_DESLIGADO", "A contratação de módulos ainda não está aberta para a sua conta.");
  if (m.formato === "SITE") throw new DomainError("JA_INCLUIDO", "O site já vem no seu plano.");
  return buyAddon(db, actor, chave, ciclo);
}

/**
 * Liga a loja virtual para quem entrou pelo caminho Site: o plano que ele assina (Start, Pro ou Scale) já é o plano da loja
 * virtual, então não há cobrança nova. Fica valendo enquanto a conta existir (o acesso segue a assinatura, como sempre).
 */
export async function ligarLojaVirtual(db: Database, actor: Actor) {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  if (actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono do negócio liga a loja.");
  const m = await modulosDoNegocio(db, actor.storeId);
  if (!m.business) throw new DomainError("BUSINESS_DESLIGADO", "Ainda não está aberto para a sua conta.");
  if (m.ativos.has("loja")) return { ligada: true, nova: false };
  await grantEntitlement(db, { type: "STORE", storeId: actor.storeId }, { key: chaveDoModulo("loja"), source: "PLAN", note: "Loja virtual ligada pelo dono (incluída no plano)" });
  await recordAudit(db, actor, { action: "LOJA_VIRTUAL_LIGADA", entityType: "store", entityId: actor.storeId, storeId: actor.storeId });
  return { ligada: true, nova: true };
}
