import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { getBrand, groupLink } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { ClientesEc } from "@/components/portal/commerce/clientes-ec";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/clientes", {
  title: "Clientes NextLevel | Marcas que a nossa equipe atende",
  description: "Marcas reais que a equipe NextLevel atende, do Brás para o Brasil, e os melhores templates da NextLevel Commerce.",
  alternates: { canonical: "/clientes" },
});

/** Nossos clientes (D283): 100% NextLevel; as lojas são da equipe, sem dizer que rodam na plataforma. */
export default async function ClientesPage() {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) notFound();
  const cadastro = brand.signupOpen ? "/cadastro" : "/quero-minha-loja";
  const pv = await commercePlansView(await getDb());
  const comecar = brand.signupOpen ? (pv.offer?.trialDays ? `Começar ${pv.offer.trialDays} dias grátis` : "Criar minha loja") : "Quero minha loja";
  return <ClientesEc cadastro={cadastro} comecar={comecar} lojaPronta={await groupLink("/loja-nextlevel")} whatsapp={supportContacts().whatsappUrl ?? null} />;
}
