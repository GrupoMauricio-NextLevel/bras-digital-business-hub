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
    <button key={value} onClick={() => set(value)} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors", current === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground")}>
      {label}
      {typeof count === "number" ? <span className={cn("rounded-full px-1.5 text-[10px]", current === value ? "bg-white/20" : "bg-surface-muted")}>{count}</span> : null}
    </button>
  );
  return (
    <div className="nl-scroll flex gap-2 overflow-x-auto pb-1">
      {chip("", allLabel)}
      {options.map((o) => chip(o.value, o.label, o.count))}
    </div>
  );
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>{children}</div>;
}
