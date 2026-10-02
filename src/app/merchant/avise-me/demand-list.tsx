"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAlertsNotifiedAction } from "@/app/actions/stock-alerts";

type Group = { productName: string; size: string; variantId: string; available: number; contacts: { id: string; kind: "EMAIL" | "WHATSAPP"; contact: string }[] };

export function DemandList({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  if (groups.length === 0) return <p className="text-sm text-muted-foreground">Nenhum pedido de aviso no momento.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {groups.map((g) => (
        <li key={g.variantId} className="space-y-2 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{g.productName} · tam. {g.size} · {g.contacts.length} {g.contacts.length === 1 ? "pessoa" : "pessoas"}</span>
            <span className={g.available > 0 ? "text-xs font-medium text-success" : "text-xs text-muted-foreground"}>{g.available > 0 ? `Voltou ao estoque (${g.available})` : "Ainda esgotado"}</span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {g.contacts.map((c) => (
              <li key={c.id}>{c.kind === "WHATSAPP"
                ? <a className="rounded bg-surface-muted px-2 py-1 text-xs underline-offset-2 hover:underline" href={`https://wa.me/${c.contact.length <= 11 ? `55${c.contact}` : c.contact}?text=${encodeURIComponent(`Olá! O tamanho ${g.size} de ${g.productName} chegou. Quer garantir o seu?`)}`} target="_blank" rel="noreferrer">WhatsApp {c.contact}</a>
                : <a className="rounded bg-surface-muted px-2 py-1 text-xs underline-offset-2 hover:underline" href={`mailto:${c.contact}?subject=${encodeURIComponent(`${g.productName} (${g.size}) chegou`)}`}>{c.contact}</a>}</li>
            ))}
          </ul>
          <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await markAlertsNotifiedAction(g.variantId); if (r.ok) { toast.success("Marcado como avisado"); router.refresh(); } else toast.error(r.error); })}>Marcar como avisados</Button>
        </li>
      ))}
    </ul>
  );
}
