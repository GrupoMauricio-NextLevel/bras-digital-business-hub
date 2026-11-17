"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { brandOfHostStrict } from "@/lib/brand";
import { BRAND_PREVIEW_COOKIE } from "@/lib/brand-server";
import { ForbiddenError } from "@/lib/domain/errors";
import { switchProfile } from "@/lib/domain/conta-grupo";
import { conectarAoBusiness, destinoDaSolucao, type conexaoSchema } from "@/lib/agencias/solucoes";

/** Soluções NextLevel da agência (D323). Fora do modo suporte: a equipe NextLevel nunca conecta nem troca pelo cliente. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  if (s.support) throw new ForbiddenError("No modo suporte não dá para conectar soluções pelo cliente.");
  return { s, db: await getDb() };
}

export async function conectarAoBusinessAction(input: z.input<typeof conexaoSchema>) {
  return runAction(async () => { const { s, db } = await ctx(); const r = await conectarAoBusiness(db, s.actor, input); revalidatePath("/agencia/solucoes"); return { conectada: !!r.storeId }; });
}

/** Abre a solução no painel do negócio: troca para o perfil ligado (sem novo login) e vai direto à tela. */
export async function abrirSolucaoAction(destino: string) {
  return runAction(async () => {
    const { s, db } = await ctx();
    const { perfilId, caminho } = await destinoDaSolucao(db, s.actor, destino);
    const h = await headers();
    const preview = !!(await cookies()).get(BRAND_PREVIEW_COOKIE)?.value;
    const r = await switchProfile(db, s.actor, perfilId, preview ? null : brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host")));
    if (r.kind === "SESSION") { await setSessionCookie(r.userId); return { redirectTo: caminho }; }
    return { redirectTo: r.url };
  });
}
