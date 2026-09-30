"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { findUsableCoupon, signupMember, type signupSchema } from "@/lib/domain/store-access";
import type { z } from "zod";

/** Confere o cupom antes de enviar o formulário (mostra de quem é). */
export async function checkCouponAction(code: string) {
  return runAction(async () => { const c = await findUsableCoupon(await getDb(), code); return { trialDays: c.trialDays }; });
}

/** Cadastro público: cria a loja, inicia o teste e entra direto no painel. */
export async function signupAction(input: z.input<typeof signupSchema>) {
  const r = await runAction(async () => {
    // Sem ?ref= na URL, vale o último link do parceiro guardado no cookie (30 dias).
    const ref = input.ref || (await cookies()).get("nl-ref")?.value;
    const created = await signupMember(await getDb(), { ...input, ref });
    await setSessionCookie(created.userId);
    return { ok: true as const };
  });
  if (r.ok) redirect("/merchant");
  return r;
}
