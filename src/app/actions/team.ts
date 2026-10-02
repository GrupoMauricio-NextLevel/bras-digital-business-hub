"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { inviteStaff, removeStaff } from "@/lib/domain/store-team";

async function actor() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}

export async function inviteStaffAction(input: { name: string; email: string; password: string }) {
  return runAction(async () => { await inviteStaff(await getDb(), await actor(), input); revalidatePath("/merchant/team"); return undefined; });
}

export async function removeStaffAction(userId: string) {
  return runAction(async () => { await removeStaff(await getDb(), await actor(), userId); revalidatePath("/merchant/team"); return undefined; });
}
