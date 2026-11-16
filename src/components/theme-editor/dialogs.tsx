"use client";
import * as React from "react";
import { History, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { inputClass } from "@/components/ui/input";
import { deleteSavedTemplateAction, listSavedTemplatesAction, listThemeVersionsAction, restoreThemeVersionAction, savePageTemplateAction } from "@/app/actions/theme";
import type { SavedTemplate } from "@/lib/themes/saved-templates";
import type { SectionInstance } from "@/lib/themes/types";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";
import { LEVEL_INFO } from "@/lib/themes/levels";
import { sectionAvailability, type EditingContext } from "@/lib/themes/policy";
import type { PageKind, SectionRegion, Template } from "@/lib/themes/types";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * Catálogo de seções: busca, agrupado por categoria. A disponibilidade vem da MESMA política do servidor:
 * seções de nível acima aparecem com cadeado e o nível; as de identidade de outra família não aparecem.
 */
export function AddSectionDialog({ open, onOpenChange, region, page, current, ctx, upgradeHref, onPick, onPickSaved }: { open: boolean; onOpenChange: (o: boolean) => void; region: SectionRegion; page: PageKind; current: Template; ctx: EditingContext; upgradeHref: string; onPick: (type: string) => void; onPickSaved?: (s: SectionInstance) => void }) {
  const [q, setQ] = React.useState("");
  const [saved, setSaved] = React.useState<SavedTemplate[]>([]);
  React.useEffect(() => { if (!open || region !== "content" || !ctx.caps.has("editor.sectionTemplates")) return; let live = true; listSavedTemplatesAction().then((r) => { if (live && r.ok) setSaved(r.data.filter((t) => t.kind === "section")); }); return () => { live = false; }; }, [open, region, ctx]);
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const used = new Set(current.order.map((id) => current.sections[id]!.type));
  const list = SECTION_SCHEMAS.filter((s) => {
    if (s.region !== region || (region === "content" && !s.pages.includes(page))) return false;
    const v = sectionAvailability(ctx, s.type, { region, page });
    if (!v.ok && (v.reason === "FAMILY_ONLY" || v.reason === "INCOMPATIBLE")) return false; // identidade de outra família: não polui a lista
    return fold(`${s.name} ${s.description} ${s.category}`).includes(fold(q));
  });
  const groups = [...new Set(list.map((s) => s.category))];
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(""); }}>
      <DialogContent title="Adicionar seção" description="Escolha o que colocar na página. Você pode mudar textos, ordem e cores depois." className="max-w-xl">
        <div className="relative mb-3"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar seção" aria-label="Buscar seção" className={cn(inputClass, "pl-8")} /></div>
        <div className="nl-scroll max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {groups.map((g) => (
            <section key={g} aria-label={g}>
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</h3>
              <ul className="space-y-1.5">
                {list.filter((s) => s.category === g).map((s) => { const v = sectionAvailability(ctx, s.type, { region, page }); const usedUp = s.singleton && used.has(s.type); const disabled = usedUp || !v.ok; return (
                  <li key={s.type}><button type="button" disabled={disabled} onClick={() => { onPick(s.type); onOpenChange(false); }} className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60">
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{s.name}{!v.ok && v.requiredLevel ? <span className="ml-2 inline-flex items-center gap-1 rounded bg-accent-soft px-1.5 text-[10px] font-semibold text-accent-foreground"><Lock className="size-3" aria-hidden /> {LEVEL_INFO[v.requiredLevel].short} · {LEVEL_INFO[v.requiredLevel].name}</span> : null}</span><span className="block text-xs text-muted-foreground">{usedUp ? "Já está na página." : !v.ok ? v.message : s.description}</span></span>
                  </button></li>
                ); })}
              </ul>
            </section>
          ))}
          {saved.length ? (
            <section aria-label="Seus modelos">
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Seus modelos</h3>
              <ul className="space-y-1.5">{saved.filter((t) => fold(t.name).includes(fold(q))).map((t) => { const inst = t.data as SectionInstance; const v = sectionAvailability(ctx, inst.type, { region, page }); return (
                <li key={t.id} className="flex items-center gap-2"><button type="button" disabled={!v.ok} onClick={() => { onPickSaved?.(structuredClone(inst)); onOpenChange(false); }} className="flex min-w-0 flex-1 items-start gap-3 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-surface-hover disabled:opacity-60"><span className="min-w-0"><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs text-muted-foreground">{v.ok ? "Modelo salvo da sua loja" : v.message}</span></span></button>
                  <button type="button" className="rounded p-2 text-xs text-muted-foreground hover:text-danger" aria-label={`Apagar o modelo ${t.name}`} onClick={async () => { const r = await deleteSavedTemplateAction(t.id); if (r.ok) setSaved((x) => x.filter((y) => y.id !== t.id)); else toast.error(r.error); }}>Apagar</button></li>
              ); })}</ul>
            </section>
          ) : null}
          {list.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma seção encontrada.</p> : null}
          <p className="px-1 text-xs text-muted-foreground">Seções com cadeado fazem parte de temas de nível superior. <a href={upgradeHref} className="font-medium underline">Comparar temas</a></p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Version = { id: string; label: string; createdAt: string; page: string };
/** Histórico de publicações: restaurar coloca a versão no rascunho; o dono revisa e publica. */
export function VersionsDialog({ open, onOpenChange, page }: { open: boolean; onOpenChange: (o: boolean) => void; /** Página fixa ou livre do site (`p:<id>`, NB2). */ page: string }) {
  const [rows, setRows] = React.useState<Version[] | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return; let live = true;
    Promise.all([listThemeVersionsAction(page), listThemeVersionsAction("globals")]).then(([a, b]) => { if (!live) return; const all = [...(a.ok ? a.data : []), ...(b.ok ? b.data : [])].sort((x, y) => y.createdAt.localeCompare(x.createdAt)); setRows(all); });
    return () => { live = false; setRows(null); };
  }, [open, page]);
  const restore = async (id: string) => { setBusy(id); const r = await restoreThemeVersionAction(id); setBusy(null); if (r.ok) { toast.success("Versão restaurada no rascunho. Revise e publique."); window.location.reload(); } else toast.error(r.error); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Histórico de versões" description="As últimas publicações. Restaurar cria um rascunho com aquela versão.">
        {rows === null ? <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma publicação ainda.</p> : (
          <ul className="nl-scroll max-h-[50vh] divide-y divide-border overflow-y-auto rounded-md border border-border">
            {rows.map((v) => <li key={v.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"><span className="flex min-w-0 items-center gap-2"><History className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="min-w-0"><span className="block truncate font-medium">{v.label}</span><span className="block text-xs text-muted-foreground">{v.page === "globals" ? "Estilo do tema" : "Página inicial"} · {formatDateTime(v.createdAt)}</span></span></span><Button size="sm" variant="secondary" loading={busy === v.id} onClick={() => restore(v.id)}>Restaurar</Button></li>)}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modelos de página e campanha (N4): guardar a página atual como modelo e aplicar um modelo no rascunho.
 * Aplicar não publica; o rascunho passa pela política ao salvar, como qualquer edição.
 */
export function PageTemplatesDialog({ open, onOpenChange, page, current, onApply }: { open: boolean; onOpenChange: (o: boolean) => void; page: PageKind; current: Template; onApply: (t: Template) => void }) {
  const [rows, setRows] = React.useState<SavedTemplate[] | null>(null);
  const [name, setName] = React.useState("");
  React.useEffect(() => { if (!open) return; let live = true; listSavedTemplatesAction().then((r) => { if (live) setRows(r.ok ? r.data.filter((t) => t.kind === "page" && t.page === page) : []); }); return () => { live = false; }; }, [open, page]);
  const save = async () => { const r = await savePageTemplateAction(name || "Modelo de página", page, current); if (r.ok) { toast.success("Modelo salvo"); setName(""); const l = await listSavedTemplatesAction(); if (l.ok) setRows(l.data.filter((t) => t.kind === "page" && t.page === page)); } else toast.error(r.error); };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setRows(null); onOpenChange(o); }}>
      <DialogContent title="Modelos de página e campanha" description="Guarde esta página como modelo (ex.: Black Friday) e aplique quando quiser. Aplicar coloca o modelo no rascunho: revise e publique.">
        <div className="mb-4 flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nome do modelo (ex.: Campanha de inverno)" aria-label="Nome do modelo" className={cn(inputClass, "flex-1")} /><Button type="button" size="sm" onClick={() => void save()}>Salvar página atual</Button></div>
        {rows === null ? <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum modelo desta página ainda.</p> : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {rows.map((t) => <li key={t.id} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{t.name}</span><span className="block text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</span></span><span className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => { onApply(t.data as Template); onOpenChange(false); }}>Aplicar no rascunho</Button><Button size="sm" variant="ghost" onClick={async () => { const r = await deleteSavedTemplateAction(t.id); if (r.ok) setRows((x) => x?.filter((y) => y.id !== t.id) ?? null); else toast.error(r.error); }}>Apagar</Button></span></li>)}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
