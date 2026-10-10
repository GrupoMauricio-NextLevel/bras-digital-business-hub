import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdMembers, bdRequests, trCarriers, trLoadRequests, trLoads } from "@/db/schema";
import { requestFreightStatus, type FreightStatus } from "@/lib/frete/situacao";
import type { Actor } from "../access";
import { ForbiddenError } from "../errors";
import { BRAS_IMPORTER_VISIBLE } from "../bras/catalogo";
import { carrierCatalog } from "../cargas/cargas";

/**
 * Painel de frete do cliente (D113): um só para transportadora e ônibus. Nesta etapa os fretes vêm dos pedidos da
 * Brás Digital (com a coleta da transportadora, D111); os fardos dos ônibus entram na etapa da Excursão. Nada aqui
 * guarda situação própria: tudo é calculado do pedido e da coleta (uma fonte de verdade).
 */
export type FreightView = {
  id: string; code: string; requestId: string; mode: "TRANSPORTADORA" | "ONIBUS" | "A_DEFINIR";
  carrier: { id: string | null; name: string; phone: string | null; inCatalog: boolean };
  status: FreightStatus; steps: { key: string; label: string; at: string | null; done: boolean }[];
  what: string; boxes: number; destination: string; importerName: string | null; pickupCode: string | null; loadNumber: number | null;
  createdAt: string;
};

const iso = (v: string | Date | null | undefined) => (v ? new Date(v).toISOString() : null);

export async function myFreights(db: Database, actor: Actor) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Painel de frete do membro da Brás Digital.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId) });
  if (!m) throw new ForbiddenError("Cadastro de membro não encontrado.");
  const reqs = await db.select().from(bdRequests).where(eq(bdRequests.memberId, m.id)).orderBy(desc(bdRequests.createdAt)).limit(200);
  if (!reqs.length) return [] as FreightView[];
  const ids = reqs.map((r) => r.id);
  const loads = await db.select({ requestId: trLoadRequests.requestId, l: trLoads }).from(trLoadRequests).innerJoin(trLoads, eq(trLoads.id, trLoadRequests.loadId)).where(and(inArray(trLoadRequests.requestId, ids), inArray(trLoads.status, ["CHAMADA", "ACEITA", "COLETADA", "ENTREGUE"])));
  const carrierIds = [...new Set([...reqs.map((r) => r.carrierId), ...loads.map((x) => x.l.carrierId)].filter((x): x is string => !!x))];
  const carriers = carrierIds.length ? await db.select({ id: trCarriers.id, name: trCarriers.name, phone: trCarriers.phone, operation: trCarriers.operation }).from(trCarriers).where(inArray(trCarriers.id, carrierIds)) : [];
  return reqs.map((r): FreightView => {
    const load = loads.filter((x) => x.requestId === r.id).map((x) => x.l).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] ?? null;
    const loadCarrier = load ? load.carrierId : null;
    const chosen = carriers.find((c) => c.id === (r.carrierId ?? loadCarrier));
    const st = requestFreightStatus({ status: r.status, createdAt: iso(r.createdAt)!, separatedAt: iso(r.separatedAt), pickedUpAt: iso(r.pickedUpAt) }, load ? { status: load.status, collectedAt: iso(load.collectedAt), deliveredAt: iso(load.deliveredAt) } : null);
    return {
      id: `req-${r.id}`, code: `BD-${r.number}`, requestId: r.id,
      mode: chosen ? (chosen.operation === "EXCURSAO" ? "ONIBUS" : "TRANSPORTADORA") : "A_DEFINIR",
      carrier: chosen ? { id: chosen.id, name: chosen.name, phone: chosen.phone, inCatalog: true } : { id: null, name: r.carrier, phone: null, inCatalog: false },
      status: st.status, steps: st.steps,
      what: r.productTitle, boxes: r.boxes, destination: `${r.shipCity}/${r.shipState}`,
      importerName: BRAS_IMPORTER_VISIBLE.includes(r.status) ? r.importerName : null,
      pickupCode: r.status === "PAID" ? r.pickupCode : null,
      loadNumber: load?.number ?? null,
      createdAt: iso(r.createdAt)!,
    };
  });
}

/** Catálogo para o cliente: transportadoras e ônibus ativos, sem documento; quem atende a UF primeiro. */
export async function freightCatalogFor(db: Database, uf?: string) {
  const list = await carrierCatalog(db, {});
  const serve = (c: { ufs: string[] }) => (uf ? c.ufs.includes(uf) : true);
  return list
    .map((c) => ({ id: c.id, name: c.name, contactName: c.contactName, phone: c.phone, operation: c.operation, ufs: c.ufs, vehicles: c.vehicles, insurance: c.insurance, rateNotes: c.rateNotes, groupCompany: c.groupCompany, docsOk: c.docsOk }))
    .sort((a, b) => Number(serve(b)) - Number(serve(a)) || Number(b.docsOk) - Number(a.docsOk) || a.name.localeCompare(b.name, "pt-BR"));
}

