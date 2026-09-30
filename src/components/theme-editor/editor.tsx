"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, CircleAlert, ExternalLink, History, Loader2, Lock, Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banner } from "@/components/ds/banner";
import { KeyboardHint } from "@/components/ds/fields";
import { discardThemeDraftAction, enterThemePreviewAction, exitThemePreviewAction, publishThemeAction, saveGlobalsDraftAction, saveTemplateDraftAction } from "@/app/actions/theme";
import { canRedo, canUndo, changedParts, getTemplate, newHistory, pushHistory, reconcileSelection, redo, setTemplate, undo, type Doc, type Region, type Selection } from "@/lib/themes/editor-state";
import { sectionSchema } from "@/lib/themes/sections";
import { addBlock, addSection, duplicateSection, moveBlock, moveSection, removeBlock, removeSection, setBlockSetting, setSectionHidden, setSetting, STYLE_DEFS, TemplateOpError } from "@/lib/themes/template";
import { PAGE_LABEL, type PageKind, type SettingValue, type Template, type ThemeStyle } from "@/lib/themes/types";
import { cn } from "@/lib/utils";
import { AddSectionDialog, VersionsDialog } from "./dialogs";
import { SettingField, type PickerData } from "./settings-panel";
import { SectionTree, type TreeActions } from "./tree";

export type EditorProps = { storeName: string; slug: string; offerName: string; initial: Doc; published: Doc; advanced: boolean; premium: boolean; upgradeHref: string; picker: PickerData };
type Device = "desktop" | "tablet" | "mobile";
type Save = "saved" | "dirty" | "saving" | "error";
const PAGE: PageKind = "home";
const DEVICES = [{ key: "desktop", label: "Computador", icon: Monitor, px: null }, { key: "tablet", label: "Tablet", icon: Tablet, px: 768 }, { key: "mobile", label: "Celular", icon: Smartphone, px: 390 }] as const;
const ADVANCED_STYLE = new Set(["headingFont", "bodyFont", "radius", "buttons"]);
const sig = (d: Doc) => JSON.stringify(d);
const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function ThemeEditor({ storeName, slug, offerName, initial, published: publishedInitial, advanced, premium, upgradeHref, picker }: EditorProps) {
  const router = useRouter();
  const [hist, setHist] = React.useState(() => newHistory(initial));
  const doc = hist.present;
  const [sel, setSel] = React.useState<Selection>(null);
  const [device, setDevice] = React.useState<Device>("desktop");
  const [save, setSave] = React.useState<Save>("saved");
  const [published, setPublished] = React.useState(publishedInitial);
  const [ready, setReady] = React.useState(false);
  const [adding, setAdding] = React.useState<Region | null>(null);
  const [versions, setVersions] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"tree" | "preview" | "settings">("preview");
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const savedRef = React.useRef<Doc>(initial);
  const docRef = React.useRef(doc); React.useEffect(() => { docRef.current = doc; }, [doc]);
  const flushing = React.useRef<Promise<boolean> | null>(null);
  const lockHint = `Disponível na oferta Loja própria. Você está na ${offerName}.`;

  // A prévia do rascunho precisa do cookie antes de a loja carregar no quadro.
  React.useEffect(() => { let live = true; enterThemePreviewAction().then(() => { if (live) setReady(true); }); return () => { live = false; }; }, []);

  const post = React.useCallback((m: object) => frameRef.current?.contentWindow?.postMessage({ source: "nl-editor", ...m }, window.location.origin), []);

  // ---- Salvamento automático ------------------------------------------------
  const flush = React.useCallback(async (): Promise<boolean> => {
    // Salva o que mudou; se houve novas edições durante o envio, repete (no máximo 5 voltas).
    for (let i = 0; i < 5; i++) {
      if (flushing.current) await flushing.current;
      const snapshot = docRef.current; const parts = changedParts(snapshot, savedRef.current);
      if (!parts.pages.length && !parts.globals) return true;
      const run = (async () => {
        setSave("saving");
        for (const p of parts.pages) { const r = await saveTemplateDraftAction(p, snapshot.pages[p]); if (!r.ok) { toast.error(r.error); setSave("error"); return false; } }
        if (parts.globals) { const r = await saveGlobalsDraftAction(snapshot.globals); if (!r.ok) { toast.error(r.error); setSave("error"); return false; } }
        savedRef.current = snapshot; post({ type: "refresh" });
        setSave(sig(docRef.current) === sig(snapshot) ? "saved" : "dirty");
        return true;
      })();
      flushing.current = run; const ok = await run; flushing.current = null;
      if (!ok) return false;
      if (sig(docRef.current) === sig(savedRef.current)) return true;
    }
    return true;
  }, [post]);

  React.useEffect(() => {
    if (sig(doc) === sig(savedRef.current)) { const id = requestAnimationFrame(() => setSave((s) => (s === "saving" ? s : "saved"))); return () => cancelAnimationFrame(id); }
    const raf = requestAnimationFrame(() => setSave((s) => (s === "saving" ? s : "dirty")));
    const t = setTimeout(() => void flush(), 700);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [doc, flush]);

  // ---- Alterações -----------------------------------------------------------
  const commit = React.useCallback((next: Doc, key?: string) => setHist((h) => pushHistory(h, next, key ?? null)), []);
  const mutate = (region: Region, fn: (t: Template) => Template, key?: string): boolean => {
    try { commit(setTemplate(doc, region, PAGE, fn(getTemplate(doc, region, PAGE))), key); return true; }
    catch (e) { if (e instanceof TemplateOpError) { toast.error(e.message); return false; } throw e; }
  };
  const needAdvanced = () => { if (advanced) return true; toast(lockHint, { action: { label: "Ver como liberar", onClick: () => router.push(upgradeHref) } }); return false; };

  const select = React.useCallback((s: Selection) => { setSel(s); if (s) setMobileTab("settings"); }, []);
  React.useEffect(() => { const id = requestAnimationFrame(() => setSel((s) => reconcileSelection(doc, s, PAGE))); return () => cancelAnimationFrame(id); }, [doc]);

  const sectionIdOf = (s: Selection) => (s?.kind === "section" ? s.id : s?.kind === "block" ? s.sectionId : null);
  React.useEffect(() => { post({ type: "select", id: sectionIdOf(sel), scroll: true }); }, [sel, post]);
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "nl-preview") return;
      if (e.data.type === "ready") post({ type: "select", id: sectionIdOf(sel) });
      if (e.data.type === "select" && typeof e.data.id === "string") {
        const d = docRef.current; const region: Region | null = d.globals.header.sections[e.data.id] ? "header" : d.globals.footer.sections[e.data.id] ? "footer" : d.pages[PAGE].sections[e.data.id] ? "content" : null;
        if (region) select({ kind: "section", region, id: e.data.id });
      }
    };
    window.addEventListener("message", onMsg); return () => window.removeEventListener("message", onMsg);
  }, [sel, post, select]);

  const actions: TreeActions = {
    select, hover: (id) => post({ type: "hover", id }),
    move: (region, id, to) => { if (needAdvanced()) mutate(region, (t) => moveSection(t, id, to)); },
    toggle: (region, id) => { if (needAdvanced()) mutate(region, (t) => setSectionHidden(t, id, !t.sections[id]?.hidden)); },
    duplicate: (region, id) => { if (!needAdvanced()) return; let nid = ""; if (mutate(region, (t) => { const r = duplicateSection(t, id); nid = r.id; return r.template; })) select({ kind: "section", region, id: nid }); },
    remove: (region, id) => { if (!needAdvanced()) return; const name = sectionSchema(getTemplate(doc, region, PAGE).sections[id]?.type ?? "")?.name ?? "Seção"; if (mutate(region, (t) => removeSection(t, id))) toast(`${name} removida`, { action: { label: "Desfazer", onClick: () => setHist((h) => undo(h)) } }); },
    addSection: (region) => { if (needAdvanced()) setAdding(region); },
    addBlock: (region, sid, type) => { if (needAdvanced()) mutate(region, (t) => addBlock(t, sid, type).template); },
    moveBlock: (region, sid, bid, to) => { if (needAdvanced()) mutate(region, (t) => moveBlock(t, sid, bid, to)); },
    removeBlock: (region, sid, bid) => { if (needAdvanced()) mutate(region, (t) => removeBlock(t, sid, bid)); },
  };

  const pickSection = (type: string) => {
    if (!adding) return; const region = adding; let nid = "";
    const t = getTemplate(doc, region, PAGE); const curId = sectionIdOf(sel); const at = sel && sel.kind !== "style" && sel.region === region && curId ? t.order.indexOf(curId) + 1 : undefined;
    if (mutate(region, (cur) => { const r = addSection(cur, type, { region, page: PAGE, index: at || undefined }); nid = r.id; return r.template; })) select({ kind: "section", region, id: nid });
  };

  // ---- Publicação e atalhos -------------------------------------------------
  const dirtyPublish = sig(doc) !== sig(published);
  const publish = async () => {
    setPublishing(true); const ok = await flush();
    if (!ok) { setPublishing(false); return; }
    const r = await publishThemeAction(); setPublishing(false);
    if (r.ok) { setPublished(savedRef.current); toast.success("Tema publicado. Sua loja já mostra as mudanças."); } else toast.error(r.error);
  };
  const discard = async () => { if (!window.confirm("Descartar todas as alterações não publicadas?")) return; const r = await discardThemeDraftAction(); if (r.ok) window.location.reload(); else toast.error(r.error); };
  const leave = async () => { await flush(); await exitThemePreviewAction(); router.push("/merchant"); };
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey; if (!mod) return; const k = e.key.toLowerCase();
      if (k === "s") { e.preventDefault(); void flush(); return; }
      if (editable(e.target)) return;
      if (k === "z" && !e.shiftKey) { e.preventDefault(); setHist((h) => undo(h)); }
      if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); setHist((h) => redo(h)); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  // ---- Painel de configurações ---------------------------------------------
  const selId = sectionIdOf(sel);
  const selSection = sel && sel.kind !== "style" && selId ? getTemplate(doc, sel.region, PAGE).sections[selId] : undefined;
  const schema = selSection ? sectionSchema(selSection.type) : undefined;
  const setStyle = (id: keyof ThemeStyle, v: SettingValue) => commit({ ...doc, globals: { ...doc.globals, style: { ...doc.globals.style, [id]: v } } }, `style.${id}`);
  const dev = DEVICES.find((d) => d.key === device)!;
  const saveLabel = save === "saving" ? "Salvando…" : save === "dirty" ? "Alterações não salvas" : save === "error" ? "Erro ao salvar. Toque para tentar de novo" : "Rascunho salvo";

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <Button variant="ghost" size="sm" onClick={leave}><ArrowLeft aria-hidden /> Painel</Button>
        <div className="mr-2 hidden min-w-0 sm:block"><p className="truncate text-sm font-semibold leading-tight">{storeName}</p><p className="text-[11px] text-muted-foreground">Editor do tema</p></div>
        <label className="sr-only" htmlFor="page-select">Página</label>
        <select id="page-select" defaultValue={PAGE} className="h-8 rounded-md border border-border bg-surface px-2 text-sm">{(Object.keys(PAGE_LABEL) as PageKind[]).map((p) => <option key={p} value={p} disabled={p !== PAGE}>{PAGE_LABEL[p]}{p !== PAGE ? " (em breve)" : ""}</option>)}</select>
        <div role="radiogroup" aria-label="Tamanho da prévia" className="mx-auto flex gap-0.5 rounded-lg bg-surface-muted p-0.5">
          {DEVICES.map((d) => { const Icon = d.icon; return <button key={d.key} type="button" role="radio" aria-checked={device === d.key} onClick={() => setDevice(d.key)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium", device === d.key ? "bg-surface shadow-sm" : "text-muted-foreground hover:text-foreground")}><Icon className="size-4" aria-hidden /><span className="sr-only md:not-sr-only">{d.label}</span></button>; })}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setHist((h) => undo(h))} disabled={!canUndo(hist)} aria-label="Desfazer"><Undo2 aria-hidden /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setHist((h) => redo(h))} disabled={!canRedo(hist)} aria-label="Refazer"><Redo2 aria-hidden /></Button>
        </div>
        <div role="status" aria-live="polite" className="flex items-center">
          <button type="button" disabled={save !== "error"} onClick={() => void flush()} className={cn("flex items-center gap-1.5 rounded px-2 py-1 text-xs disabled:opacity-100", save === "error" ? "text-danger" : "text-muted-foreground")}>
            {save === "saving" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : save === "saved" ? <Check className="size-3.5 text-success" aria-hidden /> : save === "error" ? <CircleAlert className="size-3.5" aria-hidden /> : <span className="size-2 rounded-full bg-warning" aria-hidden />}<span className="sr-only sm:not-sr-only">{saveLabel}</span>
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setVersions(true)}><History aria-hidden /> <span className="sr-only md:not-sr-only">Histórico</span></Button>
        <a href={`/store/${slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"><ExternalLink className="size-4" aria-hidden /> <span className="sr-only lg:not-sr-only">Ver loja</span></a>
        {dirtyPublish ? <Button variant="ghost" size="sm" onClick={discard}>Descartar</Button> : null}
        <Button size="sm" onClick={publish} loading={publishing} disabled={!dirtyPublish}>Publicar</Button>
      </header>

      <div className="flex border-b border-border bg-surface lg:hidden" role="tablist" aria-label="Painéis do editor">
        {([["tree", "Seções"], ["preview", "Prévia"], ["settings", "Configurar"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={mobileTab === k} onClick={() => setMobileTab(k)} className={cn("flex-1 py-2 text-sm font-medium", mobileTab === k ? "border-b-2 border-accent text-foreground" : "text-muted-foreground")}>{l}</button>)}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Seções da página" className={cn("nl-scroll w-full shrink-0 overflow-y-auto border-r border-border bg-surface lg:block lg:w-72", mobileTab === "tree" ? "block" : "hidden")}>
          {!advanced ? <div className="p-3 pb-0"><Banner tone="info" title={`Você está na ${offerName}`}>Aqui você edita textos e cores. Mudar a ordem e as seções está na <Link href={upgradeHref} className="font-medium underline">Loja própria</Link>.</Banner></div> : null}
          <SectionTree header={doc.globals.header} content={doc.pages[PAGE]} footer={doc.globals.footer} pageLabel={PAGE_LABEL[PAGE]} sel={sel} advanced={advanced} actions={actions} lockHint={lockHint} />
        </aside>

        <main className={cn("min-w-0 flex-1 bg-surface-muted p-3 lg:block", mobileTab === "preview" ? "block" : "hidden")}>
          <div className="mx-auto h-full overflow-hidden rounded-lg border border-border bg-white shadow-md transition-[width] duration-200" style={{ width: dev.px ? `${dev.px + 2}px` : "100%", maxWidth: "100%" }}>
            {ready ? <iframe ref={frameRef} title={`Prévia da loja (${dev.label})`} src={`/store/${slug}`} className="h-full w-full bg-white" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Preparando a prévia…</div>}
          </div>
        </main>

        <aside aria-label="Configurações" className={cn("nl-scroll w-full shrink-0 overflow-y-auto border-l border-border bg-surface lg:block lg:w-80", mobileTab === "settings" ? "block" : "hidden")}>
          <div className="space-y-4 p-4">
            {sel?.kind === "style" ? (
              <Card><CardHeader><CardTitle>Cores, fontes e estilo</CardTitle></CardHeader><CardContent className="space-y-4">
                {STYLE_DEFS.map((def) => { const locked = ADVANCED_STYLE.has(def.id) && !advanced; return (
                  <fieldset key={def.id} disabled={locked} className={cn(locked && "opacity-60")}>
                    <SettingField def={def} value={doc.globals.style[def.id as keyof ThemeStyle]} onChange={(v) => setStyle(def.id as keyof ThemeStyle, v)} data={picker} idPrefix="style" locked={locked} />
                    {locked ? <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" aria-hidden /> <Link href={upgradeHref} className="underline">Loja própria</Link></p> : null}
                  </fieldset>
                ); })}
              </CardContent></Card>
            ) : selSection && schema && sel?.kind === "section" ? (
              <Card><CardHeader><div><CardTitle>{schema.name}</CardTitle><p className="text-xs text-muted-foreground">{schema.description}</p></div></CardHeader><CardContent className="space-y-4">
                {schema.settings.length === 0 ? <p className="text-sm text-muted-foreground">Esta seção é configurada pelos blocos, no menu à esquerda.</p> : null}
                {schema.settings.map((def) => <SettingField key={def.id} def={def} value={selSection.settings[def.id]} idPrefix={`s-${sel.id}`} data={picker} onChange={(v) => mutate(sel.region, (t) => setSetting(t, sel.id, def.id, v), `${sel.id}.${def.id}`)} />)}
              </CardContent></Card>
            ) : selSection && schema && sel?.kind === "block" ? (() => {
              const b = selSection.blocks[sel.blockId]; const bdef = b ? schema.blocks?.find((d) => d.type === b.type) : undefined;
              if (!b || !bdef) return null;
              return <Card><CardHeader><div><CardTitle>{bdef.name}</CardTitle><p className="text-xs text-muted-foreground">Em {schema.name}</p></div></CardHeader><CardContent className="space-y-4">
                {bdef.settings.map((def) => <SettingField key={def.id} def={def} value={b.settings[def.id]} idPrefix={`b-${sel.blockId}`} data={picker} onChange={(v) => mutate(sel.region, (t) => setBlockSetting(t, sel.sectionId, sel.blockId, def.id, v), `${sel.blockId}.${def.id}`)} />)}
              </CardContent></Card>;
            })() : (
              <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground"><p className="font-medium text-foreground">Selecione uma seção</p><p className="mt-1">Clique em uma seção da lista ou direto na prévia para editar.</p><p className="mt-3 text-xs">Desfazer <KeyboardHint keys={["Ctrl", "Z"]} /> · Salvar <KeyboardHint keys={["Ctrl", "S"]} /></p></div>
            )}
          </div>
        </aside>
      </div>

      <AddSectionDialog open={adding !== null} onOpenChange={(o) => { if (!o) setAdding(null); }} region={adding ?? "content"} page={PAGE} current={getTemplate(doc, adding ?? "content", PAGE)} premium={premium} onPick={pickSection} />
      <VersionsDialog open={versions} onOpenChange={setVersions} page={PAGE} />
    </div>
  );
}
