import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { TemasNuvemshop } from "@/components/portal/commerce/temas-nuvemshop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "NextLevel Temas para Nuvemshop | Layout personalizado para a sua loja",
  description: "Layout personalizado para a sua loja Nuvemshop, sem trocar de plataforma: lojas que a NextLevel criou, o racional de cada uma, direção visual para semijoias e diagnóstico gratuito.",
  alternates: { canonical: "/temas-nuvemshop" },
  openGraph: { title: "NextLevel Temas para Nuvemshop", description: "A sua loja com cara de marca, sem trocar de plataforma." },
};

/** NextLevel Temas para Nuvemshop (D282): serviço da agência; hoje só no site da Commerce, depois em Soluções. */
export default async function TemasNuvemshopPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  return <TemasNuvemshop whatsapp={supportContacts().whatsappUrl ?? null} />;
}
