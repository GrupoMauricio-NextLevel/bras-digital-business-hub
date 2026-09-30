import { count, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { storeAssets, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assertCanAccess, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { requireFeature } from "@/lib/features";

export const MAX_ASSET_BYTES = 1_500_000;
export const MAX_ASSETS_PER_STORE = 80;

/** Confere o tipo real do arquivo pelos primeiros bytes (não confia no que o navegador diz). */
export function sniffImage(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

/** Guarda a imagem do lojista e devolve o endereço público (/assets/id). Só o dono da loja, com a oferta que libera aparência. */
export async function saveStoreAsset(db: Database, actor: Actor, storeId: string, dataUrl: string): Promise<string> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  assertCanAccess(actor, { storeId });
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Só o dono da loja envia imagens.");
  requireFeature(store.offer, "appearanceBasic");
  const m = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new DomainError("BAD_IMAGE", "Envie uma imagem PNG, JPG ou WebP.");
  const bytes = Buffer.from(m[1]!, "base64");
  if (bytes.length === 0 || bytes.length > MAX_ASSET_BYTES) throw new DomainError("IMAGE_SIZE", "A imagem deve ter no máximo 1,5 MB.");
  const mime = sniffImage(bytes);
  if (!mime) throw new DomainError("BAD_IMAGE", "O arquivo não é uma imagem válida.");
  const [n] = await db.select({ n: count() }).from(storeAssets).where(eq(storeAssets.storeId, storeId));
  if ((n?.n ?? 0) >= MAX_ASSETS_PER_STORE) throw new DomainError("TOO_MANY_IMAGES", "Limite de imagens da loja atingido. Remova imagens que não usa.");
  const id = newId("ast");
  await db.insert(storeAssets).values({ id, storeId, mime, sizeBytes: bytes.length, dataBase64: bytes.toString("base64") });
  return `/assets/${id}`;
}

export async function setStoreLogo(db: Database, actor: Actor, storeId: string, url: string | null) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  assertCanAccess(actor, { storeId });
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError();
  requireFeature(store.offer, "appearanceBasic");
  if (url !== null && !/^\/assets\/ast_[a-z0-9]+$/i.test(url) && !/^https:\/\/[^\s]+$/.test(url)) throw new DomainError("BAD_URL", "Endereço de imagem inválido.");
  await db.update(stores).set({ logoUrl: url, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
}
