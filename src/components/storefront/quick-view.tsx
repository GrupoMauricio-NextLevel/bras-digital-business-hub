"use client";
import * as React from "react";
import { Eye, X } from "lucide-react";
import { BuyBox } from "@/components/storefront/buy-box";
import { ProductArt } from "@/components/app/product-art";
import type { PublicProduct } from "@/lib/queries/storefront";

/** "Compra rápida": abre o produto em uma janela (elemento <dialog> nativo: foco preso e Esc fecham) sem sair da página. */
export function QuickViewButton({ product, slug }: { product: PublicProduct; slug: string }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); ref.current?.showModal(); }} className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white/95 text-sm font-medium text-neutral-900 shadow-md backdrop-blur transition hover:bg-white sm:translate-y-2 sm:opacity-0 sm:focus-visible:translate-y-0 sm:focus-visible:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
        <Eye className="size-4" aria-hidden /> Compra rápida<span className="sr-only">: {product.name}</span>
      </button>
      <dialog ref={ref} aria-label={`Compra rápida: ${product.name}`} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }} className="pointer-events-auto m-auto w-[min(56rem,calc(100%-2rem))] rounded-2xl border-0 bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-black/50">
        <div className="relative grid gap-6 p-5 sm:grid-cols-2 sm:p-8">
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="absolute right-3 top-3 z-10 rounded-full bg-neutral-100 p-2 hover:bg-neutral-200"><X className="size-4" aria-hidden /></button>
          <ProductArt images={product.images} size="lg" alt={product.name} className="rounded-xl bg-neutral-100" />
          <BuyBox product={product} slug={slug} />
        </div>
      </dialog>
    </>
  );
}
