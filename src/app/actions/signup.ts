"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { setSessionCookie } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { eq } from "drizzle-orm";
import { stores } from "@/db/schema";
import { diasDeTeste, findUsableCoupon, signupMember, type signupSchema } from "@/lib/domain/store-access";
import { emails, sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/base-url";
import { getBrand } from "@/lib/brand-server";
import { brandHas } from "@/lib/brand";
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
    const brand = await getBrand();
    // NB1 (D304): o caminho Site só vale com o NextLevel Business ligado e na Commerce; senão, loja como sempre.
    const { businessLigado } = await import("@/lib/business/modulos");
    const formato = input.formato === "SITE" && businessLigado() && brand.code === "NEXTLEVEL_COMMERCE" ? "SITE" as const : "LOJA" as const;
    const created = await signupMember(await getDb(), { ...input, formato, ref, brand: brand.code, independent: !brandHas(brand, "dropship") });
    await setSessionCookie(created.userId);
    const db = await getDb();
    // TR3 (D294): de onde veio quem criou a loja (anúncio, Instagram, Google…), para o Comercial e o retorno às plataformas.
    const { registrarOrigemDaVisita } = await import("@/lib/trafego/lead-na-sessao");
    await registrarOrigemDaVisita(db, { chave: `loja:${created.storeId}`, brand: brand.code, via: "CADASTRO", pagina: "/cadastro" });
    // Dias de teste que esta loja realmente recebeu (porta de entrada, cupom ou plano): o e-mail não promete um número fixo.
    const loja = await db.query.stores.findFirst({ where: eq(stores.id, created.storeId), columns: { trialEndsAt: true } });
    const m = emails.welcomeStore(input.storeName, `${await getBaseUrl()}/merchant`, created.trial ? diasDeTeste(loja?.trialEndsAt ?? null) : 0);
    await sendEmail(db, { kind: "WELCOME_STORE", to: input.email.toLowerCase(), brand: brand.code, ...m });
    return { ok: true as const };
  });
  if (r.ok) {
    // Com endereço de painéis separado, a sessão não vale lá: leva ao login do escritório com o aviso de conta criada.
    const office = (await getBrand()).officeUrl;
    redirect(office ? `${office}/login?conta=criada` : "/merchant");
  }
  return r;
}
