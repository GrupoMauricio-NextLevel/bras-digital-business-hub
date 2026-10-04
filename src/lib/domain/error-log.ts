import { createHash } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { errorEvents } from "@/db/schema";
import { newId } from "@/lib/ids";
import { requireMaster, type Actor } from "./access";
import { NotFoundError } from "./errors";

/**
 * Painel de erros. Regras: nada de dado pessoal nem segredo (e-mails, CPF/CNPJ/telefones e fichas são mascarados antes de gravar),
 * erros iguais se agrupam, e só o Master lê. Registrar NUNCA pode derrubar a requisição que falhou.
 */
const MAX_ROWS = 500;

export function maskText(raw: string, max = 300): string {
  return raw
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "***@***")
    .replace(/(?:Bearer|Basic)\s+[\w.~+/=-]+/gi, "$1 ***")
    .replace(/[A-Za-z0-9_\-=]{24,}/g, "***")
    .replace(/\d[\d .\-/()]{7,}\d/g, "***")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Só o caminho (sem parâmetros) e com trechos longos/ids trocados por :id, para não gravar identificadores. */
export function maskRoute(raw: string): string {
  const path = raw.split("?")[0]!.split("#")[0]!;
  return path.replace(/\/[A-Za-z0-9_-]{16,}/g, "/:id").replace(/\/\d{3,}/g, "/:n").slice(0, 160) || "/";
}

export function fingerprintOf(origin: string, route: string, message: string) {
  return createHash("sha256").update(`${origin}|${route}|${message.replace(/\d+/g, "#")}`).digest("hex").slice(0, 32);
}

export type ErrorInput = { origin: "SERVER" | "BROWSER"; route: string; message: string; stack?: string | null; /** de onde veio: "action", "mercadopago"... */ context?: string; /** slug público da loja afetada */ storeSlug?: string | null; /** código curto mostrado ao usuário */ ref?: string | null };

export async function recordError(db: Database, input: ErrorInput): Promise<void> {
  try {
    const route = maskRoute(input.route);
    const message = maskText(input.message || "Erro sem mensagem", 300);
    const stack = input.stack ? maskText(input.stack.split("\n").slice(0, 6).join(" | "), 600) : null;
    const fingerprint = fingerprintOf(input.origin, route, message);
    const now = new Date().toISOString();
    const upd = await db.update(errorEvents).set({ count: sql`${errorEvents.count} + 1`, lastAt: now, resolvedAt: null, ...(input.storeSlug ? { lastStoreSlug: maskText(input.storeSlug, 60) } : {}), ...(input.ref ? { lastRef: maskText(input.ref, 20) } : {}) }).where(eq(errorEvents.fingerprint, fingerprint)).returning({ id: errorEvents.id });
    if (upd.length === 0) {
      await db.insert(errorEvents).values({ id: newId("err"), fingerprint, origin: input.origin, route, message, stack, firstAt: now, lastAt: now, context: input.context ? maskText(input.context, 40) : null, lastStoreSlug: input.storeSlug ? maskText(input.storeSlug, 60) : null, lastRef: input.ref ? maskText(input.ref, 20) : null }).onConflictDoNothing();
      const old = await db.select({ id: errorEvents.id }).from(errorEvents).orderBy(desc(errorEvents.lastAt)).offset(MAX_ROWS);
      if (old.length) await db.delete(errorEvents).where(inArray(errorEvents.id, old.map((o) => o.id)));
    }
  } catch { /* o painel de erros não pode causar erro */ }
}

export async function listErrors(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(errorEvents).orderBy(sql`${errorEvents.resolvedAt} is not null`, desc(errorEvents.lastAt)).limit(200);
}

export async function resolveError(db: Database, actor: Actor, id: string) {
  requireMaster(actor);
  const done = await db.update(errorEvents).set({ resolvedAt: new Date().toISOString() }).where(eq(errorEvents.id, id)).returning({ id: errorEvents.id });
  if (done.length === 0) throw new NotFoundError("Erro não encontrado.");
}

export async function countOpenErrors(db: Database, actor: Actor) {
  requireMaster(actor);
  const rows = await db.select({ n: sql<number>`count(*)::int` }).from(errorEvents).where(sql`${errorEvents.resolvedAt} is null`);
  return rows[0]?.n ?? 0;
}
