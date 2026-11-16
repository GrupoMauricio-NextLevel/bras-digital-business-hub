import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { detalheDaMesa, ETAPAS_ANUNCIO, ROTULO_STATUS } from "@/lib/domain/anuncios";
import { NotFoundError } from "@/lib/domain/errors";
import { SalaDaCampanha } from "@/components/anuncios/sala";
import { ANUNCIO_STATUS } from "@/db/schema";
import { Controles } from "./controles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campanha · Mesa de anúncios" };

/** Um pedido de campanha na mesa de anúncios (D299): a mesma sala que o lojista vê, mais os controles da equipe. */
export default async function AnuncioMesaPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const sala = await detalheDaMesa(await getDb(), s.actor, (await params).id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const a = sala.anuncio;
  const etapas = ANUNCIO_STATUS.filter((x) => x !== "RASCUNHO").map((x) => ({ status: x, rotulo: ETAPAS_ANUNCIO.find((e) => e.status === x)?.rotulo ?? ROTULO_STATUS[x] }));
  return (
    <>
      <PageHeader backHref="/master/anuncios" eyebrow={`Mesa de anúncios · ${sala.loja?.name ?? ""}`} title={a.nome} description="O lojista vê esta mesma sala no painel dele. Mude a etapa, converse, mande a proposta e lance os números." />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <SalaDaCampanha s={sala} lado="EQUIPE" />
        <Controles id={a.id} status={a.status} etapas={etapas} temProposta={!!a.quoteId} propostaEnviada={!!sala.proposta} temResponsavel={!!a.responsavelId} metaConta={a.metaContaId} metaCampanhas={a.metaCampanhas} />
      </div>
    </>
  );
}
