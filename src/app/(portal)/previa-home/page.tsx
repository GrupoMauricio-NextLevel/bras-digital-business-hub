import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { brandHas } from "@/lib/brand";
import { HomeImersivaEc } from "@/components/portal/commerce/imersiva/home-imersiva";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prévia da home imersiva", robots: { index: false, follow: false } };

/**
 * Prévia da home imersiva da NextLevel E-commerce (branch de revisão). Só existe com EC_HOME_IMERSIVA_PREVIA=true e só no
 * endereço da E-commerce; a home "/" continua a atual. Fotos provisórias: não ligar em produção antes da troca.
 */
export default async function PreviaHomeImersiva() {
  if (process.env.EC_HOME_IMERSIVA_PREVIA !== "true") notFound();
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brandHas(brand, "dropship")) notFound();
  return (
    <>
      <p role="note" className="eci-aviso px-4 py-2 text-center">Prévia para revisão: as fotos são provisórias e esta página não está publicada. <Link href="/">Ver a home atual</Link></p>
      <HomeImersivaEc brand={brand} />
    </>
  );
}
