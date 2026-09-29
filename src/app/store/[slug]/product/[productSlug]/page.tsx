import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { ProductArt } from "@/components/app/product-art";
import { ProductCard } from "@/components/storefront/product-card";
import { BuyBox } from "./buy-box";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const item = catalog.find((c) => c.product.slug === productSlug);
  if (!item) notFound();
  const product = toPublicProduct(item, item.product.categoryId ? catName.get(item.product.categoryId) : undefined);
  const related = catalog.filter((c) => c.product.id !== product.id && c.product.categoryId === product.categoryId).slice(0, 4).map((c) => toPublicProduct(c, product.categoryName));
  const base = `/store/${slug}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="mb-6 flex items-center gap-1 text-xs text-neutral-500"><Link href={base} className="hover:text-neutral-900">Início</Link><ChevronRight className="size-3" /><Link href={`${base}/catalog`} className="hover:text-neutral-900">Catálogo</Link><ChevronRight className="size-3" /><span className="text-neutral-900">{product.name}</span></nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <ProductArt images={product.images} size="lg" className="rounded-2xl bg-neutral-100" />
          <div className="grid grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <ProductArt key={i} images={product.images} size="md" className="rounded-xl bg-neutral-100 opacity-70" />)}</div>
        </div>
        <BuyBox product={product} slug={slug} />
      </div>
      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} slug={slug} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
