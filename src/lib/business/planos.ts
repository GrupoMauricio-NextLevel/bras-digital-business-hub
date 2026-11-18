import type { Database } from "@/db/client";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { grantEntitlement } from "@/lib/domain/entitlements";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { addonViewsFor, buyAddon } from "@/lib/domain/nextlevel-billing";
import { and, eq, like } from "drizzle-orm";
import { financeInvoices } from "@/db/schema";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { getPriceBook } from "@/lib/domain/finance";
import { chaveDoModulo, modulosDoNegocio, planoDaLoja, type ModulosDoNegocio } from "./modulos";
import { comDesconto, precoDoSiteParaLojista, scaleTrazBusiness } from "./precos-frentes";

/**
 * Plano e pacotes do negócio (NextLevel Business, NB8, D308/D310, corrigido na D311).
 * - Os planos Start, Pro e Scale são os planos da loja virtual e ficam **intactos** (preço e funções).
 * - Quem entra pelo caminho Site assina um desses planos: a loja virtual já está paga e liga sem cobrança extra.
 * - O único adicional novo é o **Site** (`MODULO_SITE`), para quem já é lojista: desde a D336, o preço do Sites do mesmo
 *   nível com o desconto do segundo produto (tabela do Master); quem já tinha mantém o preço antigo.
 * - O plano Scale traz o NextLevel Business Essencial (D336).
 */
export type Pacote = "BUSINESS" | "BUSINESS_SITE" | "BUSINESS_LOJA" | "BUSINESS_SITE_LOJA";

export function pacoteDe(m: Pick<ModulosDoNegocio, "ativos">): Pacote {
  const site = m.ativos.has("site"); const loja = m.ativos.has("loja");
  return site && loja ? "BUSINESS_SITE_LOJA" : site ? "BUSINESS_SITE" : loja ? "BUSINESS_LOJA" : "BUSINESS";
}

export const PACOTE_ROTULO: Record<Pacote, string> = {
  BUSINESS: "Painel do negócio",
  BUSINESS_SITE: "Site",
  BUSINESS_LOJA: "Loja virtual",
  BUSINESS_SITE_LOJA: "Site + Loja virtual",
};

/**
 * Preço do site para quem já tem a loja (D336): o Sites do mesmo nível do plano, com o desconto do segundo produto (50%
 * hoje, na tabela do Master). Quem já pagou o adicional antes da regra mantém o preço antigo da tabela (direito adquirido).
 */
export async function precoDoSiteDoNegocio(db: Database, storeId: string) {
  const [book, pv, plano, antigo] = await Promise.all([
    getPriceBook(db), commercePlansView(db), planoDaLoja(db, storeId),
    db.query.financeInvoices.findFirst({ where: and(like(financeInvoices.dedupeKey, `ADDON:${storeId}:${chaveDoModulo("site")}:%`), eq(financeInvoices.status, "PAID")) }),
  ]);
  if (antigo) { const a = book.addons.MODULO_SITE; return { monthlyCents: a.monthlyCents, annualCents: a.annualCents, cheioCents: a.monthlyCents, descontoBps: 0, nota: "preço mantido" }; }
  const p = precoDoSiteParaLojista(book, pv.plans, plano);
  return { monthlyCents: p.monthlyCents, annualCents: p.annualCents, cheioCents: p.cheio.monthlyCents, descontoBps: book.frentes.segundoProdutoBps, nota: `${book.frentes.segundoProdutoBps / 100}% de desconto no segundo produto` };
}

/** O que o negócio tem: o pacote, o site (com o desconto do segundo produto), a loja e o NextLevel Business. */
export async function planoDoNegocio(db: Database, actor: Actor) {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  const m = await modulosDoNegocio(db, actor.storeId);
  const [views, plano, book] = await Promise.all([addonViewsFor(db, actor, { modulos: true }), planoDaLoja(db, actor.storeId), getPriceBook(db)]);
  const view = views.find((a) => a.key === chaveDoModulo("site")) ?? null;
  const preco = m.formato === "SITE" || !view ? null : await precoDoSiteDoNegocio(db, actor.storeId);
  const site = view && preco ? { ...view, monthlyCents: preco.monthlyCents, annualCents: preco.annualCents } : null;
  return {
    business: m.business, pacote: pacoteDe(m), plano,
    temSite: m.ativos.has("site"), siteIncluido: m.formato === "SITE", adicionalSite: m.formato === "SITE" ? null : site, precoSite: preco,
    temLoja: m.ativos.has("loja"), podeLigarLoja: m.business && !m.ativos.has("loja"),
    lojaMudaPlano: m.formato === "SITE" && !m.ativos.has("loja") ? await (async () => { const { noSitesStart } = await import("@/lib/domain/commerce-plans"); const ss = await noSitesStart(db, actor.storeId!); return ss ? { de: ss.sub.amountCents, para: ss.lojaCents, ciclo: ss.sub.cycle } : null; })() : null,
    temBusiness: m.ativos.has("business"), businessNoPlano: scaleTrazBusiness(plano),
    businessAPartirDeCents: comDesconto(book.frentes.business.essencialCents, book.frentes.businessClienteBps),
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
  // D336: o site sai pelo preço do Sites com o desconto do segundo produto (ou o preço antigo, para quem já tinha).
  const p = await precoDoSiteDoNegocio(db, actor.storeId);
  return buyAddon(db, actor, chave, ciclo, new Date(), { monthlyCents: p.monthlyCents, annualCents: p.annualCents, nota: p.nota });
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
  // Sites Start (D336): o preço é menor que o Start da loja; ao ligar a loja, a assinatura passa ao Start da loja virtual
  // (que já traz o site), valendo a partir da próxima fatura. Os outros níveis já pagam o preço da loja: liga sem custo.
  const { noSitesStart, trocarPlanoDaAssinatura } = await import("@/lib/domain/commerce-plans");
  const ss = await noSitesStart(db, actor.storeId);
  if (ss) await trocarPlanoDaAssinatura(db, actor, actor.storeId, ss.sub, { productKey: "COMMERCE_START", cycle: ss.sub.cycle }, new Date(), { repreciar: true });
  await grantEntitlement(db, { type: "STORE", storeId: actor.storeId }, { key: chaveDoModulo("loja"), source: "PLAN", note: "Loja virtual ligada pelo dono (incluída no plano)" });
  await recordAudit(db, actor, { action: "LOJA_VIRTUAL_LIGADA", entityType: "store", entityId: actor.storeId, storeId: actor.storeId });
  return { ligada: true, nova: true };
}
