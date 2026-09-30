"use client";
import * as React from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, GripVertical, Lock, Palette, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Region, Selection } from "@/lib/themes/editor-state";
import { sectionSchema } from "@/lib/themes/sections";
import type { Template } from "@/lib/themes/types";
import { cn } from "@/lib/utils";

export type TreeActions = {
  select: (s: Selection) => void; hover: (id: string | null) => void;
  move: (region: Region, id: string, to: number) => void; toggle: (region: Region, id: string) => void; duplicate: (region: Region, id: string) => void; remove: (region: Region, id: string) => void;
  addSection: (region: Region) => void; addBlock: (region: Region, sectionId: string, type: string) => void;
  moveBlock: (region: Region, sectionId: string, blockId: string, to: number) => void; removeBlock: (region: Region, sectionId: string, blockId: string) => void;
};

const iconBtn = "rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35 focus-visible:opacity-100";

function Group({ title, region, t, sel, advanced, actions, canAdd, canReorder, lockHint }: { title: string; region: Region; t: Template; sel: Selection; advanced: boolean; actions: TreeActions; canAdd: boolean; canReorder: boolean; lockHint: string }) {
  const [drag, setDrag] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  return (
    <section aria-label={title} className="mb-4">
      <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ul>
        {t.order.map((id, i) => {
          const s = t.sections[id]!; const schema = sectionSchema(s.type); const active = sel?.kind !== "style" && sel && ((sel.kind === "section" && sel.id === id) || (sel.kind === "block" && sel.sectionId === id)) && sel.region === region;
          const selectedSection = sel?.kind === "section" && sel.id === id && sel.region === region;
          return (
            <li key={id} draggable={canReorder && advanced} onDragStart={() => setDrag(id)} onDragEnd={() => { setDrag(null); setOver(null); }} onDragOver={(e) => { if (drag && drag !== id) { e.preventDefault(); setOver(id); } }} onDrop={(e) => { e.preventDefault(); if (drag) actions.move(region, drag, i); setDrag(null); setOver(null); }} className={cn(drag === id && "opacity-40", over === id && "border-t-2 border-accent")}>
              <div className={cn("group relative flex items-center gap-1 rounded-md px-1.5 py-1", selectedSection ? "bg-accent-soft" : active ? "bg-surface-muted" : "hover:bg-surface-hover")} onMouseEnter={() => actions.hover(id)} onMouseLeave={() => actions.hover(null)}>
                {canReorder ? <GripVertical className={cn("size-4 shrink-0 text-subtle-foreground", advanced ? "cursor-grab" : "opacity-30")} aria-hidden /> : <span className="size-4 shrink-0" />}
                <button type="button" onClick={() => actions.select({ kind: "section", region, id })} aria-current={selectedSection ? "true" : undefined} className={cn("min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-sm", s.hidden && "text-muted-foreground line-through")}>{schema?.name ?? s.type}</button>
                <span className={cn("absolute right-1 top-1/2 flex -translate-y-1/2 items-center rounded-md bg-surface shadow-sm ring-1 ring-border transition-opacity", selectedSection ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100")}>
                  {canReorder ? <><button type="button" className={iconBtn} disabled={!advanced || i === 0} onClick={() => actions.move(region, id, i - 1)} aria-label={`Mover ${schema?.name} para cima`}><ArrowUp className="size-3.5" aria-hidden /></button>
                  <button type="button" className={iconBtn} disabled={!advanced || i === t.order.length - 1} onClick={() => actions.move(region, id, i + 1)} aria-label={`Mover ${schema?.name} para baixo`}><ArrowDown className="size-3.5" aria-hidden /></button></> : null}
                  <button type="button" className={iconBtn} disabled={!advanced} onClick={() => actions.toggle(region, id)} aria-label={s.hidden ? `Mostrar ${schema?.name}` : `Ocultar ${schema?.name}`} title={advanced ? undefined : lockHint}>{s.hidden ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}</button>
                  {!schema?.singleton ? <button type="button" className={iconBtn} disabled={!advanced} onClick={() => actions.duplicate(region, id)} aria-label={`Duplicar ${schema?.name}`}><Copy className="size-3.5" aria-hidden /></button> : null}
                  {!schema?.singleton ? <button type="button" className={cn(iconBtn, "hover:text-danger")} disabled={!advanced} onClick={() => actions.remove(region, id)} aria-label={`Remover ${schema?.name}`}><Trash2 className="size-3.5" aria-hidden /></button> : null}
                </span>
              </div>
              {active && (schema?.blocks?.length ?? 0) > 0 ? (
                <ul className="ml-7 border-l border-border pl-2" aria-label={`Blocos de ${schema?.name}`}>
                  {s.blockOrder.map((bid, bi) => { const b = s.blocks[bid]!; const bdef = schema!.blocks!.find((d) => d.type === b.type); const bsel = sel?.kind === "block" && sel.blockId === bid; return (
                    <li key={bid} className={cn("group/b relative flex items-center gap-1 rounded-md px-1.5 py-1", bsel ? "bg-accent-soft" : "hover:bg-surface-hover")}>
                      <button type="button" onClick={() => actions.select({ kind: "block", region, sectionId: id, blockId: bid })} className="min-w-0 flex-1 truncate px-1 py-0.5 text-left text-[13px]">{String(b.settings.title ?? bdef?.name ?? b.type) || bdef?.name}</button>
                      <span className={cn("absolute right-1 top-1/2 flex -translate-y-1/2 items-center rounded-md bg-surface shadow-sm ring-1 ring-border transition-opacity", bsel ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-focus-within/b:opacity-100 sm:group-hover/b:opacity-100")}>
                        <button type="button" className={iconBtn} disabled={!advanced || bi === 0} onClick={() => actions.moveBlock(region, id, bid, bi - 1)} aria-label="Mover bloco para cima"><ArrowUp className="size-3" aria-hidden /></button>
                        <button type="button" className={iconBtn} disabled={!advanced || bi === s.blockOrder.length - 1} onClick={() => actions.moveBlock(region, id, bid, bi + 1)} aria-label="Mover bloco para baixo"><ArrowDown className="size-3" aria-hidden /></button>
                        <button type="button" className={cn(iconBtn, "hover:text-danger")} disabled={!advanced} onClick={() => actions.removeBlock(region, id, bid)} aria-label="Remover bloco"><Trash2 className="size-3" aria-hidden /></button>
                      </span>
                    </li>
                  ); })}
                  {schema!.blocks!.map((bd) => (s.blockOrder.length < (schema!.maxBlocks ?? 24) ? <li key={bd.type}><button type="button" disabled={!advanced} onClick={() => actions.addBlock(region, id, bd.type)} className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[13px] text-accent-foreground hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"><Plus className="size-3.5" aria-hidden /> Adicionar {bd.name.toLowerCase()}</button></li> : null))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {canAdd ? (
        <Button type="button" variant="ghost" size="sm" className="mt-1 w-full justify-start text-accent-foreground" onClick={() => actions.addSection(region)} title={advanced ? undefined : lockHint}>{advanced ? <Plus aria-hidden /> : <Lock aria-hidden />} Adicionar seção</Button>
      ) : null}
    </section>
  );
}

export function SectionTree({ header, content, footer, pageLabel, sel, advanced, actions, lockHint }: { header: Template; content: Template; footer: Template; pageLabel: string; sel: Selection; advanced: boolean; actions: TreeActions; lockHint: string }) {
  return (
    <div className="p-3">
      <button type="button" onClick={() => actions.select({ kind: "style" })} className={cn("mb-4 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-hover", sel?.kind === "style" && "border-accent bg-accent-soft")}><Palette className="size-4" aria-hidden /> Cores, fontes e estilo</button>
      <Group title="Cabeçalho" region="header" t={header} sel={sel} advanced={advanced} actions={actions} canAdd={false} canReorder={false} lockHint={lockHint} />
      <Group title={pageLabel} region="content" t={content} sel={sel} advanced={advanced} actions={actions} canAdd canReorder lockHint={lockHint} />
      <Group title="Rodapé" region="footer" t={footer} sel={sel} advanced={advanced} actions={actions} canAdd={false} canReorder={false} lockHint={lockHint} />
    </div>
  );
}
