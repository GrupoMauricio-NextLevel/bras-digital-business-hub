"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowDown, ArrowUp, Copy, ExternalLink, Palette, Plus, Save, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch } from "@/components/ui/input";
import { TwoColumn } from "@/components/ds/page";
import { MediaGallery, type MediaItem } from "@/components/ds/media-gallery";
import { RichTextLite, SearchPreview } from "@/components/ds/fields";
import { ContextualSaveBar } from "@/components/ds/contextual-save-bar";
import { bulkProductStatusAction, duplicateProductAction, excluirProdutosAction, salvarProdutoAction } from "@/app/actions/supplier";
import { compressImage } from "@/lib/client-image";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { SIZE_GRIDS, SIZE_GRID_KEYS, type SizeGridKey } from "@/lib/domain/size-grids";
import { cn } from "@/lib/utils";

type Status = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type EditorProduto = {
  id: string; name: string; description: string; category: string; sku: string; slug: string; images: string[];
  costCents: number; suggestedPriceCents: number; minimumPriceCents: number; status: Status; sellsUnit: boolean; sellsPack: boolean;
  seoTitle: string; seoDescription: string; sizeGrid: SizeGridKey; weightG: number; lengthCm: number; widthCm: number; heightCm: number;
};
export type EditorVariacao = { id: string; size: string; color: string | null; sku: string; barcode: string; onHand: number; reserved: number };
type Linha = { key: string; id?: string; size: string; color: string; sku: string; barcode: string; estoque: string; reserved: number };

const MAX_FOTOS = 8;
/** Mesma regra da loja: tudo que não é a ilustração "art:" é foto de verdade (envio, biblioteca, migração, demonstração). */
const ehFoto = (s: string) => !!s && !s.startsWith("art:");
const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const slugDe = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let seq = 0;
const novaChave = () => `n${Date.now().toString(36)}${seq++}`;
const paraLinha = (v: EditorVariacao): Linha => ({ key: v.id, id: v.id, size: v.size, color: v.color ?? "", sku: v.sku, barcode: v.barcode, estoque: String(v.onHand), reserved: v.reserved });

/** Editor completo do produto (D328): fotos, informações, preço, variações e estoque, frete e buscadores, salvos juntos. */
export function ProductEditor({ produto, variacoes, categorias, base, independent, commerce, enderecoProduto, hostDaLoja }: {
  produto: EditorProduto; variacoes: EditorVariacao[]; categorias: string[]; base: string; independent: boolean; commerce: boolean;
  /** Página do produto na loja (só da loja independente). */ enderecoProduto: string | null; hostDaLoja: string;
}) {
  const router = useRouter();
  const inicial = React.useMemo(() => ({
    f: { name: produto.name, description: produto.description, category: produto.category, sku: produto.sku, slug: produto.slug, cost: reais(produto.costCents), price: reais(produto.suggestedPriceCents), minimum: produto.minimumPriceCents && produto.minimumPriceCents !== produto.suggestedPriceCents ? reais(produto.minimumPriceCents) : "", status: produto.status, sellsUnit: produto.sellsUnit, sellsPack: produto.sellsPack, seoTitle: produto.seoTitle, seoDescription: produto.seoDescription, grid: produto.sizeGrid, weight: String(produto.weightG), len: String(produto.lengthCm), wid: String(produto.widthCm), hei: String(produto.heightCm) },
    media: produto.images.filter(ehFoto).map((src, i) => ({ id: `f${i}`, src, alt: "" })) as MediaItem[],
    linhas: variacoes.map(paraLinha),
  }), [produto, variacoes]);
  const [f, setF] = React.useState(inicial.f);
  const [media, setMedia] = React.useState<MediaItem[]>(inicial.media);
  const [linhas, setLinhas] = React.useState<Linha[]>(inicial.linhas);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, start] = React.useTransition();
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  const semChave = (ls: Linha[]) => ls.map((l) => [l.id, l.size, l.color, l.sku, l.barcode, l.estoque]);
  const dirty = JSON.stringify([f, media.map((m) => m.src), semChave(linhas)]) !== JSON.stringify([inicial.f, inicial.media.map((m) => m.src), semChave(inicial.linhas)]);
  const descartar = () => { setF(inicial.f); setMedia(inicial.media); setLinhas(inicial.linhas); setErro(null); };

  const salvar = React.useCallback(() => {
    setErro(null);
    start(async () => {
      const price = parseBRLToCents(f.price);
      const r = await salvarProdutoAction({
        productId: produto.id, name: f.name, description: f.description, categoryName: f.category, sku: f.sku, slug: f.slug,
        costCents: parseBRLToCents(f.cost), suggestedPriceCents: price, minimumPriceCents: f.minimum ? parseBRLToCents(f.minimum) : price,
        status: f.status, sellsUnit: f.sellsUnit, sellsPack: f.sellsPack, seoTitle: f.seoTitle, seoDescription: f.seoDescription, sizeGrid: f.grid,
        weightG: Number(f.weight) || 300, lengthCm: Number(f.len) || 30, widthCm: Number(f.wid) || 25, heightCm: Number(f.hei) || 3,
        images: media.map((m) => m.src),
        variacoes: linhas.map((l) => ({ id: l.id, size: l.size, color: l.color || null, sku: l.sku, barcode: l.barcode, estoque: Number(l.estoque) || 0 })),
      });
      if (r.ok) { toast.success("Produto salvo"); router.refresh(); } else { setErro(r.error); toast.error(r.error); }
    });
  }, [f, media, linhas, produto.id, router]);

  // Foto removida fica pendente até salvar; o aviso oferece desfazer na hora.
  const mudarFotos = (novas: MediaItem[]) => {
    const antes = media;
    setMedia(novas);
    if (novas.length < antes.length) toast(novas.length === 0 ? "Fotos removidas" : "Foto removida", { description: "Clique em Salvar para confirmar.", action: { label: "Desfazer", onClick: () => setMedia(antes) } });
  };

  /* ---------------- variações ---------------- */
  const cores = [...new Set(linhas.map((l) => l.color.trim()).filter(Boolean))];
  const setLinha = (key: string, patch: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const mover = (i: number, d: -1 | 1) => setLinhas((ls) => { const j = i + d; if (j < 0 || j >= ls.length) return ls; const c = [...ls]; [c[i], c[j]] = [c[j]!, c[i]!]; return c; });
  const remover = (l: Linha) => { setLinhas((ls) => ls.filter((x) => x.key !== l.key)); if (l.id) toast("Tamanho removido", { description: "Clique em Salvar para confirmar.", action: { label: "Desfazer", onClick: () => setLinhas((ls) => (ls.some((x) => x.key === l.key) ? ls : [...ls, l])) } }); };
  const adicionarTamanho = () => setLinhas((ls) => [...ls, { key: novaChave(), size: "", color: cores[0] ?? "", sku: "", barcode: "", estoque: "0", reserved: 0 }]);
  const aplicarModelo = (k: SizeGridKey) => {
    set({ grid: k });
    const tamanhos = SIZE_GRIDS[k].sizes; if (!tamanhos.length) return;
    const grupos = cores.length ? cores : [""];
    setLinhas((ls) => {
      const tem = new Set(ls.map((l) => `${l.color.toLowerCase()}|${l.size.toUpperCase()}`));
      const novas = grupos.flatMap((c) => tamanhos.filter((t) => !tem.has(`${c.toLowerCase()}|${t}`)).map((t) => ({ key: novaChave(), size: t, color: c, sku: "", barcode: "", estoque: "0", reserved: 0 })));
      if (novas.length) toast(`${novas.length} tamanho${novas.length === 1 ? "" : "s"} do modelo ${SIZE_GRIDS[k].label} adicionado${novas.length === 1 ? "" : "s"}`, { description: "Remova na lixeira os que você não vende." });
      return [...ls, ...novas];
    });
  };
  const [novaCor, setNovaCor] = React.useState("");
  const adicionarCor = () => {
    const cor = novaCor.trim(); if (cor.length < 2) return;
    if (cores.some((c) => c.toLowerCase() === cor.toLowerCase())) { toast.error("Essa cor já existe."); return; }
    setLinhas((ls) => {
      // Peças sem cor ganham a primeira cor antes de abrir a segunda (senão a loja não sabe de que cor elas são).
      if (!cores.length) return [...ls.map((l) => ({ ...l, color: cor }))];
      const base = ls.filter((l) => l.color === cores[0]);
      return [...ls, ...base.map((l) => ({ key: novaChave(), size: l.size, color: cor, sku: "", barcode: "", estoque: "0", reserved: 0 }))];
    });
    setNovaCor("");
  };
  const removerCor = (cor: string) => { const antes = linhas; setLinhas((ls) => ls.filter((l) => l.color !== cor)); toast(`Cor ${cor} removida`, { description: "Clique em Salvar para confirmar.", action: { label: "Desfazer", onClick: () => setLinhas(antes) } }); };
  const totalEstoque = linhas.reduce((s, l) => s + (Number(l.estoque) || 0), 0);

  /* ---------------- preço ---------------- */
  const custo = parseBRLToCents(f.cost), preco = parseBRLToCents(f.price), minimo = f.minimum ? parseBRLToCents(f.minimum) : preco;
  const margem = preco - custo, margemPct = preco > 0 ? Math.round((margem / preco) * 100) : 0;
  const alertaPreco = minimo > preco ? "O preço mínimo está acima do preço de venda." : custo > 0 && preco > 0 && preco < custo ? "O preço de venda está abaixo do custo." : null;
  const slugAtual = f.slug || slugDe(f.name);

  return (
    <>
      <ContextualSaveBar dirty={dirty} saving={salvando} error={erro} onSave={salvar} onDiscard={descartar} saveLabel="Salvar produto" />
      <TwoColumn
        main={<>
          <Card>
            <CardHeader><div><CardTitle>Fotos</CardTitle><CardDescription>Até {MAX_FOTOS}. A primeira é a capa. Arraste para ordenar; a lixeira fica em cada foto.</CardDescription></div></CardHeader>
            <CardContent>
              <MediaGallery items={media} onChange={mudarFotos} max={MAX_FOTOS} processFile={compressImage} onError={(m) => toast.error(m)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <FormField label="Nome" htmlFor="name" className="sm:col-span-2"><Input id="name" value={f.name} onChange={(e) => set({ name: e.target.value })} /></FormField>
              <FormField label="Categoria" htmlFor="cat" hint="Escolha uma da lista ou digite uma nova."><Input id="cat" list="cats" value={f.category} placeholder="Geral" onChange={(e) => set({ category: e.target.value })} /><datalist id="cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist></FormField>
              <FormField label="SKU (código do produto)" htmlFor="sku" hint="Os SKUs dos tamanhos acompanham a troca."><Input id="sku" value={f.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} /></FormField>
              <div className="sm:col-span-2"><RichTextLite id="desc" label="Descrição" value={f.description} onChange={(v) => set({ description: v })} rows={6} hint="Composição, medidas, cuidados. Aceita negrito, itálico e listas." /></div>
              <FormField label="Endereço da página" htmlFor="slug" className="sm:col-span-2" hint={`${hostDaLoja}/product/${slugAtual || "…"}`}><Input id="slug" value={f.slug} onChange={(e) => set({ slug: slugDe(e.target.value) })} placeholder={slugDe(f.name)} /></FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Preço</CardTitle><CardDescription>{independent ? "O preço de venda é o que a sua loja cobra. Mudou aqui, mudou na loja." : "O sugerido e o mínimo valem para as lojas da rede."}</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label={independent ? "Preço de venda (R$)" : "Preço sugerido (R$)"} htmlFor="price"><Input id="price" inputMode="decimal" value={f.price} onChange={(e) => set({ price: e.target.value })} /></FormField>
                <FormField label={independent ? "Custo (só você vê)" : "Custo (R$)"} htmlFor="cost"><Input id="cost" inputMode="decimal" value={f.cost} onChange={(e) => set({ cost: e.target.value })} /></FormField>
                <FormField label={commerce || independent ? "Mínimo em promoções (opcional)" : "Preço mínimo (R$)"} htmlFor="min" hint={independent ? "Cupons e promoções não descem abaixo disso." : "Lojas não vendem abaixo disso."}><Input id="min" inputMode="decimal" value={f.minimum} placeholder={f.price} onChange={(e) => set({ minimum: e.target.value })} /></FormField>
              </div>
              {preco > 0 && custo > 0 ? <p className="text-xs text-muted-foreground">Margem de {formatBRL(margem)} por peça ({margemPct}%).</p> : null}
              {alertaPreco ? <p role="alert" className="flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="size-3.5" aria-hidden /> {alertaPreco}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Variações e estoque</CardTitle><CardDescription>Cor e tamanho de cada peça, com o estoque físico. Mudou o estoque, o sistema registra o ajuste.</CardDescription></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Modelos de grade de tamanhos">
                <span className="text-xs text-muted-foreground">Adicionar tamanhos de:</span>
                {SIZE_GRID_KEYS.filter((k) => k !== "CUSTOM").map((k) => <Button key={k} type="button" size="sm" variant={f.grid === k ? "primary" : "secondary"} aria-pressed={f.grid === k} onClick={() => aplicarModelo(k)}>{SIZE_GRIDS[k].label}</Button>)}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-xs text-muted-foreground">Cores:</span>
                {cores.length ? cores.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium">{c}<button type="button" onClick={() => removerCor(c)} aria-label={`Remover a cor ${c}`} className="rounded-full p-0.5 hover:bg-surface-muted"><X className="size-3.5" aria-hidden /></button></span>) : <span className="text-xs text-muted-foreground">cor única</span>}
                <label className="sr-only" htmlFor="novacor">Nova cor</label>
                <Input id="novacor" value={novaCor} onChange={(e) => setNovaCor(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarCor(); } }} placeholder={cores.length ? "Nova cor (ex.: Azul)" : "Cor das peças (ex.: Preto)"} className="h-9 w-48" maxLength={24} />
                <Button type="button" size="sm" variant="secondary" onClick={adicionarCor} disabled={novaCor.trim().length < 2}><Palette /> {cores.length ? "Adicionar cor" : "Dar nome à cor"}</Button>
              </div>
              <div className="relative -mx-1 overflow-x-auto px-1"><table className="w-full min-w-[38rem] table-fixed text-sm"><colgroup><col className="w-[16%]" /><col className="w-[10%]" /><col className="w-[22%]" /><col className="w-[19%]" /><col className="w-[12%]" /><col className="w-[21%]" /></colgroup>
                <thead><tr className="text-left text-xs font-medium text-muted-foreground"><th className="pb-2 pr-2 font-medium">Cor</th><th className="pb-2 pr-2 font-medium">Tamanho</th><th className="pb-2 pr-2 font-medium">SKU</th><th className="pb-2 pr-2 font-medium">Cód. de barras</th><th className="pb-2 pr-2 font-medium">Estoque</th><th className="pb-2 font-medium"><span className="sr-only">Ordem e remover</span></th></tr></thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.key} className="border-t border-border">
                      <td className="py-1.5 pr-2"><Input aria-label={`Cor da linha ${i + 1}`} value={l.color} list="cores-produto" onChange={(e) => setLinha(l.key, { color: e.target.value })} placeholder="—" className="h-9 w-full min-w-0" maxLength={24} /></td>
                      <td className="py-1.5 pr-2"><Input aria-label={`Tamanho da linha ${i + 1}`} value={l.size} onChange={(e) => setLinha(l.key, { size: e.target.value.toUpperCase() })} className="h-9 w-full min-w-0" maxLength={12} required /></td>
                      <td className="py-1.5 pr-2"><Input aria-label={`SKU da linha ${i + 1}`} value={l.sku} onChange={(e) => setLinha(l.key, { sku: e.target.value.toUpperCase() })} placeholder="automático" className="h-9 w-full min-w-0" /></td>
                      <td className="py-1.5 pr-2"><Input aria-label={`Código de barras da linha ${i + 1}`} value={l.barcode} inputMode="numeric" onChange={(e) => setLinha(l.key, { barcode: e.target.value.replace(/\D/g, "") })} placeholder="opcional" className="h-9 w-full min-w-0" maxLength={20} /></td>
                      <td className="py-1.5 pr-2"><Input aria-label={`Estoque da linha ${i + 1}`} type="number" min={l.reserved} value={l.estoque} onChange={(e) => setLinha(l.key, { estoque: e.target.value })} className="h-9 w-full min-w-0" />{l.reserved ? <span className="mt-0.5 block text-[11px] text-warning">{l.reserved} reservada{l.reserved === 1 ? "" : "s"}</span> : null}</td>
                      <td className="py-1.5 text-right"><span className="inline-flex">
                        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${l.size}`}><ArrowUp /></Button>
                        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => mover(i, 1)} disabled={i === linhas.length - 1} aria-label={`Descer ${l.size}`}><ArrowDown /></Button>
                        <Button type="button" variant="ghost" size="icon" className="size-8 text-danger" onClick={() => remover(l)} disabled={linhas.length === 1 || l.reserved > 0} title={l.reserved > 0 ? "Tem peças reservadas em pedidos" : "Remover"} aria-label={`Remover ${l.color ? `${l.color} ` : ""}${l.size || "linha"}`}><Trash2 /></Button>
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table><datalist id="cores-produto">{cores.map((c) => <option key={c} value={c} />)}</datalist></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={adicionarTamanho}><Plus /> Tamanho</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { const v = window.prompt("Mesmo estoque em todos os tamanhos:"); if (v !== null && /^\d+$/.test(v.trim())) setLinhas((ls) => ls.map((l) => ({ ...l, estoque: String(Math.max(Number(v), l.reserved)) }))); }}>Mesmo estoque em todos</Button>
                </span>
                <span className="text-xs text-muted-foreground">Total: {totalEstoque} peças · {linhas.length} variaç{linhas.length === 1 ? "ão" : "ões"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tamanho que já foi vendido não pode ser apagado (o pedido guarda ele): zere o estoque para sair da loja.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Embalagem e frete</CardTitle><CardDescription>Usados na cotação do frete e nas etiquetas.</CardDescription></div></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FormField label="Peso (g)" htmlFor="wg"><Input id="wg" type="number" min={1} value={f.weight} onChange={(e) => set({ weight: e.target.value })} /></FormField>
              <FormField label="Comprimento (cm)" htmlFor="lc"><Input id="lc" type="number" min={1} value={f.len} onChange={(e) => set({ len: e.target.value })} /></FormField>
              <FormField label="Largura (cm)" htmlFor="wc"><Input id="wc" type="number" min={1} value={f.wid} onChange={(e) => set({ wid: e.target.value })} /></FormField>
              <FormField label="Altura (cm)" htmlFor="hc"><Input id="hc" type="number" min={1} value={f.hei} onChange={(e) => set({ hei: e.target.value })} /></FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Aparência nos buscadores</CardTitle><CardDescription>Como o produto aparece no Google. Em branco, usamos o nome e o começo da descrição.</CardDescription></div></CardHeader>
            <CardContent className="min-w-0 space-y-3">
              <SearchPreview title={f.seoTitle || f.name} description={f.seoDescription || f.description.replace(/[*_#>-]/g, "")} url={`${hostDaLoja} › product › ${slugAtual}`} />
              <FormField label="Título da página" htmlFor="seot"><Input id="seot" maxLength={120} value={f.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} placeholder={f.name} /></FormField>
              <FormField label="Descrição da página" htmlFor="seod"><Input id="seod" maxLength={320} value={f.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} /></FormField>
            </CardContent>
          </Card>
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>Publicação</CardTitle><Badge tone={f.status === "ACTIVE" ? "success" : f.status === "ARCHIVED" ? "outline" : "neutral"} dot>{f.status === "ACTIVE" ? "Ativo" : f.status === "ARCHIVED" ? "Arquivado" : "Rascunho"}</Badge></CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Situação" htmlFor="status"><Select id="status" value={f.status} onChange={(e) => set({ status: e.target.value as Status })}><option value="ACTIVE">{independent ? "Ativo (à venda na loja)" : "Ativo (visível às lojas)"}</option><option value="DRAFT">Rascunho (fora da loja)</option><option value="ARCHIVED">Arquivado (guardado)</option></Select></FormField>
              <div className="flex flex-col gap-2 py-1"><Switch checked={f.sellsUnit} onCheckedChange={(v) => set({ sellsUnit: v })} label="Vende por peça" /><Switch checked={f.sellsPack} onCheckedChange={(v) => set({ sellsPack: v })} label="Vende em grade (atacado)" /></div>
              <Button type="button" className="w-full" size="lg" onClick={salvar} loading={salvando} disabled={!dirty}><Save /> {dirty ? "Salvar produto" : "Tudo salvo"}</Button>
              {enderecoProduto && produto.status === "ACTIVE" ? <a href={enderecoProduto} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}><ExternalLink /> Ver na loja</a> : null}
            </CardContent>
          </Card>
          <AcoesDoProduto productId={produto.id} nome={produto.name} status={produto.status} base={base} />
        </>}
      />
    </>
  );
}

/** Duplicar, arquivar/reativar e excluir (D328). */
function AcoesDoProduto({ productId, nome, status, base }: { productId: string; nome: string; status: Status; base: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [confirmar, setConfirmar] = React.useState(false);
  return (
    <Card>
      <CardHeader><CardTitle>Mais ações</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="secondary" loading={pending} onClick={() => start(async () => { const r = await duplicateProductAction(productId); if (r.ok) { toast.success("Cópia criada como rascunho"); router.push(`${base}/${r.data.productId}`); } else toast.error(r.error); })}><Copy /> Duplicar</Button>
        <Button variant="secondary" disabled={pending} onClick={() => start(async () => { const r = await bulkProductStatusAction([productId], status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"); if (r.ok) { toast.success(status === "ARCHIVED" ? "Produto reativado" : "Produto arquivado"); router.refresh(); } else toast.error(r.error); })}>{status === "ARCHIVED" ? "Reativar" : "Arquivar"}</Button>
        <Button variant="danger" disabled={pending} onClick={() => setConfirmar(true)}><Trash2 /> Excluir produto</Button>
        <Dialog open={confirmar} onOpenChange={setConfirmar}>
          <DialogContent title={`Excluir “${nome}”?`} description="O produto sai do painel e da loja. Se ele já foi vendido, os pedidos antigos continuam mostrando o nome, o tamanho e o preço. Não dá para desfazer.">
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmar(false)}>Cancelar</Button>
              <Button variant="danger" loading={pending} onClick={() => start(async () => { const r = await excluirProdutosAction([productId]); if (r.ok) { toast.success("Produto excluído"); setConfirmar(false); router.push(base); } else toast.error(r.error); })}><Trash2 /> Excluir de vez</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
