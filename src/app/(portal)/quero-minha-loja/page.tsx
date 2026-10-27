import { BlocoEquipe } from "@/components/portal/equipe/blocos";
import type { Metadata } from "next";
import Link from "next/link";
import { getBrand } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return { title: "Quero minha loja", description: `Deixe seus dados e a equipe da ${brand.name} ajuda você a abrir a sua loja virtual.` };
}

export default async function QueroMinhaLoja() {
  const brand = await getBrand();
  const c = supportContacts();
  return (
    <>
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">{brand.soon ? brand.soon.leadTitle : "Quero minha loja"}</h1>
      <p className="mt-2 text-muted-foreground">{brand.soon ? `O ${brand.name} ainda está sendo construído. Conte um pouco sobre o seu negócio e a equipe avisa quando abrir.` : `Conte um pouco sobre o seu negócio. A equipe da ${brand.name} fala com você pelo WhatsApp para combinar a implantação.`}</p>
      <LeadForm brandName={brand.name} accent={brand.primaryColor} />
      <p className="mt-6 text-sm text-muted-foreground">Prefere conversar agora? {c.whatsappUrl ? <a className="font-semibold underline" href={c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero abrir a minha loja na ${brand.name}.`)}`)} target="_blank" rel="noreferrer">Chame no WhatsApp</a> : c.email ? <a className="font-semibold underline" href={`mailto:${c.email}`}>{c.email}</a> : "Fale com a equipe pelos canais do rodapé."} Já tem conta? <Link href="/login" className="font-semibold underline">Entrar</Link></p>
    </div>
    {brand.soon ? null : <BlocoEquipe lugar="quero-minha-loja" className="bg-surface" />}
    </>
  );
}
