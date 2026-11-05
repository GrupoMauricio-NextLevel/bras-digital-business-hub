"use client";
import * as React from "react";
import { eventoMeta } from "./pixel-meta";
import { precoDoCarrinho, type RegraMix } from "@/lib/finance/atacado-preco";

export type CartLine = { key: string; productId: string; variantId?: string; packId?: string; name: string; label: string; unitPriceCents: number; quantity: number; images: string[]; max: number;
  /** Preço por quantidade do produto (soma das unidades do mesmo produto no carrinho). */
  tiers?: { minQty: number; priceCents: number }[];
  /** Atacado (AT0, D257): preço por peça no atacado, coleção, peças da grade e piso. Opcionais (carrinhos antigos seguem valendo). */
  atacadoCents?: number | null; categoryId?: string | null; pecasPorUnidade?: number; pisoCents?: number };

/** Preço efetivo de cada linha pelo motor único do servidor (`precoDoCarrinho`), que recalcula tudo ao criar o pedido. */
export function priceCartLines(lines: CartLine[], regras: RegraMix[] = []): CartLine[] {
  const r = precoDoCarrinho(lines.map((l) => ({ key: l.key, productId: l.productId, categoryId: l.categoryId, packId: l.packId, pecasPorUnidade: l.pecasPorUnidade, quantity: l.quantity, varejoCents: l.unitPriceCents, atacadoCents: l.atacadoCents, faixas: l.tiers, pisoCents: l.pisoCents })), regras);
  return lines.map((l, i) => (r.linhas[i]!.unitCents === l.unitPriceCents ? l : { ...l, unitPriceCents: r.linhas[i]!.unitCents }));
}

/**
 * Store externo por loja (localStorage) consumido via useSyncExternalStore,
 * evitando setState em efeitos e mantendo SSR consistente (snapshot vazio no servidor).
 */
type Listener = () => void;
const EMPTY: CartLine[] = [];
const stores = new Map<string, { lines: CartLine[]; listeners: Set<Listener>; loaded: boolean }>();

function getStore(slug: string) {
  let s = stores.get(slug);
  if (!s) {
    s = { lines: EMPTY, listeners: new Set(), loaded: false };
    stores.set(slug, s);
  }
  if (!s.loaded && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`nl-cart:${slug}`);
      if (raw) s.lines = JSON.parse(raw) as CartLine[];
    } catch { /* ignore */ }
    s.loaded = true;
  }
  return s;
}

function setLines(slug: string, next: CartLine[]) {
  const s = getStore(slug);
  s.lines = next;
  try { localStorage.setItem(`nl-cart:${slug}`, JSON.stringify(next)); } catch { /* ignore */ }
  s.listeners.forEach((l) => l());
}

function useCartLines(slug: string): { lines: CartLine[]; ready: boolean } {
  const subscribe = React.useCallback((l: Listener) => { const s = getStore(slug); s.listeners.add(l); return () => { s.listeners.delete(l); }; }, [slug]);
  const lines = React.useSyncExternalStore(subscribe, () => getStore(slug).lines, () => EMPTY);
  const ready = React.useSyncExternalStore(subscribe, () => true, () => false);
  return { lines, ready };
}

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
  const { lines: rawLines, ready } = useCartLines(storeSlug);
  const lines = React.useMemo(() => priceCartLines(rawLines), [rawLines]);
  const value = React.useMemo<Ctx>(() => ({
    lines,
    ready,
    add: (line) => {
      eventoMeta("AddToCart", { currency: "BRL", value: (line.unitPriceCents * line.quantity) / 100 });
      const key = `${line.productId}:${line.variantId ?? ""}:${line.packId ?? ""}`;
      const prev = getStore(storeSlug).lines;
      const existing = prev.find((l) => l.key === key);
      setLines(storeSlug, existing ? prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.max, l.quantity + line.quantity) } : l)) : [...prev, { ...line, key }]);
    },
    update: (key, quantity) => setLines(storeSlug, getStore(storeSlug).lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(l.max, quantity)) } : l))),
    remove: (key) => setLines(storeSlug, getStore(storeSlug).lines.filter((l) => l.key !== key)),
    clear: () => setLines(storeSlug, []),
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0),
  }), [lines, ready, storeSlug]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
