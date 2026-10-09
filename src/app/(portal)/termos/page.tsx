import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { BrasTerms } from "@/components/portal/bras/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Termos de uso", robots: { index: false, follow: false } };

/** Termos de uso da Brás Digital (D99). Só no endereço da Brás aberta; nas outras marcas, 404. */
export default async function Page() {
  const brand = await getBrand();
  if (!isClosedCommerceBrand(brand) || brand.soon) notFound();
  return <BrasTerms />;
}
