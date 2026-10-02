"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setMinOrderAction } from "@/app/actions/price-tiers";

export function MinOrder({ cents }: { cents: number }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [v, setV] = React.useState(cents ? (cents / 100).toFixed(2).replace(".", ",") : "");
  return (
    <form className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await setMinOrderAction(v.trim() ? Math.round(Number(v.replace(",", ".")) * 100) : 0); if (r.ok) { toast.success("Pedido mínimo salvo"); router.refresh(); } else toast.error(r.error); }); }}>
      <label className="text-sm font-medium">Pedido mínimo na loja virtual (R$)<Input className="mt-1 w-40" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="sem mínimo" /></label>
      <Button type="submit" loading={pending}>Salvar</Button>
      <span className="text-xs text-muted-foreground">Vale para compras feitas pelo cliente no site (valor dos produtos, já com cupom). Venda manual sua não é barrada.</span>
    </form>
  );
}
