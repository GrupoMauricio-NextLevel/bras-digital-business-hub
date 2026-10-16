import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { LogoDoEndereco } from "@/components/brand/logo-do-endereco";
import { getBrand } from "@/lib/brand-server";
import { checkResetToken } from "@/lib/domain/password-reset";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

export default async function RedefinirSenha({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await checkResetToken(await getDb(), token);
  const brand = await getBrand();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" aria-label={`${brand.name}, página inicial`}><LogoDoEndereco /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Criar nova senha</h1>
      {valid ? <ResetForm token={token} /> : <p role="alert" className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">Este link expirou ou já foi usado. <Link href="/esqueci-senha" className="font-semibold underline">Peça um novo link</Link>.</p>}
    </main>
  );
}
