import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { BrasTerms } from "@/components/portal/bras/legal";
import { GroupTerms } from "@/components/portal/legal-grupo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Termos de uso" };

/**
 * Termos de uso (D148): um texto único do Grupo NextLevel em todas as marcas. A Brás Digital segue com o texto próprio (aceite
 * versionado, D99) até a unificação; marca "em breve" não tem página.
 */
export default async function Page() {
  const brand = await getBrand();
  if (brand.soon) notFound();
  if (isClosedCommerceBrand(brand)) return <BrasTerms />;
  return <GroupTerms marca={brand.code === "NEXTLEVEL" ? "NextLevel Soluções Digitais" : brand.name} />;
}
