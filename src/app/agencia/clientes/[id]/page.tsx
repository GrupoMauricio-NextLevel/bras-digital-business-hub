import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { fichaDoCliente, inclusoTexto, telefoneTexto, MOTIVOS_ENCERRAMENTO, SITUACAO_CLIENTE_ROTULO } from "@/lib/agencias/clientes";
import { listarEquipe } from "@/lib/agencias/agencias";
import { FUNCAO_ROTULO } from "@/lib/agencias/acesso";
import { NotFoundError } from "@/lib/domain/errors";
import { formatBRL } from "@/lib/money";
import { EditarCliente, EquipeDoCliente, SituacaoDoCliente } from "./ficha-cliente";
import { producaoDoMes } from "@/lib/agencias/producao";
import { mesRotulo } from "@/lib/agencias/fluxo";
import { CartaoClienteMes } from "@/components/agencia/producao";
import Link from "next/link";
import { situacaoDoOnboarding } from "@/lib/agencias/comercial";
import { Onboarding } from "./onboarding-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha do cliente" };

/** Ficha do cliente da agência (D313): contrato, o que entra no mês, responsável e equipe. */
export default async function FichaDoCliente({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { id } = await params;
  const c = await fichaDoCliente(db, session.actor, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const equipe = await listarEquipe(db, session.actor);
  const prod = await producaoDoMes(db, session.actor);
  const doMes = prod.clientes.find((x) => x.clienteId === c.id);
  const onb = c.onboarding ? situacaoDoOnboarding(c.onboarding, { ...c, documento: c.documento, valorMensalCents: c.valorMensalCents, diaVencimento: c.diaVencimento }, (doMes?.contagem.planejadas ?? 0) > 0) : null;
  const ativos = equipe.filter((p) => !p.desligadoEm).map((p) => ({ id: p.userId, nome: p.nome, funcao: FUNCAO_ROTULO[p.funcao] }));
  const nome = (u: string | null) => equipe.find((p) => p.userId === u)?.nome ?? "Sem responsável";
  const card = "ds-card p-5 sm:p-6";
  return (
    <>
      <PageHeader backHref="/agencia/clientes" eyebrow="Cliente" title={c.nome} description={[c.segmento, c.pacote, inclusoTexto(c.incluso)].filter(Boolean).join(" · ") || undefined}
        badge={<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.situacao === "ATIVO" ? "bg-success-soft text-success" : "bg-surface-muted text-muted-foreground"}`}>{SITUACAO_CLIENTE_ROTULO[c.situacao]}</span>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`} aria-labelledby="dados">
          <h2 id="dados" className="mb-3 font-semibold">Dados e contrato</h2>
          <dl className="mb-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Responsável</dt><dd className="font-medium">{nome(c.responsavelId)}</dd></div>
            <div><dt className="text-muted-foreground">Contato</dt><dd className="font-medium">{[c.contatoNome, c.whatsapp ? telefoneTexto(c.whatsapp) : null, c.email].filter(Boolean).join(" · ") || "—"}</dd></div>
            {c.verValores ? <div><dt className="text-muted-foreground">Contrato</dt><dd className="font-medium">{c.valorMensalCents ? `${formatBRL(c.valorMensalCents)} por mês` : "sem valor"}{c.diaVencimento ? `, vence todo dia ${c.diaVencimento}` : ""}</dd></div> : null}
            {c.encerradoEm ? <div><dt className="text-muted-foreground">Encerrado</dt><dd className="font-medium">{c.motivoEncerramento}</dd></div> : null}
          </dl>
          {c.podeEditar || c.podeEditarContrato ? (
            <EditarCliente id={c.id} podeFicha={c.podeEditar} podeContrato={c.podeEditarContrato} equipe={ativos}
              inicial={{ exigeAprovacao: c.exigeAprovacao, nome: c.nome, segmento: c.segmento, contatoNome: c.contatoNome, whatsapp: c.whatsapp, email: c.email, documento: c.documento, pacote: c.pacote, incluso: c.incluso, valorMensalCents: c.valorMensalCents, diaVencimento: c.diaVencimento, responsavelId: c.responsavelId, observacoes: c.observacoes }} />
          ) : c.observacoes ? <p className="text-sm">{c.observacoes}</p> : null}
        </section>
        <div className="space-y-4">
          {onb ? (
            <section className={card} aria-labelledby="onb">
              <h2 id="onb" className="mb-1 flex items-baseline justify-between text-base font-semibold"><span>Onboarding</span><span className="text-sm tabular-nums text-muted-foreground">{onb.feitos} de {onb.total}</span></h2>
              <p className="mb-3 text-xs text-muted-foreground">Para nenhum cliente novo ficar sem acompanhamento. Os itens automáticos marcam sozinhos pelos dados da ficha.</p>
              <Onboarding clienteId={c.id} itens={onb.itens} pode={c.podeEditar} />
            </section>
          ) : null}
          {doMes ? (
            <section aria-labelledby="mes">
              <h2 id="mes" className="mb-2 text-base font-semibold">Produção de {mesRotulo(prod.mes)}</h2>
              <CartaoClienteMes id={c.id} nome={c.nome} segmento={c.segmento} c={doMes.contagem} />
              <Link href={`/agencia/producao?cliente=${c.id}&ver=lista`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4">Ver as peças do mês</Link>
            </section>
          ) : null}
          <section className={card} aria-labelledby="eq">
            <h2 id="eq" className="mb-1 font-semibold">Equipe do cliente</h2>
            <p className="mb-3 text-sm text-muted-foreground">Quem trabalha neste cliente vê a ficha dele no painel.</p>
            <EquipeDoCliente id={c.id} equipe={ativos} marcados={c.equipe} pode={c.podeEditar} />
          </section>
          {c.podeEditar ? (
            <section className={card} aria-labelledby="sit">
              <h2 id="sit" className="mb-3 font-semibold">Situação</h2>
              <SituacaoDoCliente id={c.id} situacao={c.situacao} motivos={MOTIVOS_ENCERRAMENTO} />
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
