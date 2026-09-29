import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ category?: string; q?: string }> }) {
  const { slug } = await params;
  const { category, q } = await searchParams;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const catBySlug = sf.categories.find((c) => c.slug === category);
  const products = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined)).filter((p) => (!catBySlug || p.categoryId === catBySlug.id) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const base = `/store/${slug}/catalog`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">{catBySlug?.name ?? "Catálogo"}</h1><p className="text-sm text-neutral-500">{products.length} produto{products.length === 1 ? "" : "s"}</p></div>
        <form className="relative w-full sm:w-72" action={base}>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input name="q" defaultValue={q} placeholder="Buscar produto…" className="h-11 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-neutral-900" />
        </form>
      </div>
      <div className="nl-scroll mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link href={base} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", !category ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>Todos</Link>
        {sf.categories.map((c) => <Link key={c.id} href={`${base}?category=${c.slug}`} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", category === c.slug ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:border-neutral-900")}>{c.name}</Link>)}
      </div>
      {products.length === 0 ? <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">Nenhum produto encontrado.</div> : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} product={p} slug={slug} />)}</div>
      )}
    </div>
  );
}
