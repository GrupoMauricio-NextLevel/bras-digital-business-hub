"use client";
import * as React from "react";
import { History, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { inputClass } from "@/components/ui/input";
import { listThemeVersionsAction, restoreThemeVersionAction } from "@/app/actions/theme";
import { SECTION_SCHEMAS } from "@/lib/themes/sections";
import type { PageKind, SectionRegion, Template } from "@/lib/themes/types";
import { cn, formatDateTime } from "@/lib/utils";

/** Catálogo de seções: busca, agrupado por categoria, com seção única já usada e recurso pago sinalizados. */
export function AddSectionDialog({ open, onOpenChange, region, page, current, premium, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; region: SectionRegion; page: PageKind; current: Template; premium: boolean; onPick: (type: string) => void }) {
  const [q, setQ] = React.useState("");
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const used = new Set(current.order.map((id) => current.sections[id]!.type));
  const list = SECTION_SCHEMAS.filter((s) => s.region === region && (region !== "content" || s.pages.includes(page)) && fold(`${s.name} ${s.description} ${s.category}`).includes(fold(q)));
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
                {list.filter((s) => s.category === g).map((s) => { const disabled = (s.singleton && used.has(s.type)) || (s.premium && !premium); return (
                  <li key={s.type}><button type="button" disabled={disabled} onClick={() => { onPick(s.type); onOpenChange(false); }} className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50">
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{s.name}{s.premium ? <span className="ml-2 inline-flex items-center gap-1 rounded bg-accent-soft px-1.5 text-[10px] font-semibold text-accent-foreground"><Lock className="size-3" aria-hidden /> Premium</span> : null}</span><span className="block text-xs text-muted-foreground">{s.singleton && used.has(s.type) ? "Já está na página." : s.description}</span></span>
                  </button></li>
                ); })}
              </ul>
            </section>
          ))}
          {list.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma seção encontrada.</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Version = { id: string; label: string; createdAt: string; page: string };
/** Histórico de publicações: restaurar coloca a versão no rascunho; o dono revisa e publica. */
export function VersionsDialog({ open, onOpenChange, page }: { open: boolean; onOpenChange: (o: boolean) => void; page: PageKind }) {
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
