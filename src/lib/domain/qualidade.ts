import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { errorEvents, qaRuns, qaScreens, users, type QaCheckResult } from "@/db/schema";
import { newId } from "@/lib/ids";
import { BRAND_CODES, brandByCode, brandsFrom, type BrandCode } from "@/lib/brand";
import { describeRoutes, fillRoute, judge, routeFromFile, type QaRoute } from "@/lib/qualidade/rotas";
import { NEEDS, type Need } from "@/lib/qualidade/gpt";
import { publicImages } from "@/lib/qualidade/imagens";
import { type Actor, requireMasterFn } from "./access";
import { recordAudit } from "./audit";
import { DomainError } from "./errors";

/**
 * Central de qualidade (D142), só do dono: todas as telas do sistema (lidas dos arquivos, tela nova aparece sozinha), a
 * marcação de cada uma (testada, aprovada, com problema, anotação), a checagem dos domínios no ar e a checagem das
 * páginas sem login. As checagens só acessam os endereços configurados das marcas (nunca um endereço digitado).
 */

let cached: string[] | null = null;
/** Endereços de todas as telas, a partir de `src/app/**\/page.tsx` (vai junto na imagem publicada). */
export function listAppRoutes(root = join(process.cwd(), "src", "app")): string[] {
  if (cached && root === join(process.cwd(), "src", "app")) return cached;
  const out: string[] = [];
  const walk = (dir: string) => {
    let entries: import("node:fs").Dirent[] = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory()) { if (e.name !== "api" && e.name !== "node_modules") walk(join(dir, e.name)); }
      else if (e.name === "page.tsx") {
        const route = routeFromFile(relative(root, join(dir, e.name)));
        if (route) out.push(route);
      }
    }
  };
  walk(root);
  const list = [...new Set(out)].sort();
  if (root === join(process.cwd(), "src", "app")) cached = list;
  return list;
}

export type ScreenMark = { tested: boolean; approved: boolean; problem: boolean; note: string | null; sample: string | null; needs: Need[]; imageBrief: string | null; updatedAt: string | null; updatedByName: string | null };
export type QaScreen = QaRoute & { mark: ScreenMark; url: string | null; check: QaCheckResult | null };

const EMPTY: ScreenMark = { tested: false, approved: false, problem: false, note: null, sample: null, needs: [], imageBrief: null, updatedAt: null, updatedByName: null };

async function lastRun(db: Database, kind: "DOMINIOS" | "PAGINAS") {
  const [r] = await db.select({ run: qaRuns, by: users.name }).from(qaRuns).leftJoin(users, eq(users.id, qaRuns.startedBy)).where(eq(qaRuns.kind, kind)).orderBy(desc(qaRuns.createdAt)).limit(1);
  return r ? { ...r.run, byName: r.by } : null;
}

/** Tudo o que a central mostra: telas com a marcação e a última checagem, domínios, erros em aberto e a versão no ar. */
export async function qualityCenter(db: Database, actor: Actor, routes = listAppRoutes()) {
  requireMasterFn(actor, []);
  const described = describeRoutes(routes);
  const marks = await db.select({ m: qaScreens, by: users.name }).from(qaScreens).leftJoin(users, eq(users.id, qaScreens.updatedBy));
  const byRoute = new Map(marks.map(({ m, by }) => [m.route, { tested: m.tested, approved: m.approved, problem: m.problem, note: m.note, sample: m.sample, needs: (m.needs ?? []).filter((n): n is Need => (NEEDS as readonly string[]).includes(n)), imageBrief: m.imageBrief, updatedAt: m.updatedAt, updatedByName: by } satisfies ScreenMark]));
  const [pages, domains] = await Promise.all([lastRun(db, "PAGINAS"), lastRun(db, "DOMINIOS")]);
  const checkByKey = new Map((pages?.results ?? []).map((r) => [r.key, r]));
  const screens: QaScreen[] = described.map((r) => {
    const mark = byRoute.get(r.route) ?? EMPTY;
    return { ...r, mark, url: fillRoute(r.route, mark.sample), check: checkByKey.get(r.route) ?? null };
  });
  const [openErrors] = await db.select({ n: count() }).from(errorEvents).where(isNull(errorEvents.resolvedAt));
  const hosts = Object.fromEntries(BRAND_CODES.map((c) => [c, brandByCode(c).baseUrl])) as Record<BrandCode, string>;
  return {
    screens, hosts, images: publicImages(),
    pagesRun: pages ? { at: pages.createdAt, ok: pages.ok, failed: pages.failed, byName: pages.byName } : null,
    domainsRun: domains ? { at: domains.createdAt, ok: domains.ok, failed: domains.failed, byName: domains.byName, results: domains.results } : null,
    openErrors: openErrors?.n ?? 0,
    version: (process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "").slice(0, 7) || null,
  };
}

export const markSchema = z.object({
  tested: z.boolean().optional(), approved: z.boolean().optional(), problem: z.boolean().optional(),
  note: z.string().trim().max(1_000).nullable().optional(),
  sample: z.string().trim().max(300).nullable().optional(),
  needs: z.array(z.enum(NEEDS)).max(NEEDS.length).optional(),
  imageBrief: z.string().trim().max(600).nullable().optional(),
});

/** Marca uma tela (só telas que existem). Cada mudança fica no registro de auditoria com quem e quando. */
export async function markScreen(db: Database, actor: Actor, route: string, raw: z.input<typeof markSchema>, now = new Date(), routes = listAppRoutes()) {
  requireMasterFn(actor, []);
  if (!routes.includes(route)) throw new DomainError("QA_ROUTE", "Esta tela não existe no sistema.");
  const v = markSchema.parse(raw);
  const before = await db.query.qaScreens.findFirst({ where: eq(qaScreens.route, route) });
  const next = {
    tested: v.tested ?? before?.tested ?? false, approved: v.approved ?? before?.approved ?? false, problem: v.problem ?? before?.problem ?? false,
    note: v.note === undefined ? (before?.note ?? null) : v.note || null, sample: v.sample === undefined ? (before?.sample ?? null) : v.sample || null,
    needs: v.needs === undefined ? (before?.needs ?? []) : [...new Set(v.needs)],
    imageBrief: v.imageBrief === undefined ? (before?.imageBrief ?? null) : v.imageBrief || null,
  };
  // Aprovar resolve o problema marcado; marcar problema tira a aprovação (as duas não convivem).
  if (v.approved === true) next.problem = false;
  if (v.problem === true) next.approved = false;
  await db.insert(qaScreens).values({ route, ...next, updatedBy: actor.userId, updatedAt: now.toISOString() })
    .onConflictDoUpdate({ target: qaScreens.route, set: { ...next, updatedBy: actor.userId, updatedAt: now.toISOString() } });
  await recordAudit(db, actor, { action: "QA_SCREEN", entityType: "qa_screen", entityId: route, before: before ? { tested: before.tested, approved: before.approved, problem: before.problem, note: before.note } : undefined, after: { tested: next.tested, approved: next.approved, problem: next.problem, note: next.note, needs: next.needs } });
  return next;
}

/** Zera a marcação de uma área inteira (para uma nova rodada de testes). */
export async function resetScreens(db: Database, actor: Actor, routesToReset: string[]) {
  requireMasterFn(actor, []);
  for (const route of routesToReset) await db.update(qaScreens).set({ tested: false, approved: false, problem: false, updatedBy: actor.userId, updatedAt: new Date().toISOString() }).where(eq(qaScreens.route, route));
  await recordAudit(db, actor, { action: "QA_RESET", entityType: "qa_screen", entityId: null, after: { screens: routesToReset.length } }, { force: true });
  return { reset: routesToReset.length };
}

export type DomainTarget = { brand: BrandCode; brandName: string; origin: string; role: "principal" | "domínio" | "escritório"; live: boolean };
/** Endereços configurados de cada marca: o principal, os domínios e o do escritório (painéis). */
export function domainTargets(env: Record<string, string | undefined> = process.env): DomainTarget[] {
  const out: DomainTarget[] = [];
  const seen = new Set<string>();
  for (const b of Object.values(brandsFrom(env))) {
    const add = (origin: string, role: DomainTarget["role"]) => { const o = origin.replace(/\/+$/, ""); if (seen.has(o)) return; seen.add(o); out.push({ brand: b.code, brandName: b.name, origin: o, role, live: b.live }); };
    add(b.baseUrl, "principal");
    for (const d of b.domains) if (!/^(localhost|127\.|\d+\.\d+\.\d+\.\d+)/.test(d)) add(`https://${d}`, "domínio");
    if (b.officeUrl) add(b.officeUrl, "escritório");
  }
  return out;
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
const timed = async (fetcher: Fetcher, url: string, init: RequestInit, ms: number) => {
  const t = Date.now();
  try { const res = await fetcher(url, { ...init, signal: AbortSignal.timeout(ms) }); return { res, ms: Date.now() - t, error: null as string | null }; }
  catch (e) { return { res: null, ms: Date.now() - t, error: (e as Error).name === "TimeoutError" ? "não respondeu a tempo" : "não foi possível conectar" }; }
};
async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]!); } }));
  return out;
}

/** Checa cada domínio: abre `/api/health` e confere se é o sistema, qual versão e qual atualização do banco. */
export async function checkDomains(db: Database, actor: Actor, fetcher: Fetcher = fetch, env: Record<string, string | undefined> = process.env) {
  requireMasterFn(actor, []);
  const mine = (env.RENDER_GIT_COMMIT ?? env.GIT_COMMIT ?? "").slice(0, 7) || null;
  const results: QaCheckResult[] = await pool(domainTargets(env), 4, async (d) => {
    const url = `${d.origin}/api/health`;
    const { res, ms, error } = await timed(fetcher, url, { redirect: "follow", headers: { accept: "application/json" } }, 12_000);
    if (!res) return { key: d.origin, url, status: null, ms, ok: false, expected: "sistema no ar", detail: `${d.brandName}: ${error}${d.live ? "" : " (marca em preparação)"}` };
    type Health = { ok?: boolean; version?: string | null; migration?: string | null };
    let body: Health | null = null;
    try { body = (await res.json()) as Health; } catch { body = null; }
    const ours = !!body && typeof body.ok === "boolean";
    const ok = res.status === 200 && body?.ok === true;
    const parts = [d.brandName, ours ? `versão ${body?.version ?? "?"}` : "responde, mas não é o sistema", body?.migration ? `banco ${body.migration}` : null, ours && mine && body?.version && body.version !== mine ? "versão diferente desta" : null, d.live ? null : "marca em preparação"].filter(Boolean);
    return { key: d.origin, url, status: res.status, ms, ok, expected: "sistema no ar", detail: parts.join(" · ") };
  });
  return saveRun(db, actor, "DOMINIOS", results);
}

/**
 * Checa as telas sem login: página pública precisa abrir; painel precisa mandar para a entrada. Telas com parte variável
 * só entram com exemplo preenchido. Abre cada uma no domínio da área.
 */
export async function checkPages(db: Database, actor: Actor, fetcher: Fetcher = fetch, routes = listAppRoutes()) {
  requireMasterFn(actor, []);
  const center = await qualityCenter(db, actor, routes);
  const todo = center.screens.filter((s) => s.area.kind !== "DEMO" && s.url);
  const results: QaCheckResult[] = await pool(todo, 6, async (s) => {
    const url = `${center.hosts[s.host]}${s.url}`;
    const { res, ms, error } = await timed(fetcher, url, { redirect: "manual", headers: { accept: "text/html" } }, 15_000);
    const j = judge(s.area.kind, res?.status ?? null, res?.headers.get("location") ?? null);
    const detail = error ?? (j.ok ? null : `esperado: ${j.expected}; veio ${res!.status}${res!.headers.get("location") ? ` para ${res!.headers.get("location")}` : ""}`);
    return { key: s.route, url, status: res?.status ?? null, ms, ok: j.ok, expected: j.expected, detail };
  });
  return saveRun(db, actor, "PAGINAS", results);
}

async function saveRun(db: Database, actor: Actor, kind: "DOMINIOS" | "PAGINAS", results: QaCheckResult[]) {
  const ok = results.filter((r) => r.ok).length;
  const id = newId("qar");
  await db.insert(qaRuns).values({ id, kind, results, ok, failed: results.length - ok, startedBy: actor.userId });
  return { id, ok, failed: results.length - ok, results };
}

/** Histórico curto das checagens (para ver se piorou ou melhorou). */
export async function runHistory(db: Database, actor: Actor, kind: "DOMINIOS" | "PAGINAS", limit = 10) {
  requireMasterFn(actor, []);
  return db.select({ id: qaRuns.id, at: qaRuns.createdAt, ok: qaRuns.ok, failed: qaRuns.failed }).from(qaRuns).where(and(eq(qaRuns.kind, kind))).orderBy(desc(qaRuns.createdAt)).limit(limit);
}
