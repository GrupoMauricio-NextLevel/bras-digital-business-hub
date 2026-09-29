"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackagePlus, SlidersHorizontal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { adjustStockAction, receiveStockAction, setDistributionAction, updateProductAction } from "@/app/actions/supplier";
import { parseBRLToCents } from "@/lib/money";

export function StockActions({ variants }: { variants: { id: string; size: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<null | "IN" | "ADJUST">(null);
  const [variantId, setVariantId] = React.useState(variants[0]?.id ?? "");
  const [qty, setQty] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const fn = mode === "IN" ? receiveStockAction : adjustStockAction;
      const r = await fn({ variantId, quantity: Number(qty), note });
      if (r.ok) { toast.success(mode === "IN" ? "Entrada registrada" : "Ajuste registrado"); setMode(null); setQty(""); setNote(""); router.refresh(); } else toast.error(r.error);
    });
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => setMode("ADJUST")}><SlidersHorizontal /> Ajustar</Button>
      <Button size="sm" onClick={() => setMode("IN")}><PackagePlus /> Entrada</Button>
      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent title={mode === "IN" ? "Entrada de estoque" : "Ajuste de estoque"} description={mode === "IN" ? "Registra recebimento de mercadoria (movimentação IN)." : "Ajuste positivo ou negativo (movimentação ADJUSTMENT). Não pode ficar abaixo do reservado."}>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Tamanho" htmlFor="variant"><Select id="variant" value={variantId} onChange={(e) => setVariantId(e.target.value)}>{variants.map((v) => <option key={v.id} value={v.id}>{v.size}</option>)}</Select></FormField>
            <FormField label="Quantidade" htmlFor="qty" hint={mode === "ADJUST" ? "Use valor negativo para reduzir" : undefined}><Input id="qty" type="number" value={qty} onChange={(e) => setQty(e.target.value)} required autoFocus /></FormField>
            <FormField label="Observação" htmlFor="note"><Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: NF 1234 / contagem" /></FormField>
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setMode(null)}>Cancelar</Button><Button type="submit" loading={pending}>Salvar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DistributionForm({ productId, distribution, stores, selected }: { productId: string; distribution: "ALL_NETWORK" | "SELECTED_STORES"; stores: { id: string; name: string; status: string }[]; selected: string[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState(distribution);
  const [ids, setIds] = React.useState<string[]>(selected);
  const [pending, start] = React.useTransition();
  const dirty = mode !== distribution || ids.slice().sort().join() !== selected.slice().sort().join();
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["ALL_NETWORK", "SELECTED_STORES"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-md border px-3 py-2 text-sm ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface-muted"}`}>{m === "ALL_NETWORK" ? "Toda a rede" : "Lojas selecionadas"}</button>
        ))}
      </div>
      {mode === "SELECTED_STORES" ? (
        <ul className="space-y-1">
          {stores.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted">
                <input type="checkbox" className="accent-[var(--primary)]" checked={ids.includes(s.id)} onChange={(e) => setIds(e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id))} />
                {s.name} {s.status !== "ACTIVE" ? <span className="text-xs text-muted-foreground">({s.status.toLowerCase()})</span> : null}
              </label>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-muted-foreground">Todas as lojas da rede podem ativar e vender este produto.</p>}
      <Button size="sm" className="w-full" disabled={!dirty} loading={pending} onClick={() => start(async () => { const r = await setDistributionAction({ productId, distribution: mode, storeIds: ids }); if (r.ok) { toast.success("Distribuição atualizada"); router.refresh(); } else toast.error(r.error); })}>Salvar distribuição</Button>
    </div>
  );
}

type ProductFormData = { id: string; name: string; description: string; costCents: number; suggestedPriceCents: number; minimumPriceCents: number; status: "ACTIVE" | "DRAFT" | "ARCHIVED"; sellsUnit: boolean; sellsPack: boolean };
const toBRL = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export function ProductForm({ product }: { product: ProductFormData }) {
  const router = useRouter();
  const [f, setF] = React.useState({ ...product, cost: toBRL(product.costCents), suggested: toBRL(product.suggestedPriceCents), minimum: toBRL(product.minimumPriceCents) });
  const [pending, start] = React.useTransition();
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await updateProductAction({ productId: f.id, name: f.name, description: f.description, costCents: parseBRLToCents(f.cost), suggestedPriceCents: parseBRLToCents(f.suggested), minimumPriceCents: parseBRLToCents(f.minimum), status: f.status, sellsUnit: f.sellsUnit, sellsPack: f.sellsPack }); if (r.ok) { toast.success("Produto salvo"); router.refresh(); } else toast.error(r.error); }); }}>
      <FormField label="Nome" htmlFor="name"><Input id="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FormField>
      <FormField label="Descrição" htmlFor="desc"><Textarea id="desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></FormField>
      <div className="grid grid-cols-3 gap-2">
        <FormField label="Custo" htmlFor="cost"><Input id="cost" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} inputMode="decimal" /></FormField>
        <FormField label="Sugerido" htmlFor="sug"><Input id="sug" value={f.suggested} onChange={(e) => setF({ ...f, suggested: e.target.value })} inputMode="decimal" /></FormField>
        <FormField label="Mínimo" htmlFor="min"><Input id="min" value={f.minimum} onChange={(e) => setF({ ...f, minimum: e.target.value })} inputMode="decimal" /></FormField>
      </div>
      <FormField label="Status" htmlFor="status"><Select id="status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ProductFormData["status"] })}><option value="ACTIVE">Ativo</option><option value="DRAFT">Rascunho</option><option value="ARCHIVED">Arquivado</option></Select></FormField>
      <div className="flex flex-wrap gap-4 py-1"><Switch checked={f.sellsUnit} onCheckedChange={(v) => setF({ ...f, sellsUnit: v })} label="Venda unitária" /><Switch checked={f.sellsPack} onCheckedChange={(v) => setF({ ...f, sellsPack: v })} label="Grade" /></div>
      <Button type="submit" className="w-full" loading={pending}><Save /> Salvar produto</Button>
    </form>
  );
}
