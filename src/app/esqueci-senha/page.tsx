import type { Metadata } from "next";
import { FioCaptacao } from "@/components/ecossistema/fio-captacao";
import Link from "next/link";
import { LogoDoEndereco } from "@/components/brand/logo-do-endereco";
import { getBrand } from "@/lib/brand-server";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { ForgotForm } from "./forgot-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Esqueci a minha senha", robots: { index: false } };

export default async function EsqueciSenha() {
  const brand = await getBrand();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" aria-label={`${brand.name}, página inicial`}><LogoDoEndereco /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Recuperar a senha</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Informe o e-mail da sua conta. Enviamos um link para criar uma nova senha.</p>
      <div className="mt-6"><FioCaptacao brandCode={brand.code} /></div>
      <ForgotForm />
      <p className="mt-4 text-center text-sm text-muted-foreground"><Link href="/login" className="font-semibold underline">Voltar ao login</Link></p>
      <NextLevelSignature compact product={brand.name} className="mt-8 justify-center text-center text-muted-foreground" />
    </main>
  );
}
