"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { brandOfHostStrict } from "@/lib/brand";
import { BRAND_PREVIEW_COOKIE } from "@/lib/brand-server";
import { rateLimit } from "@/lib/rate-limit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { linkProfile, switchProfile, unlinkProfile, type linkSchema } from "@/lib/domain/conta-grupo";

/** Conta do grupo (D141). Nada disso vale em modo suporte: a equipe NextLevel nunca troca de perfil pelo cliente. */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  if (s.support) throw new ForbiddenError("No modo suporte não dá para mexer na conta do grupo do cliente.");
  return { s, db: await getDb() };
}

export async function linkProfileAction(input: z.input<typeof linkSchema>) {
  return runAction(async () => {
    const { s, db } = await ctx();
    if (!rateLimit(`group-link:${s.user.id}`, 5, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Aguarde alguns minutos.");
    const r = await linkProfile(db, s.actor, input);
    revalidatePath("/account/marcas");
    return r;
  });
}

export async function unlinkProfileAction(profileId: string) {
  return runAction(async () => { const { s, db } = await ctx(); const r = await unlinkProfile(db, s.actor, profileId); revalidatePath("/account/marcas"); return r; });
}

/** Troca de perfil: no mesmo endereço troca a sessão; em outra marca devolve o endereço de passagem (uso único). */
export async function switchProfileAction(profileId: string) {
  return runAction(async () => {
    const { s, db } = await ctx();
    const h = await headers();
    const preview = !!(await cookies()).get(BRAND_PREVIEW_COOKIE)?.value;
    const r = await switchProfile(db, s.actor, profileId, preview ? null : brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host")));
    if (r.kind === "SESSION") { await setSessionCookie(r.userId); return { redirectTo: r.home }; }
    return { redirectTo: r.url };
  });
}
