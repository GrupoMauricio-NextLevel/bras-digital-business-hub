import { ZodError } from "zod";
import { DomainError } from "./domain/errors";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; code?: string; /** código curto do erro inesperado, para o usuário informar ao suporte */ ref?: string };

/** Envolve uma server action convertendo erros de domínio/validação em resultado legível. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues.map((i) => i.message).join(", "), code: "VALIDATION" };
    if (e instanceof DomainError) return { ok: false, error: e.message, code: e.code };
    console.error(e);
    const ref = Math.random().toString(36).slice(2, 8).toUpperCase();
    await reportUnexpected(e, ref);
    return { ok: false, error: `Ocorreu um erro inesperado. Tente novamente; se continuar, informe o código ${ref}.`, ref };
  }
}

/** Manda o erro inesperado para o painel de erros do Master, com a loja e o código. Nunca lança (não pode piorar a falha). */
async function reportUnexpected(e: unknown, ref: string): Promise<void> {
  try {
    const [{ getDb }, { recordError }, { headers }, { getSession }] = await Promise.all([import("@/db/client"), import("./domain/error-log"), import("next/headers"), import("./auth")]);
    let route = "ação do servidor"; let storeSlug: string | null = null;
    try {
      const referer = (await headers()).get("referer");
      if (referer) { const path = new URL(referer).pathname; route = path; storeSlug = path.match(/^\/store\/([a-z0-9-]+)/)?.[1] ?? null; }
    } catch { /* fora de uma requisição */ }
    try { storeSlug = storeSlug ?? (await getSession())?.store?.slug ?? null; } catch { /* sem sessão */ }
    await recordError(await getDb(), { origin: "SERVER", route, message: e instanceof Error ? `${e.name}: ${e.message}` : String(e), stack: e instanceof Error ? e.stack : null, context: "ação", storeSlug, ref });
  } catch { /* o registro de erros não pode causar erro */ }
}
