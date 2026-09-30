import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { financeInvoices, networks, organizations, serviceOrders, services, stores, suppliers } from "@/db/schema";
import { isMaster, type Actor } from "./access";
import { ForbiddenError } from "./errors";
import { contractTerms, ensureContract, getPriceBook } from "./finance";
import { storeAccess, type StoreAccess } from "./store-access";

/**
 * Escritório virtual da NextLevel: as receitas próprias separadas por origem —
 * assinaturas (lojas e fornecedores), ativações (setups pagos) e serviços. Vendas digitais têm o CRM.
 */
export async function nextlevelOffice(db: Database, actor: Actor, now = new Date(), brand?: string) {
  if (!isMaster(actor)) throw new ForbiddenError("Apenas a NextLevel acessa o escritório virtual.");
  const [book, storeRows, supplierRows, netRows] = await Promise.all([getPriceBook(db), db.select().from(stores), db.select().from(suppliers), db.select().from(networks)]);

  const brandOf = new Map((await db.select({ id: organizations.id, brand: organizations.brand }).from(organizations)).map((o) => [o.id, o.brand] as const));
  const inBrand = (orgId: string) => !brand || brandOf.get(orgId) === brand;
  const storeSubs = storeRows.filter((s) => s.kind === "MEMBER" && inBrand(s.organizationId)).map((s) => {
    const acc: StoreAccess = storeAccess(s, now);
    const supplier = supplierRows.find((x) => x.id === netRows.find((n) => n.id === s.networkId)?.supplierId);
    const monthly = book.offers[s.offer]?.monthlyCents ?? 0;
    return { storeId: s.id, name: s.name, supplierName: supplier?.name ?? "—", offer: s.offer, state: acc.state, endsAt: acc.endsAt?.toISOString() ?? null, daysLeft: acc.daysLeft, monthlyCents: monthly };
  });
  const supplierSubs = [];
  for (const s of supplierRows.filter((x) => x.status !== "CLOSED" && inBrand(x.organizationId))) {
    const t = contractTerms(await ensureContract(db, s.id), s.businessModel);
    supplierSubs.push({ supplierId: s.id, name: s.name, model: s.businessModel, status: s.status, monthlyCents: t.monthlyFeeCents });
  }
  const setups = await db.select().from(financeInvoices).where(and(inArray(financeInvoices.kind, ["STORE_SETUP", "SUPPLIER_SETUP"]))).orderBy(desc(financeInvoices.createdAt));
  const month = now.toISOString().slice(0, 7);
  const who = (i: (typeof setups)[number]) => (i.payerType === "STORE" ? storeRows.find((s) => s.id === i.storeId)?.name : supplierRows.find((s) => s.id === i.supplierId)?.name) ?? "—";
  const activations = setups.map((i) => ({ id: i.id, payer: who(i), payerType: i.payerType, description: i.description, amountCents: i.amountCents, status: i.status, paidAt: i.paidAt, createdAt: i.createdAt }));
  const paidSetups = setups.filter((i) => i.status === "PAID");

  const so = await db.select({ o: serviceOrders, name: services.name }).from(serviceOrders).innerJoin(services, eq(services.id, serviceOrders.serviceId));
  const paidStores = storeSubs.filter((s) => s.state === "PAID");
  return {
    subscriptions: {
      stores: storeSubs, suppliers: supplierSubs,
      storeMrrCents: paidStores.reduce((t, s) => t + s.monthlyCents, 0),
      supplierMrrCents: supplierSubs.filter((s) => s.status !== "SUSPENDED").reduce((t, s) => t + s.monthlyCents, 0),
      counts: { paid: paidStores.length, trial: storeSubs.filter((s) => s.state === "TRIAL").length, blocked: storeSubs.filter((s) => s.state === "BLOCKED").length, free: storeSubs.filter((s) => s.state === "FREE").length },
    },
    activations: { rows: activations, paidCount: paidSetups.length, paidCents: paidSetups.reduce((t, i) => t + i.amountCents, 0), paidMonthCents: paidSetups.filter((i) => i.paidAt?.startsWith(month)).reduce((t, i) => t + i.amountCents, 0), openCents: setups.filter((i) => i.status === "OPEN" || i.status === "OVERDUE").reduce((t, i) => t + i.amountCents, 0) },
    services: {
      open: so.filter((r) => !["DELIVERED", "CANCELED"].includes(r.o.status)).length,
      pipelineCents: so.filter((r) => ["QUOTED", "IN_PROGRESS"].includes(r.o.status)).reduce((t, r) => t + (r.o.quotedCents ?? 0), 0),
      deliveredCents: so.filter((r) => r.o.status === "DELIVERED").reduce((t, r) => t + (r.o.quotedCents ?? 0), 0),
      rows: so.sort((a, b) => b.o.createdAt.localeCompare(a.o.createdAt)).slice(0, 15).map((r) => ({ id: r.o.id, name: r.name, status: r.o.status, quotedCents: r.o.quotedCents, createdAt: r.o.createdAt })),
    },
  };
}
