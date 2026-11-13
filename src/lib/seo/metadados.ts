import type { Metadata } from "next";
import { getBrand } from "@/lib/brand-server";
import { ogImageFor } from "@/lib/og-marca";
import { metadadosCommerce } from "./paginas";

/**
 * Metadados de uma página pública (D293): na NextLevel Commerce vêm da tabela central `src/lib/seo/paginas.ts`; nas
 * outras marcas, o que a página já usava (`outraMarca`).
 */
export async function metadadosDaPagina(caminho: string, outraMarca: Metadata = {}): Promise<Metadata> {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE") return outraMarca;
  return metadadosCommerce(caminho, ogImageFor(brand));
}
