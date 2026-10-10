"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { MoneyField } from "@/components/finance/fields";
import { saveProductAction } from "@/app/actions/importadora";

export type ProductRow = { id: string; sku: string; title: string; description: string | null; category: string | null; unitsPerBox: number; boxLengthMm: number | null; boxWidthMm: number | null; boxHeightMm: number | null; grossWeightG: number | null; priceTiers: { minBoxes: number; priceBoxCents: number }[]; minBoxes: number; warehouseId: string | null; status: "RASCUNHO" | "ATIVO" | "ESGOTADO" | "ALTO_MAR"; stockBoxes: number };
const STATUS = { RASCUNHO: "Rascunho (não aparece)", ATIVO: "À venda", ESGOTADO: "Esgotado", ALTO_MAR: "Em alto mar" } as const;
const cm = (mm: number | null) => (mm ? String(mm / 10).replace(".", ",") : "");
const toMm = (s: string) => { const n = Number(s.replace(",", ".")); return s.trim() && Number.isFinite(n) ? Math.round(n * 10) : null; };

/** Cadastro do produto de caixa fechada: caixa master, medidas (cubagem sai sozinha), peso e faixas de preço por quantidade. */
export function ProdutoForm({ importerId, product, warehouses, onDone }: { importerId: string | null; product?: ProductRow; warehouses: { id: string; name: string }[]; onDone?: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [f, setF] = React.useState({
    sku: product?.sku ?? "", title: product?.title ?? "", category: product?.category ?? "", description: product?.description ?? "",
    units: product ? String(product.unitsPerBox) : "", l: cm(product?.boxLengthMm ?? null), w: cm(product?.boxWidthMm ?? null), h: cm(product?.boxHeightMm ?? null),
    kg: product?.grossWeightG ? String(product.grossWeightG / 1000).replace(".", ",") : "", min: String(product?.minBoxes ?? 1), warehouseId: product?.warehouseId ?? "", status: product?.status ?? "ATIVO",
  });
  const [tiers, setTiers] = React.useState(product?.priceTiers ?? [{ minBoxes: 1, priceBoxCents: 0 }]);
  const litros = (() => { const a = toMm(f.l), b = toMm(f.w), c = toMm(f.h); return a && b && c ? Math.round((a * b * c) / 100_000) / 10 : null; })();
  const pid = product?.id ?? "novo";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = Number(f.kg.replace(",", "."));
    start(async () => {
      const r = await saveProductAction(importerId, product?.id ?? null, {
        sku: f.sku, title: f.title, category: f.category || undefined, description: f.description || undefined, unitsPerBox: Number(f.units) || 0,
        boxLengthMm: toMm(f.l), boxWidthMm: toMm(f.w), boxHeightMm: toMm(f.h), grossWeightG: f.kg.trim() && Number.isFinite(kg) ? Math.round(kg * 1000) : null,
        priceTiers: tiers, minBoxes: Number(f.min) || 1, warehouseId: f.warehouseId || undefined, status: f.status,
      });
      if (r.ok) { toast.success(product ? "Produto atualizado" : "Produto cadastrado. Agora lance o estoque."); router.refresh(); onDone?.(); if (!product) { setF({ ...f, sku: "", title: "", units: "", description: "" }); setTiers([{ minBoxes: 1, priceBoxCents: 0 }]); } }
      else toast.error(r.error);
    });
  };
  const lab = "flex flex-col text-sm font-medium";
  return (
    <form onSubmit={submit} className="space-y-4" aria-label={product ? `Editar ${product.title}` : "Novo produto"}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={lab}>Código (SKU)<Input required value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value.toUpperCase() })} placeholder="Ex.: GT-48" className="mt-1 uppercase" /></label>
        <label className={`${lab} sm:col-span-2`}>Produto<Input required minLength={3} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Garrafa térmica inox 1 L" className="mt-1" /></label>
        <label className={lab}>Categoria<Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Ex.: Cozinha" className="mt-1" /></label>
        <label className={lab}>Unidades por caixa<Input required inputMode="numeric" value={f.units} onChange={(e) => setF({ ...f, units: e.target.value.replace(/\D/g, "") })} className="mt-1" /></label>
        <label className={lab}>Comprimento (cm)<Input inputMode="decimal" value={f.l} onChange={(e) => setF({ ...f, l: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Largura (cm)<Input inputMode="decimal" value={f.w} onChange={(e) => setF({ ...f, w: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Altura (cm)<Input inputMode="decimal" value={f.h} onChange={(e) => setF({ ...f, h: e.target.value })} className="mt-1" /></label>
        <label className={lab}>Peso da caixa (kg)<Input inputMode="decimal" value={f.kg} onChange={(e) => setF({ ...f, kg: e.target.value })} className="mt-1" /></label>
        <p className="self-end pb-2 text-sm text-muted-foreground">Cubagem: <b className="tabular-nums">{litros !== null ? `${String(litros).replace(".", ",")} L (${String(Math.round(litros) / 1000).replace(".", ",")} m³)` : "informe as 3 medidas"}</b></p>
        <label className={lab}>Mínimo de caixas<Input inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value.replace(/\D/g, "") })} className="mt-1" /></label>
        <label className={lab}>Situação<Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof f.status })} className="mt-1">{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></label>
        {warehouses.length ? <label className={lab}>Galpão de saída<Select value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: e.target.value })} className="mt-1"><option value="">Padrão</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></label> : null}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Preço da caixa por quantidade</legend>
        {tiers.map((t, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs font-medium text-muted-foreground">A partir de (caixas)<Input inputMode="numeric" disabled={i === 0} value={String(t.minBoxes)} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, minBoxes: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} className="mt-1 w-32" /></label>
            <MoneyField id={`tier-${pid}-${i}`} label="Preço da caixa" valueCents={t.priceBoxCents} onChange={(v) => setTiers(tiers.map((x, j) => (j === i ? { ...x, priceBoxCents: v } : x)))} className="w-40" />
            {i > 0 ? <Button type="button" variant="ghost" size="icon" aria-label={`Remover faixa ${i + 1}`} onClick={() => setTiers(tiers.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden /></Button> : null}
          </div>
        ))}
        {tiers.length < 4 ? <Button type="button" size="sm" variant="secondary" onClick={() => setTiers([...tiers, { minBoxes: (tiers.at(-1)?.minBoxes ?? 1) * 5, priceBoxCents: tiers.at(-1)?.priceBoxCents ?? 0 }])}><Plus className="size-4" aria-hidden />Faixa de quantidade</Button> : null}
      </fieldset>
      <Button type="submit" size="lg" loading={pending}>{product ? "Gravar produto" : "Cadastrar produto"}</Button>
    </form>
  );
}
