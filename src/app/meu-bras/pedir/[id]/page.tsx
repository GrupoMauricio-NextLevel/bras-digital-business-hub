import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { brasAccessFor } from "@/lib/domain/bras/descobertas";
import { BRAS_UFS, lastBrasShipping, listBrasFeed } from "@/lib/domain/bras/catalogo";
import { RequestForm } from "./request-form";

export const dynamic = "force-dynamic";

/** Pedido de compra (D92): quantas caixas e para onde enviar. Preço vem do servidor; a equipe confirma antes do pagamento. */
export default async function Pedir({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("BRAS_MEMBER");
  const db = await getDb();
  const access = await brasAccessFor(db, session);
  if (access.level === "VISITOR") redirect("/meu-bras/empresa");
  const { id } = await params;
  const item = (await listBrasFeed(db, access.level, 500)).find((v) => v.id === id);
  if (!item) notFound();
  if (!item.offer || item.offer.boxesAvailable === 0) redirect("/meu-bras/videos");
  const last = await lastBrasShipping(db, session.actor);
  return (
    <>
      <PageHeader eyebrow="Meu Brás" title="Fazer pedido" backHref={`/meu-bras/descoberta/${id}`} description="Informe quantas caixas e para onde enviar. A equipe da Brás Digital confirma o pedido e o pagamento com você pelo WhatsApp." />
      <RequestForm videoId={item.id} youtubeId={item.youtubeId} title={item.title} offer={item.offer} ufs={[...BRAS_UFS]} initial={last} />
    </>
  );
}
