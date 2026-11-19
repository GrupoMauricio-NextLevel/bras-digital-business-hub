import Link from "next/link";
import { BuyBox } from "@/components/storefront/buy-box";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import type { PublicProduct } from "@/lib/queries/storefront";
import { ProductGalleryZoom } from "@/theme-estadio/components/ProductGalleryZoom";
import { JerseyPersonalizer } from "@/theme-estadio/components/JerseyPersonalizer";
import { OfferCountdown } from "@/theme-estadio/components/OfferCountdown";
import { SocialProof } from "@/theme-estadio/components/SocialProof";
import { ReviewsPremium } from "@/theme-estadio/components/ReviewsPremium";
import { FaqPremium, type FaqItem } from "@/theme-estadio/components/FaqPremium";
import { StickyCta } from "@/theme-estadio/components/StickyCta";

type ReviewData = { avg: number; count: number; items: { id: string; author: string; rating: number; body: string | null }[] };

export function ExampleProductPage({ slug, storeName, product, related, reviews, faq }: { slug: string; storeName: string; product: PublicProduct; related: PublicProduct[]; reviews: ReviewData | null; faq: FaqItem[] }) {
  const endsAt = "2027-12-31T23:59:59.000Z";
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="stadium-grid-premium">
        <ProductGalleryZoom images={product.images} name={product.name} />
        <div className="space-y-3">
          <span className="stadium-premium-badge">Tema Estádio</span>
          <OfferCountdown endsAt={endsAt} />
          <div className="stadium-card p-4">
            <BuyBox product={product} slug={slug} stickyBar extras />
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <JerseyPersonalizer />
        <SocialProof vendidosHoje={Math.max(7, Math.round(product.available * 0.4))} emEstoque={product.available} />
      </div>

      {reviews && reviews.count > 0 ? <div className="mt-4"><ReviewsPremium avg={reviews.avg} count={reviews.count} items={reviews.items} /></div> : null}
      <div className="mt-4"><FaqPremium items={faq} /></div>

      {related.length ? (
        <section className="mt-5" aria-label="Produtos relacionados">
          <h2 className="stadium-title text-2xl">Combine com este modelo</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/store/${slug}/product/${p.slug}`} className="stadium-card block overflow-hidden p-3">
                <ProductArt images={p.images} size="md" alt={p.name} className="rounded-lg bg-black/20" />
                <p className="mt-2 line-clamp-2 text-sm font-semibold">{p.name}</p>
                <p className="text-sm text-[var(--stadium-muted)]">{formatBRL(p.priceCents)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 text-center text-sm text-[var(--stadium-muted)]">Comprando com <b>{storeName}</b>, você mantém rotas e fluxo de compra já existentes da loja.</div>
      <StickyCta href={`/store/${slug}/checkout`} label="Finalizar compra" priceLabel={formatBRL(product.priceCents)} />
    </div>
  );
}
