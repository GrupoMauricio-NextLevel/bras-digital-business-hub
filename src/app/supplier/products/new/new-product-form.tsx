"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch } from "@/components/ui/input";
import { ProductArt } from "@/components/app/product-art";
import { TwoColumn } from "@/components/ds/page";
import { MediaGallery, type MediaItem } from "@/components/ds/media-gallery";
import { RichTextLite, SearchPreview } from "@/components/ds/fields";
import { useUnsavedGuard } from "@/components/ds/contextual-save-bar";
import { createProductAction } from "@/app/actions/supplier";
import { compressImage } from "@/lib/client-image";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { SIZE_GRIDS, SIZE_GRID_KEYS, type SizeGridKey } from "@/lib/domain/size-grids";

type Row = { size: string; stock: string; pack: string };
type Form = { grid: SizeGridKey; weightG: string; lengthCm: string; widthCm: string; heightCm: string; name: string; sku: string; description: string; category: string; cost: string; suggested: string; minimum: string; sellsUnit: boolean; sellsPack: boolean; packCost: string; packSuggested: string; packMinimum: string; status: "ACTIVE" | "DRAFT"; distribution: "ALL_NETWORK" | "SELECTED_STORES"; seoTitle: string; seoDescription: string };
const PACK_DEFAULT: Record<string, string> = { P: "2", M: "4", G: "4", GG: "2", XX1: "1", "2XL": "1" };
const rowsFor = (grid: SizeGridKey): Row[] => (grid === "CUSTOM" ? [{ size: "P", stock: "", pack: "2" }, { size: "M", stock: "", pack: "4" }, { size: "G", stock: "", pack: "4" }, { size: "GG", stock: "", pack: "2" }] : SIZE_GRIDS[grid].sizes.map((size) => ({ size, stock: "", pack: PACK_DEFAULT[size] ?? "2" })));
const MAX_IMAGES = 8;
const DRAFT_KEY = "nl-draft:new-product";

const EMPTY: Form = { grid: "ADULT_MALE", weightG: "300", lengthCm: "30", widthCm: "25", heightCm: "3", name: "", sku: "", description: "", category: "", cost: "", suggested: "", minimum: "", sellsUnit: true, sellsPack: false, packCost: "", packSuggested: "", packMinimum: "", status: "ACTIVE", distribution: "ALL_NETWORK", seoTitle: "", seoDescription: "" };

type Draft = { f: Form; rows: Row[]; storeIds: string[]; savedAt: number };
const readDraft = (): Draft | null => { try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? (JSON.parse(raw) as Draft) : null; } catch { return null; } };
const writeDraft = (d: Draft | null) => { try { if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); else localStorage.removeItem(DRAFT_KEY); } catch { /* armazenamento bloqueado */ } };

export function NewProductForm({ stores, categories, minStock = 4, base = "/supplier/products", independent = false, commerce = false, hostDaLoja = "loja-da-rede.com.br" }: { stores: { id: string; name: string }[]; categories: string[]; minStock?: number; base?: string; independent?: boolean; commerce?: boolean; hostDaLoja?: string }) {
  const router = useRouter();
  const [f, setF] = React.useState<Form>({ ...EMPTY, category: categories[0] ?? "" });
  const [rows, setRows] = React.useState<Row[]>(rowsFor("ADULT_MALE"));
  const [media, setMedia] = React.useState<MediaItem[]>([]);
  const [storeIds, setStoreIds] = React.useState<string[]>([]);
  const [pending, start] = React.useTransition();
  const [recovered, setRecovered] = React.useState<Draft | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const set = (patch: Partial<Form>) => { setF((x) => ({ ...x, ...patch })); setDirty(true); };
  useUnsavedGuard(dirty && !saved);

  // Rascunho automático (sem as fotos, que são pesadas): guarda 800 ms depois da última alteração.
  React.useEffect(() => { const id = requestAnimationFrame(() => setRecovered(readDraft())); return () => cancelAnimationFrame(id); }, []);
  React.useEffect(() => {
    if (!dirty || saved) return;
    const t = setTimeout(() => writeDraft({ f, rows, storeIds, savedAt: Date.now() }), 800);
    return () => clearTimeout(t);
  }, [f, rows, storeIds, dirty, saved]);
  const restore = () => { if (!recovered) return; setF(recovered.f); setRows(recovered.rows); setStoreIds(recovered.storeIds); setRecovered(null); setDirty(true); };
  const discard = () => { writeDraft(null); setRecovered(null); };

  const cost = parseBRLToCents(f.cost), sug = parseBRLToCents(f.suggested), min = parseBRLToCents(f.minimum);
  const packTotal = rows.reduce((s, r) => s + (Number(r.pack) || 0), 0);
  const stockTotal = rows.reduce((s, r) => s + (Number(r.stock) || 0), 0);
  const setRow = (i: number, patch: Partial<Row>) => { setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))); setDirty(true); };
  const margin = sug - cost, marginPct = sug > 0 ? Math.round((margin / sug) * 100) : 0, markup = cost > 0 ? Math.round((sug / cost - 1) * 100) : 0;
  const slug = f.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const priceIssue = cost > 0 && sug > 0 && (min && min < cost ? "O preço mínimo está abaixo do custo." : min && min > sug ? "O preço mínimo está acima do sugerido." : sug < cost ? "O preço sugerido está abaixo do custo." : null);

  const submit = (status: "ACTIVE" | "DRAFT") => (e?: React.FormEvent) => {
    e?.preventDefault();
    start(async () => {
      const r = await createProductAction({
        name: f.name, sku: f.sku, description: f.description, categoryName: f.category, images: media.map((m) => m.src),
        costCents: cost, suggestedPriceCents: sug, minimumPriceCents: min || sug,
        status, distribution: f.distribution, storeIds, sellsUnit: f.sellsUnit, sellsPack: f.sellsPack, seoTitle: f.seoTitle, seoDescription: f.seoDescription, sizeGrid: f.grid, weightG: Number(f.weightG) || 300, lengthCm: Number(f.lengthCm) || 30, widthCm: Number(f.widthCm) || 25, heightCm: Number(f.heightCm) || 3,
        sizes: rows.filter((r) => r.size.trim()).map((r) => ({ size: r.size, initialStock: Number(r.stock) || 0, packQuantity: f.sellsPack ? Number(r.pack) || 0 : 0 })),
        pack: f.sellsPack ? { name: `Grade ${packTotal} peças`, costCents: parseBRLToCents(f.packCost), suggestedPriceCents: parseBRLToCents(f.packSuggested), minimumPriceCents: parseBRLToCents(f.packMinimum) || parseBRLToCents(f.packSuggested) } : undefined,
      });
      if (r.ok) { setSaved(true); writeDraft(null); toast.success(status === "DRAFT" ? "Rascunho salvo" : "Produto cadastrado"); router.push(`${base}/${r.data.productId}`); } else toast.error(r.error);
    });
  };

  return (
    <form onSubmit={submit(f.status)}>
      {recovered ? (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-sm text-info">
          <span className="flex items-center gap-2"><RotateCcw className="size-4" aria-hidden /> Encontramos um rascunho não enviado{recovered.f.name ? ` (“${recovered.f.name}”)` : ""}. As fotos não são guardadas no rascunho.</span>
          <span className="flex gap-2"><Button type="button" size="sm" onClick={restore}>Recuperar</Button><Button type="button" size="sm" variant="ghost" onClick={discard}>Descartar</Button></span>
        </div>
      ) : null}
      <TwoColumn
        main={<>
          <Card>
            <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <FormField label="Nome" htmlFor="name" className="sm:col-span-2"><Input id="name" required value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder={independent ? "Ex.: Blusa de linho off-white" : "Manto Tricolor Paulista 2025"} /></FormField>
              <FormField label="SKU" htmlFor="sku" hint="Código único do modelo"><Input id="sku" required value={f.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} placeholder={independent ? "Ex.: BL-001" : "CS-TRI-25"} /></FormField>
              <FormField label="Categoria" htmlFor="cat" hint="Em branco, entra em “Geral”; dá para mudar depois."><Input id="cat" placeholder="Geral" list="cats" value={f.category} onChange={(e) => set({ category: e.target.value })} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></FormField>
              <div className="sm:col-span-2"><RichTextLite id="desc" label="Descrição" value={f.description} onChange={(v) => set({ description: v })} rows={5} hint="Composição, cuidados e detalhes. Aceita negrito, itálico e listas." /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Fotos</CardTitle><CardDescription>Até {MAX_IMAGES}. Arraste para ordenar e solte arquivos aqui. A primeira é a capa.</CardDescription></div></CardHeader>
            <CardContent>
              <MediaGallery items={media} onChange={(m) => { setMedia(m); setDirty(true); }} max={MAX_IMAGES} processFile={compressImage} onError={(m) => toast.error(m)} />
              {media.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">Sem foto, a loja mostra uma ilustração no lugar.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Tamanhos e estoque inicial</CardTitle><CardDescription>{independent ? "Estoque próprio da sua loja por variante." : "Um único estoque central para toda a rede."}{f.sellsPack ? " A coluna Grade define quantas peças de cada tamanho vão em cada grade." : ""}</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Grade de tamanhos">
                <span className="text-xs text-muted-foreground">Grade:</span>
                {SIZE_GRID_KEYS.map((k) => <Button key={k} type="button" size="sm" variant={f.grid === k ? "primary" : "secondary"} aria-pressed={f.grid === k} onClick={() => { set({ grid: k }); setRows(rowsFor(k)); }}>{SIZE_GRIDS[k].label}</Button>)}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <FormField label="Mesmo estoque em todos os tamanhos" htmlFor="allstock"><Input id="allstock" type="number" min={0} className="w-40" placeholder="ex.: 10" onChange={(e) => { const v = e.target.value; setRows(rows.map((r) => ({ ...r, stock: v }))); setDirty(true); }} /></FormField>
                {independent ? null : <p className="pb-2 text-xs text-muted-foreground">As lojas só ativam o produto com pelo menos {minStock} peças por tamanho.</p>}
              </div>
              {rows.some((r) => r.size && (Number(r.stock) || 0) < minStock) ? <p role="status" className="flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="size-3.5" aria-hidden /> Estoque abaixo de {minStock} em {rows.filter((r) => r.size && (Number(r.stock) || 0) < minStock).map((r) => r.size).join(", ")}: as lojas ainda não conseguirão ativar.</p> : null}
              <div className="relative overflow-x-auto"><table className="w-full min-w-[30rem] text-sm">
                <thead><tr className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"><th className="pb-2 pr-2 font-medium">Tamanho</th><th className="pb-2 pr-2 font-medium">SKU da variação</th><th className="pb-2 pr-2 font-medium">Estoque</th>{f.sellsPack ? <th className="pb-2 pr-2 font-medium">Grade</th> : null}<th className="pb-2"><span className="sr-only">Remover</span></th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2"><Input aria-label="Tamanho" value={r.size} onChange={(e) => setRow(i, { size: e.target.value.toUpperCase() })} maxLength={12} className="w-24" /></td>
                      <td className="py-1 pr-2 text-xs text-muted-foreground">{f.sku && r.size ? `${f.sku}-${r.size}` : "—"}</td>
                      <td className="py-1 pr-2"><Input aria-label="Estoque" type="number" min={0} value={r.stock} onChange={(e) => setRow(i, { stock: e.target.value })} placeholder="0" className="w-28" /></td>
                      {f.sellsPack ? <td className="py-1 pr-2"><Input aria-label="Quantidade na grade" type="number" min={0} value={r.pack} onChange={(e) => setRow(i, { pack: e.target.value })} className="w-24" /></td> : null}
                      <td className="py-1 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => { setRows(rows.filter((_, j) => j !== i)); setDirty(true); }} disabled={rows.length === 1} aria-label="Remover tamanho"><Trash2 /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <div className="flex items-center justify-between pt-1">
                <Button type="button" size="sm" variant="secondary" onClick={() => { setRows([...rows, { size: "", stock: "", pack: "0" }]); setDirty(true); }}><Plus /> Tamanho</Button>
                <span className="text-xs text-muted-foreground">Total: {stockTotal} peças{f.sellsPack ? ` · Grade: ${packTotal} peças` : ""}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Embalagem e frete</CardTitle><CardDescription>Usados na cotação de frete e nas etiquetas. Os valores já vêm com o padrão de uma camisa dobrada.</CardDescription></div></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FormField label="Peso (g)" htmlFor="wg"><Input id="wg" type="number" min={1} value={f.weightG} onChange={(e) => set({ weightG: e.target.value })} /></FormField>
              <FormField label="Comprimento (cm)" htmlFor="lc"><Input id="lc" type="number" min={1} value={f.lengthCm} onChange={(e) => set({ lengthCm: e.target.value })} /></FormField>
              <FormField label="Largura (cm)" htmlFor="wc"><Input id="wc" type="number" min={1} value={f.widthCm} onChange={(e) => set({ widthCm: e.target.value })} /></FormField>
              <FormField label="Altura (cm)" htmlFor="hc"><Input id="hc" type="number" min={1} value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} /></FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Aparência nos buscadores</CardTitle><CardDescription>Como o produto aparece no Google. Em branco, usamos o nome e o começo da descrição.</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              <SearchPreview title={f.seoTitle || f.name} description={f.seoDescription || f.description.replace(/[*_#>-]/g, "")} url={`${hostDaLoja} › product › ${slug || "nome-do-produto"}`} />
              <FormField label="Título da página" htmlFor="seot"><Input id="seot" maxLength={120} value={f.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} placeholder={f.name || "Nome do produto"} /></FormField>
              <FormField label="Descrição da página" htmlFor="seod"><Input id="seod" maxLength={320} value={f.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} /></FormField>
            </CardContent>
          </Card>
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>Status</CardTitle><Badge tone={f.status === "ACTIVE" ? "success" : "neutral"} dot>{f.status === "ACTIVE" ? "Ativo" : "Rascunho"}</Badge></CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Visibilidade" htmlFor="status"><Select id="status" value={f.status} onChange={(e) => set({ status: e.target.value as Form["status"] })}><option value="ACTIVE">{independent ? "Ativo (aparece na sua loja)" : "Ativo (visível às lojas)"}</option><option value="DRAFT">Rascunho</option></Select></FormField>
              <div className="flex flex-col gap-2">
                <Button type="submit" size="lg" loading={pending}>{f.status === "DRAFT" ? "Salvar rascunho" : "Cadastrar produto"}</Button>
                {f.status === "ACTIVE" ? <Button type="button" variant="secondary" onClick={() => submit("DRAFT")()} disabled={pending}>Salvar como rascunho</Button> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Prévia na loja</CardTitle></CardHeader>
            <CardContent>
              <div className="mx-auto max-w-[14rem] overflow-hidden rounded-lg border border-border bg-white text-neutral-900" aria-label="Prévia do cartão do produto">
                <ProductArt images={media.map((m) => m.src)} size="md" />
                <div className="space-y-0.5 p-3"><p className="line-clamp-2 text-sm font-medium">{f.name || "Nome do produto"}</p><p className="text-sm font-semibold tabular-nums">{sug ? formatBRL(sug) : "R$ 0,00"}</p><p className="text-[11px] text-neutral-500">{rows.filter((r) => r.size).map((r) => r.size).join(" · ")}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Preços</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Custo (R$)" htmlFor="cost" hint={commerce ? "Seu custo de aquisição do produto" : independent ? "Seu custo do produto" : "Quanto o lojista paga à Central"}><Input id="cost" required inputMode="decimal" value={f.cost} onChange={(e) => set({ cost: e.target.value })} placeholder="59,00" /></FormField>
              <FormField label={commerce ? "Preço de venda (R$)" : "Preço sugerido (R$)"} htmlFor="sug"><Input id="sug" required inputMode="decimal" value={f.suggested} onChange={(e) => set({ suggested: e.target.value })} placeholder="149,90" /></FormField>
              <FormField label={commerce ? "Preço promocional mínimo (R$)" : "Preço mínimo (R$)"} htmlFor="min" hint={commerce ? "Referência para proteger sua margem em promoções" : independent ? "Menor preço de referência" : "Lojas não podem vender abaixo disso"}><Input id="min" inputMode="decimal" value={f.minimum} onChange={(e) => set({ minimum: e.target.value })} placeholder="119,90" /></FormField>
              {cost > 0 ? <div className="flex flex-wrap items-center gap-1.5 text-xs" role="group" aria-label="Sugerir preço pela margem"><span className="text-muted-foreground">Sugerir com margem:</span>{[40, 50, 60].map((m) => <Button key={m} type="button" size="sm" variant="secondary" onClick={() => { const p = Math.round(cost / (1 - m / 100) / 100) * 100 - 10; set({ suggested: (p / 100).toFixed(2).replace(".", ","), minimum: (Math.round(p * 0.8 / 100) * 100 - 10 > cost ? (Math.round(p * 0.8 / 100) * 100 - 10) / 100 : cost / 100).toFixed(2).replace(".", ",") }); }}>{m}%</Button>)}</div> : null}
              {sug > 0 && cost > 0 ? <dl className="grid grid-cols-3 gap-2 rounded-md bg-surface-muted px-3 py-2 text-center text-xs"><div><dt className="text-muted-foreground">Margem</dt><dd className="font-semibold tabular-nums">{formatBRL(margin)}</dd></div><div><dt className="text-muted-foreground">Margem %</dt><dd className="font-semibold tabular-nums">{marginPct}%</dd></div><div><dt className="text-muted-foreground">Markup</dt><dd className="font-semibold tabular-nums">{markup}%</dd></div></dl> : null}
              {priceIssue ? <p role="alert" className="flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="size-3.5" aria-hidden /> {priceIssue}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Como vende</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Switch checked={f.sellsUnit} onCheckedChange={(v) => set({ sellsUnit: v })} label="Venda unitária (varejo)" />
              <Switch checked={f.sellsPack} onCheckedChange={(v) => set({ sellsPack: v })} label="Grade (atacado)" />
              {f.sellsPack ? (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <div className="text-xs text-muted-foreground">Grade de {packTotal} peças</div>
                  <FormField label="Custo da grade (R$)" htmlFor="pc"><Input id="pc" inputMode="decimal" required value={f.packCost} onChange={(e) => set({ packCost: e.target.value })} /></FormField>
                  <FormField label="Preço sugerido da grade (R$)" htmlFor="ps"><Input id="ps" inputMode="decimal" required value={f.packSuggested} onChange={(e) => set({ packSuggested: e.target.value })} /></FormField>
                  <FormField label="Preço mínimo da grade (R$)" htmlFor="pm"><Input id="pm" inputMode="decimal" value={f.packMinimum} onChange={(e) => set({ packMinimum: e.target.value })} /></FormField>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {!independent ? <Card>
            <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Quem pode vender" htmlFor="dist"><Select id="dist" value={f.distribution} onChange={(e) => set({ distribution: e.target.value as Form["distribution"] })}><option value="ALL_NETWORK">Toda a rede</option><option value="SELECTED_STORES">Lojas selecionadas</option></Select></FormField>
              {f.distribution === "SELECTED_STORES" ? (
                stores.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma loja na rede ainda.</p> : (
                  <ul className="space-y-1">{stores.map((s) => <li key={s.id}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={storeIds.includes(s.id)} onChange={(e) => { setStoreIds(e.target.checked ? [...storeIds, s.id] : storeIds.filter((x) => x !== s.id)); setDirty(true); }} /> {s.name}</label></li>)}</ul>
                )
              ) : null}
            </CardContent>
          </Card> : null}
        </>}
      />
    </form>
  );
}
