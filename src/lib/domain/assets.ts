import { and, count, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/client";
import { storeAssets, stores, themeGlobals, themeTemplates, themeTemplateVersions } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assetStorage } from "@/lib/storage/assets";
import { assertCanAccess, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { requireFeature } from "@/lib/features";

/** Limites da mídia: peso do arquivo enviado (já reduzido no navegador), dimensões e pixels depois de decodificar. */
export const MAX_ASSET_BYTES = 3_000_000;
export const MAX_ASSETS_PER_STORE = 200;
export const MAX_SIDE = 6000;
export const MAX_PIXELS = 36_000_000;

/** Confere o tipo pelos primeiros bytes (não confia no que o navegador diz). Só a assinatura NÃO basta: veja decodeImage. */
export function sniffImage(bytes: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (bytes.length > 12 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

/** Decodifica de verdade (sharp): arquivo vazio, truncado ou corrompido é recusado; dimensões e pixels são limitados. */
export async function decodeImage(bytes: Buffer): Promise<{ mime: "image/png" | "image/jpeg" | "image/webp"; width: number; height: number }> {
  if (bytes.length === 0) throw new DomainError("BAD_IMAGE", "O arquivo está vazio.");
  const mime = sniffImage(bytes);
  if (!mime) throw new DomainError("BAD_IMAGE", "O arquivo não é uma imagem válida.");
  const sharp = (await import("sharp")).default;
  let meta;
  try { const img = sharp(bytes, { failOn: "error", limitInputPixels: MAX_PIXELS }); meta = await img.metadata(); await img.stats(); }
  catch { throw new DomainError("BAD_IMAGE", "Não foi possível abrir a imagem: o arquivo parece corrompido."); }
  const width = meta.width ?? 0, height = meta.height ?? 0;
  if (!width || !height) throw new DomainError("BAD_IMAGE", "O arquivo não é uma imagem válida.");
  if (width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) throw new DomainError("IMAGE_TOO_LARGE", `A imagem é grande demais (${width}×${height}). O limite é ${MAX_SIDE} px por lado.`);
  return { mime, width, height };
}

async function ownerStore(db: Database, actor: Actor, storeId: string) {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  assertCanAccess(actor, { storeId });
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Só o dono da loja envia e gerencia imagens.");
  requireFeature(store.offer, "appearanceBasic");
  return store;
}

/** Guarda a imagem do lojista (original preservado; derivados são gerados ao servir) e devolve o endereço /assets/id. */
export async function saveStoreAsset(db: Database, actor: Actor, storeId: string, dataUrl: string, meta: { name?: string; alt?: string } = {}): Promise<string> {
  await ownerStore(db, actor, storeId);
  const m = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]*)$/.exec(dataUrl);
  if (!m) throw new DomainError("BAD_IMAGE", "Envie uma imagem PNG, JPG ou WebP.");
  const bytes = Buffer.from(m[1]!, "base64");
  if (bytes.length > MAX_ASSET_BYTES) throw new DomainError("IMAGE_SIZE", "A imagem deve ter no máximo 3 MB.");
  const { mime, width, height } = await decodeImage(bytes);
  const [n] = await db.select({ n: count() }).from(storeAssets).where(and(eq(storeAssets.storeId, storeId), isNull(storeAssets.archivedAt)));
  if ((n?.n ?? 0) >= MAX_ASSETS_PER_STORE) throw new DomainError("TOO_MANY_IMAGES", "Limite de imagens da biblioteca atingido. Remova ou arquive imagens que não usa.");
  const id = newId("ast");
  await db.transaction(async (tx) => {
    await tx.insert(storeAssets).values({ id, storeId, mime, sizeBytes: bytes.length, dataBase64: "", width, height, name: meta.name?.slice(0, 120) ?? null, alt: meta.alt?.slice(0, 140) ?? null });
    await assetStorage.put(tx as unknown as Database, id, bytes);
  });
  return `/assets/${id}`;
}

export async function setStoreLogo(db: Database, actor: Actor, storeId: string, url: string | null) {
  await ownerStore(db, actor, storeId);
  if (url !== null && !/^\/assets\/ast_[a-z0-9]+$/i.test(url) && !/^https:\/\/[^\s]+$/.test(url)) throw new DomainError("BAD_URL", "Endereço de imagem inválido.");
  if (url) await assertAssetsBelong(db, storeId, [url]);
  await db.update(stores).set({ logoUrl: url, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
}

const ASSET_REF = /\/assets\/(ast_[a-z0-9]+)/gi;
/** Ids de imagens da biblioteca referenciados num documento qualquer (modelo, globais, versão). */
export function assetIdsIn(doc: unknown): string[] { return [...new Set([...JSON.stringify(doc ?? null).matchAll(ASSET_REF)].map((m) => m[1]!.toLowerCase()))]; }

/** Uma loja não usa imagem da biblioteca de outra (a imagem é pública, mas o controle de uso e a remoção são da dona). */
export async function assertAssetsBelong(db: Database, storeId: string, docs: unknown[]) {
  const ids = [...new Set(docs.flatMap(assetIdsIn))]; if (!ids.length) return;
  const rows = await db.select({ id: storeAssets.id, storeId: storeAssets.storeId }).from(storeAssets);
  const owner = new Map(rows.map((r) => [r.id.toLowerCase(), r.storeId]));
  const foreign = ids.filter((id) => owner.get(id) !== storeId);
  if (foreign.length) throw new DomainError("THEME_INVALID", "Use imagens da biblioteca da sua loja (envie a imagem pela biblioteca).");
}

export type AssetUse = { where: "publicado" | "rascunho" | "histórico" | "logo"; page: string };
/** Onde cada imagem da loja aparece: publicado, rascunho, versões restauráveis e logo. */
export async function assetUsage(db: Database, storeId: string): Promise<Map<string, AssetUse[]>> {
  const usage = new Map<string, AssetUse[]>();
  const add = (doc: unknown, use: AssetUse) => { for (const id of assetIdsIn(doc)) usage.set(id, [...(usage.get(id) ?? []), use]); };
  for (const t of await db.select().from(themeTemplates).where(eq(themeTemplates.storeId, storeId))) { add(t.published, { where: "publicado", page: t.page }); add(t.draft, { where: "rascunho", page: t.page }); }
  const g = await db.query.themeGlobals.findFirst({ where: eq(themeGlobals.storeId, storeId) });
  if (g) { add(g.published, { where: "publicado", page: "globals" }); add(g.draft, { where: "rascunho", page: "globals" }); }
  for (const v of await db.select({ page: themeTemplateVersions.page, snapshot: themeTemplateVersions.snapshot }).from(themeTemplateVersions).where(eq(themeTemplateVersions.storeId, storeId))) add(v.snapshot, { where: "histórico", page: v.page });
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (s?.logoUrl) add(s.logoUrl, { where: "logo", page: "globals" });
  return usage;
}

export type MediaItem = { id: string; url: string; width: number | null; height: number | null; sizeBytes: number; name: string | null; alt: string | null; createdAt: string; uses: AssetUse[] };
/** Biblioteca da loja (sem as arquivadas), com os usos de cada imagem. */
export async function listStoreMedia(db: Database, actor: Actor, storeId: string): Promise<MediaItem[]> {
  await ownerStore(db, actor, storeId);
  const rows = await db.select({ id: storeAssets.id, width: storeAssets.width, height: storeAssets.height, sizeBytes: storeAssets.sizeBytes, name: storeAssets.name, alt: storeAssets.alt, createdAt: storeAssets.createdAt }).from(storeAssets).where(and(eq(storeAssets.storeId, storeId), isNull(storeAssets.archivedAt)));
  const usage = await assetUsage(db, storeId);
  return rows.map((r) => ({ ...r, url: `/assets/${r.id}`, uses: usage.get(r.id.toLowerCase()) ?? [] })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Remover da biblioteca. Em uso no publicado, no rascunho ou como logo: recusa e diz onde.
 * Só no histórico (versão restaurável): arquiva (some da biblioteca, mas continua servida). Sem uso: apaga.
 */
export async function removeStoreAsset(db: Database, actor: Actor, storeId: string, assetId: string): Promise<{ result: "deleted" | "archived" }> {
  await ownerStore(db, actor, storeId);
  const row = await db.query.storeAssets.findFirst({ where: and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)) });
  if (!row) throw new NotFoundError("Imagem não encontrada.");
  const uses = (await assetUsage(db, storeId)).get(assetId.toLowerCase()) ?? [];
  const live = uses.filter((u) => u.where !== "histórico");
  if (live.length) throw new DomainError("ASSET_IN_USE", `Esta imagem está em uso (${[...new Set(live.map((u) => u.where))].join(", ")}). Troque-a nesses lugares antes de remover.`);
  if (uses.length) { await db.update(storeAssets).set({ archivedAt: new Date().toISOString() }).where(eq(storeAssets.id, assetId)); return { result: "archived" }; }
  await db.delete(storeAssets).where(eq(storeAssets.id, assetId));
  return { result: "deleted" };
}

/** Atualiza nome e descrição padrão (usada como sugestão de texto alternativo). */
export async function updateStoreAsset(db: Database, actor: Actor, storeId: string, assetId: string, data: { name?: string; alt?: string }) {
  await ownerStore(db, actor, storeId);
  const row = await db.query.storeAssets.findFirst({ where: and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)) });
  if (!row) throw new NotFoundError("Imagem não encontrada.");
  await db.update(storeAssets).set({ name: data.name?.slice(0, 120) ?? row.name, alt: data.alt?.slice(0, 140) ?? row.alt }).where(eq(storeAssets.id, assetId));
}
