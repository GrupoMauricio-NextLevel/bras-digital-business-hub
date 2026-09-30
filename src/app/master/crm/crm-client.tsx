"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { addNlNoteAction, advanceNlOrderAction, updateDigitalProductAction } from "@/app/actions/nl-sales";
import type { NlOrderStatus } from "@/db/schema";

const NEXT: Record<NlOrderStatus, { status: NlOrderStatus; label: string }[]> = {
  AWAITING_PAYMENT: [],
  PAID: [{ status: "CONTACTED", label: "Marcar contato feito" }, { status: "IN_PROGRESS", label: "Iniciar execução" }],
  CONTACTED: [{ status: "IN_PROGRESS", label: "Iniciar execução" }],
  IN_PROGRESS: [{ status: "DELIVERED", label: "Marcar entregue" }],
  DELIVERED: [],
  CANCELED: [],
};

/** Ações do CRM sobre um pedido da Loja NextLevel: avançar etapa, cancelar e anotar. */
export function CrmOrderActions({ id, status }: { id: string; status: NlOrderStatus }) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); return true; } toast.error(r.error ?? "Falha"); return false; };
  const closed = status === "DELIVERED" || status === "CANCELED";
  return (
    <div className="space-y-4">
      {!closed ? (
        <div className="flex flex-wrap gap-2">
          {NEXT[status].map((n) => <Button key={n.status} loading={busy} onClick={() => run(() => advanceNlOrderAction(id, n.status), n.label)}>{n.label}</Button>)}
          <Button variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => advanceNlOrderAction(id, "CANCELED"), "Pedido cancelado")}>Cancelar pedido</Button>
        </div>
      ) : null}
      <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => addNlNoteAction(id, note), "Anotação salva")) setNote(""); }}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anotar contato, combinado, prazo…" aria-label="Anotação" />
        <Button type="submit" variant="secondary" loading={busy} disabled={!note.trim()}>Anotar</Button>
      </form>
    </div>
  );
}

/** Linha editável da vitrine pública: preço cheio (cartão), destaque e visibilidade. */
export function DigitalProductRow({ id, name, priceCents, active, featured }: { id: string; name: string; priceCents: number; active: boolean; featured: boolean }) {
  const router = useRouter();
  const [price, setPrice] = React.useState(priceCents);
  const [busy, setBusy] = React.useState(false);
  const save = async (patch: Parameters<typeof updateDigitalProductAction>[1], ok: string) => { setBusy(true); const r = await updateDigitalProductAction(id, patch); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); };
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="min-w-40 flex-1"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{active ? "Visível na loja" : "Oculto"}{featured ? " · Destaque" : ""}</div></div>
      <MoneyInput label="Preço cheio (cartão)" valueCents={price} onChange={setPrice} className="w-44" id={`dprice-${id}`} />
      <Button size="sm" variant="secondary" loading={busy} disabled={price === priceCents} onClick={() => save({ priceCents: price }, "Preço atualizado")}>Salvar preço</Button>
      <Button size="sm" variant="ghost" loading={busy} onClick={() => save({ featured: !featured }, featured ? "Destaque removido" : "Em destaque")}>{featured ? "Tirar destaque" : "Destacar"}</Button>
      <Button size="sm" variant="ghost" loading={busy} onClick={() => save({ active: !active }, active ? "Oferta ocultada" : "Oferta ativada")}>{active ? "Ocultar" : "Ativar"}</Button>
    </div>
  );
}
