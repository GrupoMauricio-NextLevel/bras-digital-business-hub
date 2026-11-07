import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBrandFeature } from "@/lib/brand-server";
import { ComissoesEc } from "@/components/portal/commerce/parceiros/comissoes-ec";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Comissões e bônus por produção: Programa de Parceiros da NextLevel E-commerce" }, description: "Comissão em toda mensalidade enquanto o lojista pagar, bônus por produção na semana e no mês, garantia, saque por Pix sem nota fiscal: a regra completa, com os números de hoje.", alternates: { canonical: "/parceiros/comissoes" } };

/** Página pública de comissões e bônus (D272, pedido do dono). Só na E-commerce. */
export default async function Page() {
  const brand = await requireBrandFeature("partners");
  if (brand.code !== "NEXTLEVEL_COMMERCE") redirect("/parceiros");
  return <ComissoesEc />;
}
