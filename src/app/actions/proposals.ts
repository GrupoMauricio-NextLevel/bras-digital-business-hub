"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { acceptProposal, cancelProposal, createProposal } from "@/lib/domain/proposals";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { storeId: requireStoreId(session.actor), db: await getDb() };
}

type CreateInput = Parameters<typeof createProposal>[2];

export async function createProposalAction(input: CreateInput) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    const r = await createProposal(db, storeId, input);
    revalidatePath("/merchant/orders/propostas");
    return { token: r.token, expiresAt: r.expiresAt };
  });
}

export async function cancelProposalAction(id: string) {
  return runAction(async () => {
    const { storeId, db } = await ctx();
    await cancelProposal(db, storeId, id);
    revalidatePath("/merchant/orders/propostas");
    return undefined;
  });
}

/** Pública: quem tem o link aceita. O código do link é a credencial; o servidor reprecifica tudo. */
export async function acceptProposalAction(token: string) {
  return runAction(async () => acceptProposal(await getDb(), token));
}
