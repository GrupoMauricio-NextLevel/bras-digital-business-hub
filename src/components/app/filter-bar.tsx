"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/input";

export function SearchInput({ placeholder = "Buscar…", param = "q", className }: { placeholder?: string; param?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get(param) ?? "");
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(param, value);
      else next.delete(param);
      const qs = next.toString();
      if (qs !== params.toString()) router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [value, param, params, pathname, router]);
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className={cn(inputClass, "pl-9 pr-8")} />
      {value ? (
        <button onClick={() => setValue("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle-foreground hover:text-foreground" aria-label="Limpar">
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function FilterChips({ param, options, allLabel = "Todos" }: { param: string; options: { value: string; label: string; count?: number }[]; allLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? "";
  const set = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(param, v);
    else next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  const chip = (value: string, label: string, count?: number) => (
    <button key={value} type="button" aria-pressed={current === value} onClick={() => set(value)} className="ds-seg-btn">
      {label}
      {typeof count === "number" ? <span className="ds-count">{count}</span> : null}
    </button>
  );
  return (
    <div className="ds-seg nl-scroll">
      {chip("", allLabel)}
      {options.map((o) => chip(o.value, o.label, o.count))}
    </div>
  );
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>{children}</div>;
}

/** Abas para as visões frequentes e um seletor agrupado para os demais valores (todas as opções continuam disponíveis). */
export function FilterTabs({ param, primary, rest, allLabel = "Todos", restLabel = "Outros status" }: { param: string; primary: { value: string; label: string; count?: number }[]; rest: { value: string; label: string }[]; allLabel?: string; restLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? "";
  const set = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(param, v);
    else next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  const inRest = rest.some((r) => r.value === current);
  const tab = (value: string, label: string, count?: number) => (
    <button key={value} type="button" role="tab" aria-selected={current === value} onClick={() => set(value)} className="ds-seg-btn">
      {label}{typeof count === "number" ? <span className="ds-count">{count}</span> : null}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="tablist" aria-label="Visões de pedidos" className="ds-seg nl-scroll">{tab("", allLabel)}{primary.map((o) => tab(o.value, o.label, o.count))}</div>
      {rest.length ? (
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only sm:not-sr-only">{restLabel}</span>
          <select value={inRest ? current : ""} onChange={(e) => set(e.target.value)} className="h-10 rounded-[var(--ds-r-control)] border border-border bg-surface px-3 text-sm font-semibold text-foreground">
            <option value="">{inRest ? "Limpar filtro" : "Outros status…"}</option>
            {rest.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}
