"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { createDiscountAction, setDiscountActiveAction } from "@/app/actions/discounts";
import { formatBRL } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

type Row = { id: string; code: string; kind: "PERCENT" | "FIXED"; value: number; minSubtotalCents: number; maxRedemptions: number | null; redemptions: number; expiresAt: string | null; active: boolean };

export function DiscountManager({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({ code: "", kind: "PERCENT" as "PERCENT" | "FIXED", value: "10", min: "", max: "", expiresAt: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const value = f.kind === "PERCENT" ? Number(f.value) : Math.round(Number(f.value.replace(",", ".")) * 100);
      const r = await createDiscountAction({ code: f.code, kind: f.kind, value, minSubtotalCents: f.min ? Math.round(Number(f.min.replace(",", ".")) * 100) : 0, maxRedemptions: f.max ? Number(f.max) : null, expiresAt: f.expiresAt || null });
      if (r.ok) { toast.success("Cupom criado"); setF({ ...f, code: "" }); router.refresh(); } else toast.error(r.error);
    });
  };
  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Código<Input className="mt-1" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="BEMVINDO10" maxLength={24} /></label>
        <label className="text-sm font-medium">Tipo<Select className="mt-1" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "PERCENT" | "FIXED" })}><option value="PERCENT">Percentual (%)</option><option value="FIXED">Valor fixo (R$)</option></Select></label>
        <label className="text-sm font-medium">{f.kind === "PERCENT" ? "Desconto (1 a 90%)" : "Desconto (R$)"}<Input className="mt-1" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
        <label className="text-sm font-medium">Pedido mínimo (R$, opcional)<Input className="mt-1" inputMode="decimal" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></label>
        <label className="text-sm font-medium">Limite de usos (opcional)<Input className="mt-1" inputMode="numeric" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></label>
        <label className="text-sm font-medium">Válido até (opcional)<Input className="mt-1" type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></label>
        <div className="sm:col-span-2"><Button type="submit" loading={pending} disabled={f.code.trim().length < 3 || !f.value}>Criar cupom</Button></div>
      </form>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.length === 0 ? <li className="p-4 text-sm text-muted-foreground">Nenhum cupom ainda.</li> : null}
        {rows.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><div className="font-mono font-semibold">{d.code}</div><div className="text-xs text-muted-foreground">{d.kind === "PERCENT" ? `${d.value}%` : formatBRL(d.value)}{d.minSubtotalCents ? ` · mínimo ${formatBRL(d.minSubtotalCents)}` : ""} · {d.redemptions}{d.maxRedemptions ? `/${d.maxRedemptions}` : ""} usos{d.expiresAt ? ` · até ${formatDateTime(d.expiresAt)}` : ""}</div></div>
            <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await setDiscountActiveAction(d.id, !d.active); if (r.ok) router.refresh(); else toast.error(r.error); })}>{d.active ? "Desativar" : "Ativar"}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
