import { metadadosDaPagina } from "@/lib/seo/metadados";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brand-server";
import { isClosedCommerceBrand } from "@/lib/brand";
import { BrasTerms } from "@/components/portal/bras/legal";
import { GroupTerms } from "@/components/portal/legal-grupo";
import { TermosView } from "@/components/contratos/termos-view";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Promise<Metadata> => metadadosDaPagina("/termos", { title: "Termos de uso" });

/**
 * Termos de uso (D148): um texto único do Grupo NextLevel em todas as marcas. A Brás Digital segue com o texto próprio (aceite
 * versionado, D99) até a unificação; marca "em breve" não tem página.
 */
export default async function Page() {
  const brand = await getBrand();
  if (brand.soon) notFound();
  if (isClosedCommerceBrand(brand)) return <BrasTerms />;
  // NextLevel Commerce (D279): o mesmo texto que o lojista aceita no painel.
  if (brand.code === "NEXTLEVEL_COMMERCE") return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="mb-6 text-3xl font-extrabold tracking-tight">Termos de uso</h1><TermosView /><p className="mt-6 text-sm">Veja também a <a className="underline" href="/privacidade">Política de privacidade</a>.</p></main>;
  return <GroupTerms marca={brand.code === "NEXTLEVEL" ? "NextLevel Business" : brand.name} />;
}
