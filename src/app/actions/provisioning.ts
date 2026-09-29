"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { networks, stores, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster, requireSupplierId } from "@/lib/domain/access";
import { ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { createStore, createSupplier, resetUserPassword, type createStoreSchema, type createSupplierSchema } from "@/lib/domain/provisioning";
import type { z } from "zod";

async function session() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s;
}

export async function createSupplierAction(input: z.input<typeof createSupplierSchema>) {
  return runAction(async () => {
    const s = await session();
    requireMaster(s.actor);
    const r = await createSupplier(await getDb(), input);
    revalidatePath("/master", "layout");
    return r;
  });
}

export async function createStoreAction(input: z.input<typeof createStoreSchema>) {
  return runAction(async () => {
    const s = await session();
    const supplierId = requireSupplierId(s.actor);
    const r = await createStore(await getDb(), supplierId, input);
    revalidatePath("/supplier", "layout");
    revalidatePath("/master", "layout");
    return r;
  });
}

/** Fornecedor redefine a senha do dono de uma loja da sua rede; master redefine qualquer usuário. */
export async function resetPasswordAction(userId: string) {
  return runAction(async () => {
    const s = await session();
    const db = await getDb();
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) throw new NotFoundError("Usuário não encontrado.");
    if (s.actor.role === "SUPPLIER_ADMIN") {
      if (!target.storeId) throw new ForbiddenError();
      const owned = await db.select({ id: stores.id }).from(stores).innerJoin(networks, eq(networks.id, stores.networkId)).where(and(eq(stores.id, target.storeId), eq(networks.supplierId, s.actor.supplierId ?? ""))).limit(1);
      if (!owned[0]) throw new ForbiddenError();
    } else requireMaster(s.actor);
    const temporaryPassword = await resetUserPassword(db, userId);
    return { email: target.email, temporaryPassword };
  });
}
