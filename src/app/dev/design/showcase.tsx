"use client";
import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { StatusBadge } from "@/components/app/status-badge";
import { Banner } from "@/components/ds/banner";
import { ContextualSaveBar } from "@/components/ds/contextual-save-bar";
import { ColorField, FontPicker, KeyboardHint, LinkPicker, RangeField, ResourcePicker, RichTextLite, SearchPreview, SlugField } from "@/components/ds/fields";
import { IndexList } from "@/components/ds/index-list";
import { MediaGallery, type MediaItem } from "@/components/ds/media-gallery";
import { Page, TwoColumn } from "@/components/ds/page";
import { SkeletonList, SkeletonTwoColumn } from "@/components/ds/skeletons";
import type { IndexSpec, IndexView } from "@/lib/ds/index-list";
import { formatBRL } from "@/lib/money";

type Row = { id: string; name: string; status: "ACTIVE" | "DRAFT"; stock: number; priceCents: number };
const ROWS: Row[] = [
  { id: "p1", name: "Camisa Tailandesa São Paulo 25/26", status: "ACTIVE", stock: 42, priceCents: 12000 },
  { id: "p2", name: "Camisa Tailandesa Flamengo 25/26", status: "ACTIVE", stock: 8, priceCents: 12000 },
  { id: "p3", name: "Camisa Tailandesa Corinthians 25/26", status: "DRAFT", stock: 0, priceCents: 12000 },
  { id: "p4", name: "Camisa Tailandesa Palmeiras 25/26", status: "ACTIVE", stock: 27, priceCents: 12000 },
  { id: "p5", name: "Camisa Tailandesa Santos 25/26", status: "DRAFT", stock: 15, priceCents: 12000 },
];
const SPEC: IndexSpec<Row> = { searchText: (r) => r.name, filterValue: { status: (r) => r.status }, sortValue: { name: (r) => r.name, stock: (r) => r.stock, price: (r) => r.priceCents } };
const VIEWS: IndexView[] = [{ id: "active", name: "Ativos", query: { search: "", filters: { status: "ACTIVE" }, sort: null } }, { id: "low", name: "Estoque baixo", query: { search: "", filters: {}, sort: { key: "stock", dir: "asc" } } }];

const art = (bg: string, fg: string, t: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${bg}"/><text x="100" y="112" font-size="34" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="${fg}">${t}</text></svg>`)}`;
const INITIAL_MEDIA: MediaItem[] = [{ id: "a", src: art("#0f1c16", "#22c55e", "Frente"), alt: "" }, { id: "b", src: art("#1240c7", "#ffffff", "Verso"), alt: "" }, { id: "c", src: art("#a4570a", "#fdf0cf", "Detalhe"), alt: "" }];

export function Showcase() {
  const [panel, setPanel] = React.useState<"master" | "supplier" | "lite" | "pro">("lite");
  const [saved, setSaved] = React.useState({ title: "Camisa Tailandesa São Paulo 25/26", slug: "camisa-tailandesa-sao-paulo", color: "#12a150", radius: 12, font: "moderna", link: "/catalog", body: "**Tecido leve** e respirável.\n\n- Modelagem torcedor\n- Envio em 24h", media: INITIAL_MEDIA, product: ["p1"] });
  const [draft, setDraft] = React.useState(saved);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const save = () => { setSaving(true); setTimeout(() => { setSaved(draft); setSaving(false); toast.success("Alterações salvas"); }, 500); };
  const [skeleton, setSkeleton] = React.useState<"none" | "list" | "two">("none");

  return (
    <div data-panel={panel} className="rounded-2xl border border-border bg-background p-5">
      <ContextualSaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setDraft(saved)} />
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Clima do painel">
        {(["master", "supplier", "lite", "pro"] as const).map((p) => <Button key={p} size="sm" variant={panel === p ? "primary" : "secondary"} aria-pressed={panel === p} onClick={() => setPanel(p)} className="capitalize">{p}</Button>)}
        <span className="ml-auto text-xs text-muted-foreground">Edite qualquer campo para ver a barra de salvar <KeyboardHint keys={["Ctrl", "S"]} /></span>
      </div>
      <Page title="Editar produto" subtitle="Página em duas colunas com barra de alterações, campos ricos e lista com visões." breadcrumbs={[{ label: "Produtos", href: "#" }, { label: "Camisa Tailandesa" }]} badge={<StatusBadge value="ACTIVE" />} primaryAction={<Button><Plus /> Novo produto</Button>} secondaryActions={<Button variant="secondary">Duplicar</Button>}>
        <div className="mb-6 grid gap-3 md:grid-cols-2"><Banner tone="info" title="Dica">Arraste as fotos para ordenar. A primeira é a capa.</Banner><Banner tone="warning" title="Estoque baixo">Faltam poucas unidades do tamanho M.</Banner><Banner tone="success">Produto publicado na loja.</Banner><Banner tone="critical" title="Preço abaixo do mínimo">Ajuste antes de publicar.</Banner></div>
        <TwoColumn
          main={<>
            <Card><CardHeader><CardTitle>Informações</CardTitle></CardHeader><CardContent className="space-y-4">
              <FormField label="Título" htmlFor="t"><Input id="t" value={draft.title} onChange={(e) => set("title", e.target.value)} /></FormField>
              <RichTextLite id="body" label="Descrição" value={draft.body} onChange={(v) => set("body", v)} />
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Fotos</CardTitle></CardHeader><CardContent><MediaGallery items={draft.media} onChange={(m) => set("media", m)} max={6} onError={(m) => toast.error(m)} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Busca no Google</CardTitle></CardHeader><CardContent className="space-y-4">
              <SlugField id="slug" value={draft.slug} onChange={(v) => set("slug", v)} source={draft.title} prefix="loja.superdrop.com.br/produto/" />
              <SearchPreview title={draft.title} description="Camisa Tailandesa com tecido leve, modelagem torcedor e envio em 24 horas." url={`loja.superdrop.com.br › produto › ${draft.slug}`} />
            </CardContent></Card>
          </>}
          aside={<>
            <Card><CardHeader><CardTitle>Aparência</CardTitle></CardHeader><CardContent className="space-y-4">
              <ColorField id="c" label="Cor de destaque" value={draft.color} onChange={(v) => set("color", v)} against="#ffffff" swatches={["#12a150", "#1240c7", "#a4570a", "#b42318", "#0f1c16"]} />
              <RangeField id="r" label="Cantos" value={draft.radius} onChange={(v) => set("radius", v)} min={0} max={32} unit="px" />
              <FontPicker label="Fonte dos títulos" value={draft.font} onChange={(v) => set("font", v)} />
              <LinkPicker id="l" label="Link do botão" value={draft.link} onChange={(v) => set("link", v)} destinations={[{ label: "Catálogo", href: "/catalog" }, { label: "Carrinho", href: "/cart" }]} />
              <ResourcePicker id="rp" label="Produto em destaque" noun="produto" options={ROWS.map((r) => ({ id: r.id, label: r.name, sublabel: formatBRL(r.priceCents) }))} value={draft.product} onChange={(v) => set("product", v)} />
            </CardContent></Card>
          </>}
        />
        <div className="mt-8"><h2 className="mb-3 text-base font-semibold">Lista com visões salvas e ações em lote</h2>
          <IndexList storageKey="dev-design" rows={ROWS} rowKey={(r) => r.id} spec={SPEC} defaultViews={VIEWS} noun={{ singular: "produto", plural: "produtos" }} searchPlaceholder="Buscar produto"
            filters={[{ key: "status", label: "Status", options: [{ value: "ACTIVE", label: "Ativo" }, { value: "DRAFT", label: "Rascunho" }] }]}
            bulkActions={[{ label: "Arquivar", onRun: (ids) => { toast.success(`${ids.length} arquivado(s)`); } }, { label: "Excluir", tone: "danger", onRun: (ids) => { toast.error(`${ids.length} excluído(s) (simulação)`); } }]}
            rowHref={() => "#"}
            columns={[
              { key: "n", header: "Produto", sortKey: "name", primary: true, cell: (r) => r.name },
              { key: "s", header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
              { key: "e", header: "Estoque", sortKey: "stock", align: "right", hideBelow: "md", cell: (r) => r.stock },
              { key: "p", header: "Preço", sortKey: "price", align: "right", cell: (r) => formatBRL(r.priceCents) },
            ]} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2"><span className="text-sm font-medium">Esqueletos:</span>
          {(["none", "list", "two"] as const).map((k) => <Button key={k} size="sm" variant={skeleton === k ? "primary" : "secondary"} onClick={() => setSkeleton(k)}>{k === "none" ? "Ocultar" : k === "list" ? "Lista" : "Duas colunas"}</Button>)}
        </div>
        {skeleton === "list" ? <div className="mt-4"><SkeletonList rows={4} /></div> : skeleton === "two" ? <div className="mt-4"><SkeletonTwoColumn /></div> : null}
      </Page>
    </div>
  );
}
