"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { assertStoreAdmin } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { ligarLojaVirtual } from "@/lib/business/planos";

/** Liga a loja virtual já incluída no plano (D311): sem cobrança nova; só o dono. */
export async function ligarLojaVirtualAction() {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    assertStoreAdmin(s.actor);
    const r = await ligarLojaVirtual(await getDb(), s.actor);
    revalidatePath("/merchant", "layout"); if (s.store?.slug) revalidatePath(`/store/${s.store.slug}`, "layout");
    return r;
  });
}
