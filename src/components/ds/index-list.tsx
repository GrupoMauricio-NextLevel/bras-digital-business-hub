"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Bookmark, Rows3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/app/empty-state";
import { applyIndexQuery, EMPTY_QUERY, queryIsEmpty, sameQuery, toggleSelection, type IndexQuery, type IndexSpec, type IndexView } from "@/lib/ds/index-list";
import { cn } from "@/lib/utils";

export type IndexColumn<T> = { key: string; header: string; cell: (row: T) => React.ReactNode; sortKey?: string; align?: "left" | "right"; hideBelow?: "md" | "lg"; primary?: boolean };
export type IndexFilter = { key: string; label: string; options: { value: string; label: string }[] };
export type BulkAction = { label: string; onRun: (ids: string[]) => void | Promise<void>; tone?: "default" | "danger" };

type Density = "comfortable" | "compact";
const HIDE = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

/** Lê e grava com segurança: o armazenamento do navegador pode estar bloqueado. */
const store = {
  get<V>(key: string, fallback: V): V { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as V) : fallback; } catch { return fallback; } },
  set(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignora */ } },
};

/**
 * Lista de administração: busca, filtros, ordenação, visões salvas por usuário, seleção em lote e densidade.
 * As linhas já vêm carregadas; a lógica de consulta é pura (`lib/ds/index-list`).
 */
export function IndexList<T>({ storageKey, rows, columns, rowKey, spec, filters = [], defaultViews = [], bulkActions = [], rowHref, empty, noun = { singular: "item", plural: "itens" }, searchPlaceholder = "Buscar" }: {
  storageKey: string; rows: T[]; columns: IndexColumn<T>[]; rowKey: (row: T) => string; spec: IndexSpec<T>; filters?: IndexFilter[]; defaultViews?: IndexView[];
  bulkActions?: BulkAction[]; rowHref?: (row: T) => string; empty?: React.ReactNode; noun?: { singular: string; plural: string }; searchPlaceholder?: string;
}) {
  const [query, setQuery] = React.useState<IndexQuery>(EMPTY_QUERY);
  const [activeView, setActiveView] = React.useState<string>("all");
  const [saved, setSaved] = React.useState<IndexView[]>([]);
  const [density, setDensity] = React.useState<Density>("comfortable");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [lastClicked, setLastClicked] = React.useState<string | null>(null);
  const [naming, setNaming] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => { setSaved(store.get<IndexView[]>(`nl-views:${storageKey}`, [])); setDensity(store.get<Density>(`nl-density:${storageKey}`, "comfortable")); });
    return () => cancelAnimationFrame(id);
  }, [storageKey]);

  const views: IndexView[] = [{ id: "all", name: "Todos", query: EMPTY_QUERY }, ...defaultViews, ...saved];
  const shown = React.useMemo(() => applyIndexQuery(rows, query, spec), [rows, query, spec]);
  const ids = shown.map(rowKey);
  const allSelected = ids.length > 0 && ids.every((i) => selected.has(i));
  const dirtyView = !queryIsEmpty(query) && !views.some((v) => sameQuery(v.query, query));

  const pick = (v: IndexView) => { setActiveView(v.id); setQuery(v.query); setSelected(new Set()); };
  const update = (patch: Partial<IndexQuery>) => { setQuery((q) => ({ ...q, ...patch })); setActiveView(""); setSelected(new Set()); };
  const saveView = () => {
    const n = name.trim(); if (!n) return;
    const v: IndexView = { id: `u-${Date.now().toString(36)}`, name: n, query };
    const next = [...saved, v]; setSaved(next); store.set(`nl-views:${storageKey}`, next); setActiveView(v.id); setNaming(false); setName("");
  };
  const removeView = (id: string) => { const next = saved.filter((v) => v.id !== id); setSaved(next); store.set(`nl-views:${storageKey}`, next); if (activeView === id) pick(views[0]!); };
  const setDens = (d: Density) => { setDensity(d); store.set(`nl-density:${storageKey}`, d); };
  const sortBy = (key: string) => update({ sort: query.sort?.key !== key ? { key, dir: "asc" } : query.sort.dir === "asc" ? { key, dir: "desc" } : null });
  const run = async (a: BulkAction) => { setBusy(true); try { await a.onRun([...selected]); setSelected(new Set()); } finally { setBusy(false); } };

  const pad = density === "compact" ? "py-1.5" : "py-3";
  const primary = columns.find((c) => c.primary) ?? columns[0]!;
  const rest = columns.filter((c) => c !== primary);

  return (
    <section aria-label={`Lista de ${noun.plural}`} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="nl-scroll flex items-center gap-1 overflow-x-auto border-b border-border px-2 pt-2" role="group" aria-label="Visões">
        {views.map((v) => (
          <span key={v.id} className="group relative flex shrink-0 items-center">
            <button aria-pressed={activeView === v.id} onClick={() => pick(v)} className={cn("rounded-t-md px-3 py-2 text-sm font-medium transition-colors", activeView === v.id ? "bg-surface-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>{v.name}</button>
            {v.id.startsWith("u-") ? <button aria-label={`Remover visão ${v.name}`} onClick={() => removeView(v.id)} className="-ml-1 rounded p-0.5 text-subtle-foreground opacity-0 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"><X className="size-3.5" aria-hidden /></button> : null}
          </span>
        ))}
        {dirtyView && !naming ? <button onClick={() => setNaming(true)} className="ml-1 flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-soft"><Bookmark className="size-3.5" aria-hidden /> Salvar visão</button> : null}
        {naming ? (
          <form className="ml-1 flex shrink-0 items-center gap-1 pb-1" onSubmit={(e) => { e.preventDefault(); saveView(); }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da visão" aria-label="Nome da visão" maxLength={30} className="h-8 w-40 rounded-md border border-border bg-surface px-2 text-sm" />
            <Button type="submit" size="sm" disabled={!name.trim()}>Salvar</Button><Button type="button" size="sm" variant="ghost" onClick={() => setNaming(false)}>Cancelar</Button>
          </form>
        ) : null}
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-accent-soft px-4 py-2 text-sm" role="region" aria-label="Ações em lote">
          <span className="font-medium">{selected.size} {selected.size === 1 ? noun.singular : noun.plural} {selected.size === 1 ? "selecionado" : "selecionados"}</span>
          {bulkActions.map((a) => <Button key={a.label} size="sm" variant={a.tone === "danger" ? "danger" : "secondary"} loading={busy} onClick={() => run(a)}>{a.label}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar seleção</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden /><input value={query.search} onChange={(e) => update({ search: e.target.value })} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="h-9 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-sm placeholder:text-subtle-foreground" /></div>
          {filters.map((f) => (
            <Select key={f.key} aria-label={f.label} value={query.filters[f.key] ?? ""} onChange={(e) => update({ filters: { ...query.filters, [f.key]: e.target.value } })} className="h-9 w-auto min-w-36 pr-8"><option value="">{f.label}: todos</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          ))}
          {!queryIsEmpty(query) ? <Button variant="ghost" size="sm" onClick={() => pick(views[0]!)}>Limpar filtros</Button> : null}
          <div className="ml-auto flex items-center gap-2">
            <p className="text-xs text-muted-foreground" aria-live="polite">{shown.length} de {rows.length}</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setDens(density === "compact" ? "comfortable" : "compact")} aria-label={density === "compact" ? "Usar densidade confortável" : "Usar densidade compacta"} aria-pressed={density === "compact"}><Rows3 aria-hidden /></Button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="p-6">{rows.length === 0 ? (empty ?? <EmptyState compact title={`Nenhum ${noun.singular} ainda`} />) : <EmptyState compact title="Nada encontrado" description="Ajuste a busca ou os filtros." action={<Button variant="secondary" size="sm" onClick={() => pick(views[0]!)}>Limpar filtros</Button>} />}</div>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {bulkActions.length ? <th className="w-10 px-4 py-2"><input type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(ids))} /></th> : null}
                  {columns.map((c) => {
                    const sorted = c.sortKey && query.sort?.key === c.sortKey ? query.sort.dir : null;
                    return (
                      <th key={c.key} aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined} className={cn("px-4 py-2 font-medium", c.align === "right" && "text-right", c.hideBelow && HIDE[c.hideBelow])}>
                        {c.sortKey ? <button onClick={() => sortBy(c.sortKey!)} className="inline-flex items-center gap-1 uppercase hover:text-foreground">{c.header}{sorted === "asc" ? <ArrowUp className="size-3" aria-hidden /> : sorted === "desc" ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUpDown className="size-3 opacity-40" aria-hidden />}</button> : c.header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((row) => {
                  const id = rowKey(row); const on = selected.has(id);
                  return (
                    <tr key={id} className={cn("relative transition-colors hover:bg-surface-hover", on && "bg-accent-soft/50")}>
                      {bulkActions.length ? <td className="relative z-10 px-4"><input type="checkbox" aria-label={`Selecionar ${id}`} checked={on} onClick={(e) => { setSelected(toggleSelection(selected, ids, id, { shift: (e as React.MouseEvent).shiftKey, last: lastClicked })); setLastClicked(id); }} onChange={() => undefined} /></td> : null}
                      {columns.map((c, i) => <td key={c.key} className={cn("px-4", pad, c.align === "right" && "text-right tabular-nums", c.hideBelow && HIDE[c.hideBelow])}>{i === 0 && rowHref ? <Link href={rowHref(row)} className="font-medium after:absolute after:inset-0 hover:underline">{c.cell(row)}</Link> : c.cell(row)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border md:hidden">
            {shown.map((row) => {
              const id = rowKey(row);
              return (
                <li key={id} className="relative flex gap-3 p-4">
                  {bulkActions.length ? <input type="checkbox" className="relative z-10 mt-1 size-4" aria-label={`Selecionar ${id}`} checked={selected.has(id)} onChange={() => setSelected(toggleSelection(selected, ids, id))} /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 text-sm font-medium">{rowHref ? <Link href={rowHref(row)} className="after:absolute after:inset-0">{primary.cell(row)}</Link> : primary.cell(row)}</div>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">{rest.map((c) => <React.Fragment key={c.key}><dt className="text-xs text-muted-foreground">{c.header}</dt><dd className="text-right">{c.cell(row)}</dd></React.Fragment>)}</dl>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
