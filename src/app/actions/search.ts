"use server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { globalSearch, type SearchHit } from "@/lib/domain/search";

/** Busca da paleta de comandos. Sem sessão devolve vazio. */
export async function globalSearchAction(query: string): Promise<SearchHit[]> {
  const s = await getSession();
  if (!s) return [];
  return globalSearch(await getDb(), s.actor, query.slice(0, 60));
}
