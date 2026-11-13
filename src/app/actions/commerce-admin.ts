"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { organizations, stores } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { extendTrial } from "@/lib/domain/store-access";
import { salvarTabelaRecursos } from "@/lib/domain/perfil-loja";

async function master() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  requireMaster(session.actor);
  return session;
}

async function commerceStore(storeId: string) {
  const db = await getDb();
  const row = await db.select({ store: stores, brand: organizations.brand }).from(stores)
    .innerJoin(organizations, eq(organizations.id, stores.organizationId))
    .where(eq(stores.id, storeId)).limit(1);
  if (!row[0] || row[0].brand !== "NEXTLEVEL_COMMERCE") throw new NotFoundError("Loja Commerce não encontrada.");
  return { db, store: row[0].store };
}

export async function setCommerceStoreStatusAction(storeId: string, status: "ACTIVE" | "SUSPENDED") {
  return runAction(async () => {
    await master();
    const { db } = await commerceStore(storeId);
    await db.update(stores).set({ status, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
    revalidatePath("/commerce/stores"); revalidatePath("/commerce");
    return { status };
  });
}

export async function extendCommerceTrialAction(storeId: string, days: number) {
  return runAction(async () => {
    const session = await master();
    const { db } = await commerceStore(storeId);
    const result = await extendTrial(db, session.actor, storeId, days);
    revalidatePath("/commerce/stores"); revalidatePath("/commerce");
    return { trialEndsAt: result.trialEndsAt.toISOString() };
  });
}

/** Tabela "o que cada plano da Commerce libera" (D172). Só o Master financeiro altera; fica na auditoria. */
export async function salvarRecursosPorPlanoAction(tabela: unknown) {
  return runAction(async () => {
    const session = await master();
    await salvarTabelaRecursos(await getDb(), session.actor, tabela);
    revalidatePath("/commerce/plans");
    return { salvo: true };
  });
}

/** Benefícios por plano (D247): a tabela única que trava o painel e alimenta /planos, checkout e placar. */
export async function salvarBeneficiosAction(tabela: unknown) {
  return runAction(async () => {
    const session = await master();
    const { salvarBeneficios } = await import("@/lib/domain/beneficios-plano");
    await salvarBeneficios(await getDb(), session.actor, tabela);
    revalidatePath("/commerce/plans"); revalidatePath("/planos"); revalidatePath("/");
    return { salvo: true };
  });
}
