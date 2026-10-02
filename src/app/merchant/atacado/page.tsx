import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listStoreCatalog } from "@/lib/domain/catalog";
import { storeModality } from "@/lib/domain/order-policy";
import { TiersEditor } from "./tiers-editor";

export const dynamic = "force-dynamic";

export default async function AtacadoPage() {
  const session = await requireStoreAdmin();
  const db = await getDb();
  if ((await storeModality(db, session.store!.id)) === "NETWORK") redirect("/merchant");
  const items = (await listStoreCatalog(db, session.store!.id)).map((c) => ({ productId: c.product.id, name: c.product.name, priceCents: c.storeProduct.priceCents, floorCents: Math.max(c.product.costCents, c.product.minimumPriceCents), tiers: c.tiers }));
  return (
    <>
      <PageHeader title="Preço por quantidade" description="Defina preços menores para quem leva mais peças do mesmo produto (somando os tamanhos). Vale na loja, nas propostas e nos pedidos manuais." />
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Ative produtos na sua loja para criar faixas.</p> : <TiersEditor items={items} />}
    </>
  );
}
