import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBrandFeature } from "@/lib/brand-server";
import { ParceirosEc } from "@/components/portal/commerce/parceiros/parceiros-ec";
import { PERFIS } from "@/lib/finance/captacao-regras";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Indique e ganhe pelo CPF: Programa de Indicações da NextLevel E-commerce" }, description: PERFIS.indicacao.titulo, alternates: { canonical: "/parceiros/indique" } };

/** Subpágina de captação por perfil (D252; Programa de Indicações pelo CPF, D263): mesma página, com o perfil já escolhido. Só na E-commerce. */
export default async function Page() {
  const brand = await requireBrandFeature("partners");
  if (brand.code !== "NEXTLEVEL_COMMERCE") redirect("/parceiros");
  return <ParceirosEc brand={brand} perfil="indicacao" />;
}
