import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { getBrand, requireBrandFeature } from "@/lib/brand-server";
import { getPartnerSettings } from "@/lib/domain/partners";
import { PartnerShell } from "@/components/auth/partner-shell";
import { PartnerSignupForm } from "./form";
import { CandidaturaEc } from "./candidatura-ec";
import { PERFIL_LISTA, type PerfilCaptacao } from "@/lib/finance/captacao-regras";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cadastro de parceiro", description: "Crie a sua conta gratuita no Programa de Parceiros.", robots: { index: false } };

export default async function CadastroParceiro({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  await requireBrandFeature("partners");
  const brand = await getBrand();
  const s = await getPartnerSettings(await getDb());
  const pedido = (await searchParams).perfil;
  const ec = brand.code === "NEXTLEVEL_COMMERCE";
  const perfil = (PERFIL_LISTA as readonly string[]).includes(pedido ?? "") ? (pedido as PerfilCaptacao) : "criador";
  return (
    <PartnerShell tech={brand.code === "NEXTLEVEL_COMMERCE"} photo={brand.code === "SUPERDROP" ? { src: "/portal/superdrop/v3/pa-parceiros-hero.webp", position: "50% 35%" } : undefined} program={`Parceiros ${brand.name}`} title="Crie sua conta de parceiro" intro={ec ? "Cadastro gratuito em 4 passos. O seu link fica pronto assim que você entrar." : "Cadastro gratuito. Seus links e cupons ficam prontos assim que você entrar."}>
      {ec ? <CandidaturaEc termsVersion={s.termsVersion} inicial={perfil} /> : <PartnerSignupForm termsVersion={s.termsVersion} />}
      <p className="mt-8 text-sm text-body">Já é parceiro? <Link href="/parceiros/entrar" className="font-semibold text-foreground underline underline-offset-2">Entrar</Link></p>
    </PartnerShell>
  );
}
