import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { getBrand, requireBrandFeature } from "@/lib/brand-server";
import { getPartnerSettings } from "@/lib/domain/partners";
import { PartnerShell } from "@/components/auth/partner-shell";
import { PartnerSignupForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cadastro de parceiro", description: "Crie a sua conta gratuita no Programa de Parceiros.", robots: { index: false } };

export default async function CadastroParceiro() {
  await requireBrandFeature("partners");
  const brand = await getBrand();
  const s = await getPartnerSettings(await getDb());
  return (
    <PartnerShell tech={brand.code === "NEXTLEVEL_COMMERCE"} photo={brand.code === "SUPERDROP" ? { src: "/portal/superdrop/v3/pa-parceiros-hero.webp", position: "50% 35%" } : undefined} program={`Parceiros ${brand.name}`} title="Crie sua conta de parceiro" intro="Cadastro gratuito. Seus links e cupons ficam prontos assim que você entrar.">
      <PartnerSignupForm termsVersion={s.termsVersion} />
      <p className="mt-8 text-sm text-body">Já é parceiro? <Link href="/parceiros/entrar" className="font-semibold text-foreground underline underline-offset-2">Entrar</Link></p>
    </PartnerShell>
  );
}
