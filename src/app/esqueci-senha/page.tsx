import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Esqueci a minha senha", robots: { index: false } };

export default function EsqueciSenha() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" aria-label="SuperDrop, página inicial"><Logo className="mx-auto h-9" /></Link>
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Recuperar a senha</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
      <ForgotForm />
      <p className="mt-4 text-center text-sm text-muted-foreground"><Link href="/login" className="font-semibold underline">Voltar ao login</Link></p>
      <NextLevelSignature compact className="mt-8 justify-center text-center text-muted-foreground" />
    </main>
  );
}
