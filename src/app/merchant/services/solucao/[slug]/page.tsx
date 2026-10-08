import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { isDemoMode } from "@/lib/auth";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { storeJourney } from "@/lib/domain/journey";
import { ProductLanding } from "@/components/nl-store/product-landing";
import { landingContext } from "@/components/nl-store/landing-data";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

/** Landing do produto dentro do painel: mesmo conteúdo da página pública, com o estado da loja e o checkout. */
export default async function SolucaoLojista({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireStoreAdmin();
  const db = await getDb();
  const p = await getCatalogItem(db, { slug: (await params).slug });
  if (!p) notFound();
  const j = await storeJourney(db, session.actor, session.store!.id);
  const card = j.cards.find((c) => c.product.id === p.id);
  const ctx = await landingContext(db, p, (s) => `/merchant/services/solucao/${s}`);
  return (
    <>
      <PageHeader backHref="/merchant/services" title="Loja NextLevel" eyebrow="Entender esta solução" />
      <ProductLanding product={p} mode="panel" state={card?.state ?? "not_eligible"} reason={card?.reason ?? "Não disponível para o seu tipo de conta."} base="/merchant" demo={isDemoMode()} unlocks={ctx.unlocks} related={ctx.related} currentPlan={j.subscription ? { productKey: j.subscription.productKey, cycle: j.subscription.cycle } : null} />
    </>
  );
}
