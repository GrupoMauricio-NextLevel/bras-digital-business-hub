"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession, setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { rateLimit } from "@/lib/rate-limit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { setBrasMemberStatus, signupBrasMember, type brasSignupSchema } from "@/lib/domain/bras/membros";
import { addBrasVideo, moveBrasVideo, removeBrasVideo, setBrasVideoActive, type brasVideoSchema } from "@/lib/domain/bras/videos";

/** Cadastro grátis do membro comprador da Brás (D91): só no endereço da Brás com o cadastro aberto. Libera na hora. */
export async function brasSignupAction(input: z.input<typeof brasSignupSchema>) {
  const r = await runAction(async () => {
    const brand = await getBrand();
    if (!isClosedCommerceBrand(brand) || !brand.signupOpen) throw new DomainError("CLOSED", "O cadastro não está aberto neste endereço.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`bras-signup:${ip}`, 8, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const created = await signupBrasMember(await getDb(), input);
    await setSessionCookie(created.userId);
    return { ok: true as const };
  });
  if (r.ok) {
    const office = (await getBrand()).officeUrl;
    redirect(office ? `${office}/login?conta=criada` : "/meu-bras?bem-vindo=1");
  }
  return r;
}

async function master() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = () => { revalidatePath("/master/bras", "layout"); revalidatePath("/"); revalidatePath("/meu-bras", "layout"); };

export async function setBrasMemberStatusAction(memberId: string, status: "ACTIVE" | "BLOCKED", reason?: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasMemberStatus(db, actor, memberId, status, reason); refresh(); return r; });
}

export async function addBrasVideoAction(input: z.input<typeof brasVideoSchema>) {
  return runAction(async () => { const { actor, db } = await master(); const r = await addBrasVideo(db, actor, input); refresh(); return r; });
}

export async function setBrasVideoActiveAction(id: string, active: boolean) {
  return runAction(async () => { const { actor, db } = await master(); const r = await setBrasVideoActive(db, actor, id, active); refresh(); return r; });
}

export async function moveBrasVideoAction(id: string, dir: "up" | "down") {
  return runAction(async () => { const { actor, db } = await master(); const r = await moveBrasVideo(db, actor, id, dir); refresh(); return r; });
}

export async function removeBrasVideoAction(id: string) {
  return runAction(async () => { const { actor, db } = await master(); const r = await removeBrasVideo(db, actor, id); refresh(); return r; });
}
