import Link from "next/link";
import { Clock, Columns3, Inbox, List, ListTodo, MessageCircle, Trophy, UserRoundPlus } from "lucide-react";
import { tarefasDeHoje } from "@/lib/business/assistente-contato";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { modulosDoNegocio } from "@/lib/business/modulos";
import { duracao, funilEmQuadro, listarContatos, resumoDosContatos, SITUACAO_ROTULO } from "@/lib/business/contatos";
import { listarServicos } from "@/lib/business/servicos";
import { ROTULO_CANAL, type Canal } from "@/lib/trafego/canal";
import { NOME_GERENCIADOR } from "@/lib/marcas/nextlevel-ecommerce";
import { formatBRL } from "@/lib/money";
import { CONTATO_SITUACOES, type ContatoSituacao } from "@/db/schema";
import { NovoContatoManual } from "./contatos-cliente";

export const dynamic = "force-dynamic";

const FILTROS: { v: ContatoSituacao | "ABERTOS" | "TODOS"; l: string }[] = [{ v: "ABERTOS", l: "Em aberto" }, ...CONTATO_SITUACOES.map((s) => ({ v: s, l: SITUACAO_ROTULO[s] })), { v: "TODOS", l: "Todos" }];
const quando = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Contatos e orçamentos (NextLevel Business, NB3, D309): cada pedido do site, com origem, situação e responsável. */
export default async function ContatosDoNegocio({ searchParams }: { searchParams: Promise<{ situacao?: string; ver?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const store = session.store!; const db = await getDb();
  if (!(await modulosDoNegocio(db, store.id)).ativos.has("contatos")) return <><PageHeader title="Contatos e orçamentos" /><EmptyState icon={Inbox} title="Ainda não está ligado na sua conta" description="Os pedidos de orçamento do site aparecem aqui quando o gerenciador do negócio estiver ligado na sua conta." /></>;
  const { situacao, ver } = await searchParams;
  // Funil em quadro (D337): as etapas lado a lado, como no CRM; a lista continua sendo o padrão.
  const quadro = ver === "quadro";
  const hoje = ver === "hoje";
  const filtro = quadro || hoje ? "TODOS" : (FILTROS.find((f) => f.v === situacao)?.v ?? "ABERTOS");
  const [lista, resumo, servicos] = await Promise.all([listarContatos(db, session.actor, store.id, { situacao: filtro === "TODOS" ? undefined : filtro }), resumoDosContatos(db, store.id), listarServicos(db, store.id)]);
  const colunas = quadro ? funilEmQuadro(lista) : [];
  const tarefas = hoje ? tarefasDeHoje(lista) : [];
  return (
    <>
      <PageHeader eyebrow={NOME_GERENCIADOR.nome} title="Contatos e orçamentos" description="Cada pedido que chega pelo site, com de onde veio. Assuma, responda e marque o andamento até fechar." actions={<NovoContatoManual servicos={servicos.filter((s) => s.ativo).map((s) => ({ id: s.id, nome: s.nome }))} />} />
      <OperationalPulse className="mb-5" items={[
        { label: "Novos sem resposta", value: resumo.novos, icon: UserRoundPlus, tone: resumo.novos ? "warning" : "neutral", hint: "responda primeiro estes" },
        { label: "Em aberto", value: resumo.abertos, icon: Inbox, tone: "info", hint: "últimos 30 dias" },
        { label: "Primeira resposta", value: duracao(resumo.medianaRespostaMs), icon: Clock, tone: "neutral", hint: "tempo do meio (mediana)" },
        { label: "Fechados", value: resumo.ganhos, icon: Trophy, tone: resumo.ganhos ? "success" : "neutral", hint: resumo.valorGanhoCents ? formatBRL(resumo.valorGanhoCents) : "nos últimos 30 dias" },
      ]} />
      {resumo.porCanal.length ? <p className="mb-4 text-sm text-muted-foreground">De onde vieram (30 dias): {resumo.porCanal.map(([c, n]) => `${ROTULO_CANAL[c as Canal] ?? c} ${n}`).join(" · ")}</p> : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {quadro ? <p className="text-sm text-muted-foreground">Fechados e perdidos dos últimos 30 dias. Abra o contato para mudar a etapa.</p> : hoje ? <p className="text-sm text-muted-foreground">Quem está esperando por você, do mais urgente ao menos, com o que fazer em cada um.</p> : (
          <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
            {FILTROS.map((f) => <Link key={f.v} href={`/merchant/contatos?situacao=${f.v}`} aria-current={f.v === filtro ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm ${f.v === filtro ? "border-[var(--ds-link)] bg-[var(--ds-link)]/10 font-semibold" : "border-border"}`}>{f.l}</Link>)}
          </nav>
        )}
        <nav aria-label="Modo de ver" className="inline-flex rounded-full border border-border p-0.5 text-sm">
          <Link href="/merchant/contatos?ver=hoje" aria-current={hoje ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${hoje ? "bg-[var(--ds-link)]/10 font-semibold text-[var(--ds-link)]" : ""}`}><ListTodo className="size-4" aria-hidden />Hoje</Link>
          <Link href="/merchant/contatos" aria-current={!quadro && !hoje ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${!quadro && !hoje ? "bg-[var(--ds-link)]/10 font-semibold text-[var(--ds-link)]" : ""}`}><List className="size-4" aria-hidden />Lista</Link>
          <Link href="/merchant/contatos?ver=quadro" aria-current={quadro ? "page" : undefined} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${quadro ? "bg-[var(--ds-link)]/10 font-semibold text-[var(--ds-link)]" : ""}`}><Columns3 className="size-4" aria-hidden />Funil</Link>
        </nav>
      </div>
      {quadro ? (
        <div className="overflow-x-auto pb-2" role="region" aria-label="Funil de contatos por etapa" tabIndex={0}>
          <ol className="grid min-w-[56rem] grid-cols-5 gap-3">
            {colunas.map((col) => (
              <li key={col.situacao} className="flex min-h-40 flex-col rounded-2xl border border-border bg-surface-muted/50 p-3">
                <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">{col.rotulo}<span className="text-xs font-normal text-muted-foreground">{col.itens.length}{col.valorCents ? ` · ${formatBRL(col.valorCents)}` : ""}</span></h2>
                <ul className="mt-3 space-y-2">
                  {col.itens.slice(0, 40).map((c) => (
                    <li key={c.id}><Link href={`/merchant/contatos/${c.id}`} className="block rounded-xl border border-border bg-surface p-3 text-sm shadow-sm hover:border-[var(--ds-link)]">
                      <b className="block truncate">{c.nome}</b>
                      <span className="block truncate text-xs text-muted-foreground">{c.servicoNome ?? "Sem serviço"} · {ROTULO_CANAL[c.canal as Canal] ?? c.canal}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{quando(c.createdAt)}{c.responsavelNome ? ` · ${c.responsavelNome.split(" ")[0]}` : ""}{c.valorCents ? ` · ${formatBRL(c.valorCents)}` : ""}</span>
                    </Link></li>
                  ))}
                  {col.itens.length > 40 ? <li className="text-xs text-muted-foreground">e mais {col.itens.length - 40} na lista</li> : null}
                  {!col.itens.length ? <li className="text-xs text-muted-foreground">Nenhum contato aqui.</li> : null}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      ) : hoje ? (tarefas.length ? (
        <ol className="space-y-2" aria-label="O que fazer hoje">
          {tarefas.map((t, i) => (
            <li key={t.id}><Link href={`/merchant/contatos/${t.id}`} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-[var(--ds-link)]">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${t.urgente ? "bg-warning-soft text-warning" : "bg-surface-muted text-muted-foreground"}`}>{i + 1}</span>
              <span className="min-w-0 flex-1"><b className="block">{t.nome}{t.servicoNome ? <span className="font-normal text-muted-foreground"> · {t.servicoNome}</span> : null}</b>
                <span className="mt-0.5 block text-sm">{t.acao}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{SITUACAO_ROTULO[t.situacao]} · {ROTULO_CANAL[t.canal as Canal] ?? t.canal} · chegou {quando(t.createdAt)}</span></span>
            </Link></li>
          ))}
        </ol>
      ) : <EmptyState icon={Trophy} title="Tudo em dia" description="Ninguém esperando resposta nem retorno de orçamento agora." />)
      : lista.length ? (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface" aria-label="Contatos">
          {lista.map((c) => (
            <li key={c.id}>
              <Link href={`/merchant/contatos/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-muted">
                <span className="min-w-0 flex-1">
                  <b className="block">{c.nome}{c.servicoNome ? <span className="font-normal text-muted-foreground"> · {c.servicoNome}</span> : null}</b>
                  <span className="text-xs text-muted-foreground">{quando(c.createdAt)} · {ROTULO_CANAL[c.canal as Canal] ?? c.canal}{c.utmCampaign ? ` · campanha ${c.utmCampaign}` : ""}{c.responsavelNome ? ` · com ${c.responsavelNome.split(" ")[0]}` : ""}</span>
                </span>
                {c.whatsapp ? <MessageCircle className="size-4 text-muted-foreground" aria-label="Tem WhatsApp" /> : null}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.situacao === "NOVO" ? "bg-warning-soft text-warning" : c.situacao === "GANHO" ? "bg-success-soft text-success" : c.situacao === "PERDIDO" ? "bg-surface-muted text-muted-foreground" : "bg-[var(--ds-link)]/10 text-[var(--ds-link)]"}`}>{SITUACAO_ROTULO[c.situacao]}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Inbox} title={filtro === "ABERTOS" ? "Nenhum contato em aberto" : "Nada por aqui"} description="Os pedidos do formulário de orçamento do site chegam aqui. Confira se a página Contato tem o formulário e se o site está publicado." action={<Link href="/merchant/site/paginas" className="font-semibold text-link underline underline-offset-4">Ver as páginas do site</Link>} />}
    </>
  );
}
