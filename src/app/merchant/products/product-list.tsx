"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, CheckCheck } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { ProductArt } from "@/components/app/product-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input, Switch } from "@/components/ui/input";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { upsertStoreProductAction, activateAllProductsAction } from "@/app/actions/merchant";
import { cn } from "@/lib/utils";

export type MerchantProduct = { shortSizes: { min: number; sizes: string[] } | null; productId: string; name: string; sku: string; images: string[]; description: string; costCents: number; suggestedPriceCents: number; minimumPriceCents: number; sellsPack: boolean; packSuggested: number | null; packMinimum: number | null; active: boolean; priceCents: number; packPriceCents: number | null; available: number; sizes: string };
const toBRL = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export function MerchantProductList({ items }: { items: MerchantProduct[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<MerchantProduct | null>(null);
  const [price, setPrice] = React.useState("");
  const [packPrice, setPackPrice] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [pending, start] = React.useTransition();

  const open = (p: MerchantProduct) => { setEditing(p); setPrice(toBRL(p.priceCents)); setPackPrice(p.packPriceCents ? toBRL(p.packPriceCents) : ""); setActive(p.active); };
  const save = (p: MerchantProduct, patch: Partial<{ active: boolean; priceCents: number; packPriceCents: number | null }>) =>
    start(async () => {
      const r = await upsertStoreProductAction({ productId: p.productId, active: patch.active ?? p.active, priceCents: patch.priceCents ?? p.priceCents, packPriceCents: patch.packPriceCents === undefined ? p.packPriceCents : patch.packPriceCents });
      if (r.ok) { toast.success("Produto atualizado"); setEditing(null); router.refresh(); } else toast.error(r.error);
    });
  const margin = (p: MerchantProduct) => p.priceCents - p.costCents;

  const inactive = items.filter((i) => !i.active).length;
  return (
    <>
      {inactive > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm"><span className="font-medium">{inactive} produto(s) da Central ainda não estão na sua loja.</span> <span className="text-muted-foreground">Ative todos com o preço sugerido e ajuste depois.</span></div>
          <Button loading={pending} onClick={() => start(async () => { const r = await activateAllProductsAction(); if (r.ok) { toast.success(`${r.data.activated} produto(s) ativados${r.data.skipped ? `. ${r.data.skipped} ficaram de fora por estoque abaixo do mínimo` : ""}`); router.refresh(); } else toast.error(r.error); })}><CheckCheck /> Ativar todos</Button>
        </div>
      ) : null}
      <DataTable
        rows={items}
        rowKey={(r) => r.productId}
        columns={[
          { key: "name", header: "Produto", primary: true, cell: (r) => <div className="flex items-center gap-3"><ProductArt images={r.images} size="sm" /><div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.sku} · disp. {r.sizes}</div>{r.shortSizes ? <div className="mt-0.5 text-xs text-warning">Estoque abaixo de {r.shortSizes.min} em {r.shortSizes.sizes.join(", ")}: {r.active ? "reponha para manter a venda" : "ainda não dá para ativar"}</div> : null}</div></div> },
          { key: "cost", header: "Custo", className: "text-right", cell: (r) => <span className="tabular-nums text-muted-foreground">{formatBRL(r.costCents)}</span>, mobile: false },
          { key: "price", header: "Seu preço", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.priceCents)}</span> },
          { key: "margin", header: "Margem", className: "text-right", cell: (r) => <span className={cn("tabular-nums", margin(r) > 0 ? "text-success" : "text-danger")}>{formatBRL(margin(r))}</span> },
          { key: "pack", header: "Grade", className: "text-right", cell: (r) => r.sellsPack ? <span className="tabular-nums">{r.packPriceCents ? formatBRL(r.packPriceCents) : <Badge tone="outline">sem preço</Badge>}</span> : <span className="text-muted-foreground">—</span>, mobile: false },
          { key: "stock", header: "Estoque", className: "text-right", cell: (r) => <span className={cn("tabular-nums", r.available < 5 && "text-warning")}>{r.available}</span> },
          { key: "active", header: "Vendendo", cell: (r) => <Switch checked={r.active} onCheckedChange={(v) => save(r, { active: v })} disabled={pending || (!r.active && !!r.shortSizes)} /> },
          { key: "edit", header: "", className: "text-right", cell: (r) => <Button variant="ghost" size="icon-sm" onClick={() => open(r)} aria-label="Editar preço"><Pencil /></Button> },
        ]}
      />
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing ? (
          <DialogContent title={editing.name} description={`Custo ${formatBRL(editing.costCents)} · sugerido ${formatBRL(editing.suggestedPriceCents)} · mínimo ${formatBRL(editing.minimumPriceCents)}`}>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(editing, { active, priceCents: parseBRLToCents(price), packPriceCents: editing.sellsPack && packPrice ? parseBRLToCents(packPrice) : null }); }}>
              <FormField label="Preço unitário (R$)" htmlFor="price" hint={`Margem: ${formatBRL(parseBRLToCents(price) - editing.costCents)}`}><Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" autoFocus /></FormField>
              {editing.sellsPack ? <FormField label="Preço da grade de 12 (R$)" htmlFor="pack" hint={editing.packMinimum ? `Mínimo sugerido ${formatBRL(editing.packMinimum)}` : undefined}><Input id="pack" value={packPrice} onChange={(e) => setPackPrice(e.target.value)} inputMode="decimal" /></FormField> : null}
              <Switch checked={active} onCheckedChange={setActive} label="Ativo na loja" />
              <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" loading={pending}>Salvar</Button></div>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
