"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [{ value: "", label: "Ordem do catálogo" }, { value: "newest", label: "Mais novos" }, { value: "price-asc", label: "Menor preço" }, { value: "price-desc", label: "Maior preço" }, { value: "name", label: "Nome (A a Z)" }];

/** Ordenação do catálogo pelo endereço (?sort=), mantendo busca e categoria. */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter(); const path = usePathname(); const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600">Ordenar
      <select value={value} onChange={(e) => { const p = new URLSearchParams(params.toString()); if (e.target.value) p.set("sort", e.target.value); else p.delete("sort"); router.push(`${path}${p.size ? `?${p}` : ""}`); }} className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900">
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
