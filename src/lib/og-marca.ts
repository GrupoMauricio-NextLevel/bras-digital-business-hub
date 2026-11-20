import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Brand, BrandCode } from "@/lib/brand";

/**
 * Prévia de link (WhatsApp, redes) de cada marca: a arte da própria marca quando existe; senão, um cartão gerado com
 * o nome, a frase e a cor da marca (`/og/<marca>.png`). Nunca a arte de outra marca (antes, todo endereço usava a do SuperDrop).
 */
const ARTE: Partial<Record<BrandCode, string[]>> = {
  // NextLevel Commerce (D163): logo Prisma escura do pacote sobre o marinho (a arte v3 tinha a logo antiga).
  NEXTLEVEL_COMMERCE: ["marcas/nextlevel-ecommerce/og-1200x630.jpg"],
  // NextLevel v2 (D161): cartão social do pacote da marca (achatado sobre o marinho; o PNG original tem transparência).
  NEXTLEVEL: ["marcas/nextlevel/v2/social/og-nextlevel-1200x630.jpg"],
};

export function ogImageFor(brand: Pick<Brand, "code" | "name">): { url: string; width: number; height: number; alt: string } {
  const arte = (ARTE[brand.code] ?? []).find((f) => existsSync(join(process.cwd(), "public", f)));
  return { url: arte ? `/${arte}` : `/og/${brand.code.toLowerCase()}.png`, width: 1200, height: 630, alt: brand.name };
}
