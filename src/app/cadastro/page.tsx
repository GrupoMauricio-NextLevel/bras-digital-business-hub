import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Teste grátis por 7 dias", description: "Crie sua loja com o cupom do seu fornecedor e teste tudo por 7 dias, sem cartão." };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ cupom?: string }> }) {
  const { cupom } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <Logo className="mx-auto h-9" />
      <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">Teste grátis por 7 dias</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">Sem cartão. Todas as funcionalidades liberadas. Depois do teste, o acesso é pausado até o pagamento por Pix.</p>
      <SignupForm initialCode={(cupom ?? "").toUpperCase().slice(0, 24)} />
    </main>
  );
}
