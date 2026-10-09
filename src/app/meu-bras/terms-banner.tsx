"use client";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptBrasTermsAction } from "@/app/actions/bras";

/** Aviso para o membro aceitar a versão atual dos termos e da política (cadastro anterior a eles ou versão nova, D99). */
export function TermsBanner() {
  const [pending, start] = React.useTransition();
  return (
    <div role="region" aria-label="Aceite dos termos" className="flex flex-wrap items-center gap-3 border-b border-warning/40 bg-warning-soft px-4 py-2.5 text-sm text-foreground">
      <FileCheck2 className="size-4 shrink-0 text-warning" aria-hidden />
      <span className="min-w-0 flex-1">Publicamos os <Link href="/termos" target="_blank" className="font-semibold underline">termos de uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold underline">política de privacidade</Link> da Brás Digital. Leia e aceite para continuar usando a área do cliente.</span>
      <Button size="sm" loading={pending} onClick={() => start(async () => { const r = await acceptBrasTermsAction(); if (r.ok) toast.success("Obrigado! Aceite registrado."); else toast.error(r.error); })}>Li e aceito</Button>
    </div>
  );
}
