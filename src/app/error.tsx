"use client";
import * as React from "react";
import Link from "next/link";
import { ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

/** Erro inesperado: mensagem simples ao usuário; o detalhe técnico fica só nos logs do servidor. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Avisa o painel de erros do Master (sem dado pessoal; o servidor mascara e limita).
  React.useEffect(() => {
    fetch("/api/errors", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ route: window.location.pathname, message: error.message, digest: error.digest }) }).catch(() => undefined);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg p-8">
      <ErrorState
        title="Não foi possível carregar esta página"
        description="Tivemos um problema temporário. Tente novamente em instantes. Se continuar, volte ao início."
        action={<div className="flex flex-wrap justify-center gap-2"><Button onClick={reset}>Tentar novamente</Button><Link href="/" className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 text-sm">Voltar ao início</Link></div>}
      />
    </div>
  );
}
