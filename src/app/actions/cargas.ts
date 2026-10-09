"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { runAction } from "@/lib/action-result";
import { getBrand } from "@/lib/brand-server";
import { DomainError } from "@/lib/domain/errors";
import { registerCargasInterest, type CargasInterestInput } from "@/lib/domain/cargas/interesse";
import { rateLimit } from "@/lib/rate-limit";

/** Interesse na NextLevel Cargas (D108): só no endereço da marca; vai para o CRM do Master (Interessados). */
export async function cargasInterestAction(input: CargasInterestInput) {
  return runAction(async () => {
    const brand = await getBrand();
    if (brand.code !== "NEXTLEVEL_CARGAS") throw new DomainError("BRAND", "Cadastro disponível no endereço da NextLevel Cargas.");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`cargas:${ip}`, 6, 60 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas. Tente de novo em alguns minutos.");
    const ref = (await cookies()).get("nl-ref")?.value;
    const r = await registerCargasInterest(await getDb(), input, ref);
    revalidatePath("/master/crm");
    return { created: r.created };
  });
}
