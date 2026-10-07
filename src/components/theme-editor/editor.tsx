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
import { addBlock, addSection, DEFAULT_STYLE, duplicateSection, moveBlock, moveSection, removeBlock, removeSection, setBlockSetting, setSectionHidden, setSetting, STYLE_DEFS, TemplateOpError } from "@/lib/themes/template";
import { checkStyleChange, checkTemplateChange, hydrateContext, settingAllowed, STYLE_MIN_LEVEL, structureRights, violationMessage, type SerializedContext, type Violation } from "@/lib/themes/policy";
import { LEVEL_INFO } from "@/lib/themes/levels";
import { ImageUploadButton } from "./image-upload";
import { setStoreLogoAction } from "@/app/actions/assets";
import { PAGE_LABEL, type PageKind, type SettingValue, type Template, type ThemeStyle } from "@/lib/themes/types";
import { cn } from "@/lib/utils";
import { AddSectionDialog, PageTemplatesDialog, VersionsDialog } from "./dialogs";
import { saveSectionTemplateAction } from "@/app/actions/theme";
import { newSectionId } from "@/lib/themes/template";
import { LayoutTemplate } from "lucide-react";
import { MediaLibraryProvider } from "./media-library";
import { BannerMediaPanel, MEDIA_FIELDS } from "./banner-media";
import { scheduleIssues } from "@/lib/themes/banners";
import { SettingField, type PickerData } from "./settings-panel";
import { SectionTree, type TreeActions } from "./tree";

export type EditorProps = { logoUrl: string | null; storeName: string; slug: string; offerName: string; initial: Doc; published: Doc; policy: SerializedContext; revisions: Record<PageKind | "globals", number>; upgradeHref: string; picker: PickerData; previewPaths: Record<PageKind, string> };
type Device = "desktop" | "tablet" | "mobile";
type Save = "saved" | "dirty" | "saving" | "error";
const DEVICES = [{ key: "desktop", label: "Computador", icon: Monitor, px: null }, { key: "tablet", label: "Tablet", icon: Tablet, px: 768 }, { key: "mobile", label: "Celular", icon: Smartphone, px: 390 }] as const;
const sig = (d: Doc) => JSON.stringify(d);
const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function ThemeEditor({ logoUrl: logoUrlInitial, storeName, slug, offerName, initial, published: publishedInitial, policy, revisions, upgradeHref, picker, previewPaths }: EditorProps) {
  const router = useRouter();
  const [page, setPage] = React.useState<PageKind>("home");
  const [logo, setLogo] = React.useState<string | null>(logoUrlInitial);
  const [hist, setHist] = React.useState(() => newHistory(initial));
  const doc = hist.present;
  const [sel, setSel] = React.useState<Selection>(null);
  const [device, setDevice] = React.useState<Device>("desktop");
  const [save, setSave] = React.useState<Save>("saved");
  const [published, setPublished] = React.useState(publishedInitial);
  const [ready, setReady] = React.useState(false);
  const [adding, setAdding] = React.useState<Region | null>(null);
  const [versions, setVersions] = React.useState(false);
  const [pageModels, setPageModels] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [mobileTab, setMobileTab] = React.useState<"tree" | "preview" | "settings">("preview");
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const savedRef = React.useRef<Doc>(initial);
  const docRef = React.useRef(doc); React.useEffect(() => { docRef.current = doc; }, [doc]);
  const flushing = React.useRef<Promise<boolean> | null>(null);
  // Política única (a mesma do servidor): o que o tema ATIVO permite. O servidor confere de novo ao salvar e publicar.
  const ctx = React.useMemo(() => hydrateContext(policy), [policy]);
  const rights = structureRights(ctx);
  const revRef = React.useRef(revisions);
  const [conflict, setConflict] = React.useState(false);
  const levelLabel = `${LEVEL_INFO[ctx.level].short} · ${LEVEL_INFO[ctx.level].name}`;
  const lockHint = `Recurso de temas de nível superior. O tema ${ctx.themeName} é ${levelLabel}.`;
  void offerName;
  const blocked = (v: Violation[]) => { toast.error(violationMessage(v), { id: "theme-policy", action: v.some((x) => x.requiredLevel) ? { label: "Ver temas", onClick: () => router.push(upgradeHref) } : undefined }); };

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
        for (const p of parts.pages) {
          const r = await saveTemplateDraftAction(p, snapshot.pages[p], revRef.current[p]);
          if (!r.ok) { if (r.code === "DRAFT_CONFLICT") setConflict(true); else toast.error(r.error); setSave("error"); return false; }
          revRef.current = { ...revRef.current, [p]: r.data.revision };
        }
        if (parts.globals) {
          const r = await saveGlobalsDraftAction(snapshot.globals, revRef.current.globals);
          if (!r.ok) { if (r.code === "DRAFT_CONFLICT") setConflict(true); else toast.error(r.error); setSave("error"); return false; }
          revRef.current = { ...revRef.current, globals: r.data.revision };
          const warn = r.data.issues.find((i) => i.includes("clara demais")); if (warn) toast.warning(warn, { id: "contrast-warning" });
        }
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

  // Sair com alterações ainda não gravadas pede confirmação do navegador (nada se perde por engano).
  React.useEffect(() => {
    if (save === "saved") return;
    const onLeave = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", onLeave); return () => window.removeEventListener("beforeunload", onLeave);
  }, [save]);

  // ---- Alterações -----------------------------------------------------------
  const commit = React.useCallback((next: Doc, key?: string) => setHist((h) => pushHistory(h, next, key ?? null)), []);
  const mutate = (region: Region, fn: (t: Template) => Template, key?: string): boolean => {
    try {
      const cur = getTemplate(doc, region, page); const next = fn(cur);
      const v = checkTemplateChange(ctx, cur, next, { region, page: region === "content" ? page : undefined });
      if (v.length) { blocked(v); return false; }
      commit(setTemplate(doc, region, page, next), key); return true;
    } catch (e) { if (e instanceof TemplateOpError) { toast.error(e.message); return false; } throw e; }
  };

  const select = React.useCallback((s: Selection) => { setSel(s); if (s) setMobileTab("settings"); }, []);
  React.useEffect(() => { const id = requestAnimationFrame(() => setSel((s) => reconcileSelection(doc, s, page))); return () => cancelAnimationFrame(id); }, [doc, page]);

  const sectionIdOf = (s: Selection) => (s?.kind === "section" ? s.id : s?.kind === "block" ? s.sectionId : null);
  React.useEffect(() => { post({ type: "select", id: sectionIdOf(sel), scroll: true }); }, [sel, post]);
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "nl-preview") return;
      if (e.data.type === "ready") post({ type: "select", id: sectionIdOf(sel) });
      if (e.data.type === "select" && typeof e.data.id === "string") {
        const d = docRef.current; const region: Region | null = d.globals.header.sections[e.data.id] ? "header" : d.globals.footer.sections[e.data.id] ? "footer" : d.pages[page].sections[e.data.id] ? "content" : null;
        if (region) select({ kind: "section", region, id: e.data.id });
      }
    };
    window.addEventListener("message", onMsg); return () => window.removeEventListener("message", onMsg);
  }, [sel, post, select, page]);

  const actions: TreeActions = {
    select, hover: (id) => post({ type: "hover", id }),
    move: (region, id, to) => { mutate(region, (t) => moveSection(t, id, to)); },
    toggle: (region, id) => { mutate(region, (t) => setSectionHidden(t, id, !t.sections[id]?.hidden)); },
    duplicate: (region, id) => { let nid = ""; if (mutate(region, (t) => { const r = duplicateSection(t, id); nid = r.id; return r.template; })) select({ kind: "section", region, id: nid }); },
    remove: (region, id) => { const name = sectionSchema(getTemplate(doc, region, page).sections[id]?.type ?? "")?.name ?? "Seção"; if (mutate(region, (t) => removeSection(t, id))) toast(`${name} removida`, { action: { label: "Desfazer", onClick: () => setHist((h) => undo(h)) } }); },
    addSection: (region) => { if (rights.add === "none") { toast(`O tema ${ctx.themeName} (${levelLabel}) tem a composição fixa: edite o conteúdo dos espaços. Temas N2 em diante acrescentam espaços.`, { action: { label: "Ver temas", onClick: () => router.push(upgradeHref) } }); return; } setAdding(region); },
    addBlock: (region, sid, type) => { mutate(region, (t) => addBlock(t, sid, type).template); },
    moveBlock: (region, sid, bid, to) => { mutate(region, (t) => moveBlock(t, sid, bid, to)); },
    removeBlock: (region, sid, bid) => { mutate(region, (t) => removeBlock(t, sid, bid)); },
  };

  const insertSaved = (inst: import("@/lib/themes/types").SectionInstance) => {
    if (!adding) return; const region = adding; let nid = "";
    if (mutate(region, (cur) => { nid = newSectionId(inst.type, cur.order); return { ...cur, sections: { ...cur.sections, [nid]: inst }, order: [...cur.order, nid] }; })) select({ kind: "section", region, id: nid });
  };
  const pickSection = (type: string) => {
    if (!adding) return; const region = adding; let nid = "";
    const t = getTemplate(doc, region, page); const curId = sectionIdOf(sel); const at = sel && sel.kind !== "style" && sel.region === region && curId ? t.order.indexOf(curId) + 1 : undefined;
    if (mutate(region, (cur) => { const r = addSection(cur, type, { region, page: page, index: at || undefined }); nid = r.id; return r.template; })) select({ kind: "section", region, id: nid });
  };

  // ---- Publicação e atalhos -------------------------------------------------
  const dirtyPublish = sig(doc) !== sig(published);
  const publish = async () => {
    setPublishing(true); const ok = await flush();
    if (!ok) { setPublishing(false); return; }
    const r = await publishThemeAction(undefined, revRef.current); setPublishing(false);
    if (r.ok) { revRef.current = r.data.revisions; setPublished(savedRef.current); toast.success("Tema publicado. Sua loja já mostra as mudanças."); }
    else if (r.code === "DRAFT_CONFLICT") setConflict(true); else toast.error(r.error);
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
  const selSection = sel && sel.kind !== "style" && selId ? getTemplate(doc, sel.region, page).sections[selId] : undefined;
  const schema = selSection ? sectionSchema(selSection.type) : undefined;
  const setStyle = (id: keyof ThemeStyle, v: SettingValue) => {
    const next = { ...doc.globals.style, [id]: v } as ThemeStyle;
    const viol = checkStyleChange(ctx, doc.globals.style, next, DEFAULT_STYLE); if (viol.length) { blocked(viol); return; }
    commit({ ...doc, globals: { ...doc.globals, style: next } }, `style.${id}`);
  };
  const dev = DEVICES.find((d) => d.key === device)!;
  const saveLabel = save === "saving" ? "Salvando…" : save === "dirty" ? "Alterações não salvas" : save === "error" ? "Erro ao salvar. Toque para tentar de novo" : "Rascunho salvo";

  return (
    <MediaLibraryProvider>
    <div className="flex h-full flex-col bg-background">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <h1 className="sr-only">Editor do tema da loja</h1>
        <Button variant="ghost" size="sm" onClick={leave}><ArrowLeft aria-hidden /> Painel</Button>
        <div className="mr-2 hidden min-w-0 sm:block"><p className="truncate text-sm font-semibold leading-tight">{storeName}</p><p className="text-[11px] text-muted-foreground">Editor do tema</p></div>
        <label className="sr-only" htmlFor="page-select">Página</label>
        <select id="page-select" value={page} onChange={(e) => { setPage(e.target.value as PageKind); setSel(null); }} className="h-8 rounded-md border border-border bg-surface px-2 text-sm">{(Object.keys(PAGE_LABEL) as PageKind[]).map((p) => <option key={p} value={p}>{PAGE_LABEL[p]}</option>)}</select>
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
        {ctx.caps.has("editor.pageTemplates") ? <Button variant="ghost" size="sm" onClick={() => setPageModels(true)}><LayoutTemplate aria-hidden /> <span className="sr-only md:not-sr-only">Modelos</span></Button> : null}
        <a href={`/store/${slug}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"><ExternalLink className="size-4" aria-hidden /> <span className="sr-only lg:not-sr-only">Ver loja</span></a>
        {dirtyPublish ? <Button variant="ghost" size="sm" onClick={discard}>Descartar</Button> : null}
        <Button size="sm" onClick={publish} loading={publishing} disabled={!dirtyPublish}>Publicar</Button>
      </header>

      <div className="flex border-b border-border bg-surface lg:hidden" role="tablist" aria-label="Painéis do editor">
        {([["tree", "Seções"], ["preview", "Prévia"], ["settings", "Configurar"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={mobileTab === k} onClick={() => setMobileTab(k)} className={cn("flex-1 py-2 text-sm font-medium", mobileTab === k ? "border-b-2 border-accent text-foreground" : "text-muted-foreground")}>{l}</button>)}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside aria-label="Seções da página" className={cn("nl-scroll w-full shrink-0 overflow-y-auto border-r border-border bg-surface lg:block lg:w-72", mobileTab === "tree" ? "block" : "hidden")}>
          {conflict ? <div className="p-3 pb-0"><Banner tone="warning" title="Outra aba mudou este rascunho">Para não apagar o trabalho de ninguém, nada desta aba foi gravado por cima. <button type="button" className="font-medium underline" onClick={() => window.location.reload()}>Recarregar a versão mais nova</button></Banner></div> : null}
          <div className="p-3 pb-0"><LevelCard ctx={ctx} rights={rights} levelLabel={levelLabel} upgradeHref={upgradeHref} /></div>
          <SectionTree header={doc.globals.header} content={doc.pages[page]} footer={doc.globals.footer} pageLabel={PAGE_LABEL[page]} sel={sel} ctx={ctx} page={page} actions={actions} lockHint={lockHint} />
        </aside>

        <main className={cn("min-w-0 flex-1 bg-surface-muted p-3 lg:block", mobileTab === "preview" ? "block" : "hidden")}>
          <div className="mx-auto h-full overflow-hidden rounded-lg border border-border bg-white shadow-md transition-[width] duration-200" style={{ width: dev.px ? `${dev.px + 2}px` : "100%", maxWidth: "100%" }}>
            {ready ? <iframe ref={frameRef} title={`Prévia da loja (${dev.label})`} src={previewPaths[page]} className="h-full w-full bg-white" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Preparando a prévia…</div>}
          </div>
        </main>

        <aside aria-label="Configurações" className={cn("nl-scroll w-full shrink-0 overflow-y-auto border-l border-border bg-surface lg:block lg:w-80", mobileTab === "settings" ? "block" : "hidden")}>
          <div className="space-y-4 p-4">
            {sel?.kind === "style" ? (
              <Card><CardHeader><CardTitle>Cores, fontes e estilo</CardTitle></CardHeader><CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border border-border p-3" aria-label="Logo da loja">
                  <p className="text-sm font-medium">Logo da loja</p>
                  {logo ? <div className="flex items-center gap-3"><div className="rounded-md border border-border bg-neutral-100 p-2"><LogoPreview src={logo} /></div><Button type="button" size="sm" variant="ghost" onClick={async () => { const r = await setStoreLogoAction(null); if (r.ok) { setLogo(null); post({ type: "refresh" }); toast.success("Logo removida"); } else toast.error(r.error); }}>Remover</Button></div> : <p className="text-xs text-muted-foreground">Sem logo enviada: a loja mostra as iniciais e o nome.</p>}
                  <ImageUploadButton label={logo ? "Trocar logo" : "Enviar logo"} maxSide={640} format="png" onUploaded={async (url) => { const r = await setStoreLogoAction(url); if (r.ok) { setLogo(url); post({ type: "refresh" }); } else toast.error(r.error); }} />
                  <p className="text-[11px] text-muted-foreground">PNG com fundo transparente fica melhor. A altura ajusta-se no cabeçalho.</p>
                </div>
                {STYLE_DEFS.map((def) => { const min = STYLE_MIN_LEVEL[def.id as keyof ThemeStyle]; const locked = !!min && !settingAllowed(ctx, { ...def, minLevel: min } as never).ok; return (
                  <fieldset key={def.id} disabled={locked} className={cn(locked && "opacity-60")}>
                    <SettingField def={def} value={doc.globals.style[def.id as keyof ThemeStyle]} onChange={(v) => setStyle(def.id as keyof ThemeStyle, v)} data={picker} idPrefix="style" locked={locked} />
                    {locked && min ? <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" aria-hidden /> Temas {LEVEL_INFO[min].short} · <Link href={upgradeHref} className="underline">ver temas</Link></p> : null}
                  </fieldset>
                ); })}
              </CardContent></Card>
            ) : selSection && schema && sel?.kind === "section" ? (
              <Card><CardHeader><div><CardTitle>{schema.name}</CardTitle><p className="text-xs text-muted-foreground">{schema.description}</p>
                {sel.region === "content" && !schema.singleton && !schema.required ? (ctx.caps.has("editor.sectionTemplates")
                  ? <button type="button" className="mt-1 text-xs font-medium text-accent-foreground underline" onClick={async () => { const name = window.prompt("Nome do modelo de seção", schema.name); if (!name) return; const r = await saveSectionTemplateAction(name, selSection); if (r.ok) toast.success("Modelo salvo. Use em “Adicionar seção”."); else toast.error(r.error); }}>Salvar como modelo</button>
                  : <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" aria-hidden /> Modelos de seção: temas N3</p>) : null}
              </div></CardHeader><CardContent className="space-y-4">
                {schema.settings.length === 0 ? <p className="text-sm text-muted-foreground">Esta seção é configurada pelos blocos, no menu à esquerda.</p> : null}
                {schema.settings.map((def) => <LockedField key={def.id} def={def} ctx={ctx}><SettingField def={def} value={selSection.settings[def.id]} idPrefix={`s-${sel.id}`} data={picker} locked={!settingAllowed(ctx, def).ok} onChange={(v) => mutate(sel.region, (t) => setSetting(t, sel.id, def.id, v), `${sel.id}.${def.id}`)} /></LockedField>)}
              </CardContent></Card>
            ) : selSection && schema && sel?.kind === "block" ? (() => {
              const b = selSection.blocks[sel.blockId]; const bdef = b ? schema.blocks?.find((d) => d.type === b.type) : undefined;
              if (!b || !bdef) return null;
              const isBanner = bdef.settings.some((d) => d.id === "focusX");
              const issues = isBanner ? scheduleIssues([{ id: sel.blockId, settings: b.settings }], new Date()) : [];
              const patch = (p: Record<string, SettingValue>) => mutate(sel.region, (t) => Object.entries(p).reduce((acc, [k, v]) => setBlockSetting(acc, sel.sectionId, sel.blockId, k, v), t), `${sel.blockId}.media`);
              let lastGroup: string | undefined;
              return <Card><CardHeader><div><CardTitle>{bdef.name}</CardTitle><p className="text-xs text-muted-foreground">Em {schema.name}</p></div></CardHeader><CardContent className="space-y-4">
                {isBanner ? <BannerMediaPanel sectionType={selSection.type} settings={b.settings} onSet={patch} idPrefix={`bm-${sel.blockId}`} /> : null}
                {issues.map((m) => <p key={m} role="status" className="rounded-md bg-warning-soft p-2 text-xs text-warning">{m}</p>)}
                {bdef.settings.filter((def) => !(isBanner && MEDIA_FIELDS.has(def.id))).map((def) => { const head = def.group && def.group !== lastGroup && def.group !== "Imagem" ? def.group : null; lastGroup = def.group; return <React.Fragment key={def.id}>{head ? <p className="border-t border-border pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{head}</p> : null}<LockedField key={def.id} def={def} ctx={ctx}><SettingField def={def} value={b.settings[def.id]} idPrefix={`b-${sel.blockId}`} data={picker} locked={!settingAllowed(ctx, def).ok} onChange={(v) => mutate(sel.region, (t) => setBlockSetting(t, sel.sectionId, sel.blockId, def.id, v), `${sel.blockId}.${def.id}`)} /></LockedField></React.Fragment>; })}
              </CardContent></Card>;
            })() : (
              <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground"><p className="font-medium text-foreground">Selecione uma seção</p><p className="mt-1">Clique em uma seção da lista ou direto na prévia para editar.</p><p className="mt-3 text-xs">Desfazer <KeyboardHint keys={["Ctrl", "Z"]} /> · Salvar <KeyboardHint keys={["Ctrl", "S"]} /></p></div>
            )}
          </div>
        </aside>
      </div>

      <AddSectionDialog open={adding !== null} onOpenChange={(o) => { if (!o) setAdding(null); }} region={adding ?? "content"} page={page} current={getTemplate(doc, adding ?? "content", page)} ctx={ctx} upgradeHref={upgradeHref} onPick={pickSection} onPickSaved={insertSaved} />
      <PageTemplatesDialog open={pageModels} onOpenChange={setPageModels} page={page} current={doc.pages[page]} onApply={(t) => mutate("content", () => t)} />
      <VersionsDialog open={versions} onOpenChange={setVersions} page={page} />
    </div>
    </MediaLibraryProvider>
  );
}

/** Ajuste acima do nível: aparece (para mostrar o valor), mas travado e com o nível necessário. */
function LockedField({ def, ctx, children }: { def: import("@/lib/themes/types").SettingDef; ctx: ReturnType<typeof hydrateContext>; children: React.ReactNode }) {
  const v = settingAllowed(ctx, def);
  if (v.ok) return <>{children}</>;
  return <fieldset disabled className="opacity-60">{children}<p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" aria-hidden /> Temas {def.minLevel ? LEVEL_INFO[def.minLevel].short : ""} ({def.minLevel ? LEVEL_INFO[def.minLevel].name : ""})</p></fieldset>;
}

/** O que o tema ativo permite editar (nível e compatibilidade), com o caminho para níveis acima. */
function LevelCard({ ctx, rights, levelLabel, upgradeHref }: { ctx: ReturnType<typeof hydrateContext>; rights: ReturnType<typeof structureRights>; levelLabel: string; upgradeHref: string }) {
  const can = [rights.add === "any" ? "adicionar, mover e duplicar seções" : rights.add === "approved" ? `acrescentar até ${rights.extraLimit} espaços aprovados por página` : "editar o conteúdo dos espaços do tema", "ocultar espaços opcionais", "imagens com foco e versão de celular"];
  return (
    <div className="rounded-lg border border-border bg-surface-muted p-3 text-xs" aria-label="Nível do tema">
      <p className="font-semibold text-foreground">Tema {ctx.themeName} · {levelLabel}</p>
      <p className="mt-1 text-muted-foreground">Você pode {can.join(", ")}.</p>
      {ctx.legacy.size ? <p className="mt-1 text-muted-foreground">Sua oferta Loja própria mantém a reorganização de seções que ela já incluía.</p> : null}
      {ctx.level < 4 ? <Link href={upgradeHref} className="mt-1.5 inline-block font-medium text-accent-foreground underline">Comparar níveis de tema</Link> : null}
    </div>
  );
}

/* eslint-disable-next-line @next/next/no-img-element -- logo enviada pelo lojista */
const LogoPreview = ({ src }: { src: string }) => <img src={src} alt="Logo atual" className="h-10 w-auto max-w-40 object-contain" />;
