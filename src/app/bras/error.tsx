"use client";
import { ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

/** Estado de erro das cascas Brás: mensagem simples, sem detalhe técnico. */
export default function BrasError({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-lg p-8"><ErrorState title="Não foi possível abrir esta área" description="Tente de novo em instantes." action={<Button onClick={reset}>Tentar novamente</Button>} /></div>;
}
