import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBrandFeature } from "@/lib/brand-server";
import { ParceirosEc } from "@/components/portal/commerce/parceiros/parceiros-ec";
import { PERFIS } from "@/lib/finance/captacao-regras";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/parceiros/criadores", { title: { absolute: "Parceiros criadores: ganhe indicando a NextLevel Commerce" }, description: PERFIS.criador.titulo, alternates: { canonical: "/parceiros/criadores" } });

/** Subpágina de captação por perfil (D252): mesma página, com o perfil já escolhido. Só na Commerce. */
export default async function Page() {
  const brand = await requireBrandFeature("partners");
  if (brand.code !== "NEXTLEVEL_COMMERCE") redirect("/parceiros");
  return <ParceirosEc brand={brand} perfil="criador" />;
}
