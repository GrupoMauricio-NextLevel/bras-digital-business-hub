import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { jobRuns } from "@/db/schema";
import { newId } from "@/lib/ids";

/** Rotinas do sistema e de quanto em quanto tempo devem rodar (o dobro disso sem rodar = atrasada). */
export const JOBS = {
  "expire-reservations": { label: "Liberar reservas e conferir pagamentos", everyMs: 10 * 60_000 },
  finance: { label: "Rotina financeira diária", everyMs: 24 * 3_600_000 },
} as const;
export type JobName = keyof typeof JOBS;

const KEEP = 200;
/** Mensagem curta e sem segredos nem e-mails (fichas longas e endereços de e-mail são mascarados). */
const shortMessage = (e: unknown) => (e instanceof Error ? e.message : String(e)).replace(/\s+/g, " ").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "***@***").replace(/[A-Za-z0-9_\-=]{24,}/g, "***").slice(0, 160);

export type Step = { name: string; run: () => Promise<unknown>; summarize?: (r: never) => string };

/**
 * Executa as etapas de uma rotina em sequência, ISOLADAS (a falha de uma não impede as outras), e registra UMA linha com o resultado.
 * O detalhe guarda só contagens ou o motivo resumido (sem dado pessoal). Nunca lança.
 */
export async function runJob(db: Database, job: JobName, steps: Step[]): Promise<{ ok: boolean; results: Record<string, unknown>; failed: string[] }> {
  const t0 = Date.now();
  const results: Record<string, unknown> = {};
  const failed: string[] = [];
  const notes: string[] = [];
  for (const st of steps) {
    try {
      const r = await st.run();
      results[st.name] = r;
      notes.push(`${st.name}: ${st.summarize ? st.summarize(r as never) : "ok"}`);
    } catch (e) {
      failed.push(`${st.name}: ${shortMessage(e)}`);
      notes.push(`${st.name}: FALHOU (${shortMessage(e)})`);
    }
  }
  const ok = failed.length === 0;
  try {
    await db.insert(jobRuns).values({ id: newId("job"), job, ok, detail: notes.join(" · ").slice(0, 500), durationMs: Date.now() - t0 });
    const old = await db.select({ id: jobRuns.id }).from(jobRuns).where(eq(jobRuns.job, job)).orderBy(desc(jobRuns.createdAt)).offset(KEEP);
    if (old.length) await db.delete(jobRuns).where(inArray(jobRuns.id, old.map((o) => o.id)));
  } catch { /* registrar não pode derrubar a rotina */ }
  return { ok, results, failed };
}

/** Último resultado de cada rotina, com a marca de atraso (sem rodar há mais que o dobro do intervalo esperado). */
export async function jobStatus(db: Database, now = new Date()) {
  const out = [];
  for (const [name, def] of Object.entries(JOBS) as [JobName, (typeof JOBS)[JobName]][]) {
    const [last] = await db.select().from(jobRuns).where(eq(jobRuns.job, name)).orderBy(desc(jobRuns.createdAt)).limit(1);
    const ageMs = last ? now.getTime() - new Date(last.createdAt).getTime() : null;
    out.push({ job: name, label: def.label, lastAt: last?.createdAt ?? null, lastOk: last?.ok ?? null, detail: last?.detail ?? null, late: ageMs === null || ageMs > def.everyMs * 2 });
  }
  return out;
}
