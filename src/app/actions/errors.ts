"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { resolveError } from "@/lib/domain/error-log";

export async function resolveErrorAction(id: string) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await resolveError(await getDb(), s.actor, id);
    revalidatePath("/master/errors");
    return undefined;
  });
}
