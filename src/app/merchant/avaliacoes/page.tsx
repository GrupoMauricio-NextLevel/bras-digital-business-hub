import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listReviewsForStore } from "@/lib/domain/reviews";
import { ReviewModeration } from "./review-moderation";
import { perfilAtual } from "@/lib/perfil-loja-server";
import { avaliacoesAgora } from "@/lib/domain/loja-agora";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

export default async function AvaliacoesPage() {
  const session = await requireRole("STORE_OWNER");
  const rows = await listReviewsForStore(await getDb(), session.store!.id);
  return (
    <>
      <PageHeader title="Avaliações" description="Só quem comprou (pedido pago e enviado) pode avaliar. A avaliação só aparece na sua loja depois que você aprova." />
      {(await perfilAtual(session.store!.id)).ecommerce ? <PrecisaDeVoce itens={avaliacoesAgora(rows.map(({ r, productName }) => ({ id: r.id, product: productName, author: r.authorName, rating: r.rating, status: r.status })))} vazio="Nenhuma avaliação esperando você." descricao="Avaliações esperando aprovação. Nota baixa primeiro: vale falar com o cliente antes." /> : null}
      <ReviewModeration rows={rows.map(({ r, productName }) => ({ id: r.id, product: productName, author: r.authorName, rating: r.rating, body: r.body, status: r.status }))} />
    </>
  );
}
