"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireMaster } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { MASTER_MARCA_COOKIE, ehMarcaMaster } from "@/lib/master-marca";

/** Seletor de marca do Master (R2): guarda a escolha; "todas" apaga. Só muda o que o Master VÊ, nunca o que pode. */
export async function escolherMarcaMasterAction(marca: string) {
  return runAction(async () => {
    const session = await getSession();
    if (!session) throw new ForbiddenError("Sessão expirada.");
    requireMaster(session.actor);
    const jar = await cookies();
    if (ehMarcaMaster(marca)) jar.set(MASTER_MARCA_COOKIE, marca, { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
    else jar.delete(MASTER_MARCA_COOKIE);
    revalidatePath("/", "layout");
    return { marca: ehMarcaMaster(marca) ? marca : null };
  });
}
