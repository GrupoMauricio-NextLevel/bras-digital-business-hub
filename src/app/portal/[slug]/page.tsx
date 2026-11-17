import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { CalendarClock, CheckCircle2, Clapperboard, ExternalLink, Hourglass } from "lucide-react";
import { getDb } from "@/db/client";
import { AreaTheme } from "@/design-system/components/area-theme";
import { Kpi } from "@/components/commerce/commerce-home";
import { NotFoundError } from "@/lib/domain/errors";
import { COOKIE_PORTAL, agenciaDoPortal, clientesDaSessao, portalDoCliente } from "@/lib/agencias/portal";
import { agenciasLigado } from "@/lib/agencias/acesso";
import { formatBRL } from "@/lib/money";
import { AprovarConteudo, EntrarPortal, NovaSolicitacao, SairPortal } from "./portal-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal do cliente", robots: { index: false, follow: false } };

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const card = "ds-card p-5 sm:p-6";
const TIPO = { PEDIDO: "Pedido", IDEIA: "Ideia", DUVIDA: "Dúvida" } as const;
const SIT = { ABERTA: "Recebido", EM_ANDAMENTO: "Em andamento", RESPONDIDA: "Respondido" } as const;

/** Portal do cliente da agência (D320): acompanhar o mês, aprovar conteúdos, pagar e falar com a agência. */
export default async function Portal({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ cliente?: string }> }) {
  if (!agenciasLigado()) notFound();
  const { slug } = await params; const sp = await searchParams;
  const db = await getDb();
  const a = await agenciaDoPortal(db, slug).catch((e) => { if (e instanceof NotFoundError) notFound(); throw e; });
  const token = (await cookies()).get(`${COOKIE_PORTAL}-${a.slug}`)?.value;
  const { email, clientes } = await clientesDaSessao(db, a.id, token);
  const casca = (conteudo: React.ReactNode) => (
    <>
      <AreaTheme theme="nextlevel" brand="NEXTLEVEL" />
      <main className="mx-auto min-h-screen max-w-[1100px] space-y-5 bg-background px-4 py-6 sm:py-10">
        <header className="ds-hero ds-enter px-5 py-6 sm:px-10 sm:py-8">
          <div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">Portal do cliente</p>
            <h1 className="mt-2 text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-[1.05] tracking-[-.04em]">{a.nome}</h1>
            {email ? <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{email} <SairPortal slug={a.slug} /></p> : <p className="mt-2 text-sm text-muted-foreground">Acompanhe o seu mês, aprove os conteúdos e fale com a agência.</p>}
          </div>
        </header>
        {conteudo}
        <p className="pb-6 text-center text-xs text-muted-foreground">{a.nome} · com tecnologia NextLevel</p>
      </main>
    </>
  );
  if (!email) return casca(<section className={`${card} mx-auto max-w-md`}><h2 className="text-base font-semibold">Entrar</h2><p className="mt-1 text-sm text-muted-foreground">Use o e-mail que você passou para a agência. Mandamos um código de 6 dígitos, sem senha.</p><EntrarPortal slug={a.slug} /></section>);
  if (!clientes.length) return casca(<section className={card}><p className="text-sm">Não achamos nenhuma empresa ligada a <b>{email}</b>. Fale com a {a.nome}.</p></section>);
  const atual = clientes.find((c) => c.id === sp.cliente) ?? clientes[0]!;
  const p = await portalDoCliente(db, a.id, token, atual.id);
  const c = p.contagem;
  return casca(
    <>
      {clientes.length > 1 ? <nav aria-label="Empresas" className="flex flex-wrap gap-2">{clientes.map((x) => <Link key={x.id} href={`/portal/${a.slug}?cliente=${x.id}`} aria-current={x.id === atual.id ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm ${x.id === atual.id ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10 font-semibold" : "border-border"}`}>{x.nome}</Link>)}</nav> : null}
      <h2 className="text-xl font-semibold tracking-tight">{p.cliente.nome} · {p.mesRotulo}</h2>
      <section aria-label="Resumo do mês" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={Clapperboard} label="Contratados no mês" value={String(c.contratado)} note={`${c.produzidas} produzidos`} />
        <Kpi i={2} icon={CheckCircle2} label="Publicados" value={`${c.percentualPublicado}%`} note={`${c.publicadas} publicados`} />
        <Kpi i={3} icon={Hourglass} label="Esperando você" value={String(p.paraAprovar.length)} note="para aprovar" />
        <Kpi i={4} icon={CalendarClock} label="Em produção" value={String(p.producao.length)} note={p.programadas.length ? `${p.programadas.length} publicação(ões) programada(s)` : "conteúdos em andamento"} />
      </section>
      {p.paraAprovar.length ? (
        <section className={card} aria-labelledby="pt-apr">
          <h2 id="pt-apr" className="mb-1 text-base font-semibold">Para você aprovar</h2>
          <p className="mb-3 text-sm text-muted-foreground">Assista, aprove ou peça um ajuste contando o que precisa mudar.</p>
          <ul className="space-y-3">{p.paraAprovar.map((x) => <li key={x.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span><b className="block">{x.titulo}</b><span className="text-xs text-muted-foreground">{x.tipo} · versão {x.versao}</span></span>{x.link ? <a href={x.link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-link underline underline-offset-4">Assistir<ExternalLink className="size-4" aria-hidden /></a> : null}</div><AprovarConteudo slug={a.slug} clienteId={atual.id} pecaId={x.id} /></li>)}</ul>
        </section>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card} aria-labelledby="pt-prod">
          <h2 id="pt-prod" className="mb-3 text-base font-semibold">Em produção</h2>
          {p.producao.length ? <ul className="divide-y divide-border text-sm">{p.producao.map((x) => <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{x.titulo}<span className="block text-xs text-muted-foreground">{x.tipo}{x.anterior ? " · do mês anterior" : ""}</span></span><span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-[var(--ds-link)]">{x.situacao}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nada em produção agora.</p>}
        </section>
        <section className={card} aria-labelledby="pt-pub">
          <h2 id="pt-pub" className="mb-3 text-base font-semibold">Publicações</h2>
          {p.programadas.length ? <ul className="mb-3 space-y-1 text-sm">{p.programadas.map((x) => <li key={x.id}>{x.titulo} <span className="text-muted-foreground">· programado para {dm(x.em)}</span></li>)}</ul> : null}
          {p.publicacoes.length ? <ul className="divide-y divide-border text-sm">{p.publicacoes.map((x) => <li key={x.id} className="flex items-center justify-between gap-2 py-2"><span>{x.titulo}{x.em ? <span className="block text-xs text-muted-foreground">publicado em {dm(x.em)}</span> : null}</span>{x.link ? <a href={x.link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link underline underline-offset-4">Ver<ExternalLink className="size-3.5" aria-hidden /></a> : null}</li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma publicação neste mês ainda.</p>}
        </section>
        <section className={card} aria-labelledby="pt-cob">
          <h2 id="pt-cob" className="mb-3 text-base font-semibold">Pagamentos</h2>
          {p.cobrancas.length ? <ul className="divide-y divide-border text-sm">{p.cobrancas.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{f.descricao}<span className="block text-xs text-muted-foreground">vence {dm(f.vencimento)}</span></span><span className="flex items-center gap-2"><b className="tabular-nums">{formatBRL(f.valorCents)}</b>{f.mostrada === "PAGA" ? <span className="text-xs font-semibold text-success">Pago</span> : f.checkoutUrl ? <a href={f.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)]">Pagar</a> : <span className={`text-xs font-semibold ${f.mostrada === "ATRASADA" ? "text-danger" : "text-muted-foreground"}`}>{f.mostrada === "ATRASADA" ? "Em atraso" : "Em aberto"}</span>}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma cobrança por aqui.</p>}
        </section>
        <section className={card} aria-labelledby="pt-sol">
          <h2 id="pt-sol" className="mb-1 text-base font-semibold">Falar com a agência</h2>
          <p className="mb-3 text-sm text-muted-foreground">Mande pedidos, ideias e dúvidas e acompanhe a resposta por aqui.</p>
          <NovaSolicitacao slug={a.slug} clienteId={atual.id} />
          {p.solicitacoes.length ? <ul className="mt-4 space-y-2 text-sm">{p.solicitacoes.map((s) => <li key={s.id} className="rounded-xl bg-surface-muted/60 p-3"><span className="text-xs text-muted-foreground">{TIPO[s.tipo]} · {dm(s.createdAt)} · <b>{SIT[s.situacao]}</b></span><p className="mt-1">{s.texto}</p>{s.resposta ? <p className="mt-1.5 border-l-2 border-[var(--ds-link)] pl-2 text-muted-foreground">{s.resposta}</p> : null}</li>)}</ul> : null}
        </section>
      </div>
    </>
  );
}
