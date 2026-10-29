"use server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { rateLimit } from "@/lib/rate-limit";
import { enviarAjuda, verAjuda } from "@/lib/domain/ajuda-lojista";

/** Ajuda do lojista (D201): conversa com a equipe NextLevel dentro do painel. */
async function ator() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return s.actor;
}
export async function verAjudaAction(depoisDe?: string | null) {
  return runAction(async () => verAjuda(await getDb(), await ator(), depoisDe));
}
export async function enviarAjudaAction(texto: string, depoisDe?: string | null) {
  return runAction(async () => {
    const a = await ator();
    if (!rateLimit(`ajuda:${a.userId}`, 60, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas mensagens seguidas. Aguarde a resposta da equipe.");
    return enviarAjuda(await getDb(), a, texto, depoisDe);
  });
}
