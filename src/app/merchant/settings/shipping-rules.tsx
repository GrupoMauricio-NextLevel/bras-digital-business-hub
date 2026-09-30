"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { saveShippingConfigAction } from "@/app/actions/merchant";
import type { ShippingConfig } from "@/lib/shipping/quote";

const toReais = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2).replace(".", ","));
const toCents = (s: string) => { const n = Number(s.replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) && s.trim() !== "" ? Math.round(n * 100) : null; };

/** Regras que a loja controla sobre o frete: grátis a partir de, entrega padrão, preparo e retirada. */
export function ShippingRules({ config }: { config: ShippingConfig }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ free: toReais(config.freeFromCents), flat: toReais(config.flatCents), flatDays: String(config.flatDays), handling: String(config.handlingDays), markup: toReais(config.markupCents), pickup: config.pickupEnabled, pickupAddress: config.pickupAddress });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await saveShippingConfigAction({ freeFromCents: toCents(f.free), flatCents: toCents(f.flat) ?? 0, flatDays: Math.max(1, Number(f.flatDays) || 1), handlingDays: Math.max(0, Number(f.handling) || 0), markupCents: toCents(f.markup) ?? 0, pickupEnabled: f.pickup, pickupAddress: f.pickupAddress });
      if (r.ok) { toast.success("Regras de frete salvas"); router.refresh(); } else toast.error(r.error);
    });
  };
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2" aria-label="Regras de frete">
      <FormField label="Frete grátis a partir de (R$)" htmlFor="free" hint="Deixe vazio para nunca dar frete grátis."><Input id="free" inputMode="decimal" value={f.free} onChange={(e) => setF({ ...f, free: e.target.value })} placeholder="299,00" /></FormField>
      <FormField label="Dias para preparar o pedido" htmlFor="handling" hint="Somados ao prazo da transportadora."><Input id="handling" inputMode="numeric" value={f.handling} onChange={(e) => setF({ ...f, handling: e.target.value })} /></FormField>
      <FormField label="Entrega padrão (R$)" htmlFor="flat" hint="Vale quando não há transportadora conectada ou ela não responde."><Input id="flat" inputMode="decimal" value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} /></FormField>
      <FormField label="Prazo da entrega padrão (dias)" htmlFor="flatdays"><Input id="flatdays" inputMode="numeric" value={f.flatDays} onChange={(e) => setF({ ...f, flatDays: e.target.value })} /></FormField>
      <FormField label="Acréscimo de embalagem (R$)" htmlFor="markup" hint="Somado a cada cotação de transportadora."><Input id="markup" inputMode="decimal" value={f.markup} onChange={(e) => setF({ ...f, markup: e.target.value })} /></FormField>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.pickup} onChange={(e) => setF({ ...f, pickup: e.target.checked })} /> Permitir retirada na loja</label>
        {f.pickup ? <Input aria-label="Endereço de retirada" value={f.pickupAddress} onChange={(e) => setF({ ...f, pickupAddress: e.target.value })} placeholder="Rua, número, bairro" /> : null}
      </div>
      <div className="sm:col-span-2"><Button type="submit" loading={pending}>Salvar regras de frete</Button></div>
    </form>
  );
}
