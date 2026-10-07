import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { auditLog } from "@/db/schema";
import { newId } from "@/lib/ids";
import type { Actor } from "./access";
import { ForbiddenError } from "./errors";

/** Campos cujo valor nunca é gravado na trilha (só o fato de que mudaram). */
const SENSITIVE = /token|secret|senha|password|hash|chave|key|pix|iban|card|cartao/i;

export type AuditInput = { action: string; entityType: string; entityId?: string | null; storeId?: string | null; supplierId?: string | null; before?: Record<string, unknown>; after?: Record<string, unknown> };

/** Diferença campo a campo entre antes e depois; campos sensíveis ficam sem valor. */
export function diffFields(before: Record<string, unknown> = {}, after: Record<string, unknown> = {}): Record<string, { from?: unknown; to?: unknown }> {
  const out: Record<string, { from?: unknown; to?: unknown }> = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[k]; const b = after[k];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    out[k] = SENSITIVE.test(k) ? {} : { from: a ?? null, to: b ?? null };
  }
  return out;
}

/** Registra uma mudança sensível. Nunca derruba a ação que a originou. Sem diferença e sem `force`, não grava. */
export async function recordAudit(db: Database, actor: Actor, e: AuditInput, opts: { force?: boolean } = {}): Promise<boolean> {
  try {
    const changes = diffFields(e.before, e.after);
    if (!opts.force && !Object.keys(changes).length && (e.before || e.after)) return false;
    await db.insert(auditLog).values({ id: newId("aud"), storeId: e.storeId ?? actor.storeId ?? null, supplierId: e.supplierId ?? actor.supplierId ?? null, actorUserId: actor.userId, actorRole: actor.role, action: e.action, entityType: e.entityType, entityId: e.entityId ?? null, changes });
    return true;
  } catch (err) {
    console.error("[audit]", e.action, err);
    return false;
  }
}

/** Últimas mudanças da própria loja (só o dono). */
export async function listAudit(db: Database, actor: Actor, limit = 100) {
  if (actor.role !== "STORE_OWNER" || !actor.storeId || actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono da loja vê o histórico de mudanças.");
  return db.select().from(auditLog).where(eq(auditLog.storeId, actor.storeId)).orderBy(desc(auditLog.createdAt)).limit(Math.min(limit, 200));
}

// ---------------------------------------------------------------------------
// Texto legível para o dono da loja (nunca mostrar nome de campo técnico nem JSON).
// ---------------------------------------------------------------------------
const FIELD_LABEL: Record<string, string> = {
  role: "papel", storeRole: "papel na loja", email: "e-mail", name: "nome", status: "situação", priceCents: "preço", compareAtCents: "preço de comparação",
  active: "ativo", published: "publicado", stock: "estoque", title: "título", slug: "endereço", offer: "plano", customDomain: "domínio próprio",
  motivo: "motivo", modo: "modo", kind: "tipo", rules: "regras", freeShippingFromCents: "frete grátis a partir de",
};
const VALUE_LABEL: Record<string, string> = {
  STAFF: "equipe", OWNER: "dono", ACTIVE: "ativo", SUSPENDED: "suspenso", CLOSED: "encerrado", PENDING_PAYMENT: "aguardando pagamento",
  STORE_OWNER: "lojista", SUPPLIER_ADMIN: "fornecedor", SUPPLIER_DISPATCH: "expedição", AFFILIATE: "parceiro", NEXTLEVEL_MASTER: "NextLevel",
  DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria",
};
function describeValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "number" && /Cents$/.test(field)) return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (typeof v === "string") return VALUE_LABEL[v] ?? v;
  if (Array.isArray(v)) return `${v.length} ${v.length === 1 ? "item" : "itens"}`;
  return "alterado";
}
/** Ex.: { role: { from: null, to: "STAFF" } } → ["papel: vazio → equipe"]. Campos sensíveis viram "alterado". */
export function describeChanges(changes: Record<string, { from?: unknown; to?: unknown }>): string[] {
  return Object.entries(changes).map(([k, v]) => {
    const label = FIELD_LABEL[k] ?? k.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    if (!v || !("to" in v)) return `${label}: alterado`;
    if (!("from" in v) || v.from === null || v.from === undefined) return `${label}: ${describeValue(k, v.to)}`;
    return `${label}: ${describeValue(k, v.from)} → ${describeValue(k, v.to)}`;
  });
}
