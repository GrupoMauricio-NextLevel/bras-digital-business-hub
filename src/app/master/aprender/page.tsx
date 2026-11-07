import Link from "next/link";
import { ArrowRight, BookOpen, Check, CircleCheck, GraduationCap, Search, Sparkles, Users, X } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { fatosAoVivo } from "@/lib/conhecimento/fatos";
import { aulas, buscarAulas, TRILHAS, trilhasDa, type Aula } from "@/lib/conhecimento/aulas";
import { MASTER_FUNCTION_LABEL } from "@/lib/master-equipe";
import { perguntasDa } from "@/lib/conhecimento/perguntas";
import { painelDaEquipe, progressoDe, resumoPorTrilha } from "@/lib/domain/aprender";
import { isMasterOwner } from "@/lib/domain/access";
import { QuizAula } from "@/components/master/quiz-aula";
import novidades from "@/lib/conhecimento/novidades.json";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aprender" };

type Busca = { trilha?: string; aula?: string; q?: string; aba?: string };

/**
 * Aprender (BC1, D266): a base de conhecimento da equipe do Master. Trilhas por função (D265), aulas com os números
 * lidos do sistema agora (`fatosAoVivo`), busca e Novidades geradas das decisões. Só a equipe do Master vê.
 */
export default async function AprenderPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  const fn = session.actor.masterFunction ?? null;
  const minhas = trilhasDa(fn);
  const db = await getDb();
  const fatos = await fatosAoVivo(db);
  const todas = aulas(fatos);
  const dono = isMasterOwner(session.actor);
  const feitas = await progressoDe(db, session.actor.userId);
  const visiveis = todas.filter((a) => minhas.includes(a.trilha));
  const trilhas = TRILHAS.filter((t) => minhas.includes(t.id));
  const aba = sp.aba === "novidades" ? "novidades" : sp.aba === "equipe" && dono ? "equipe" : "trilhas";
  const equipe = aba === "equipe" ? await painelDaEquipe(db, session.actor, fatos) : [];
  const resumo = resumoPorTrilha(visiveis, minhas, feitas);
  const feitasN = resumo.reduce((s, t) => s + t.feitas, 0), totalN = resumo.reduce((s, t) => s + t.total, 0);
  const q = (sp.q ?? "").trim();
  const resultados = q ? buscarAulas(visiveis, q) : null;
  const trilhaAtual = trilhas.find((t) => t.id === sp.trilha) ?? trilhas[0]!;
  const daTrilha = visiveis.filter((a) => a.trilha === trilhaAtual.id);
  const aula = visiveis.find((a) => a.id === sp.aula) ?? daTrilha[0] ?? null;
  const url = (p: Busca) => `/master/aprender?${new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString()}`;

  return (
    <>
      <PageHeader eyebrow="Base de conhecimento" title="Aprender" description={`Tudo o que a equipe precisa saber, com os números do sistema de agora. ${fn ? `Trilhas da sua função (${MASTER_FUNCTION_LABEL[fn]}).` : "Você vê todas as trilhas."}`} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <nav className="flex gap-1 rounded-full border border-border bg-surface p-1" aria-label="Seções">
          <Link href={url({})} aria-current={aba === "trilhas" ? "page" : undefined} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${aba === "trilhas" ? "bg-foreground text-surface" : "text-muted-foreground hover:text-foreground"}`}><GraduationCap className="size-4" aria-hidden />Trilhas</Link>
          <Link href={url({ aba: "novidades" })} aria-current={aba === "novidades" ? "page" : undefined} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${aba === "novidades" ? "bg-foreground text-surface" : "text-muted-foreground hover:text-foreground"}`}><Sparkles className="size-4" aria-hidden />Novidades</Link>
          {dono ? <Link href={url({ aba: "equipe" })} aria-current={aba === "equipe" ? "page" : undefined} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${aba === "equipe" ? "bg-foreground text-surface" : "text-muted-foreground hover:text-foreground"}`}><Users className="size-4" aria-hidden />Equipe</Link> : null}
        </nav>
        <form action="/master/aprender" className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1 sm:max-w-md" role="search">
          <label htmlFor="busca-aprender" className="sr-only">Buscar na base</label>
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="busca-aprender" name="q" defaultValue={q} placeholder="Buscar: comissão, CPF, Black, grade…" className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm" /></div>
          <button className="h-10 rounded-full bg-foreground px-4 text-sm font-semibold text-surface">Buscar</button>
        </form>
      </div>

      {aba === "trilhas" && !resultados ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">Seu progresso: {feitasN} de {totalN} aulas</span>
          <Barra feitas={feitasN} total={totalN} rotulo="Progresso nas suas trilhas" className="w-full max-w-xs" />
          {totalN && feitasN === totalN ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success"><CircleCheck className="size-3.5" aria-hidden />Pronto</span> : null}
        </div>
      ) : null}

      {aba === "equipe" ? (
        <section aria-labelledby="eq-t">
          <h2 id="eq-t" className="mb-1 text-base font-semibold">Quem está pronto</h2>
          <p className="mb-4 text-sm text-muted-foreground">Cada pessoa faz a Base e as trilhas da função. Fica pronta quando acerta todas as perguntas de todas as aulas.</p>
          {equipe.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {equipe.map((p) => (
                <li key={p.id} className="ds-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-semibold">{p.nome}</p><p className="text-xs text-muted-foreground">{MASTER_FUNCTION_LABEL[p.funcao]} · {p.ultima ? `última aula em ${new Date(p.ultima).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "ainda não começou"}</p></div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.pronto ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{p.pronto ? "Pronto" : `${p.feitas} de ${p.total}`}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {p.trilhas.map((t) => (
                      <li key={t.trilha} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
                        <span className="truncate">{TRILHAS.find((x) => x.id === t.trilha)?.titulo}</span>
                        <span className="font-mono text-xs text-muted-foreground">{t.feitas}/{t.total}</span>
                        <Barra feitas={t.feitas} total={t.total} rotulo={`${p.nome}: ${TRILHAS.find((x) => x.id === t.trilha)?.titulo}`} className="col-span-2" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={Users} title="Ninguém na equipe ainda" description="Convide pessoas em Equipe; a trilha da função já vem atribuída." action={<Link href="/master/equipe" className="ds-btn ds-btn--sm">Abrir Equipe</Link>} />}
        </section>
      ) : aba === "novidades" ? (
        <section aria-labelledby="nov-t">
          <h2 id="nov-t" className="sr-only">Novidades</h2>
          <ol className="space-y-3">
            {novidades.map((n) => (
              <li key={n.numero} className="ds-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono font-semibold text-foreground">D{n.numero}</span>{n.frente ? <span className="rounded-full border border-border px-2 py-0.5">{n.frente}</span> : null}{n.data ? <time dateTime={n.data}>{n.data.split("-").reverse().join("/")}</time> : null}</div>
                <p className="mt-2 font-semibold">{n.titulo}</p>
                {n.resumo ? <p className="mt-1 text-sm text-muted-foreground">{n.resumo}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : resultados ? (
        <section aria-labelledby="res-t">
          <h2 id="res-t" className="mb-3 text-base font-semibold">{resultados.length} resultado{resultados.length === 1 ? "" : "s"} para “{q}”</h2>
          {resultados.length ? (
            <ul className="grid gap-3 md:grid-cols-2">{resultados.map((a) => <li key={a.id}><Link href={url({ trilha: a.trilha, aula: a.id })} className="ds-card block p-4 hover:border-foreground/30"><p className="text-xs text-muted-foreground">{TRILHAS.find((t) => t.id === a.trilha)?.titulo}</p><p className="mt-1 font-semibold">{a.titulo}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.oQue}</p></Link></li>)}</ul>
          ) : <EmptyState icon={Search} title="Nada encontrado" description="Tente outra palavra, como comissão, plano, grade ou Black." />}
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav aria-label="Trilhas" className="space-y-2">
            {trilhas.map((t) => {
              const atual = t.id === trilhaAtual.id;
              const lista = visiveis.filter((a) => a.trilha === t.id);
              const feitasT = lista.filter((a) => feitas.has(a.id)).length;
              return (
                <div key={t.id} className={`ds-card p-3 ${atual ? "ring-1 ring-foreground/20" : ""}`}>
                  <Link href={url({ trilha: t.id })} aria-current={atual ? "true" : undefined} className="flex items-start gap-2">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-xs font-bold">{t.numero}</span>
                    <span><span className="block text-sm font-semibold">{t.titulo}</span><span className="block text-xs text-muted-foreground">{feitasT} de {lista.length} aula{lista.length === 1 ? "" : "s"}{t.id === "base" ? " · obrigatória" : ""}</span></span>
                  </Link>
                  <Barra feitas={feitasT} total={lista.length} rotulo={`Progresso em ${t.titulo}`} className="mt-2" />
                  {atual ? (
                    <ul className="mt-2 space-y-0.5 border-t border-border pt-2">{lista.map((a) => <li key={a.id}><Link href={url({ trilha: t.id, aula: a.id })} aria-current={aula?.id === a.id ? "page" : undefined} className={`flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-sm ${aula?.id === a.id ? "bg-surface-muted font-semibold" : "text-muted-foreground hover:text-foreground"}`}>{feitas.has(a.id) ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Concluída" /> : <span aria-hidden className="mt-0.5 size-4 shrink-0 rounded-full border border-border" />}<span>{a.titulo}</span></Link></li>)}</ul>
                  ) : null}
                </div>
              );
            })}
          </nav>
          {aula ? <div className={sp.aula ? "order-first lg:order-none" : undefined}><AulaView aula={aula} trilha={TRILHAS.find((t) => t.id === aula.trilha)?.titulo ?? trilhaAtual.titulo} perguntas={perguntasDa(aula.id, fatos).map(({ pergunta, opcoes }) => ({ pergunta, opcoes }))} concluida={feitas.has(aula.id)} /></div> : <EmptyState icon={BookOpen} title="Sem aulas nesta trilha" description="As aulas desta trilha chegam em breve." />}
        </div>
      )}
    </>
  );
}

function Barra({ feitas, total, rotulo, className = "" }: { feitas: number; total: number; rotulo: string; className?: string }) {
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  return <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitas} className={`h-1.5 overflow-hidden rounded-full bg-surface-muted ${className}`}><div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-foreground"}`} style={{ width: `${pct}%` }} /></div>;
}

function AulaView({ aula, trilha, perguntas, concluida }: { aula: Aula; trilha: string; perguntas: { pergunta: string; opcoes: string[] }[]; concluida: boolean }) {
  return (
    <article className="ds-card p-5 sm:p-7" aria-labelledby="aula-t">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{trilha}</span>·<span className={`rounded-full px-2 py-0.5 font-semibold ${aula.estado === "no-ar" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{aula.estado === "no-ar" ? "No ar" : "Em breve"}</span>{aula.decisoes.map((d) => <span key={d} className="rounded-full border border-border px-2 py-0.5 font-mono">{d}</span>)}</div>
      <h2 id="aula-t" className="mt-3 text-2xl font-bold tracking-tight">{aula.titulo}</h2>
      <p className="mt-2 text-base text-muted-foreground">{aula.oQue}</p>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">A regra</h3>
      <ul className="mt-2 space-y-2">{aula.regra.map((r) => <li key={r} className="flex gap-2 text-sm"><ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /><span>{r}</span></li>)}</ul>
      {aula.exemplo ? <><h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exemplo</h3><p className="mt-2 rounded-xl bg-surface-muted p-3 text-sm">{aula.exemplo}</p></> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div><h3 className="text-sm font-semibold uppercase tracking-wider text-success">O que dizer</h3><ul className="mt-2 space-y-2">{aula.dizer.map((d) => <li key={d} className="flex gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /><span>{d}</span></li>)}</ul></div>
        <div><h3 className="text-sm font-semibold uppercase tracking-wider text-danger">Nunca dizer ou fazer</h3><ul className="mt-2 space-y-2">{aula.nunca.map((d) => <li key={d} className="flex gap-2 text-sm"><X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden /><span>{d}</span></li>)}</ul></div>
      </div>
      {aula.link ? <Link href={aula.link.href} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-surface">{aula.link.rotulo} <ArrowRight className="size-4" aria-hidden /></Link> : null}
      {perguntas.length ? <QuizAula key={aula.id} aulaId={aula.id} perguntas={perguntas} concluida={concluida} /> : null}
    </article>
  );
}
