import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { getBrand, requireBrandFeature } from "@/lib/brand-server";
import { PartnerShell } from "@/components/auth/partner-shell";
import { LoginForm } from "@/app/login/login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar como parceiro", robots: { index: false } };

export default async function EntrarParceiro() {
  await requireBrandFeature("partners");
  const session = await getSession();
  if (session) redirect(homeFor(session.user.role));
  const brand = await getBrand();
  return (
    <PartnerShell program={`Parceiros ${brand.name}`} title="Entre no escritório do parceiro" intro="Links, cupons e comissões em um só lugar.">
      <LoginForm />
      <p className="mt-8 text-sm text-neutral-700">Ainda não é parceiro? <Link href="/parceiros/cadastro" className="font-semibold text-neutral-950 underline underline-offset-2">Criar conta</Link></p>
    </PartnerShell>
  );
}
