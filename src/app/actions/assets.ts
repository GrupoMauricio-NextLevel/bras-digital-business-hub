"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId } from "@/lib/domain/access";
import { ForbiddenError } from "@/lib/domain/errors";
import { listStoreMedia, removeStoreAsset, saveStoreAsset, setStoreLogo, updateStoreAsset } from "@/lib/domain/assets";

async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { session: s, storeId: requireStoreId(s.actor), db: await getDb() };
}
const assetId = z.string().regex(/^ast_[a-z0-9]+$/i);

/** Envia uma imagem (já reduzida no navegador) para a biblioteca e devolve o endereço. */
export async function uploadStoreImageAction(dataUrl: string, meta?: { name?: string; alt?: string }) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); return { url: await saveStoreAsset(db, session.actor, storeId, z.string().parse(dataUrl), { name: z.string().max(120).optional().parse(meta?.name), alt: z.string().max(140).optional().parse(meta?.alt) }) }; });
}

/** Biblioteca da loja, com onde cada imagem é usada. */
export async function listMediaAction() {
  return runAction(async () => { const { session, storeId, db } = await ctx(); return listStoreMedia(db, session.actor, storeId); });
}

/** Remove (ou arquiva, se só o histórico usa) uma imagem. Em uso na loja, recusa e diz onde. */
export async function removeMediaAction(id: string) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); return removeStoreAsset(db, session.actor, storeId, assetId.parse(id)); });
}

export async function updateMediaAction(id: string, data: { name?: string; alt?: string }) {
  return runAction(async () => { const { session, storeId, db } = await ctx(); await updateStoreAsset(db, session.actor, storeId, assetId.parse(id), { name: z.string().max(120).optional().parse(data.name), alt: z.string().max(140).optional().parse(data.alt) }); return undefined; });
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
