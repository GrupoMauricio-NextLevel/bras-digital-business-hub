import Link from "next/link";
import { cn } from "@/lib/utils";

/** Abas por endereço (`?tab=`): funcionam sem JavaScript e podem ser compartilhadas por link. */
export function LinkTabs({ items, active, label }: { items: { key: string; label: string; href: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined} className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition", t.key === active ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</Link>
      ))}
    </nav>
  );
}
