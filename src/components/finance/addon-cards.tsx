"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvoicePay } from "./invoice-pay";
import { buyAddonAction } from "@/app/actions/billing";
import { formatBRL } from "@/lib/money";

export type AddonView = { key: string; name: string; description: string; monthlyCents: number; annualCents: number; active: boolean; endsAt: string | null; openInvoiceId: string | null };

/** Vitrine de add-ons: contratar gera a fatura e abre o Pix; ativo mostra até quando vale. */
export function AddonCards({ addons, demo }: { addons: AddonView[]; demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Record<string, string>>({});
  const buy = async (a: AddonView, cycle: "MONTHLY" | "ANNUAL") => {
    setBusy(a.key + cycle);
    const r = await buyAddonAction(a.key, cycle);
    setBusy(null);
    if (!r.ok) return toast.error(r.error);
    setPending((p) => ({ ...p, [a.key]: r.data.invoiceId })); router.refresh();
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {addons.map((a) => {
        const inv = pending[a.key] ?? a.openInvoiceId;
        return (
          <Card key={a.key}><CardContent className="space-y-3 pt-4">
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{a.name}</h3>{a.active ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success"><Check className="size-3" /> Ativo{a.endsAt ? ` até ${new Date(a.endsAt).toLocaleDateString("pt-BR")}` : ""}</span> : null}</div>
            <p className="text-sm text-muted-foreground">{a.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              {inv ? <InvoicePay invoiceId={inv} label="Pagar fatura" demo={demo} /> : (
                <>
                  <Button size="sm" variant={a.active ? "secondary" : "primary"} loading={busy === a.key + "MONTHLY"} onClick={() => buy(a, "MONTHLY")}>{a.active ? "Renovar" : "Contratar"} · {formatBRL(a.monthlyCents)}/mês</Button>
                  <Button size="sm" variant="ghost" loading={busy === a.key + "ANNUAL"} onClick={() => buy(a, "ANNUAL")}>Anual {formatBRL(a.annualCents)}</Button>
                </>
              )}
            </div>
          </CardContent></Card>
        );
      })}
    </div>
  );
}
