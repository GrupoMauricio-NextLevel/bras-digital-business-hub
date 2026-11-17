import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EtapaChip, PrazoTexto } from "@/components/agencia/producao";
import { NotFoundError } from "@/lib/domain/errors";
import { FUNCAO_ROTULO } from "@/lib/agencias/acesso";
import { hojeEmSaoPaulo } from "@/lib/agencias/clientes";
import { ETAPA_ROTULO, TIPO_ROTULO, atrasada, etapaSeAplica, mesRotulo, situacaoRotulo, SITUACOES } from "@/lib/agencias/fluxo";
import { fichaDaPeca, pessoasDaAgencia } from "@/lib/agencias/producao";
import { PECA_ETAPAS } from "@/db/schema";
import { AcoesDaPeca, CamposDaPeca, NovoComentario } from "./peca-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Peça de conteúdo" };

const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
const card = "ds-card p-5 sm:p-6";

/** Peça de conteúdo (D314): etapas, campos de cada departamento, ações, comentários internos e histórico. */
export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { id } = await params;
  const f = await fichaDaPeca(db, session.actor, id).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const pessoas = f.podeGerir || f.podeMexer ? await pessoasDaAgencia(db, session.actor) : [];
  const p = f.peca;
  const ctxEtapa = { tipo: p.tipo, exigeAprovacao: f.cliente.exigeAprovacao };
  const etapas = PECA_ETAPAS.filter((e) => etapaSeAplica(e, ctxEtapa));
  const idx = etapas.indexOf(p.etapa);
  const links: [string, string | null][] = [["Brutos", p.linkBrutos], [`Versão ${p.versao || ""}`.trim(), p.linkVersao], ["Publicação", p.linkPublicacao]];
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <PageHeader backHref="/agencia/producao" eyebrow={`${f.cliente.nome} · ${TIPO_ROTULO[p.tipo]}${f.mes ? ` · ${mesRotulo(f.mes)}` : ""}${p.extra ? " · extra" : ""}`} title={p.titulo}
        badge={<EtapaChip etapa={p.etapa} />} description={<>{situacaoRotulo(p.etapa, p.situacao)} · {f.responsavelNome ? `com ${f.responsavelNome}` : "sem responsável"} · prazo <PrazoTexto prazo={p.prazo} atrasada={atrasada(p, hojeEmSaoPaulo())} /></>} />

      <ol className="ds-card flex flex-wrap gap-x-1 gap-y-2 !p-3 text-xs" aria-label="Etapas da peça">
        {etapas.map((e, i) => <li key={e} aria-current={e === p.etapa ? "step" : undefined} className={`rounded-full px-2.5 py-1 font-semibold ${i < idx ? "bg-success-soft text-success" : e === p.etapa ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-surface-muted text-muted-foreground"}`}>{i < idx ? "✓ " : ""}{ETAPA_ROTULO[e]}</li>)}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {f.podeMexer ? (
            <section className={card} aria-labelledby="pc-acoes">
              <h2 id="pc-acoes" className="mb-3 text-base font-semibold">O que fazer agora</h2>
              <AcoesDaPeca id={p.id} etapa={p.etapa} situacao={p.situacao} situacoes={SITUACOES[p.etapa].map(([v, l]) => ({ v, l }))} proxima={f.proxima ? ETAPA_ROTULO[f.proxima] : null} requisito={f.requisito} podeAjuste={f.podeAjuste} podeGerir={f.podeGerir}
                responsavelId={p.responsavelId} prazo={p.prazo} prioridade={p.prioridade} pessoas={pessoas.map((x) => ({ id: x.id, nome: `${x.nome} · ${FUNCAO_ROTULO[x.funcao]}` }))} />
            </section>
          ) : null}
          <section className={card} aria-labelledby="pc-campos">
            <h2 id="pc-campos" className="mb-3 text-base font-semibold">Conteúdo</h2>
            <CamposDaPeca id={p.id} etapa={p.etapa} pode={f.podeMexer} inicial={{ objetivo: p.objetivo, roteiro: p.roteiro, referencias: p.referencias, legenda: p.legenda, linkBrutos: p.linkBrutos, linkVersao: p.linkVersao, linkPublicacao: p.linkPublicacao, publicarEm: p.publicarEm }} />
          </section>
        </div>
        <div className="space-y-5">
          <section className={card} aria-labelledby="pc-links">
            <h2 id="pc-links" className="mb-2 text-base font-semibold">Arquivos</h2>
            <ul className="space-y-1.5 text-sm">{links.map(([l, u]) => <li key={l} className="flex items-center justify-between gap-2"><span className="text-muted-foreground">{l}</span>{u ? <a href={u} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-link underline underline-offset-4">Abrir<ExternalLink className="size-3.5" aria-hidden /></a> : <span className="text-muted-foreground">—</span>}</li>)}</ul>
            <p className="mt-2 text-xs text-muted-foreground">Os arquivos ficam no Google Drive (ou onde a agência guarda); aqui fica só o link.</p>
          </section>
          <section className={card} aria-labelledby="pc-coment">
            <h2 id="pc-coment" className="mb-1 text-base font-semibold">Comentários da equipe</h2>
            <p className="mb-3 text-xs text-muted-foreground">Internos: o cliente nunca vê.</p>
            <ul className="mb-3 space-y-3">{f.comentarios.map((c) => <li key={c.id} className="rounded-xl bg-surface-muted/60 p-3 text-sm"><span className="text-xs text-muted-foreground"><b className="text-foreground">{c.autorNome}</b> · {quando(c.createdAt)}</span><p className="mt-1 whitespace-pre-line">{c.texto}</p>{c.link ? <a href={c.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-link underline">Abrir link</a> : null}{c.mencoes.length ? <p className="mt-1 text-xs text-muted-foreground">Avisou: {c.mencoes.map((m) => pessoas.find((x) => x.id === m)?.nome ?? f.equipeCliente.find((x) => x.userId === m)?.nome ?? "alguém").join(", ")}</p> : null}</li>)}{f.comentarios.length ? null : <li className="text-sm text-muted-foreground">Nenhum comentário ainda.</li>}</ul>
            <NovoComentario id={p.id} pessoas={(pessoas.length ? pessoas : f.equipeCliente.map((x) => ({ id: x.userId, nome: x.nome }))).map((x) => ({ id: x.id, nome: x.nome }))} />
          </section>
          <section className={card} aria-labelledby="pc-hist">
            <h2 id="pc-hist" className="mb-3 text-base font-semibold">Histórico</h2>
            <ol className="space-y-2.5 border-l border-border pl-4 text-sm">{f.eventos.map((e) => <li key={e.id}><span className="block text-xs text-muted-foreground">{quando(e.createdAt)}{e.autorNome ? ` · ${e.autorNome}` : ""}</span>{e.mensagem}{e.link ? <> <a href={e.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-link underline">link</a></> : null}</li>)}</ol>
          </section>
          <p className="text-xs text-muted-foreground"><Link href={`/agencia/clientes/${f.cliente.id}`} className="font-semibold text-link underline underline-offset-4">Ficha de {f.cliente.nome}</Link></p>
        </div>
      </div>
    </div>
  );
}
