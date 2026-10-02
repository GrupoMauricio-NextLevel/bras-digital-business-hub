import type { Instrumentation } from "next";

/** Erros do servidor viram uma linha no painel de erros do Master (mascarada e agrupada). Nunca lança. */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  try {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { getDb } = await import("@/db/client");
    const { recordError } = await import("@/lib/domain/error-log");
    const message = err instanceof Error ? err.message : String(err);
    await recordError(await getDb(), { origin: "SERVER", route: request.path, message, stack: err instanceof Error ? err.stack : null });
  } catch { /* nunca atrapalhar a resposta */ }
};
