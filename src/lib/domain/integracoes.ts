import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores } from "@/db/schema";
import { DomainError, ForbiddenError } from "./errors";
import { assertStoreAdmin, type Actor } from "./access";
import { storeModality } from "./order-policy";
import { validarIntegracoes, type EntradaIntegracoes, type IntegracoesLoja } from "./integracoes-regras";

/** Gravação das integrações da loja (D189). As regras puras (validação, manifesto) ficam em integracoes-regras.ts. */
export * from "./integracoes-regras";

export async function salvarIntegracoes(db: Database, actor: Actor, entrada: EntradaIntegracoes): Promise<IntegracoesLoja> {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só o dono da loja.");
  assertStoreAdmin(actor);
  if ((await storeModality(db, actor.storeId)) !== "INDEPENDENT") throw new DomainError("NOT_ALLOWED", "Disponível na loja da NextLevel E-commerce.");
  const r = validarIntegracoes(entrada);
  if (!r.ok) throw new DomainError("INVALID", Object.values(r.erros).join(" "));
  await db.update(stores).set({ integrations: r.valor }).where(eq(stores.id, actor.storeId));
  return r.valor;
}
