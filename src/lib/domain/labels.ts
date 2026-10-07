import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import type { Database } from "@/db/client";
import { activities, labelPrints, orderEvents, orderItems, orderLabelFiles, orders } from "@/db/schema";
import { newId } from "@/lib/ids";
import { assertCanAccess, isSupplierSide, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import { resolveFulfillmentStatus } from "./order-status";

export const MAX_LABEL_FILES = 5;
export const MAX_LABEL_BYTES = 3 * 1024 * 1024;

const isPdf = (b: Uint8Array) => b.length > 8 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d; // %PDF-

const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || "etiqueta.pdf";

export type LabelFileMeta = { id: string; orderId: string; filename: string; sizeBytes: number; sha256: string; createdAt: string };

const metaCols = { id: orderLabelFiles.id, orderId: orderLabelFiles.orderId, filename: orderLabelFiles.filename, sizeBytes: orderLabelFiles.sizeBytes, sha256: orderLabelFiles.sha256, createdAt: orderLabelFiles.createdAt };

async function loadOrder(db: Database, actor: Actor, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new NotFoundError("Pedido não encontrado.");
  assertCanAccess(actor, order);
  return order;
}

/** Lojista anexa a etiqueta (PDF da plataforma de envio). Valida assinatura, tamanho, limite por pedido e duplicidade. */
export async function addLabelFile(db: Database, actor: Actor, orderId: string, file: { filename: string; bytes: Uint8Array }) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Apenas o lojista anexa a etiqueta.");
  const order = await loadOrder(db, actor, orderId);
  if (order.status === "CANCELED") throw new DomainError("ORDER_CANCELED", "Pedido cancelado.");
  if (["SHIPPED", "DELIVERED"].includes(order.status)) throw new DomainError("ORDER_SHIPPED", "Pedido já enviado.");
  if (file.bytes.length === 0) throw new DomainError("EMPTY_FILE", "Arquivo vazio.");
  if (file.bytes.length > MAX_LABEL_BYTES) throw new DomainError("FILE_TOO_LARGE", "A etiqueta deve ter no máximo 3 MB.");
  if (!isPdf(file.bytes)) throw new DomainError("NOT_PDF", "Envie a etiqueta em PDF (arquivo da plataforma de envio).");
  const sha256 = createHash("sha256").update(file.bytes).digest("hex");
  return db.transaction(async (tx) => {
    const existing = await tx.select({ id: orderLabelFiles.id, sha256: orderLabelFiles.sha256 }).from(orderLabelFiles).where(eq(orderLabelFiles.orderId, orderId));
    if (existing.some((e) => e.sha256 === sha256)) throw new DomainError("DUPLICATE_FILE", "Este arquivo já foi anexado ao pedido.");
    if (existing.length >= MAX_LABEL_FILES) throw new DomainError("TOO_MANY_FILES", `No máximo ${MAX_LABEL_FILES} arquivos por pedido.`);
    const id = newId("lbl");
    await tx.insert(orderLabelFiles).values({ id, orderId, filename: safeName(file.filename), sizeBytes: file.bytes.length, sha256, dataBase64: Buffer.from(file.bytes).toString("base64"), uploadedBy: actor.userId });
    const next = resolveFulfillmentStatus({ ...order, shippingLabelStatus: "READY" });
    await tx.update(orders).set({ shippingLabelStatus: "READY", status: next, updatedAt: new Date().toISOString() }).where(eq(orders.id, orderId));
    await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "LABEL_READY", message: `Etiqueta anexada (${safeName(file.filename)}).`, actorRole: actor.role });
    if (next !== order.status) {
      await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: `STATUS_${next}`, message: next === "READY_TO_PICK" ? "Pronto para separação na Central." : "Status atualizado.", actorRole: actor.role });
      if (next === "READY_TO_PICK") await tx.insert(activities).values({ id: newId("act"), scope: "SUPPLIER", supplierId: order.supplierId, storeId: order.storeId, type: "READY_TO_PICK", message: `Pedido #${order.number} pronto para separação` });
    }
    return { id, status: next };
  });
}

/** Remove um arquivo enquanto o pedido ainda não começou a ser separado. Sem arquivos, a etiqueta volta a pendente. */
export async function removeLabelFile(db: Database, actor: Actor, orderId: string, fileId: string) {
  if (actor.role !== "STORE_OWNER") throw new ForbiddenError("Apenas o lojista remove a etiqueta.");
  const order = await loadOrder(db, actor, orderId);
  if (!["PENDING", "AWAITING_CENTRAL_PAYMENT", "AWAITING_LABEL", "READY_TO_PICK"].includes(order.status)) throw new DomainError("ORDER_LOCKED", "A separação já começou; fale com a Central.");
  await db.transaction(async (tx) => {
    await tx.delete(orderLabelFiles).where(and(eq(orderLabelFiles.id, fileId), eq(orderLabelFiles.orderId, orderId)));
    const left = await tx.select({ id: orderLabelFiles.id }).from(orderLabelFiles).where(eq(orderLabelFiles.orderId, orderId));
    if (left.length === 0) {
      const next = order.status === "READY_TO_PICK" ? "AWAITING_LABEL" : order.status;
      await tx.update(orders).set({ shippingLabelStatus: "PENDING", status: next, updatedAt: new Date().toISOString() }).where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ id: newId("evt"), orderId, type: "LABEL_REMOVED", message: "Etiqueta removida.", actorRole: actor.role });
    }
  });
}

export async function listLabelFiles(db: Database, actor: Actor, orderId: string): Promise<LabelFileMeta[]> {
  await loadOrder(db, actor, orderId);
  return db.select(metaCols).from(orderLabelFiles).where(eq(orderLabelFiles.orderId, orderId)).orderBy(asc(orderLabelFiles.createdAt));
}

/** Conteúdo do PDF, com o mesmo controle de acesso do pedido (lojista dono, fornecedor/expedição, master). */
export async function getLabelBytes(db: Database, actor: Actor, orderId: string, fileId: string) {
  await loadOrder(db, actor, orderId);
  const f = await db.query.orderLabelFiles.findFirst({ where: and(eq(orderLabelFiles.id, fileId), eq(orderLabelFiles.orderId, orderId)) });
  if (!f) throw new NotFoundError("Arquivo não encontrado.");
  return { filename: f.filename, bytes: new Uint8Array(Buffer.from(f.dataBase64, "base64")) };
}

/** Junta as etiquetas de vários pedidos em um único PDF para impressão em lote. Registra a impressão de cada pedido. */
export async function mergeLabels(db: Database, actor: Actor, orderIds: string[]) {
  if (!isSupplierSide(actor)) throw new ForbiddenError("Impressão em lote é da Central.");
  const ids = [...new Set(orderIds)].slice(0, 100);
  if (ids.length === 0) throw new DomainError("NO_ORDERS", "Selecione ao menos um pedido.");
  const found = await db.select().from(orders).where(inArray(orders.id, ids));
  for (const o of found) assertCanAccess(actor, o);
  if (found.length !== ids.length) throw new NotFoundError("Pedido não encontrado.");
  const out = await PDFDocument.create();
  let pages = 0;
  const printed: string[] = [];
  for (const o of found) {
    const files = await db.select().from(orderLabelFiles).where(eq(orderLabelFiles.orderId, o.id)).orderBy(asc(orderLabelFiles.createdAt));
    for (const f of files) {
      try {
        const src = await PDFDocument.load(Buffer.from(f.dataBase64, "base64"), { ignoreEncryption: true });
        for (const pg of await out.copyPages(src, src.getPageIndices())) { out.addPage(pg); pages++; }
      } catch { throw new DomainError("BAD_PDF", `A etiqueta do pedido #${o.number} está corrompida. Peça ao lojista para anexar de novo.`); }
    }
    if (files.length) printed.push(o.id);
  }
  if (pages === 0) throw new DomainError("NO_LABELS", "Nenhum dos pedidos tem etiqueta anexada.");
  await db.insert(labelPrints).values(printed.map((orderId) => ({ id: newId("prt"), orderId, kind: "LABEL" as const, printedBy: actor.userId })));
  return { bytes: await out.save(), pages, orders: printed.length };
}

/** Marca a lista de separação como impressa (a impressão em si é do navegador). */
export async function recordPickingListPrint(db: Database, actor: Actor, orderIds: string[]) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  const found = await db.select().from(orders).where(inArray(orders.id, orderIds));
  for (const o of found) assertCanAccess(actor, o);
  if (found.length) await db.insert(labelPrints).values(found.map((o) => ({ id: newId("prt"), orderId: o.id, kind: "PICKING_LIST" as const, printedBy: actor.userId })));
}

export async function printCounts(db: Database, orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, { label: number; list: number }>();
  const rows = await db.select().from(labelPrints).where(inArray(labelPrints.orderId, orderIds)).orderBy(desc(labelPrints.createdAt));
  const m = new Map<string, { label: number; list: number }>();
  for (const r of rows) { const c = m.get(r.orderId) ?? { label: 0, list: 0 }; if (r.kind === "LABEL") c.label++; else c.list++; m.set(r.orderId, c); }
  return m;
}

export async function pickingListItems(db: Database, actor: Actor, orderIds: string[]) {
  if (!isSupplierSide(actor)) throw new ForbiddenError();
  const found = await db.select().from(orders).where(inArray(orders.id, orderIds));
  for (const o of found) assertCanAccess(actor, o);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  return { orders: found, items };
}
