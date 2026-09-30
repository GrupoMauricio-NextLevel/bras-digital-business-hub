import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor/editor";
import { getDb } from "@/db/client";
import { canUse } from "@/lib/features";
import { requireRole } from "@/lib/require-session";
import { getStorefront, getStorefrontCatalog } from "@/lib/queries/storefront";
import { resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import type { Doc } from "@/lib/themes/editor-state";
import { formatBRL } from "@/lib/money";

const OFFER_NAME = { DROP_MANUAL: "oferta Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" } as const;

export default async function ThemeEditorPage() {
  const session = await requireRole("STORE_OWNER");
  const store = session.store!;
  // Drop manual não tem loja virtual: leva para os serviços, onde está o upgrade.
  if (!canUse(store.offer, "storefront")) redirect("/merchant/services?pedir=upgrade-loja-superdrop");
  const db = await getDb();
  const sf = await getStorefront(store.slug);
  const catalog = await getStorefrontCatalog(store.id);
  const gDraft = await resolveGlobals(db, store, { draft: true }); const gPub = await resolveGlobals(db, store);
  const kinds = ["home", "product", "collection", "cart"] as const;
  const drafts = await Promise.all(kinds.map((k) => resolveTemplate(db, store, k, { draft: true })));
  const pubs = await Promise.all(kinds.map((k) => resolveTemplate(db, store, k)));
  const pages = (list: typeof drafts): Doc["pages"] => ({ home: list[0]!.template, product: list[1]!.template, collection: list[2]!.template, cart: list[3]!.template });
  const firstProduct = catalog[0]?.product.slug;
  const previewPaths = { home: `/store/${store.slug}`, product: firstProduct ? `/store/${store.slug}/product/${firstProduct}` : `/store/${store.slug}/catalog`, collection: `/store/${store.slug}/catalog`, cart: `/store/${store.slug}/cart` };
  return (
    <ThemeEditor
      logoUrl={store.logoUrl} storeName={store.name} slug={store.slug} offerName={OFFER_NAME[store.offer]}
      initial={{ pages: pages(drafts), globals: gDraft.globals }} published={{ pages: pages(pubs), globals: gPub.globals }} previewPaths={previewPaths}
      advanced={canUse(store.offer, "appearanceAdvanced")} premium={canUse(store.offer, "templatesPremium")} upgradeHref="/merchant/services?pedir=upgrade-loja-propria"
      picker={{ products: catalog.map((c) => ({ id: c.product.id, label: c.product.name, sublabel: formatBRL(c.storeProduct.priceCents) })), categories: (sf?.categories ?? []).map((c) => ({ id: c.id, label: c.name })) }}
    />
  );
}
