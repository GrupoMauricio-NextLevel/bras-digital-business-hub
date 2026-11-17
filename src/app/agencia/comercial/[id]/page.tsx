import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { NotFoundError } from "@/lib/domain/errors";
import { ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { ETAPA_COMERCIAL_ROTULO, MOTIVOS_PERDA_COMERCIAL, ORIGEM_ROTULO, fichaDaOportunidade } from "@/lib/agencias/comercial";
import { listarEquipe } from "@/lib/agencias/agencias";
import { OPORTUNIDADE_ETAPAS } from "@/db/schema";
import { AndamentoDaOportunidade, EditarOportunidade } from "../comercial-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oportunidade" };

const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Oportunidade (D317): dados, etapa, contato, perder com motivo e virar cliente. */
export default async function Oportunidade({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { id } = await params;
  const o = await fichaDaOportunidade(db, session.actor, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const equipe = (await listarEquipe(db, session.actor)).filter((p) => !p.desligadoEm).map((p) => ({ id: p.userId, nome: p.nome }));
  const card = "ds-card p-5 sm:p-6";
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader backHref="/agencia/comercial" eyebrow={`Comercial · ${ORIGEM_ROTULO[o.origem]}`} title={o.empresa} badge={<span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-[var(--ds-link)]">{ETAPA_COMERCIAL_ROTULO[o.etapa]}</span>}
        description={[o.ultimoContatoEm ? `último contato ${quando(o.ultimoContatoEm)}` : "sem contato registrado", o.motivoPerda ? `perdida: ${o.motivoPerda}` : null].filter(Boolean).join(" · ")} />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {o.canal ? (
          <section className={`${card} lg:col-span-2`} aria-labelledby="op-site"><h2 id="op-site" className="mb-2 text-base font-semibold">Pedido pela página de captação</h2>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Veio por</dt><dd className="font-medium">{ROTULO_CANAL[o.canal as Canal] ?? o.canal}{o.origemSite ? ` (${o.origemSite})` : ""}</dd></div>
              {o.utmCampaign || o.utmSource ? <div><dt className="text-muted-foreground">Campanha</dt><dd className="font-medium">{[o.utmCampaign, o.utmSource, o.utmMedium].filter(Boolean).join(" · ")}</dd></div> : null}
              {o.pagina ? <div><dt className="text-muted-foreground">Página</dt><dd className="font-medium break-all">{o.pagina}</dd></div> : null}
              <div><dt className="text-muted-foreground">Chegou em</dt><dd className="font-medium">{quando(o.createdAt)}</dd></div>
              {o.mensagem ? <div className="sm:col-span-2"><dt className="text-muted-foreground">Mensagem</dt><dd>{o.mensagem}</dd></div> : null}
            </dl>
          </section>
        ) : null}
        <section className={card} aria-labelledby="op-dados"><h2 id="op-dados" className="mb-3 text-base font-semibold">Dados da negociação</h2>
          <EditarOportunidade id={o.id} equipe={equipe} d={{ empresa: o.empresa, contatoNome: o.contatoNome, whatsapp: o.whatsapp, email: o.email, segmento: o.segmento, origem: o.origem, servicos: o.servicos, valorPropostoCents: o.valorPropostoCents, responsavelId: o.responsavelId, proximaAtividade: o.proximaAtividade, proximaAtividadeEm: o.proximaAtividadeEm, observacoes: o.observacoes }} />
        </section>
        <section className={card} aria-labelledby="op-and"><h2 id="op-and" className="mb-3 text-base font-semibold">Andamento</h2>
          {o.clienteId ? <p className="text-sm">Virou cliente. <Link href={`/agencia/clientes/${o.clienteId}`} className="font-semibold text-link underline underline-offset-4">Abrir a ficha e o onboarding</Link></p>
            : <AndamentoDaOportunidade id={o.id} etapa={o.etapa} etapas={OPORTUNIDADE_ETAPAS.filter((e) => e !== "FECHADO" && e !== "PERDIDO").map((e) => ({ v: e, l: ETAPA_COMERCIAL_ROTULO[e] }))} motivos={MOTIVOS_PERDA_COMERCIAL} />}
        </section>
      </div>
    </div>
  );
}
