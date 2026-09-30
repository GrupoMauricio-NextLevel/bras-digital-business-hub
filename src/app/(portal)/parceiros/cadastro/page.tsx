import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { requireBrandFeature } from "@/lib/brand-server";
import { getPartnerSettings } from "@/lib/domain/partners";
import { PartnerSignupForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cadastro de parceiro", description: "Crie a sua conta gratuita no Programa de Parceiros SuperDrop.", robots: { index: false } };

export default async function CadastroParceiro() {
  await requireBrandFeature("partners");
  const s = await getPartnerSettings(await getDb());
  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Seja um parceiro</h1>
      <p className="mt-2 text-neutral-600">Cadastro gratuito. Seus links e cupons ficam prontos assim que você entrar.</p>
      <PartnerSignupForm termsVersion={s.termsVersion} />
      <p className="mt-6 text-sm text-neutral-600">Já é parceiro? <Link href="/login" className="font-semibold underline">Entrar</Link></p>
    </div>
  );
}
