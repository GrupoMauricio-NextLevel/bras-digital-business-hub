import type { Metadata } from "next";
import { StorePage } from "@/components/storefront/store-page";
import { getDb } from "@/db/client";
import { approvedReviews } from "@/lib/domain/reviews";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { ldJson, SCHEMA_AVAILABILITY, shortDescription, storeOrigin } from "@/lib/storefront-seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productSlug: string }> }): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  if (!sf) return {};
  const item = (await getStorefrontCatalog(sf.store.id)).find((i) => i.product.slug === productSlug);
  if (!item) return {};
  const p = toPublicProduct(item);
  const origin = await storeOrigin(sf.store);
  const image = p.images.find((i) => /^https?:\/\//.test(i) || i.startsWith("/"));
  const description = p.seoDescription || shortDescription(p.description, `${p.name}, na loja ${sf.store.name}.`);
  return {
    title: { absolute: `${p.seoTitle || p.name} · ${sf.store.name}` }, description,
    alternates: { canonical: `${origin}/product/${p.slug}` },
    openGraph: { type: "website", title: p.seoTitle || p.name, description, url: `${origin}/product/${p.slug}`, siteName: sf.store.name, locale: "pt_BR", ...(image ? { images: [image.startsWith("/") ? `${new URL(origin).origin}${image}` : image] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string; productSlug: string }> }) {
  const { slug, productSlug } = await params;
  const sf = await getStorefront(slug);
  const item = sf ? (await getStorefrontCatalog(sf.store.id)).find((i) => i.product.slug === productSlug) : undefined;
  const reviews = sf && item ? await approvedReviews(await getDb(), sf.store.id, item.product.id) : null;
  const pub = item ? toPublicProduct(item) : null;
  const origin = sf ? await storeOrigin(sf.store) : "";
  const siteRoot = origin ? new URL(origin).origin : "";
  const imageUrls = pub ? pub.images.filter((i) => /^https?:\/\//.test(i) || i.startsWith("/")).map((i) => (i.startsWith("/") ? `${siteRoot}${i}` : i)) : [];
  const ld = sf && pub && !(!sf.store.publishedAt) ? [
    {
      "@context": "https://schema.org", "@type": "Product", name: pub.name, description: shortDescription(pub.description, pub.name), ...(imageUrls.length ? { image: imageUrls } : {}), brand: { "@type": "Brand", name: sf.store.name },
      offers: { "@type": "Offer", url: `${origin}/product/${pub.slug}`, priceCurrency: "BRL", price: (pub.priceCents / 100).toFixed(2), availability: pub.available > 0 ? SCHEMA_AVAILABILITY.IN_STOCK : SCHEMA_AVAILABILITY.OUT_OF_STOCK, itemCondition: "https://schema.org/NewCondition" },
      ...(reviews && reviews.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.avg.toFixed(1), reviewCount: reviews.count } } : {}),
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: sf.store.name, item: origin }, { "@type": "ListItem", position: 2, name: "Catálogo", item: `${origin}/catalog` }, { "@type": "ListItem", position: 3, name: pub.name, item: `${origin}/product/${pub.slug}` }] },
  ] : null;
  return (
    <>
      {ld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} /> : null}
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
