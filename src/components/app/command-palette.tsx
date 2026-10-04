"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search, ShoppingCart, Store, Package, Factory, User, Compass, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, QuickAction } from "@/lib/nav";
import type { SearchHit } from "@/lib/domain/search";
import { ICONS } from "./icons";

type Item = { key: string; group: string; label: string; hint?: string; href: string; icon: React.ReactNode };
const KIND_ICON = { order: ShoppingCart, store: Store, product: Package, supplier: Factory, customer: User } as const;

/** Ctrl/Cmd+K: navegar, executar ações rápidas e buscar pedidos, lojas e produtos do seu escopo. */
export function CommandPalette({ open, onOpenChange, items, quick, search, container }: { open: boolean; onOpenChange: (o: boolean) => void; items: NavItem[]; quick: QuickAction[]; search?: (q: string) => Promise<SearchHit[]>; /** Onde montar a janela (o painel Commerce usa o próprio escopo de tema). */ container?: HTMLElement | null }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<SearchHit[]>([]);
  const [active, setActive] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const seq = React.useRef(0);

  React.useEffect(() => {
    if (!search || q.trim().length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await search(q).catch(() => []);
      if (id === seq.current) { setHits(r); setBusy(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [q, search]);

  const needle = q.trim().toLowerCase();
  const list: Item[] = React.useMemo(() => {
    const nav: Item[] = items.filter((i) => !needle || i.label.toLowerCase().includes(needle)).map((i) => { const Icon = ICONS[i.icon]; return { key: `n-${i.href}`, group: "Ir para", label: i.label, href: i.href, icon: <Icon className="size-4" /> }; });
    const act: Item[] = quick.filter((a) => !needle || a.label.toLowerCase().includes(needle)).map((a) => { const Icon = ICONS[a.icon]; return { key: `a-${a.href}`, group: "Ações rápidas", label: a.label, href: a.href, icon: <Icon className="size-4" /> }; });
    const shownHits = needle.length < 2 ? [] : hits;
    const res: Item[] = shownHits.map((h) => { const Icon = KIND_ICON[h.kind]; return { key: `h-${h.kind}-${h.id}`, group: "Resultados", label: h.title, hint: h.subtitle, href: h.href, icon: <Icon className="size-4" /> }; });
    return [...res, ...act, ...nav];
  }, [items, quick, needle, hits]);

  const go = (it: Item) => { onOpenChange(false); router.push(it.href); };
  const clampedActive = Math.min(active, Math.max(list.length - 1, 0));
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && list[clampedActive]) { e.preventDefault(); go(list[clampedActive]!); }
  };
  const groups = [...new Set(list.map((l) => l.group))];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setQ(""); setHits([]); setActive(0); } }}>
      <DialogPrimitive.Portal container={container ?? undefined}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-raised shadow-md animate-pop focus:outline-none" onKeyDown={onKey}>
          <DialogPrimitive.Title className="sr-only">Buscar e navegar</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Digite para buscar pedidos, lojas e produtos, ou escolha uma página ou ação.</DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder="Buscar pedido, loja, produto ou ir para…" aria-label="Buscar" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle-foreground" />
            {busy ? <span className="text-xs text-muted-foreground" aria-live="polite">buscando…</span> : null}
          </div>
          <div className="nl-scroll max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Resultados">
            {list.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nada encontrado para “{q}”.</p> : groups.map((g) => (
              <div key={g} className="mb-1">
                <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">{g === "Ir para" ? <Compass className="size-3" /> : g === "Ações rápidas" ? <Zap className="size-3" /> : <Search className="size-3" />}{g}</div>
                {list.map((it, idx) => it.group !== g ? null : (
                  <button key={it.key} role="option" aria-selected={idx === clampedActive} onMouseEnter={() => setActive(idx)} onClick={() => go(it)} className={cn("flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm", idx === clampedActive ? "bg-accent-soft text-foreground" : "text-foreground")}>
                    <span className="text-muted-foreground">{it.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate">{it.label}</span>{it.hint ? <span className="block truncate text-xs text-muted-foreground">{it.hint}</span> : null}</span>
                    {idx === clampedActive ? <CornerDownLeft className="size-3.5 text-muted-foreground" /> : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground"><span>↑↓ navegar · Enter abrir · Esc fechar</span><span>Ctrl/Cmd + K</span></div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
