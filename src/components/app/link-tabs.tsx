import Link from "next/link";

/** Abas por endereço (`?tab=`): funcionam sem JavaScript e podem ser compartilhadas por link. */
export function LinkTabs({ items, active, label }: { items: { key: string; label: string; href: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="ds-seg nl-scroll mb-6">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
