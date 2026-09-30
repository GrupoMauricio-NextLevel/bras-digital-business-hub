"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Check, Truck } from "lucide-react";
import type { PublicProduct } from "@/lib/queries/storefront";
import { useCart } from "@/components/storefront/cart-context";
import { SfButton } from "@/components/storefront/sf-button";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export function BuyBox({ product, slug, shippingNote = "Enviado pela Central Sports · etiqueta em até 1 dia útil após confirmação", stickyBar = false }: { product: PublicProduct; slug: string; shippingNote?: string; stickyBar?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [mode, setMode] = React.useState<"unit" | "pack">(product.sellsUnit ? "unit" : "pack");
  const [variantId, setVariantId] = React.useState<string>(product.variants.find((v) => v.available > 0)?.id ?? "");
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = React.useState(true);
  React.useEffect(() => {
    if (!stickyBar || !ctaRef.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(!!e?.isIntersecting), { threshold: 0.2 });
    io.observe(ctaRef.current); return () => io.disconnect();
  }, [stickyBar]);
  const pack = product.packs[0];
  const variant = product.variants.find((v) => v.id === variantId);
  const max = mode === "unit" ? variant?.available ?? 0 : pack?.available ?? 0;
  const price = mode === "unit" ? product.priceCents : pack?.priceCents ?? 0;

  const add = () => {
    if (max === 0) return toast.error("Sem estoque disponível.");
    if (mode === "unit" && !variant) return toast.error("Escolha um tamanho.");
    cart.add(mode === "unit"
      ? { productId: product.id, variantId: variant!.id, name: product.name, label: `Tam. ${variant!.size}`, unitPriceCents: price, quantity: qty, images: product.images, max }
      : { productId: product.id, packId: pack!.id, name: product.name, label: `${pack!.name} (${pack!.items.map((i) => `${i.size}:${i.quantity}`).join(" ")})`, unitPriceCents: price, quantity: qty, images: product.images, max });
    setAdded(true);
    toast.success("Adicionado ao carrinho", { action: { label: "Ver carrinho", onClick: () => router.push(`/store/${slug}/cart`) } });
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{product.categoryName}</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
      <div className="mt-3 flex items-baseline gap-3"><span className="text-2xl font-semibold">{formatBRL(price)}</span>{mode === "unit" ? <span className="text-sm text-neutral-500">ou 6x de {formatBRL(Math.round(price / 6))}</span> : <span className="text-sm text-neutral-500">{pack ? `${formatBRL(Math.round(price / pack.totalQuantity))} por peça` : null}</span>}</div>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>

      {product.sellsUnit && product.sellsPack ? (
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-1">
          <button type="button" onClick={() => setMode("unit")} className={cn("rounded-md py-2 text-sm font-medium", mode === "unit" ? "bg-white shadow-sm" : "text-neutral-500")}>Unidade</button>
          <button type="button" onClick={() => setMode("pack")} className={cn("rounded-md py-2 text-sm font-medium", mode === "pack" ? "bg-white shadow-sm" : "text-neutral-500")}>Grade de {pack?.totalQuantity ?? 12}</button>
        </div>
      ) : null}

      {mode === "unit" ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">Tamanho</span>{variant ? <span className="text-neutral-500">{variant.available > 0 ? `${variant.available} disponíveis` : "esgotado"}</span> : null}</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button key={v.id} type="button" disabled={v.available === 0} onClick={() => { setVariantId(v.id); setQty(1); }} className={cn("h-11 min-w-[52px] rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through", variantId === v.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>{v.size}</button>
            ))}
          </div>
        </div>
      ) : pack ? (
        <div className="mt-6 rounded-lg border border-neutral-200 p-4">
          <div className="text-sm font-medium">{pack.name} — {pack.totalQuantity} peças do mesmo modelo</div>
          <div className="mt-2 flex flex-wrap gap-2">{pack.items.map((i) => <span key={i.variantId} className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs"><b>{i.size}</b> × {i.quantity}</span>)}</div>
          <div className="mt-2 text-xs text-neutral-500">{pack.available > 0 ? `${pack.available} grade(s) disponíveis` : "Sem grades disponíveis no momento"}</div>
        </div>
      ) : null}

      <div ref={ctaRef} className="mt-6 flex items-center gap-3">
        <div className="flex h-11 items-center rounded-lg border border-neutral-300">
          <button type="button" className="px-3 disabled:opacity-40" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Menos"><Minus className="size-4" /></button>
          <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
          <button type="button" className="px-3 disabled:opacity-40" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="Mais"><Plus className="size-4" /></button>
        </div>
        <SfButton className="h-11 flex-1" onClick={add} disabled={max === 0}>{added ? <><Check className="size-4" /> Adicionado</> : <><ShoppingBag className="size-4" /> {max === 0 ? "Esgotado" : "Adicionar ao carrinho"}</>}</SfButton>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500"><Truck className="size-4" /> {shippingNote}</div>
      {stickyBar && !ctaVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden" data-sticky-buy-bar>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{product.name}</div><div className="text-sm font-semibold">{formatBRL(price)}</div></div>
          <SfButton className="h-11 px-6" onClick={add} disabled={max === 0}>{max === 0 ? "Esgotado" : "Comprar"}</SfButton>
        </div>
      ) : null}
    </div>
  );
}
