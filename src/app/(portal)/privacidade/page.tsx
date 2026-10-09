import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { BrasPrivacy } from "@/components/portal/bras/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Política de privacidade", robots: { index: false, follow: false } };

/** Política de privacidade da Brás Digital (D99). Só no endereço da Brás aberta; nas outras marcas, 404. */
export default async function Page() {
  const brand = await getBrand();
  if (!isClosedCommerceBrand(brand) || brand.soon) notFound();
  return <BrasPrivacy />;
}
