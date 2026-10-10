import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { syncLoadCollected } from "../cargas/coleta";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { auditLog, bdImporters, bdRequests } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";
import { brasShippingView } from "./catalogo";
import { notifyBrasRequestStatus } from "./avisos";

/**
 * Balcão da importadora v1 (D106): link privado por importadora, sem login (importadoras não têm conta, D93), atrás da
 * chave `BRAS_PANELS`. Mostra só `brasShippingView` + código de retirada dos pedidos Confirmados (separar) e Pagos (retirar).
 * Confirmar a retirada exige digitar o código que o motorista apresenta. Só o hash do link fica no banco.
 */
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

/** Gera (ou troca) o link do Balcão. O código aparece uma vez só; o anterior deixa de valer. Só Master. */
export async function createBalcaoLink(db: Database, actor: Actor, importerId: string) {
  requireMaster(actor);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!imp) throw new NotFoundError("Importadora não encontrada.");
  const token = randomBytes(24).toString("base64url");
  await db.update(bdImporters).set({ balcaoTokenHash: hash(token), balcaoTokenCreatedAt: new Date().toISOString() }).where(eq(bdImporters.id, importerId));
  await recordAudit(db, actor, { action: imp.balcaoTokenHash ? "BRAS_BALCAO_LINK_ROTATED" : "BRAS_BALCAO_LINK_CREATED", entityType: "bd_importer", entityId: importerId }, { force: true });
  return { token, path: `/balcao/${token}` };
}

export async function revokeBalcaoLink(db: Database, actor: Actor, importerId: string) {
  requireMaster(actor);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!imp) throw new NotFoundError("Importadora não encontrada.");
  await db.update(bdImporters).set({ balcaoTokenHash: null, balcaoTokenCreatedAt: null }).where(eq(bdImporters.id, importerId));
  await recordAudit(db, actor, { action: "BRAS_BALCAO_LINK_REVOKED", entityType: "bd_importer", entityId: importerId }, { force: true });
  return { ok: true as const };
}

/** Importadora dona do link (ativa). Código malformado, revogado ou de importadora pausada: null. */
export async function importerByBalcaoToken(db: Database, token: string) {
  if (!TOKEN.test(token)) return null;
  const h = hash(token);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.balcaoTokenHash, h), columns: { id: true, name: true, active: true, pickupAddress: true, balcaoTokenHash: true } });
  if (!imp?.balcaoTokenHash || !imp.active) return null;
  if (!timingSafeEqual(Buffer.from(imp.balcaoTokenHash), Buffer.from(h))) return null;
  return { id: imp.id, name: imp.name, pickupAddress: imp.pickupAddress };
}

export type BalcaoLine = ReturnType<typeof brasShippingView> & { id: string; pickupCode: string | null };

/** Fila do Balcão: Confirmados (separar) e Pagos (retirar), só daquela importadora, só envio e código. */
export async function balcaoQueue(db: Database, token: string) {
  const imp = await importerByBalcaoToken(db, token);
  if (!imp) return null;
  const rows = await db.select().from(bdRequests).where(and(eq(bdRequests.importerId, imp.id), inArray(bdRequests.status, ["CONFIRMED", "PAID"]))).orderBy(asc(bdRequests.number));
  const line = (r: typeof rows[number]): BalcaoLine => ({ id: r.id, ...brasShippingView(r), pickupCode: r.pickupCode });
  return { importer: imp, separar: rows.filter((r) => r.status === "CONFIRMED").map(line), retirar: rows.filter((r) => r.status === "PAID").map(line) };
}

/** Confirma a retirada pelo Balcão: pedido Pago desta importadora e o código certo. Avisa o membro (D100). */
export async function balcaoConfirmPickup(db: Database, token: string, requestId: string, code: string) {
  const imp = await importerByBalcaoToken(db, token);
  if (!imp) throw new NotFoundError("Link do Balcão inválido.");
  const r = await db.query.bdRequests.findFirst({ where: and(eq(bdRequests.id, requestId), eq(bdRequests.importerId, imp.id)) });
  if (!r) throw new NotFoundError("Pedido não encontrado.");
  if (r.status !== "PAID") throw new DomainError("NOT_PAID", "Este pedido ainda não está pago: a retirada só é liberada depois do pagamento.");
  if (!r.pickupCode || code.trim().toUpperCase().replace(/\s/g, "") !== r.pickupCode) throw new DomainError("CODE", "Código de retirada não confere. Peça ao motorista o código do comprovante.");
  const agora = new Date().toISOString();
  const upd = await db.update(bdRequests).set({ status: "PICKED_UP", pickedUpAt: agora, updatedAt: agora }).where(and(eq(bdRequests.id, r.id), eq(bdRequests.status, "PAID"))).returning({ id: bdRequests.id });
  if (!upd.length) throw new DomainError("STATUS_RACE", "O pedido mudou. Atualize a página.");
  await db.insert(auditLog).values({ id: newId("aud"), actorUserId: null, actorRole: "BRAS_BALCAO", action: "BRAS_REQUEST_STATUS", entityType: "bd_request", entityId: r.id, changes: { status: { from: "PAID", to: "PICKED_UP" }, importerId: { to: imp.id } } });
  await notifyBrasRequestStatus(db, r.id, "PICKED_UP");
  await syncLoadCollected(db, r.id);
  return { ok: true as const, number: r.number };
}
