import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Brand, BrandCode } from "@/lib/brand";

/**
 * Prévia de link (WhatsApp, redes) de cada marca: a arte da própria marca quando existe; senão, um cartão gerado com
 * o nome, a frase e a cor da marca (`/og/<marca>.png`). Nunca a arte de outra marca (antes, todo endereço usava a do SuperDrop).
 */
const ARTE: Partial<Record<BrandCode, string[]>> = {
  SUPERDROP: ["portal/superdrop/v3/sd-og-portal.jpg", "portal/superdrop/v3/sd-og-portal.png", "og/superdrop.png"],
  NEXTLEVEL_COMMERCE: ["portal/commerce/v3/cm-og-portal.jpg", "portal/commerce/v3/cm-og-portal.png"],
  NEXTLEVEL: ["portal/nextlevel/v3/nl-og-solucoes.jpg", "portal/nextlevel/v3/nl-og-solucoes.png"],
  BRAS_DIGITAL: ["portal/bras/v3/bd-og-portal.jpg", "portal/bras/v3/bd-og-portal.png"],
};

export function ogImageFor(brand: Pick<Brand, "code" | "name">): { url: string; width: number; height: number; alt: string } {
  const arte = (ARTE[brand.code] ?? []).find((f) => existsSync(join(process.cwd(), "public", f)));
  return { url: arte ? `/${arte}` : `/og/${brand.code.toLowerCase()}.png`, width: 1200, height: 630, alt: brand.name };
}
