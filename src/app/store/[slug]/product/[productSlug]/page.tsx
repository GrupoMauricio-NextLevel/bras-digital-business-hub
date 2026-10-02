import type { Metadata } from "next";
import { StorePage } from "@/components/storefront/store-page";
import { getDb } from "@/db/client";
import { approvedReviews } from "@/lib/domain/reviews";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) return {};
  const item = (await getStorefrontCatalog(sf.store.id)).find((i) => i.product.slug === productSlug);
  if (!item) return {};
  const p = toPublicProduct(item);
  return { title: { absolute: `${p.seoTitle || p.name} · ${sf.store.name}` }, description: p.seoDescription || p.description.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  const item = sf ? (await getStorefrontCatalog(sf.store.id)).find((i) => i.product.slug === productSlug) : undefined;
  const reviews = sf && item ? await approvedReviews(await getDb(), sf.store.id, item.product.id) : null;
  return (
    <>
      <StorePage slug={slug} page="product" productSlug={productSlug} />
      {reviews && reviews.count > 0 ? (
        <section className="mx-auto max-w-3xl px-4 pb-12 sm:px-6" aria-label="Avaliações de clientes">
          <h2 className="text-lg font-semibold">Avaliações de clientes <span className="text-sm font-normal text-neutral-500">· {reviews.avg.toFixed(1)}★ ({reviews.count})</span></h2>
          <ul className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-sm">
            {reviews.items.map((r) => <li key={r.id} className="px-4 py-3"><div className="font-medium">{r.author} · {"★".repeat(r.rating)}<span className="sr-only"> {r.rating} de 5</span></div>{r.body ? <p className="mt-1 text-neutral-600">{r.body}</p> : null}</li>)}
          </ul>
        </section>
      ) : null}
    </>
  );
}
