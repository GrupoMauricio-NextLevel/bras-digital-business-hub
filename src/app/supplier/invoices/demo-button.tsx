"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { simulateSupplierOverdueAction } from "@/app/actions/demo";

/** Só aparece no ambiente de demonstração: cria uma fatura vencida para mostrar o aviso e o bloqueio. */
export function OverdueDemoButtons() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const go = (days: number) => start(async () => { await simulateSupplierOverdueAction(days); router.refresh(); });
  return <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm"><span className="text-muted-foreground">Demonstração:</span><Button size="sm" variant="secondary" loading={pending} onClick={() => go(5)}>Fatura vencida há 5 dias</Button><Button size="sm" variant="secondary" loading={pending} onClick={() => go(16)}>Há 16 dias (bloqueio parcial)</Button><Button size="sm" variant="secondary" loading={pending} onClick={() => go(26)}>Há 26 dias (acesso pausado)</Button></div>;
}
