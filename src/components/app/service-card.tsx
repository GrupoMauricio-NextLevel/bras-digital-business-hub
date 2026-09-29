import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServiceCard({ title, description, priceLabel, href, badge, className }: { title: string; description: string; priceLabel?: string; href: string; badge?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-accent/50 hover:shadow-md", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-accent-soft text-accent"><Sparkles className="size-4" aria-hidden /></span>
        {badge ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">{badge}</span> : null}
      </div>
      <h3 className="text-sm font-semibold group-hover:text-accent">{title}</h3>
      <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
      {priceLabel ? <p className="mt-auto pt-1 text-sm font-semibold tabular-nums">{priceLabel}</p> : null}
    </Link>
  );
}
