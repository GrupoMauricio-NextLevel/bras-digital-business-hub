import { getDb } from "@/db/client";
import type { Actor } from "@/lib/domain/access";
import { listBrasMembers } from "@/lib/domain/bras/membros";
import { listBrasVideosForMaster } from "@/lib/domain/bras/videos";
import { listBrasImporters, listBrasOffersForMaster, listBrasRequestsForMaster } from "@/lib/domain/bras/catalogo";

/** Tudo que o Estúdio mostra (só Master: cada função confere). */
export async function estudioData(actor: Actor) {
  const db = await getDb();
  const [members, videos, importers, offers, requests] = await Promise.all([listBrasMembers(db, actor), listBrasVideosForMaster(db, actor), listBrasImporters(db, actor), listBrasOffersForMaster(db, actor), listBrasRequestsForMaster(db, actor)]);
  return { members, videos, importers, offers, requests };
}
