"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { advanceServiceOrderAction, postServiceMessageAction, updateServiceAction } from "@/app/actions/services";

const NEXT: Record<string, { status: string; label: string }[]> = {
  REQUESTED: [{ status: "IN_ANALYSIS", label: "Iniciar análise" }],
  IN_ANALYSIS: [],
  QUOTED: [{ status: "IN_PROGRESS", label: "Iniciar execução" }],
  IN_PROGRESS: [{ status: "DELIVERED", label: "Marcar entregue" }],
};

/** Ações do master sobre um pedido de serviço: orçar, avançar, cancelar e responder. */
export function ServiceOrderActions({ id, status, defaultQuote }: { id: string; status: string; defaultQuote: number }) {
  const router = useRouter();
  const [quote, setQuote] = React.useState(defaultQuote);
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => { setBusy(true); const r = await fn(); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); return true; } toast.error(r.error ?? "Falha"); return false; };
  const closed = status === "DELIVERED" || status === "CANCELED";
  return (
    <div className="space-y-3">
      {!closed ? (
        <div className="flex flex-wrap items-end gap-2">
          {(status === "REQUESTED" || status === "IN_ANALYSIS") ? (
            <>
              <MoneyInput label="Orçamento" valueCents={quote} onChange={setQuote} className="w-40" id={`quote-${id}`} />
              <Button loading={busy} onClick={() => run(() => advanceServiceOrderAction(id, "QUOTED", quote), "Orçamento enviado")}>Enviar orçamento</Button>
            </>
          ) : null}
          {(NEXT[status] ?? []).map((n) => <Button key={n.status} variant="secondary" loading={busy} onClick={() => run(() => advanceServiceOrderAction(id, n.status), n.label)}>{n.label}</Button>)}
          <Button variant="ghost" className="text-danger" loading={busy} onClick={() => run(() => advanceServiceOrderAction(id, "CANCELED"), "Pedido cancelado")}>Cancelar</Button>
        </div>
      ) : null}
      {!closed ? (
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(() => postServiceMessageAction(id, msg), "Mensagem enviada")) setMsg(""); }}>
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Responder ao cliente…" aria-label="Mensagem" />
          <Button type="submit" variant="secondary" loading={busy} disabled={!msg.trim()}>Enviar</Button>
        </form>
      ) : null}
    </div>
  );
}

/** Linha editável do catálogo: preço, destaque e ativação. */
export function ServiceCatalogRow({ id, name, priceCents, active, featured }: { id: string; name: string; priceCents: number; active: boolean; featured: boolean }) {
  const router = useRouter();
  const [price, setPrice] = React.useState(priceCents);
  const [busy, setBusy] = React.useState(false);
  const save = async (patch: Parameters<typeof updateServiceAction>[1], ok: string) => { setBusy(true); const r = await updateServiceAction(id, patch); setBusy(false); if (r.ok) { toast.success(ok); router.refresh(); } else toast.error(r.error); };
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="min-w-40 flex-1"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{active ? "Visível na loja" : "Oculto"}{featured ? " · Destaque" : ""}</div></div>
      <MoneyInput label="A partir de" valueCents={price} onChange={setPrice} className="w-36" id={`price-${id}`} />
      <Button size="sm" variant="secondary" loading={busy} disabled={price === priceCents} onClick={() => save({ priceFromCents: price }, "Preço atualizado")}>Salvar preço</Button>
      <Button size="sm" variant="ghost" loading={busy} onClick={() => save({ featured: !featured }, featured ? "Destaque removido" : "Em destaque")}>{featured ? "Tirar destaque" : "Destacar"}</Button>
      <Button size="sm" variant="ghost" loading={busy} onClick={() => save({ active: !active }, active ? "Serviço ocultado" : "Serviço ativado")}>{active ? "Ocultar" : "Ativar"}</Button>
    </div>
  );
}
