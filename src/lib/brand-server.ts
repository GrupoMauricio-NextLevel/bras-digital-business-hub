import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { brandByCode, brandForHost, type Brand } from "@/lib/brand";

/** Cookie do modo prévia: `/lojas` liga a NextLevel Commerce num endereço que ainda não é dela (ex.: superdrop.com.br). */
export const BRAND_PREVIEW_COOKIE = "nl-brand";

/** Marca do endereço da requisição atual (só em servidor). */
export async function getBrand(): Promise<Brand> {
  const h = await headers();
  const brand = brandForHost(h.get("x-forwarded-host") ?? h.get("host"));
  // Só o endereço da marca padrão aceita a prévia; o endereço próprio de cada marca sempre manda.
  if (brand.code === "SUPERDROP" && (await cookies()).get(BRAND_PREVIEW_COOKIE)?.value === "NEXTLEVEL_COMMERCE") return brandByCode("NEXTLEVEL_COMMERCE");
  return brand;
}

/** Leva ao início quando a marca do endereço não tem o recurso (evita páginas de outra marca em domínio errado). */
export async function requireBrandFeature(feature: "dropship" | "partners" | "signup"): Promise<Brand> {
  const brand = await getBrand();
  const ok = feature === "dropship" ? brand.modules.includes("dropship") : feature === "partners" ? brand.partnersOpen : brand.signupOpen;
  if (!ok) redirect(feature === "signup" ? "/quero-minha-loja" : "/");
  return brand;
}
