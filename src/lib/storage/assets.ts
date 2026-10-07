import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { storeAssets } from "@/db/schema";

/**
 * Onde os bytes das imagens do lojista ficam. Hoje: no próprio banco (base64), que funciona local e em produção simples.
 * Para trocar por um armazenamento de objetos (S3, R2…), basta outra implementação desta interface: o resto do sistema
 * (biblioteca, usos, /assets/[id]) não muda. A migração pode ser incremental (lê de um, grava no outro).
 */
export interface AssetStorage {
  readonly name: string;
  /** Grava os bytes de uma imagem já registrada em `store_assets`. */
  put(db: Database, id: string, bytes: Buffer): Promise<void>;
  get(db: Database, id: string): Promise<{ bytes: Buffer; mime: string } | null>;
}

export const databaseStorage: AssetStorage = {
  name: "banco (base64)",
  async put(db, id, bytes) { await db.update(storeAssets).set({ dataBase64: bytes.toString("base64") }).where(eq(storeAssets.id, id)); },
  async get(db, id) { const r = await db.query.storeAssets.findFirst({ where: eq(storeAssets.id, id) }); return r ? { bytes: Buffer.from(r.dataBase64, "base64"), mime: r.mime } : null; },
};

/** Armazenamento em uso. Só existe o do banco por enquanto (ver docs/temas-modulares/MIDIA.md). */
export const assetStorage: AssetStorage = databaseStorage;
