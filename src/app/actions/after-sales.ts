"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { addOrderNote } from "@/lib/domain/after-sales";

export async function addOrderNoteAction(orderId: string, text: string) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await addOrderNote(await getDb(), s.actor, orderId, text);
    revalidatePath("/merchant", "layout");
    return undefined;
  });
}
