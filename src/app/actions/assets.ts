"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { saveStoreAsset, setStoreLogo } from "@/lib/domain/assets";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, storeId: requireStoreId(s.actor), db: await getDb() };
}

/** Envia uma imagem (já reduzida no navegador) e devolve o endereço para usar no tema. */
export async function uploadStoreImageAction(dataUrl: string) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); return { url: await saveStoreAsset(db, session.actor, storeId, dataUrl) }; });
}

/** Define (ou remove) a logo da loja. */
export async function setStoreLogoAction(url: string | null) {
  return runAction(async () => {
    const { session, storeId, db } = await ctx();
    await setStoreLogo(db, session.actor, storeId, url);
    revalidatePath("/merchant", "layout"); if (session.store?.slug) revalidatePath(`/store/${session.store.slug}`, "layout");
    return undefined;
  });
}
