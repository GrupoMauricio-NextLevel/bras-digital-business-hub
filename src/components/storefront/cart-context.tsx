"use client";
import * as React from "react";
import { eventoMeta } from "./pixel-meta";
import { precoDoCarrinho, type CarrinhoPrecificado, type LinhaPreco, type RegraMix } from "@/lib/finance/atacado-preco";
import { pendenciasDoCarrinho, type RegraDoModelo } from "@/lib/finance/atacado-modelo";

export type CartLine = { key: string; productId: string; variantId?: string; packId?: string; name: string; label: string; unitPriceCents: number; quantity: number; images: string[]; max: number;
  /** Preço por quantidade do produto (soma das unidades do mesmo produto no carrinho). */
  tiers?: { minQty: number; priceCents: number }[];
  /** Atacado (AT0, D257): preço por peça no atacado, coleção, peças da grade e piso. Opcionais (carrinhos antigos seguem valendo). */
  atacadoCents?: number | null; categoryId?: string | null; pecasPorUnidade?: number; pisoCents?: number };

/** Linha do carrinho no formato do motor único. */
export const linhaDoMotor = (l: CartLine): LinhaPreco => ({ key: l.key, productId: l.productId, categoryId: l.categoryId, packId: l.packId, pecasPorUnidade: l.pecasPorUnidade, quantity: l.quantity, varejoCents: l.unitPriceCents, atacadoCents: l.atacadoCents, faixas: l.tiers, pisoCents: l.pisoCents });

/** Preço efetivo de cada linha pelo motor único do servidor (`precoDoCarrinho`), que recalcula tudo ao criar o pedido. */
export function priceCartLines(lines: CartLine[], regras: RegraMix[] = []): CartLine[] {
  return precificarCarrinho(lines, regras).lines;
}

function precificarCarrinho(lines: CartLine[], regras: RegraMix[]): { lines: CartLine[]; precificado: CarrinhoPrecificado } {
  const r = precoDoCarrinho(lines.map(linhaDoMotor), regras);
  return { precificado: r, lines: lines.map((l, i) => (r.linhas[i]!.unitCents === l.unitPriceCents ? l : { ...l, unitPriceCents: r.linhas[i]!.unitCents })) };
}

/**
 * Atacado da loja para o carrinho (AT2, D259): regras de mix e, por produto, o preço de atacado e a coleção atuais
 * (carrinhos salvos antes continuam certos, porque o dado vem da loja e não da linha guardada no navegador).
 */
export type AtacadoDaLoja = { regras: RegraMix[]; produtos: Record<string, { atacadoCents: number | null; categoryId: string | null }>; pacotes: Record<string, number>; /** Grade livre (AT3, D268): mínimo e múltiplo por modelo. */ modelos?: Record<string, RegraDoModelo> };

function comDadosDaLoja(lines: CartLine[], a: AtacadoDaLoja | undefined): CartLine[] {
  if (!a) return lines;
  return lines.map((l) => {
    const p = a.produtos[l.productId];
    const pecas = l.packId ? a.pacotes[l.packId] ?? l.pecasPorUnidade : l.pecasPorUnidade;
    return p || pecas !== l.pecasPorUnidade ? { ...l, atacadoCents: l.packId ? null : p?.atacadoCents ?? null, categoryId: p?.categoryId ?? l.categoryId ?? null, pecasPorUnidade: pecas } : l;
  });
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
  /** Resultado do motor para o carrinho todo: economia, peças e progresso de cada regra de mix. */
  precificado: CarrinhoPrecificado;
  regras: RegraMix[];
  /** A loja vende no atacado (não é loja de rede): o card e o box mostram grade, pacote e "a partir de". */
  atacadoLigado: boolean;
  /** Linhas atuais (preço de varejo) com os dados de atacado da loja, para simular uma adição no box. */
  linhasBase: CartLine[];
  /** Modelos com mínimo ou múltiplo que ainda não fecham (o pedido é recusado até fechar). */
  pendencias: ReturnType<typeof pendenciasDoCarrinho>;
  modelos: Record<string, RegraDoModelo>;
  /** Adiciona várias linhas de uma vez (matriz cor × tamanho). */
  addMany: (lines: Omit<CartLine, "key">[]) => void;
  add: (line: Omit<CartLine, "key">) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  ready: boolean;
};

const CartContext = React.createContext<Ctx | null>(null);

function juntar(prev: CartLine[], line: Omit<CartLine, "key">): CartLine[] {
  const key = `${line.productId}:${line.variantId ?? ""}:${line.packId ?? ""}`;
  const existing = prev.find((l) => l.key === key);
  return existing ? prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.max, l.quantity + line.quantity) } : l)) : [...prev, { ...line, key }];
}

export function CartProvider({ storeSlug, atacado, children }: { storeSlug: string; atacado?: AtacadoDaLoja; children: React.ReactNode }) {
  const { lines: rawLines, ready } = useCartLines(storeSlug);
  const linhasBase = React.useMemo(() => comDadosDaLoja(rawLines, atacado), [rawLines, atacado]);
  const regras = React.useMemo(() => atacado?.regras ?? [], [atacado]);
  const { lines, precificado } = React.useMemo(() => precificarCarrinho(linhasBase, regras), [linhasBase, regras]);
  const modelos = React.useMemo(() => atacado?.modelos ?? {}, [atacado]);
  const pendencias = React.useMemo(() => pendenciasDoCarrinho(rawLines, modelos), [rawLines, modelos]);
  const value = React.useMemo<Ctx>(() => ({
    lines,
    precificado,
    regras,
    atacadoLigado: !!atacado,
    linhasBase,
    ready,
    pendencias,
    modelos,
    addMany: (novas) => {
      if (!novas.length) return;
      eventoMeta("AddToCart", { currency: "BRL", value: novas.reduce((t, l) => t + l.unitPriceCents * l.quantity, 0) / 100 });
      setLines(storeSlug, novas.reduce(juntar, getStore(storeSlug).lines));
    },
    add: (line) => {
      eventoMeta("AddToCart", { currency: "BRL", value: (line.unitPriceCents * line.quantity) / 100 });
      setLines(storeSlug, juntar(getStore(storeSlug).lines, line));
    },
    update: (key, quantity) => setLines(storeSlug, getStore(storeSlug).lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(l.max, quantity)) } : l))),
    remove: (key) => setLines(storeSlug, getStore(storeSlug).lines.filter((l) => l.key !== key)),
    clear: () => setLines(storeSlug, []),
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0),
  }), [lines, precificado, regras, atacado, linhasBase, ready, storeSlug, pendencias, modelos]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Para componentes que também aparecem fora da loja (card): sem carrinho, sem atacado. */
export function useCartOptional() {
  return React.useContext(CartContext);
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
