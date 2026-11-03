"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertStoreAdmin, requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { recordAudit } from "@/lib/domain/audit";
import { removerDominio, salvarDominio, verificarDominio } from "@/lib/domain/dominio-proprio";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { requireFeature } from "@/lib/features";

/** Quem pode ligar o domínio: todo lojista E-commerce (D234); no SuperDrop, a oferta decide (sem mudança). */
async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  assertStoreAdmin(session.actor);
  const storeId = requireStoreId(session.actor);
  const perfil = await perfilAtual(storeId);
  if (!perfil.ecommerce) requireFeature(session.store!.offer, "customDomain");
  else if (!perfil.pode.customDomain) throw new ForbiddenError("Domínio próprio não está liberado no seu plano.");
  return { db: await getDb(), storeId, session };
}
const atualizar = () => { revalidatePath("/merchant/storefront"); revalidatePath("/merchant/settings"); };

export async function salvarDominioAction(dominio: string) {
  return runAction(async () => {
    const { db, storeId, session } = await ctx();
    const r = await salvarDominio(db, storeId, dominio);
    await recordAudit(db, session.actor, { action: "DOMINIO_CADASTRADO", entityType: "store", entityId: storeId, storeId, after: { dominio: r.dominio } });
    atualizar();
    return r;
  });
}

export async function verificarDominioAction() {
  return runAction(async () => { const { db, storeId } = await ctx(); const v = await verificarDominio(db, storeId); atualizar(); return v; });
}

export async function removerDominioAction() {
  return runAction(async () => {
    const { db, storeId, session } = await ctx();
    await removerDominio(db, storeId);
    await recordAudit(db, session.actor, { action: "DOMINIO_REMOVIDO", entityType: "store", entityId: storeId, storeId });
    atualizar();
    return undefined;
  });
}
