"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { createProductAction } from "@/app/actions/supplier";
import { compressImage } from "@/lib/client-image";
import { formatBRL, parseBRLToCents } from "@/lib/money";

type Row = { size: string; stock: string; pack: string };
const DEFAULT_SIZES: Row[] = [{ size: "P", stock: "", pack: "2" }, { size: "M", stock: "", pack: "4" }, { size: "G", stock: "", pack: "4" }, { size: "GG", stock: "", pack: "2" }];
const MAX_IMAGES = 4;

export function NewProductForm({ stores, categories }: { stores: { id: string; name: string }[]; categories: string[] }) {
  const router = useRouter();
  const [f, setF] = React.useState({ name: "", sku: "", description: "", category: categories[0] ?? "", cost: "", suggested: "", minimum: "", sellsUnit: true, sellsPack: false, packCost: "", packSuggested: "", packMinimum: "", status: "ACTIVE" as "ACTIVE" | "DRAFT", distribution: "ALL_NETWORK" as "ALL_NETWORK" | "SELECTED_STORES" });
  const [rows, setRows] = React.useState<Row[]>(DEFAULT_SIZES);
  const [images, setImages] = React.useState<string[]>([]);
  const [storeIds, setStoreIds] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [pending, start] = React.useTransition();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const cost = parseBRLToCents(f.cost), sug = parseBRLToCents(f.suggested), min = parseBRLToCents(f.minimum);
  const packTotal = rows.reduce((s, r) => s + (Number(r.pack) || 0), 0);
  const stockTotal = rows.reduce((s, r) => s + (Number(r.stock) || 0), 0);
  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const room = MAX_IMAGES - images.length;
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, room)) next.push(await compressImage(file));
      setImages([...images, ...next]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao processar a imagem."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await createProductAction({
        name: f.name, sku: f.sku, description: f.description, categoryName: f.category, images,
        costCents: cost, suggestedPriceCents: sug, minimumPriceCents: min || sug,
        status: f.status, distribution: f.distribution, storeIds, sellsUnit: f.sellsUnit, sellsPack: f.sellsPack,
        sizes: rows.filter((r) => r.size.trim()).map((r) => ({ size: r.size, initialStock: Number(r.stock) || 0, packQuantity: f.sellsPack ? Number(r.pack) || 0 : 0 })),
        pack: f.sellsPack ? { name: `Grade ${packTotal} peças`, costCents: parseBRLToCents(f.packCost), suggestedPriceCents: parseBRLToCents(f.packSuggested), minimumPriceCents: parseBRLToCents(f.packMinimum) || parseBRLToCents(f.packSuggested) } : undefined,
      });
      if (r.ok) { toast.success("Produto cadastrado"); router.push(`/supplier/products/${r.data.productId}`); } else toast.error(r.error);
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nome" htmlFor="name" className="sm:col-span-2"><Input id="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Manto Tricolor Paulista 2025" /></FormField>
            <FormField label="SKU" htmlFor="sku" hint="Código único do modelo"><Input id="sku" required value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value.toUpperCase() })} placeholder="CS-TRI-25" /></FormField>
            <FormField label="Categoria" htmlFor="cat"><Input id="cat" required list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></FormField>
            <FormField label="Descrição" htmlFor="desc" className="sm:col-span-2"><Textarea id="desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Fotos</CardTitle><CardDescription>Até {MAX_IMAGES} imagens. Redimensionadas automaticamente. A primeira é a capa.</CardDescription></div></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 ? <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Capa</span> : null}
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-1.5 top-1.5 rounded-md bg-surface/90 p-1 text-danger shadow-sm" aria-label="Remover foto"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
              {images.length < MAX_IMAGES ? (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-sm text-muted-foreground hover:bg-surface-muted disabled:opacity-50">
                  <ImagePlus className="size-5" /> {uploading ? "Processando…" : "Adicionar"}
                </button>
              ) : null}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            {images.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">Sem foto, a loja mostra uma ilustração de camisa.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><CardTitle>Tamanhos e estoque inicial</CardTitle><CardDescription>Um único estoque central para toda a rede.{f.sellsPack ? " A coluna Grade define quantas peças de cada tamanho vão em cada grade." : ""}</CardDescription></div></CardHeader>
          <CardContent className="space-y-2">
            <div className={`grid gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground ${f.sellsPack ? "grid-cols-[1fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_auto]"}`}><span>Tamanho</span><span>Estoque</span>{f.sellsPack ? <span>Grade</span> : null}<span className="w-9" /></div>
            {rows.map((r, i) => (
              <div key={i} className={`grid items-center gap-2 ${f.sellsPack ? "grid-cols-[1fr_1fr_1fr_auto]" : "grid-cols-[1fr_1fr_auto]"}`}>
                <Input aria-label="Tamanho" value={r.size} onChange={(e) => setRow(i, { size: e.target.value.toUpperCase() })} maxLength={6} />
                <Input aria-label="Estoque" type="number" min={0} value={r.stock} onChange={(e) => setRow(i, { stock: e.target.value })} placeholder="0" />
                {f.sellsPack ? <Input aria-label="Quantidade na grade" type="number" min={0} value={r.pack} onChange={(e) => setRow(i, { pack: e.target.value })} /> : null}
                <Button type="button" variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label="Remover tamanho"><Trash2 /></Button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <Button type="button" size="sm" variant="secondary" onClick={() => setRows([...rows, { size: "", stock: "", pack: "0" }])}><Plus /> Tamanho</Button>
              <span className="text-xs text-muted-foreground">Total: {stockTotal} peças{f.sellsPack ? ` · Grade: ${packTotal} peças` : ""}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Preços</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Custo (R$)" htmlFor="cost" hint="Quanto o lojista paga à Central"><Input id="cost" required inputMode="decimal" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} placeholder="59,00" /></FormField>
            <FormField label="Preço sugerido (R$)" htmlFor="sug"><Input id="sug" required inputMode="decimal" value={f.suggested} onChange={(e) => setF({ ...f, suggested: e.target.value })} placeholder="149,90" /></FormField>
            <FormField label="Preço mínimo (R$)" htmlFor="min" hint="Lojas não podem vender abaixo disso"><Input id="min" inputMode="decimal" value={f.minimum} onChange={(e) => setF({ ...f, minimum: e.target.value })} placeholder="119,90" /></FormField>
            {sug > 0 && cost > 0 ? <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-muted-foreground">Margem sugerida do lojista: <b className="text-foreground">{formatBRL(sug - cost)}</b> ({Math.round(((sug - cost) / sug) * 100)}%)</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Como vende</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Switch checked={f.sellsUnit} onCheckedChange={(v) => setF({ ...f, sellsUnit: v })} label="Venda unitária (varejo)" />
            <Switch checked={f.sellsPack} onCheckedChange={(v) => setF({ ...f, sellsPack: v })} label="Grade (atacado)" />
            {f.sellsPack ? (
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Grade de {packTotal} peças</div>
                <FormField label="Custo da grade (R$)" htmlFor="pc"><Input id="pc" inputMode="decimal" required value={f.packCost} onChange={(e) => setF({ ...f, packCost: e.target.value })} /></FormField>
                <FormField label="Preço sugerido da grade (R$)" htmlFor="ps"><Input id="ps" inputMode="decimal" required value={f.packSuggested} onChange={(e) => setF({ ...f, packSuggested: e.target.value })} /></FormField>
                <FormField label="Preço mínimo da grade (R$)" htmlFor="pm"><Input id="pm" inputMode="decimal" value={f.packMinimum} onChange={(e) => setF({ ...f, packMinimum: e.target.value })} /></FormField>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Quem pode vender" htmlFor="dist"><Select id="dist" value={f.distribution} onChange={(e) => setF({ ...f, distribution: e.target.value as typeof f.distribution })}><option value="ALL_NETWORK">Toda a rede</option><option value="SELECTED_STORES">Lojas selecionadas</option></Select></FormField>
            {f.distribution === "SELECTED_STORES" ? (
              stores.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma loja na rede ainda.</p> : (
                <ul className="space-y-1">{stores.map((s) => <li key={s.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={storeIds.includes(s.id)} onChange={(e) => setStoreIds(e.target.checked ? [...storeIds, s.id] : storeIds.filter((x) => x !== s.id))} /> {s.name}</label></li>)}</ul>
              )
            ) : null}
            <FormField label="Status" htmlFor="status"><Select id="status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as typeof f.status })}><option value="ACTIVE">Ativo (visível às lojas)</option><option value="DRAFT">Rascunho</option></Select></FormField>
          </CardContent>
        </Card>
        <Button type="submit" size="lg" className="w-full" loading={pending}>Cadastrar produto</Button>
      </div>
    </form>
  );
}
