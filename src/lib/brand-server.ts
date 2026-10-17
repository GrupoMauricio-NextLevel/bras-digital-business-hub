import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { groupLinkFor } from "@/lib/host-routing";
import { HOLDING_CODE, brandByCode, brandForHost, brandOfHostStrict, brandPreviewAllowed, isBrandCode, type Brand, type BrandCode } from "@/lib/brand";

/** Cookie do modo prévia: `/lojas` liga a NextLevel E-commerce num endereço que ainda não é dela. Só na demonstração (D149). */
export const BRAND_PREVIEW_COOKIE = "nl-brand";

/** Link para uma página do grupo (Soluções, Loja NextLevel) visto do endereço atual: relativo no grupo e em endereço técnico; nas marcas, o do site do grupo (D149). */
export async function groupLink(path: string): Promise<string> {
  const h = await headers();
  return groupLinkFor(path, brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"))?.code);
}

/** Marca do endereço da requisição atual (só em servidor). */
export async function getBrand(): Promise<Brand> {
  const h = await headers();
  const brand = brandForHost(h.get("x-forwarded-host") ?? h.get("host"));
  // Só o endereço da marca padrão aceita a prévia; o endereço próprio de cada marca sempre manda.
  if (brand.code === "SUPERDROP" && brandPreviewAllowed() && (await cookies()).get(BRAND_PREVIEW_COOKIE)?.value === "NEXTLEVEL_COMMERCE") return brandByCode("NEXTLEVEL_COMMERCE");
  return brand;
}

/**
 * Marca padrão dos filtros do Master: a do endereço oficial (ou da prévia). Em endereço técnico ou localhost não filtra.
 * `marca=todas` na URL mostra todas; um código de marca mostra só aquela.
 */
export async function masterBrandFilter(raw: string | undefined): Promise<BrandCode | undefined> {
  if (raw === "todas") return undefined;
  if (raw && isBrandCode(raw)) return raw;
  const h = await headers();
  const preview = brandPreviewAllowed() ? (await cookies()).get(BRAND_PREVIEW_COOKIE)?.value : undefined;
  if (isBrandCode(preview)) return preview;
  const code = brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"))?.code;
  // No endereço do Master central (holding) a visão padrão é a de todos os produtos.
  return code === HOLDING_CODE ? undefined : code;
}

/** Leva ao início quando a marca do endereço não tem o recurso (evita páginas de outra marca em domínio errado). */
export async function requireBrandFeature(feature: "dropship" | "partners" | "signup"): Promise<Brand> {
  const brand = await getBrand();
  const ok = feature === "dropship" ? brand.modules.includes("dropship") : feature === "partners" ? brand.partnersOpen : brand.signupOpen;
  if (!ok) redirect(feature === "signup" ? "/quero-minha-loja" : "/");
  return brand;
}
