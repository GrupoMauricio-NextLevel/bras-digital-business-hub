import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Você está em" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {c.href && i < items.length - 1 ? <Link href={c.href} className="rounded hover:text-foreground hover:underline">{c.label}</Link> : <span aria-current={i === items.length - 1 ? "page" : undefined} className={i === items.length - 1 ? "text-foreground" : undefined}>{c.label}</span>}
            {i < items.length - 1 ? <ChevronRight className="size-3.5" aria-hidden /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Página de administração: trilha, título com status, ação primária e secundárias.
 * `width` controla a largura útil (formulários ficam mais estreitos que listas).
 */
export function Page({ title, subtitle, breadcrumbs, badge, primaryAction, secondaryActions, width = "full", className, children }: {
  title: string; subtitle?: React.ReactNode; breadcrumbs?: Crumb[]; badge?: React.ReactNode; primaryAction?: React.ReactNode; secondaryActions?: React.ReactNode;
  width?: "narrow" | "wide" | "full"; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full", width === "narrow" && "max-w-3xl", width === "wide" && "max-w-6xl", className)}>
      <header className="mb-6">
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{badge}</div>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {primaryAction || secondaryActions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{secondaryActions}{primaryAction}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}

/** Duas colunas: conteúdo principal e lateral (status, organização, prévia). A lateral gruda ao rolar em telas grandes. */
export function TwoColumn({ main, aside, asideSticky = true, className }: { main: React.ReactNode; aside: React.ReactNode; asideSticky?: boolean; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]", className)}>
      <div className="min-w-0 space-y-6">{main}</div>
      <aside className={cn("min-w-0 space-y-6", asideSticky && "lg:sticky lg:top-24 lg:self-start")}>{aside}</aside>
    </div>
  );
}
