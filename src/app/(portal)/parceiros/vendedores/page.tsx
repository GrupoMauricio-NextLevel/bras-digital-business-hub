import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBrandFeature } from "@/lib/brand-server";
import { ParceirosEc } from "@/components/portal/commerce/parceiros/parceiros-ec";
import { PERFIS } from "@/lib/finance/captacao-regras";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Parceiros vendedores: ganhe indicando a NextLevel E-commerce" }, description: PERFIS.vendedor.titulo, alternates: { canonical: "/parceiros/vendedores" } };

/** Subpágina de captação por perfil (D252): mesma página, com o perfil já escolhido. Só na E-commerce. */
export default async function Page() {
  const brand = await requireBrandFeature("partners");
  if (brand.code !== "NEXTLEVEL_COMMERCE") redirect("/parceiros");
  return <ParceirosEc brand={brand} perfil="vendedor" />;
}
