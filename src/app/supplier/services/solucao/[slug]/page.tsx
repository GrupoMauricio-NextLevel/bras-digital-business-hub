import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { isDemoMode } from "@/lib/auth";
import { getCatalogItem } from "@/lib/domain/nl-catalog";
import { ProductLanding } from "@/components/nl-store/product-landing";
import { landingContext } from "@/components/nl-store/landing-data";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

export default async function SolucaoFornecedor({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("SUPPLIER_ADMIN");
  const db = await getDb();
  const p = await getCatalogItem(db, { slug: (await params).slug });
  if (!p) notFound();
  const ok = p.audience.includes("SUPPLIER");
  const ctx = await landingContext(db, p, (s) => `/supplier/services/solucao/${s}`);
  return (
    <>
      <PageHeader backHref="/supplier/services" title="Loja NextLevel" eyebrow="Entender esta solução" />
      <ProductLanding product={p} mode="panel" state={!ok ? "not_eligible" : p.kind === "quote_required" ? "quote_required" : "available"} reason={ok ? undefined : "Esta solução é para lojas. Para fornecedores, veja as soluções da Loja NextLevel do seu painel."} base="/supplier" demo={isDemoMode()} unlocks={ctx.unlocks} related={ctx.related} />
    </>
  );
}
