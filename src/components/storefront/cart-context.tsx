"use client";
import * as React from "react";

export type CartLine = { key: string; productId: string; variantId?: string; packId?: string; name: string; label: string; unitPriceCents: number; quantity: number; images: string[]; max: number };

type Ctx = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key">) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = React.createContext<Ctx | null>(null);

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: React.ReactNode }) {
  const storageKey = `nl-cart:${storeSlug}`;
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch { /* ignore */ }
    setReady(true);
  }, [storageKey]);

  React.useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(lines));
  }, [lines, ready, storageKey]);

  const value = React.useMemo<Ctx>(() => ({
    lines,
    ready,
    add: (line) => setLines((prev) => {
      const key = `${line.productId}:${line.variantId ?? ""}:${line.packId ?? ""}`;
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.max, l.quantity + line.quantity) } : l));
      return [...prev, { ...line, key }];
    }),
    update: (key, quantity) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(l.max, quantity)) } : l))),
    remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
    clear: () => setLines([]),
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0),
  }), [lines, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
