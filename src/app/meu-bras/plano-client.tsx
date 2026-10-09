"use client";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestBrasPlanUpgradeAction } from "@/app/actions/bras";

/** "Quero este plano": avisa a equipe, que chama pelo WhatsApp do cadastro (a cobrança dos planos ainda é combinada). */
export function PlanRequestButton({ plan, label }: { plan: "PRATA" | "OURO" | "PLATINUM"; label: string }) {
  const [pending, start] = React.useTransition();
  const [done, setDone] = React.useState(false);
  if (done) return <p role="status" className="text-sm font-semibold text-success">Pedido enviado. A equipe chama você no WhatsApp do cadastro.</p>;
  return <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await requestBrasPlanUpgradeAction(plan); if (r.ok) setDone(true); else toast.error(r.error); })}>Quero o {label}</Button>;
}
