import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { RecursosEc } from "@/components/portal/commerce/imersiva/recursos-ec";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recursos", description: "Como funciona a loja virtual da NextLevel E-commerce: cadastro, vitrine, pagamento, envio, personalização, IA e integrações.", alternates: { canonical: "/recursos" } };

/** Recursos (D219): o que saiu da home para ela ficar objetiva. Só na E-commerce. */
export default async function RecursosPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  return <RecursosEc brand={brand} />;
}
