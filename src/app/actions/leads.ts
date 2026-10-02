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

/** Pedido público "quero minha loja": a marca vem do endereço, nunca do formulário. */
export async function submitLeadAction(input: Omit<z.input<typeof leadSchema>, "brand" | "affiliateRef">) {
  return runAction(async () => {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`lead:${ip}`, 6, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const brand = await getBrand();
    const ref = (await cookies()).get("nl-ref")?.value;
    const r = await createBrandLead(await getDb(), { ...input, brand: brand.code, affiliateRef: ref });
    revalidatePath("/master/crm");
    return { created: r.created };
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
