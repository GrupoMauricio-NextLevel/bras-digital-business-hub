"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { revokeMarketingConsents, updateStoreCustomerProfile } from "@/lib/domain/crm";
import { anonymizeCustomer } from "@/lib/domain/privacy";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { storeId: requireStoreId(session.actor), db: await getDb() };
}

export async function updateCustomerProfileAction(storeCustomerId: string, input: { notes: string; tags: string }) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    await updateStoreCustomerProfile(db, storeId, storeCustomerId, { notes: input.notes, tags: input.tags.split(",") });
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}

export async function revokeConsentAction(storeCustomerId: string) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    const r = await revokeMarketingConsents(db, storeId, storeCustomerId);
    revalidatePath("/merchant", "layout");
    return r;
  });
}

export async function anonymizeCustomerAction(storeCustomerId: string) {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Sessão expirada.");
    await anonymizeCustomer(await getDb(), session.actor, storeCustomerId);
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}
