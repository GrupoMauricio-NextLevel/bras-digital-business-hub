import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { perfilDaLoja } from "@/lib/domain/perfil-loja";

/**
 * Perfil da loja da requisição atual (D172): calculado uma vez por requisição (`cache` do React) e reaproveitado pela casca
 * do painel e pela página. Cada requisição tem o seu; nunca vaza de uma loja para outra.
 */
export const perfilAtual = cache(async (storeId: string) => {
  const db = await getDb();
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new Error("Loja não encontrada.");
  return perfilDaLoja(db, store);
});
