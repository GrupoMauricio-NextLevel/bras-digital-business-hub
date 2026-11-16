import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { BrasPrivacy } from "@/components/portal/bras/legal";
import { GroupPrivacy } from "@/components/portal/legal-grupo";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/privacidade", { title: "Política de privacidade" });

/**
 * Política de privacidade (D148): um texto único do Grupo NextLevel em todas as marcas. A Brás Digital segue com o texto próprio (aceite
 * versionado, D99) até a unificação; marca "em breve" não tem página.
 */
export default async function Page() {
  const brand = await getBrand();
  if (brand.soon) notFound();
  if (isClosedCommerceBrand(brand)) return <BrasPrivacy />;
  return <GroupPrivacy marca={brand.code === "NEXTLEVEL" ? "NextLevel Business" : brand.name} />;
}
