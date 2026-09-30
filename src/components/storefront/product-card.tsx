import Link from "next/link";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import type { PublicProduct } from "@/lib/queries/storefront";
import { QuickViewButton } from "./quick-view";

export function ProductCard({ product, slug, quickView = false }: { product: PublicProduct; slug: string; quickView?: boolean }) {
  const soldOut = product.available === 0;
  const link = (
    <Link href={`/store/${slug}/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-neutral-100 transition-transform duration-300 group-hover:-translate-y-0.5">
        <ProductArt images={product.images} size="lg" className="bg-neutral-100 transition-transform duration-500 group-hover:scale-[1.03]" />
        {soldOut ? <span className="absolute left-3 top-3 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white">Esgotado</span> : product.available <= 5 ? <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-neutral-950 shadow-sm">Últimas unidades</span> : product.sellsPack ? <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-900 shadow-sm">Grade 12</span> : null}
      </div>
      <div className="mt-3 space-y-0.5">
        <div className="text-xs text-neutral-500">{product.categoryName}</div>
        <h3 className="text-sm font-medium leading-snug text-neutral-900 group-hover:underline">{product.name}</h3>
        <div className="text-sm font-semibold">{formatBRL(product.priceCents)}</div>
      </div>
    </Link>
  );
  if (!quickView || soldOut) return link;
  // Com compra rápida o botão fica fora do link (não pode haver botão dentro de link) e sobre a área da imagem.
  return (
    <div className="group relative">
      {link}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]"><QuickViewButton product={product} slug={slug} /></div>
    </div>
  );
}
