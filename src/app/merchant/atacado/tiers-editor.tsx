"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setPriceTiersAction } from "@/app/actions/price-tiers";
import { formatBRL } from "@/lib/money";

type Item = { productId: string; name: string; priceCents: number; floorCents: number; tiers: { minQty: number; priceCents: number }[] };
type Row = { minQty: string; price: string };
const toRows = (t: Item["tiers"]): Row[] => t.map((x) => ({ minQty: String(x.minQty), price: (x.priceCents / 100).toFixed(2).replace(".", ",") }));

function ProductTiers({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [rows, setRows] = React.useState<Row[]>(toRows(item.tiers));
  const save = () => start(async () => {
    const tiers = rows.filter((r) => r.minQty && r.price).map((r) => ({ minQty: Number(r.minQty), priceCents: Math.round(Number(r.price.replace(",", ".")) * 100) }));
    const r = await setPriceTiersAction(item.productId, tiers);
    if (r.ok) { toast.success("Faixas salvas"); router.refresh(); } else toast.error(r.error);
  });
  return (
    <li className="space-y-2 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{item.name}</span><span className="text-xs text-muted-foreground">Preço atual {formatBRL(item.priceCents)} · não pode ficar abaixo de {formatBRL(item.floorCents)}</span></div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground">A partir de</span>
          <Input aria-label="Quantidade mínima" className="w-20" inputMode="numeric" value={r.minQty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, minQty: e.target.value } : x)))} />
          <span className="text-muted-foreground">peças: R$</span>
          <Input aria-label="Preço unitário" className="w-28" inputMode="decimal" value={r.price} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
          <Button type="button" variant="ghost" aria-label="Remover faixa" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        {rows.length < 5 ? <Button type="button" variant="secondary" onClick={() => setRows([...rows, { minQty: "", price: "" }])}><Plus /> Faixa</Button> : null}
        <Button type="button" loading={pending} onClick={save}>Salvar</Button>
      </div>
    </li>
  );
}

export function TiersEditor({ items }: { items: Item[] }) {
  return <ul className="divide-y divide-border rounded-lg border border-border bg-surface">{items.map((i) => <ProductTiers key={i.productId} item={i} />)}</ul>;
}
