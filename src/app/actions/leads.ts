"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { getBrand } from "@/lib/brand-server";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { createBrandLead, updateBrandLead, type leadSchema } from "@/lib/domain/brand-leads";
import { rateLimit } from "@/lib/rate-limit";
import { registrarOrigemDaVisita } from "@/lib/trafego/lead-na-sessao";

/** Pedido público "quero minha loja": a marca vem do endereço, nunca do formulário. */
export async function submitLeadAction(input: Omit<z.input<typeof leadSchema>, "brand" | "affiliateRef">) {
  return runAction(async () => {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`lead:${ip}`, 6, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const brand = await getBrand();
    const ref = (await cookies()).get("nl-ref")?.value;
    const db = await getDb();
    const r = await createBrandLead(db, { ...input, brand: brand.code, affiliateRef: ref });
    await registrarOrigemDaVisita(db, { chave: `interessado:${r.id}`, brand: brand.code, via: "FORMULARIO" });
    revalidatePath("/master/crm");
    return { created: r.created, eventoId: `interessado:${r.id}` };
  });
}

export async function updateLeadAction(id: string, patch: { status?: "NEW" | "CONTACTED" | "WON" | "LOST"; notes?: string }) {
  return runAction(async () => {
    const s = await getSession();
    if (!s) throw new ForbiddenError("Sessão expirada.");
    await updateBrandLead(await getDb(), s.actor, id, patch);
    revalidatePath("/master/crm");
    revalidatePath("/commerce/leads");
    revalidatePath("/commerce");
    return undefined;
  });
}

/** Janela de resgate na saída (D280): só e-mail e consentimento. */
export async function capturarLeadSaidaAction(input: { email: string; consent: boolean; pagina: string }) {
  return runAction(async () => {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`lead-saida:${ip}`, 6, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const brand = await getBrand();
    const ref = (await cookies()).get("nl-ref")?.value;
    const cadastro = `${brand.baseUrl.replace(/\/$/, "")}${brand.signupOpen ? "/cadastro" : "/quero-minha-loja"}`;
    const { capturarLeadSaida } = await import("@/lib/domain/brand-leads");
    const db = await getDb();
    const r = await capturarLeadSaida(db, { brand: brand.code, email: input.email, consent: input.consent as true, pagina: input.pagina, affiliateRef: ref }, cadastro);
    await registrarOrigemDaVisita(db, { chave: `interessado:${r.id}`, brand: brand.code, via: "SAIDA", pagina: input.pagina });
    revalidatePath("/master/crm");
    return { eventoId: `interessado:${r.id}` };
  });
}
