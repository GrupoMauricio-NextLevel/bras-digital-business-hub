import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { brandForHost, type Brand } from "@/lib/brand";

/** Marca do endereço da requisição atual (só em servidor). */
export async function getBrand(): Promise<Brand> {
  const h = await headers();
  return brandForHost(h.get("x-forwarded-host") ?? h.get("host"));
}

/** Leva ao início quando a marca do endereço não tem o recurso (evita páginas de outra marca em domínio errado). */
export async function requireBrandFeature(feature: "dropship" | "partners" | "signup"): Promise<Brand> {
  const brand = await getBrand();
  const ok = feature === "dropship" ? brand.modules.includes("dropship") : feature === "partners" ? brand.partnersOpen : brand.signupOpen;
  if (!ok) redirect(feature === "signup" ? "/quero-minha-loja" : "/");
  return brand;
}
