import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ExternalLink, Eye, Percent, UserCheck, Users } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getBaseUrl } from "@/lib/base-url";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { AcoesContato, CopiarLink } from "@/components/business/academia-acoes";
import { ETAPAS_ACADEMIA, contatosDaAcademia, ehAcademia, linksDaAcademia, nomeDaOrigem, resumoDaCaptacao, type EtapaAcademia } from "@/lib/domain/business/academia";

export const dynamic = "force-dynamic";
export const metadata = { title: "Captação de alunos" };

const TURNO: Record<string, string> = { MANHA: "manhã", TARDE: "tarde", NOITE: "noite" };
const dia = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const quando = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

/** Captação da academia (NextLevel Business, A1, D307): números, funil por etapa, origem e links prontos. */
export default async function Page({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const db = await getDb();
  if (!(await ehAcademia(db, session.actor.storeId))) redirect("/merchant");
  const [resumo, contatos] = await Promise.all([resumoDaCaptacao(db, session.actor), contatosDaAcademia(db, session.actor)]);
  const { etapa: etapaQ } = await searchParams;
  const ativos = ETAPAS_ACADEMIA.map((e) => e.key).filter((k) => k !== "matriculou" && k !== "perdido");
  const filtro = ETAPAS_ACADEMIA.some((e) => e.key === etapaQ) ? (etapaQ as EtapaAcademia) : null;
  const lista = filtro ? contatos.filter((c) => c.etapa === filtro) : contatos.filter((c) => (ativos as string[]).includes(c.etapa));
  const slug = session.store!.slug;
  const links = linksDaAcademia(await getBaseUrl(), slug);
  const pagina = `/academia/${slug}`;

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="NextLevel Business · Academia"
        title="Captação de alunos"
        description="Quem pediu aula experimental, de onde veio e o que fazer agora. Cobrança e catraca continuam no sistema que você já usa."
        actions={<>
          <Link href="/merchant/academia/pagina" className={buttonVariants({ variant: "secondary" })}>Editar página</Link>
          <a href={pagina} target="_blank" rel="noopener" className={buttonVariants()}><ExternalLink aria-hidden />Ver página</a>
        </>}
      />

      <section aria-label="Números dos últimos 30 dias" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Interessados" value={resumo.interessados} hint="últimos 30 dias" icon={Users} />
        <MetricCard label="Matrículas" value={resumo.matriculas} hint="últimos 30 dias" icon={UserCheck} tone="success" />
        <MetricCard label="Viraram aluno" value={resumo.conversao === null ? "—" : `${resumo.conversao}%`} hint="dos interessados do período" icon={Percent} />
        <MetricCard label="Confirmar presença" value={resumo.paraConfirmar} hint="o dia da aula já passou" icon={CalendarCheck} tone={resumo.paraConfirmar ? "warning" : "neutral"} href="/merchant/academia?etapa=confirmar" />
        <MetricCard label="Visitas da página" value={resumo.visitas} hint="últimos 30 dias" icon={Eye} />
      </section>

      <section aria-labelledby="funil-t" className="grid gap-4">
        <h2 id="funil-t" className="sr-only">Funil</h2>
        <nav aria-label="Filtrar por etapa" className="flex gap-2 overflow-x-auto pb-1">
          <Link href="/merchant/academia" className="ds-chip shrink-0" aria-current={!filtro ? "page" : undefined}>Em andamento ({contatos.filter((c) => (ativos as string[]).includes(c.etapa)).length})</Link>
          {ETAPAS_ACADEMIA.map((e) => (
            <Link key={e.key} href={`/merchant/academia?etapa=${e.key}`} className="ds-chip shrink-0" aria-current={filtro === e.key ? "page" : undefined} title={e.dica}>
              {e.rotulo} ({resumo.porEtapa[e.key]})
            </Link>
          ))}
        </nav>
        {lista.length ? (
          <ul className="grid gap-3" data-academia-lista>
            {lista.map((c) => (
              <li key={c.id} className="ds-card grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="font-semibold">{c.nome} <span className="ml-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{ETAPAS_ACADEMIA.find((e) => e.key === c.etapa)!.rotulo}</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[c.interesse, c.experimentalDia ? `aula ${dia(c.experimentalDia)}${c.turno ? ` (${TURNO[c.turno]})` : ""}` : c.turno ? `prefere ${TURNO[c.turno]}` : null, `veio por ${nomeDaOrigem(c.origem)}`, `pediu em ${quando(c.createdAt)}`].filter(Boolean).join(" · ")}
                    {c.motivoPerda ? ` · motivo: ${c.motivoPerda}` : ""}
                  </p>
                </div>
                <AcoesContato id={c.id} etapa={c.etapa} whatsappHref={c.whatsappHref} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={filtro ? "Ninguém nesta etapa" : "Ainda não há interessados"}
            description={filtro ? "Quando alguém chegar aqui, aparece nesta lista." : "Divulgue a página da academia com os links abaixo: cada pedido de aula experimental aparece aqui, com a origem."}
            icon={Users}
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="ds-card">
          <SectionTitle title="De onde vêm os interessados" description="Últimos 30 dias, pela origem do link." />
          {resumo.origens.length ? (
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-2 font-medium">Origem</th><th className="py-2 pl-3 text-right font-medium">Pediram</th><th className="py-2 pl-3 text-right font-medium">Matricularam</th></tr></thead>
              <tbody>{resumo.origens.map((o) => <tr key={o.origem} className="border-t border-border"><td className="py-2">{o.nome}</td><td className="py-2 pl-3 text-right tabular-nums">{o.interessados}</td><td className="py-2 pl-3 text-right tabular-nums">{o.matriculas}</td></tr>)}</tbody>
            </table>
          ) : <p className="mt-2 text-sm text-muted-foreground">Sem interessados no período.</p>}
        </section>
        <section className="ds-card">
          <SectionTitle title="Links para divulgar" description="Use um link por canal: a origem de cada aluno chega sozinha." />
          <ul className="mt-2 grid gap-3">
            {links.map((l) => (
              <li key={l.fonte} className="flex items-start justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="min-w-0"><p className="font-medium">{l.rotulo}</p><p className="text-xs text-muted-foreground">{l.dica}</p><p className="mt-1 break-all text-xs text-muted-foreground">{l.url}</p></div>
                <CopiarLink url={l.url} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
