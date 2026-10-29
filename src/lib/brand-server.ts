import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { groupLinkFor } from "@/lib/host-routing";
import { MASTER_MARCA_COOKIE, ehMarcaMaster, marcasAtivasNoMaster, type MarcaMaster } from "@/lib/master-marca";
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
 * `marca=todas` na URL mostra todas; um código de marca mostra só aquela. No Master central, sem nada na URL, vale a marca
 * escolhida no seletor do topo (R2).
 */
export async function masterBrandFilter(raw: string | undefined): Promise<BrandCode | undefined> {
  // D218: marca fechada no Master nunca aparece. Com um negócio só aberto, toda lista fica presa nele.
  const abertas = marcasAtivasNoMaster();
  if (abertas.length === 1 && (await marcaDoMaster()) === abertas[0]) return abertas[0];
  if (raw === "todas") return undefined;
  if (raw && isBrandCode(raw)) return (abertas as readonly string[]).includes(raw) ? raw : ((await marcaDoMaster()) ?? undefined);
  const h = await headers();
  const preview = brandPreviewAllowed() ? (await cookies()).get(BRAND_PREVIEW_COOKIE)?.value : undefined;
  if (isBrandCode(preview)) return preview;
  const code = brandOfHostStrict(h.get("x-forwarded-host") ?? h.get("host"))?.code;
  // No endereço do Master central (holding) a visão padrão é a do seletor; sem escolha, todos os produtos.
  if (code === HOLDING_CODE || !code) return (await marcaDoMaster()) ?? undefined;
  return code;
}

/** Marca escolhida no seletor do Master (R2), ou nula para "todas". */
export async function marcaDoMaster(): Promise<MarcaMaster | null> {
  // Com uma marca só aberta (D200), o Master fica sempre nela, sem seletor.
  const ativas = marcasAtivasNoMaster();
  if (ativas.length === 1) return ativas[0]!;
  const v = (await cookies()).get(MASTER_MARCA_COOKIE)?.value;
  return ehMarcaMaster(v) && ativas.includes(v) ? v : null;
}

/** Leva ao início quando a marca do endereço não tem o recurso (evita páginas de outra marca em domínio errado). */
export async function requireBrandFeature(feature: "dropship" | "partners" | "signup"): Promise<Brand> {
  const brand = await getBrand();
  const ok = feature === "dropship" ? brand.modules.includes("dropship") : feature === "partners" ? brand.partnersOpen : brand.signupOpen;
  if (!ok) redirect(feature === "signup" ? "/quero-minha-loja" : "/");
  return brand;
}

/**
 * Escritório da E-commerce (D205): com só a E-commerce aberta no Master, as telas antigas que viraram duplicadas levam
 * direto para a área nova. Com mais marcas abertas, cada tela volta a abrir normalmente.
 */
export async function levarAoEscritorio(destino: string): Promise<void> {
  if (marcasAtivasNoMaster().length === 1 && (await marcaDoMaster()) === "NEXTLEVEL_COMMERCE") redirect(destino);
}
