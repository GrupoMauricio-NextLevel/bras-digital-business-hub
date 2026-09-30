import { redirect } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor/editor";
import { getDb } from "@/db/client";
import { canUse } from "@/lib/features";
import { requireRole } from "@/lib/require-session";
import { getStorefront, getStorefrontCatalog } from "@/lib/queries/storefront";
import { resolveGlobals, resolveTemplate } from "@/lib/themes/store";
import { emptyTemplate } from "@/lib/themes/template";
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
  const [homeDraft, homePub, gDraft, gPub, catalog] = await Promise.all([
    resolveTemplate(db, store, "home", { draft: true }), resolveTemplate(db, store, "home"), resolveGlobals(db, store, { draft: true }), resolveGlobals(db, store), getStorefrontCatalog(store.id),
  ]);
  const pages = (home: typeof homeDraft.template): Doc["pages"] => ({ home, product: emptyTemplate(), collection: emptyTemplate(), cart: emptyTemplate() });
  return (
    <ThemeEditor
      storeName={store.name} slug={store.slug} offerName={OFFER_NAME[store.offer]}
      initial={{ pages: pages(homeDraft.template), globals: gDraft.globals }} published={{ pages: pages(homePub.template), globals: gPub.globals }}
      advanced={canUse(store.offer, "appearanceAdvanced")} premium={canUse(store.offer, "templatesPremium")} upgradeHref="/merchant/services?pedir=upgrade-loja-propria"
      picker={{ products: catalog.map((c) => ({ id: c.product.id, label: c.product.name, sublabel: formatBRL(c.storeProduct.priceCents) })), categories: (sf?.categories ?? []).map((c) => ({ id: c.id, label: c.name })) }}
    />
  );
}
