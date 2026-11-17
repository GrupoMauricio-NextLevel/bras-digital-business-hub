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
import { cobrancasDoCliente } from "@/lib/agencias/cobranca";
import { Onboarding } from "./onboarding-cliente";
import { solicitacoesDaAgencia, urlDoPortal } from "@/lib/agencias/portal";
import { agencias } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CopiarLinkPortal, ResponderSolicitacao } from "./portal-agencia";
import { contratosDoClienteNaAgencia } from "@/lib/agencias/contratos";
import { hojeEmSaoPaulo } from "@/lib/agencias/clientes";
import { CancelarContrato, GerarContrato } from "./contrato-cliente";

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
  const cobrancas = c.verValores ? await cobrancasDoCliente(db, session.actor, c.id) : [];
  const contratos = c.podeEditarContrato ? await contratosDoClienteNaAgencia(db, session.actor, c.id) : [];
  const pedidos = await solicitacoesDaAgencia(db, session.actor, { clienteId: c.id });
  const ag = await db.query.agencias.findFirst({ where: eq(agencias.id, c.agenciaId), columns: { slug: true } });
  const linkPortal = ag ? urlDoPortal(ag.slug) : null;
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
          {c.verValores ? (
            <section className={card} aria-labelledby="cob">
              <h2 id="cob" className="mb-2 text-base font-semibold">Cobranças</h2>
              {cobrancas.length ? <ul className="divide-y divide-border text-sm">{cobrancas.slice(-6).reverse().map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="min-w-0"><span className="block truncate">{f.descricao}</span><span className="text-xs text-muted-foreground">vence {f.vencimento.split("-").reverse().join("/")}</span></span><span className="text-right"><b className="block tabular-nums">{formatBRL(f.valorCents)}</b><span className={`text-xs font-semibold ${f.mostrada === "ATRASADA" ? "text-danger" : f.mostrada === "PAGA" ? "text-success" : "text-muted-foreground"}`}>{f.mostrada === "ATRASADA" ? "Atrasada" : f.mostrada === "PAGA" ? "Paga" : "Em aberto"}</span></span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma cobrança ainda.</p>}
              <Link href="/agencia/financeiro" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4">Abrir o Financeiro</Link>
            </section>
          ) : null}
          {c.podeEditarContrato ? (
            <section className={card} aria-labelledby="ctr">
              <h2 id="ctr" className="mb-1 text-base font-semibold">Contrato</h2>
              <p className="mb-3 text-sm text-muted-foreground">Gerado com os dados da ficha. O cliente lê e aceita no portal; o PDF assinado vai por e-mail para os dois lados.</p>
              {contratos.length ? <ul className="mb-3 divide-y divide-border text-sm">{contratos.map((k) => <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><b className="block">{k.numero}</b><span className="text-xs text-muted-foreground">{k.status === "ACEITO" ? `Aceito por ${k.aceitoNome} em ${k.aceitoEm!.slice(0, 10).split("-").reverse().join("/")}` : `Enviado em ${k.enviadoEm.slice(0, 10).split("-").reverse().join("/")}, esperando o aceite`}</span></span><span className="flex items-center gap-1"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${k.status === "ACEITO" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{k.status === "ACEITO" ? "Assinado" : "Aguardando"}</span><a href={`/agencia/contratos/${k.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-link underline underline-offset-4">PDF</a>{k.status === "ENVIADO" ? <CancelarContrato id={k.id} /> : null}</span></li>)}</ul> : null}
              {contratos.some((k) => k.status === "ENVIADO") ? null : <GerarContrato clienteId={c.id} hoje={hojeEmSaoPaulo()} />}
            </section>
          ) : null}
          <section className={card} aria-labelledby="portal">
            <h2 id="portal" className="mb-1 text-base font-semibold">Portal do cliente</h2>
            <p className="mb-2 text-sm text-muted-foreground">{c.email ? <>O cliente entra com <b>{c.email}</b> e um código no e-mail: acompanha o mês, aprova conteúdos, paga e manda pedidos.</> : "Cadastre o e-mail do cliente na ficha para ele entrar no portal."}</p>
            {linkPortal && c.email ? <CopiarLinkPortal url={linkPortal} /> : null}
            {pedidos.length ? (
              <ul className="mt-3 space-y-3 text-sm">{pedidos.slice(0, 8).map((s) => <li key={s.id} className="rounded-xl bg-surface-muted/60 p-3"><span className="text-xs text-muted-foreground">{({ PEDIDO: "Pedido", IDEIA: "Ideia", DUVIDA: "Dúvida" } as const)[s.tipo]} · {s.createdAt.slice(0, 10).split("-").reverse().join("/")} · <b>{({ ABERTA: "Novo", EM_ANDAMENTO: "Em andamento", RESPONDIDA: "Respondido" } as const)[s.situacao]}</b></span><p className="mt-1">{s.texto}</p>{s.resposta ? <p className="mt-1.5 border-l-2 border-[var(--ds-link)] pl-2 text-muted-foreground">{s.resposta}</p> : null}{s.situacao !== "RESPONDIDA" ? <ResponderSolicitacao id={s.id} situacao={s.situacao} /> : null}</li>)}</ul>
            ) : <p className="mt-2 text-xs text-muted-foreground">Nenhum pedido do cliente ainda.</p>}
          </section>
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
