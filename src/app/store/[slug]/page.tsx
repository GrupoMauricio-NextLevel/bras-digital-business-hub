import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { getStorefront, getStorefrontCatalog, toPublicProduct } from "@/lib/queries/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductArt } from "@/components/app/product-art";
import { cn } from "@/lib/utils";

export default async function StoreHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string }> }) {
  const { slug } = await params;
  const { theme } = await searchParams;
  const sf = await getStorefront(slug);
  if (!sf) notFound();
  const themeKey = theme ?? sf.themeKey;
  const catalog = await getStorefrontCatalog(sf.store.id);
  const catName = new Map(sf.categories.map((c) => [c.id, c.name]));
  const products = catalog.map((c) => toPublicProduct(c, c.product.categoryId ? catName.get(c.product.categoryId) : undefined));
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const showcase = featured.length >= 4 ? featured : products.slice(0, 4);
  const base = `/store/${slug}`;
  const hero = showcase[0];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {theme && theme !== sf.themeKey ? <div className="mt-4 rounded-md bg-neutral-100 px-3 py-2 text-center text-xs text-neutral-600">Pré-visualizando o tema <b className="capitalize">{theme}</b>. Seu tema ativo continua sendo <b className="capitalize">{sf.themeKey}</b>.</div> : null}

      {/* Hero */}
      <section className={cn("mt-6 grid gap-6 overflow-hidden rounded-2xl", themeKey === "elite" ? "min-h-[520px] lg:grid-cols-5" : "lg:grid-cols-2")} style={{ background: `color-mix(in srgb, var(--sf-accent) 10%, white)` }}>
        <div className={cn("flex flex-col justify-center p-8 sm:p-12", themeKey === "elite" && "lg:col-span-3")}>
          {sf.store.tagline ? <span className="mb-3 inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-neutral-700">{sf.store.tagline}</span> : null}
          <h1 className={cn("font-semibold tracking-tight text-neutral-900", themeKey === "elite" ? "text-4xl sm:text-6xl" : "text-3xl sm:text-5xl")}>{sf.settings.heroTitle}</h1>
          <p className="mt-4 max-w-md text-base text-neutral-600">{sf.settings.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`${base}/catalog`} className="inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-medium transition-all hover:brightness-95" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{sf.settings.heroCta} <ArrowRight className="size-4" /></Link>
            {sf.store.whatsapp ? <a href={`https://wa.me/${sf.store.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-medium hover:bg-neutral-50">Falar no WhatsApp</a> : null}
          </div>
        </div>
        <div className={cn("relative hidden items-center justify-center p-8 lg:flex", themeKey === "elite" && "lg:col-span-2")}>
          {hero ? <Link href={`${base}/product/${hero.slug}`} className="w-full max-w-sm transition-transform hover:scale-[1.02]"><ProductArt images={hero.images} size="lg" className="rounded-2xl bg-white shadow-xl" /></Link> : null}
        </div>
      </section>

      {/* Trust bar */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[{ icon: Truck, t: "Envio para todo o Brasil", d: "Etiqueta gerada em até 1 dia útil" }, { icon: ShieldCheck, t: "Compra segura", d: "Pagamento protegido" }, { icon: RefreshCw, t: "Troca fácil", d: "7 dias para trocar o tamanho" }].map((i) => (
          <div key={i.t} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3"><i.icon className="size-5 text-neutral-500" /><div><div className="text-sm font-medium">{i.t}</div><div className="text-xs text-neutral-500">{i.d}</div></div></div>
        ))}
      </section>

      {/* Categories */}
      {sf.settings.showCategories && sf.categories.length ? (
        <section className="mt-10">
          <div className="nl-scroll flex gap-2 overflow-x-auto pb-1">
            {sf.categories.map((c) => <Link key={c.id} href={`${base}/catalog?category=${c.slug}`} className="shrink-0 rounded-full border border-neutral-300 px-4 py-2 text-sm hover:border-neutral-900">{c.name}</Link>)}
          </div>
        </section>
      ) : null}

      {/* Featured */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-semibold tracking-tight">Destaques</h2><p className="text-sm text-neutral-500">Os mais procurados da temporada</p></div><Link href={`${base}/catalog`} className="text-sm font-medium underline-offset-4 hover:underline">Ver tudo</Link></div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{showcase.map((p) => <ProductCard key={p.id} product={p} slug={slug} />)}</div>
      </section>

      {/* Banners */}
      {sf.settings.banners.length ? (
        <section className={cn("mt-12 grid gap-4", sf.settings.banners.length > 1 && "sm:grid-cols-2")}>
          {sf.settings.banners.map((b, i) => {
            const bg = b.tone === "primary" ? "var(--sf-primary)" : b.tone === "accent" ? "var(--sf-accent)" : "#171717";
            const fg = b.tone === "primary" ? "var(--sf-on-primary)" : b.tone === "accent" ? "var(--sf-on-accent)" : "#fff";
            return <Link key={i} href={`${base}/catalog`} className="flex min-h-[160px] flex-col justify-end rounded-2xl p-6 transition-transform hover:-translate-y-0.5" style={{ background: bg, color: fg }}><div className="text-xl font-semibold">{b.title}</div><div className="text-sm opacity-80">{b.subtitle}</div></Link>;
          })}
        </section>
      ) : null}

      {/* All products */}
      {products.length > showcase.length ? (
        <section className="mt-12 mb-16">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">Todos os produtos</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{products.filter((p) => !showcase.includes(p)).map((p) => <ProductCard key={p.id} product={p} slug={slug} />)}</div>
        </section>
      ) : <div className="mb-16" />}
    </div>
  );
}
