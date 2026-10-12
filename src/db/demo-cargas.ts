import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { bdImporters, trCarriers, trLoadRatings, trLoads, users } from "./schema";
import { newId } from "@/lib/ids";

/**
 * Transportadoras FICTÍCIAS de demonstração (D139, pedido do dono): uma em cada nível de reputação (Ouro, Prata e
 * Bronze), com cargas entregues e avaliações inventadas, todas com "(demonstração)" no nome. Só entram no banco de
 * demonstração (DEMO_AUTOSEED), nunca na produção. Idempotente pelo documento.
 */
const DEMO = [
  { doc: "90.000.001/0001-01", name: "Rota Ouro Transportes (demonstração)", ufs: ["MG", "GO"], delivered: 34, punctuality: 5, care: 5, refused: 1 },
  { doc: "90.000.002/0001-02", name: "Expresso Prata (demonstração)", ufs: ["MG"], delivered: 12, punctuality: 4, care: 5, refused: 2 },
  { doc: "90.000.003/0001-03", name: "Fretes Começando (demonstração)", ufs: ["MG", "BA"], delivered: 2, punctuality: 4, care: 4, refused: 0 },
];

export async function seedDemoCargas(db: Database): Promise<boolean> {
  if (await db.query.trCarriers.findFirst({ where: eq(trCarriers.document, DEMO[0]!.doc) })) return false;
  const master = await db.query.users.findFirst({ where: eq(users.role, "NEXTLEVEL_MASTER") });
  const importerId = newId("bdi");
  await db.insert(bdImporters).values({ id: importerId, name: "Importadora de demonstração" });
  let number = 90_001;
  const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  for (const c of DEMO) {
    const carrierId = newId("trc");
    await db.insert(trCarriers).values({ id: carrierId, name: c.name, docType: "CNPJ", document: c.doc, contactName: "Contato fictício", phone: "11900000000", ufs: c.ufs, vehicles: ["TRUCK"], plan: "GRATIS", status: "ATIVA", operation: "CARGA" });
    for (let i = 0; i < c.delivered + c.refused; i++) {
      const loadId = newId("trl");
      const refused = i >= c.delivered;
      await db.insert(trLoads).values({ id: loadId, number: number++, importerId, carrierId, status: refused ? "RECUSADA" : "ENTREGUE", pickupDate: day(10 + i).slice(0, 10), period: "MANHA", boxes: 4, destinations: c.ufs.join(", "), freightCents: refused ? null : 60_000, commissionBps: refused ? null : 1_000, commissionCents: refused ? null : 6_000, createdBy: master?.id ?? "demo", acceptedAt: refused ? null : day(10 + i), collectedAt: refused ? null : day(9 + i), deliveredAt: refused ? null : day(8 + i), createdAt: day(11 + i) });
      if (!refused) await db.insert(trLoadRatings).values({ id: newId("trrt"), loadId, carrierId, importerId, punctuality: c.punctuality, care: c.care, comment: "Avaliação fictícia de demonstração" });
    }
  }
  return true;
}
