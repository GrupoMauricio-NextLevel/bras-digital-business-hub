import type { Database } from "@/db/client";
import type { Actor } from "@/lib/domain/access";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { addonViewsFor, buyAddon } from "@/lib/domain/nextlevel-billing";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { chaveDoModulo, modulosDoNegocio, type ModulosDoNegocio } from "./modulos";

/**
 * Plano e pacotes do negócio (NextLevel Business, NB8, D308/D310).
 * - O plano da conta (Start, Pro, Scale) já inclui o NextLevel Business e o primeiro caminho escolhido (site ou loja).
 * - O segundo caminho é um adicional mensal ou anual (MODULO_SITE, MODULO_LOJA), com preço na tabela do Master; pago,
 *   o direito libera o módulo (`modulosDe` lê a mesma chave).
 * - Lojista de hoje = "Business + Loja", sem mudança.
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

const MODULO_DO_ADICIONAL = { MODULO_SITE: "site", MODULO_LOJA: "loja" } as const;
type ChaveModulo = keyof typeof MODULO_DO_ADICIONAL;

/** O que o negócio tem e o que pode contratar, com o preço da tabela do Master. */
export async function planoDoNegocio(db: Database, actor: Actor) {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  const m = await modulosDoNegocio(db, actor.storeId);
  const adicionais = await addonViewsFor(db, actor, { modulos: true });
  const ofertas = adicionais.map((a) => {
    const modulo = MODULO_DO_ADICIONAL[a.key as ChaveModulo];
    // "Incluído": veio com o plano (primeiro caminho). "Contratado": adicional pago e vigente.
    const incluido = m.formato === (modulo === "site" ? "SITE" : "LOJA");
    return { ...a, modulo, incluido, ativo: m.ativos.has(modulo) };
  });
  return { business: m.business, pacote: pacoteDe(m), ofertas };
}

/** Contrata o segundo caminho: gera a fatura (Pix ou cartão); o módulo liga quando o pagamento é confirmado. */
export async function contratarModulo(db: Database, actor: Actor, chave: string, ciclo: "MONTHLY" | "ANNUAL") {
  if (!actor.storeId) throw new ForbiddenError("Esta área é do painel do negócio.");
  if (actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono do negócio contrata.");
  if (!(chave in MODULO_DO_ADICIONAL)) throw new DomainError("MODULO", "Módulo não encontrado.");
  const m = await modulosDoNegocio(db, actor.storeId);
  if (!m.business) throw new DomainError("BUSINESS_DESLIGADO", "A contratação de módulos ainda não está aberta para a sua conta.");
  const modulo = MODULO_DO_ADICIONAL[chave as ChaveModulo];
  if (m.formato === (modulo === "site" ? "SITE" : "LOJA")) throw new DomainError("JA_INCLUIDO", "Este caminho já vem no seu plano.");
  if (chave !== chaveDoModulo(modulo)) throw new DomainError("MODULO", "Módulo não encontrado.");
  return buyAddon(db, actor, chave, ciclo);
}
