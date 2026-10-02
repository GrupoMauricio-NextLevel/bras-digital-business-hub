"use client";

import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import * as React from "react";
import { BUSINESS_CONTEXTS, PRODUCT_CONTEXTS, type ProductContext } from "@/lib/product-context";

export function ProductSwitcher({ current, master = false }: { current: ProductContext; master?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const contexts = master ? [PRODUCT_CONTEXTS.master, ...BUSINESS_CONTEXTS] : [current, PRODUCT_CONTEXTS.master];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="group flex min-h-11 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--product-accent)]">
        <span className="h-7 w-[3px] shrink-0 bg-[var(--product-accent)]" aria-hidden />
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">NextLevel /</span>
          <span className="block truncate text-sm font-semibold tracking-tight text-foreground">{current.shortName}</span>
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-aria-expanded:rotate-180" aria-hidden />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Fechar seletor" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-3 w-[min(88vw,360px)] border border-border bg-surface py-2 shadow-xl">
            <div className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[.16em] text-subtle-foreground">Ecossistema NextLevel</div>
            {contexts.map((item) => item.available && item.href ? (
              <Link key={item.key} href={item.href} onClick={() => setOpen(false)}
                className="group flex items-center gap-3 border-t border-border/70 px-4 py-3 transition-colors hover:bg-surface-hover">
                <span className="h-8 w-1 shrink-0" style={{ background: item.accent }} aria-hidden />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="block text-xs text-muted-foreground">{item.descriptor}</span></span>
                <ArrowUpRight className="size-4 text-subtle-foreground group-hover:text-foreground" />
              </Link>
            ) : (
              <div key={item.key} className="flex items-center gap-3 border-t border-border/70 px-4 py-3 opacity-55">
                <span className="h-8 w-1 shrink-0" style={{ background: item.accent }} aria-hidden />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="block text-xs text-muted-foreground">{item.descriptor}</span></span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-subtle-foreground">Em preparação</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
