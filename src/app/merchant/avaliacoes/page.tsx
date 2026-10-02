import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listReviewsForStore } from "@/lib/domain/reviews";
import { ReviewModeration } from "./review-moderation";

export const dynamic = "force-dynamic";

export default async function AvaliacoesPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await listReviewsForStore(await getDb(), session.store!.id);
  return (
    <>
      <PageHeader title="Avaliações" description="Só quem comprou (pedido pago e enviado) pode avaliar. A avaliação só aparece na sua loja depois que você aprova." />
      <ReviewModeration rows={rows.map(({ r, productName }) => ({ id: r.id, product: productName, author: r.authorName, rating: r.rating, body: r.body, status: r.status }))} />
    </>
  );
}
