import { ZodError } from "zod";
import { DomainError } from "./domain/errors";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; code?: string };

/** Envolve uma server action convertendo erros de domínio/validação em resultado legível. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues.map((i) => i.message).join(", "), code: "VALIDATION" };
    if (e instanceof DomainError) return { ok: false, error: e.message, code: e.code };
    console.error(e);
    return { ok: false, error: "Ocorreu um erro inesperado. Tente novamente." };
  }
}
