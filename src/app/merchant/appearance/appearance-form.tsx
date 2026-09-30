"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Monitor, Plus, Save, Smartphone, Tablet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/app/form-field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { updateAppearanceAction } from "@/app/actions/merchant";
import type { ThemeSettingsData } from "@/db/schema";
import { readableOn } from "@/lib/utils";

type State = { logoText: string; primaryColor: string; accentColor: string; settings: ThemeSettingsData };
const PRESETS = [["#0f172a", "#16a34a"], ["#1d4ed8", "#f59e0b"], ["#7c2d12", "#ca8a04"], ["#111827", "#dc2626"], ["#065f46", "#f97316"], ["#4c1d95", "#22d3ee"]];

const WIDTHS = [{ key: "desktop", label: "Computador", px: null, icon: Monitor }, { key: "tablet", label: "Tablet", px: 768, icon: Tablet }, { key: "mobile", label: "Celular", px: 390, icon: Smartphone }] as const;

export function AppearanceForm({ initial, slug, name, advanced = false }: { initial: State; slug: string; name: string; advanced?: boolean }) {
  const [width, setWidth] = React.useState<(typeof WIDTHS)[number]["key"]>("desktop");
  const frame = WIDTHS.find((w) => w.key === width)!;
  const router = useRouter();
  const [s, setS] = React.useState<State>(initial);
  const [pending, start] = React.useTransition();
  const [previewKey, setPreviewKey] = React.useState(0);
  const set = (patch: Partial<State>) => setS({ ...s, ...patch });
  const setT = (patch: Partial<ThemeSettingsData>) => setS({ ...s, settings: { ...s.settings, ...patch } });

  const save = () => start(async () => {
    const r = await updateAppearanceAction(s);
    if (r.ok) { toast.success("Aparência salva"); router.refresh(); setPreviewKey((k) => k + 1); } else toast.error(r.error);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader><div><CardTitle>Marca</CardTitle><CardDescription>Logo em texto e paleta da loja.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-lg text-lg font-bold" style={{ background: s.primaryColor, color: readableOn(s.primaryColor) }}>{s.logoText || "?"}</span>
              <FormField label="Logo (texto curto)" htmlFor="logo" className="flex-1" hint="Upload de imagem em breve"><Input id="logo" maxLength={4} value={s.logoText} onChange={(e) => set({ logoText: e.target.value.toUpperCase() })} /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cor principal" htmlFor="primary"><div className="flex items-center gap-2"><input type="color" value={s.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="size-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5" /><Input id="primary" value={s.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} /></div></FormField>
              <FormField label="Cor de destaque" htmlFor="accent"><div className="flex items-center gap-2"><input type="color" value={s.accentColor} onChange={(e) => set({ accentColor: e.target.value })} className="size-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5" /><Input id="accent" value={s.accentColor} onChange={(e) => set({ accentColor: e.target.value })} /></div></FormField>
            </div>
            <div className="flex flex-wrap gap-2">{PRESETS.map(([p, a]) => <button key={p} type="button" onClick={() => set({ primaryColor: p!, accentColor: a! })} className="flex overflow-hidden rounded-md border border-border" aria-label={`Paleta ${p}`}><span className="size-6" style={{ background: p }} /><span className="size-6" style={{ background: a }} /></button>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Conteúdo da home</CardTitle><CardDescription>Separado do layout (ThemeSettings).</CardDescription></div></CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Barra de anúncio" htmlFor="ann"><Input id="ann" value={s.settings.announcement} onChange={(e) => setT({ announcement: e.target.value })} placeholder="Frete grátis acima de R$ 299" /></FormField>
            <FormField label="Título principal" htmlFor="hero"><Input id="hero" value={s.settings.heroTitle} onChange={(e) => setT({ heroTitle: e.target.value })} /></FormField>
            <FormField label="Subtítulo" htmlFor="sub"><Textarea id="sub" value={s.settings.heroSubtitle} onChange={(e) => setT({ heroSubtitle: e.target.value })} /></FormField>
            <FormField label="Texto do botão" htmlFor="cta"><Input id="cta" value={s.settings.heroCta} onChange={(e) => setT({ heroCta: e.target.value })} /></FormField>
            <Switch checked={s.settings.showCategories} onCheckedChange={(v) => setT({ showCategories: v })} label="Mostrar categorias" />
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">Banners</span><Button type="button" size="sm" variant="secondary" onClick={() => setT({ banners: [...s.settings.banners, { title: "Novo banner", subtitle: "", tone: "primary" }] })}><Plus /> Banner</Button></div>
              <div className="space-y-2">
                {s.settings.banners.map((b, i) => (
                  <div key={i} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <Input value={b.title} onChange={(e) => setT({ banners: s.settings.banners.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Título" />
                    <Input value={b.subtitle} onChange={(e) => setT({ banners: s.settings.banners.map((x, j) => (j === i ? { ...x, subtitle: e.target.value } : x)) })} placeholder="Subtítulo" />
                    <Select value={b.tone} onChange={(e) => setT({ banners: s.settings.banners.map((x, j) => (j === i ? { ...x, tone: e.target.value as typeof b.tone } : x)) })}><option value="primary">Principal</option><option value="accent">Destaque</option><option value="neutral">Neutro</option></Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setT({ banners: s.settings.banners.filter((_, j) => j !== i) })} aria-label="Remover"><Trash2 /></Button>
                  </div>
                ))}
              </div>
            </div>
            <FormField label="Rodapé" htmlFor="footer"><Input id="footer" value={s.settings.footerText} onChange={(e) => setT({ footerText: e.target.value })} /></FormField>
          </CardContent>
        </Card>
        <Button className="w-full" size="lg" loading={pending} onClick={save}><Save /> Salvar aparência</Button>
      </div>
      <div className="lg:col-span-3">
        <div className="sticky top-20 space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Pré-visualização ao vivo</h2><span className="text-xs text-muted-foreground">Cores e logo atualizam ao digitar; textos após salvar</span></div>
          {/* Miniatura instantânea */}
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="px-4 py-1.5 text-center text-[11px]" style={{ background: s.primaryColor, color: readableOn(s.primaryColor) }}>{s.settings.announcement || " "}</div>
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded text-[10px] font-bold" style={{ background: s.primaryColor, color: readableOn(s.primaryColor) }}>{s.logoText || "?"}</span><span className="text-sm font-semibold">{name}</span></div><div className="flex gap-3 text-xs text-muted-foreground"><span>Início</span><span>Catálogo</span><span>Carrinho</span></div></div>
            <div className="px-4 py-8" style={{ background: `${s.accentColor}14` }}><div className="text-lg font-semibold">{s.settings.heroTitle}</div><div className="mt-1 text-xs text-muted-foreground">{s.settings.heroSubtitle}</div><span className="mt-3 inline-block rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: s.accentColor, color: readableOn(s.accentColor) }}>{s.settings.heroCta}</span></div>
            <div className="grid grid-cols-4 gap-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-md bg-surface-muted" />)}</div>
          </div>
          {advanced ? (
            <div role="group" aria-label="Largura da pré-visualização" className="flex gap-1 rounded-lg bg-surface-muted p-1">
              {WIDTHS.map((w) => { const Icon = w.icon; return <button key={w.key} type="button" aria-pressed={width === w.key} onClick={() => setWidth(w.key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${width === w.key ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-4" aria-hidden />{w.label}{w.px ? ` · ${w.px}px` : ""}</button>; })}
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg border border-border bg-surface-muted"><iframe key={previewKey} title={`Loja (${frame.label})`} src={`/store/${slug}`} style={{ width: advanced && frame.px ? frame.px : "100%", maxWidth: "100%" }} className={`mx-auto block bg-white ${advanced ? "h-[560px]" : "h-[420px]"}`} /></div>
        </div>
      </div>
    </div>
  );
}
