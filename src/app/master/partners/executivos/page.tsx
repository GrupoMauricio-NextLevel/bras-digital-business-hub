import { diaDoPrazo } from "@/lib/finance/executivo-regras";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { isMasterOwner } from "@/lib/domain/access";
import { feedDaEquipe, painelDosExecutivos, primeiraFaixaDaRua, pendenciasDosExecutivos } from "@/lib/domain/executivos";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { MetaSemanal, NovoExecutivo, ReceberPendencia } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Executivos de venda" };

const quando = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");
const NIVEL: Record<string, string> = { INICIAL: "Inicial", PRATA: "Prata", OURO: "Ouro" };

/** Executivos de venda (CX3, D273): equipe de rua, dinheiro com cada um, prestação de contas e cadastro. */
export default async function ExecutivosPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [lista, pend, feed] = await Promise.all([painelDosExecutivos(db, session.actor), pendenciasDosExecutivos(db, session.actor), feedDaEquipe(db, session.actor, 25)]);
  const padrao = (await primeiraFaixaDaRua(db)) ?? 3;
  const dono = isMasterOwner(session.actor);
  const ranking = [...lista].sort((a, b) => b.vendasSemana - a.vendasSemana || b.visitasSemana - a.visitasSemana);
  const naRua = pend.filter((p) => p.meio === "DINHEIRO").reduce((t, p) => t + p.valorCents, 0);
  return (
    <>
      <PageHeader eyebrow="Parceiros" title="Executivos de venda" description="A equipe de rua: vendem em dinheiro ou na maquininha, a loja do cliente é liberada na hora e o valor fica com o executivo até prestar contas com você (prazo de 2 dias úteis). Recebido, entra no caixa do dia." />
      <section className="ds-kpis mb-6" aria-label="Resumo">
        <MetricCard label="Executivos" value={lista.length} hint={`${lista.filter((x) => x.status === "ACTIVE").length} ativos`} />
        <MetricCard label="Dinheiro na rua" value={formatBRL(naRua)} hint="com os executivos, a receber" tone={naRua ? "warning" : "neutral"} />
        <MetricCard label="Atrasados" value={pend.filter((p) => p.atrasado).length} hint="passaram do prazo de 2 dias úteis" tone={pend.some((p) => p.atrasado) ? "danger" : "neutral"} />
        <MetricCard label="Maquininha a conferir" value={pend.filter((p) => p.meio === "MAQUININHA_VENDEDOR").length} hint="confira no Mercado Pago e lance" />
      </section>

      <section className="ds-card mb-6 p-5" aria-labelledby="pend-t">
        <h2 id="pend-t" className="text-base font-semibold">Prestações de contas</h2>
        <p className="text-sm text-muted-foreground">Receber lança no caixa de hoje (abra o caixa antes). Atrasado trava novas vendas em dinheiro do executivo; a loja do cliente segue liberada.</p>
        {pend.length ? (
          <ul className="mt-3 divide-y divide-border">
            {pend.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.executivo} · {p.loja}</p>
                  <p className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <Badge tone={p.meio === "DINHEIRO" ? "warning" : "info"}>{p.meio === "DINHEIRO" ? "Dinheiro com o executivo" : "Maquininha do vendedor"}</Badge>
                    <span className="font-mono">{p.codigo}</span> · vendido {quando(p.recebidoEm)} · entregar até {diaDoPrazo(p.prazoAte)}
                    {p.atrasado ? <Badge tone="danger"><AlertTriangle className="size-3" aria-hidden /> atrasado</Badge> : null}
                  </p>
                </div>
                <b className="tabular-nums">{formatBRL(p.valorCents)}</b>
                <ReceberPendencia id={p.id} dinheiro={p.meio === "DINHEIRO"} />
              </li>
            ))}
          </ul>
        ) : <EmptyState compact title="Nada pendente" description="Todo o dinheiro das vendas de rua já foi entregue." />}
      </section>

      <section className="mb-6" aria-labelledby="exec-t">
        <h2 id="exec-t" className="mb-3 text-base font-semibold">A equipe</h2>
        {lista.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((x) => (
              <li key={x.id} className="ds-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{x.nome}</p><p className="text-xs text-muted-foreground">{x.email} · nível {NIVEL[x.nivel] ?? x.nivel}</p></div><Badge tone={x.atrasados ? "danger" : x.status === "ACTIVE" ? "success" : "outline"}>{x.atrasados ? `${x.atrasados} atrasado(s)` : x.status === "ACTIVE" ? "Ativo" : "Inativo"}</Badge></div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Vendas na semana</dt><dd className="font-bold tabular-nums">{x.vendasSemana}{x.metaSemanal ? <span className="font-normal text-muted-foreground"> de {x.metaSemanal}</span> : null}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Visitas na semana</dt><dd className="font-bold tabular-nums">{x.visitasSemana}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Vendas no mês</dt><dd className="font-bold tabular-nums">{x.vendasMes}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Comissão no mês</dt><dd className="font-bold tabular-nums">{formatBRL(x.comissaoMesCents)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Dinheiro com ele</dt><dd className="font-bold tabular-nums">{formatBRL(x.dinheiroComEleCents)}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">Última prestação de contas: {quando(x.ultimaPrestacao)} · <Link href={`/master/partners/${x.id}`} className="underline">ficha no CRM</Link></p>
                {dono ? <MetaSemanal partnerId={x.id} meta={x.metaSemanal} padrao={padrao} /> : null}
              </li>
            ))}
          </ul>
        ) : <EmptyState compact title="Nenhum executivo ainda" description="Cadastre a sua equipe de rua abaixo." />}
      </section>

      {lista.length ? (
        <div className="mb-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section className="ds-card p-5" aria-labelledby="rank-t">
            <h2 id="rank-t" className="text-base font-semibold">Ranking da semana</h2>
            <p className="text-sm text-muted-foreground">Vendas e, no empate, visitas. Reconhecimento; dinheiro só pelas campanhas de bônus.</p>
            <ol className="mt-3 grid gap-1">{ranking.map((x, i) => <li key={x.id} className="flex justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-surface-muted/60"><span>{i + 1}º {x.nome}</span><span className="tabular-nums">{x.vendasSemana} {x.vendasSemana === 1 ? "venda" : "vendas"} · {x.visitasSemana} {x.visitasSemana === 1 ? "visita" : "visitas"}</span></li>)}</ol>
          </section>
          <section className="ds-card p-5" aria-labelledby="feed-t">
            <h2 id="feed-t" className="text-base font-semibold">O que a equipe fez</h2>
            {feed.length ? <ul className="mt-3 divide-y divide-border">{feed.map((f) => <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"><span className="min-w-0"><Badge tone={f.tipo.startsWith("Venda") ? (f.tipo === "Venda" ? "success" : "danger") : f.tipo === "Demonstração" ? "info" : "outline"}>{f.tipo}</Badge> <b>{f.executivo.split(" ")[0]}</b> · {f.texto}</span><span className="text-xs text-muted-foreground tabular-nums">{quando(f.em)}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">As visitas, demonstrações e vendas aparecem aqui assim que a equipe registrar.</p>}
          </section>
        </div>
      ) : null}

      {dono ? (
        <section className="ds-card p-5" aria-labelledby="novo-t">
          <h2 id="novo-t" className="mb-1 text-base font-semibold">Cadastrar executivo</h2>
          <p className="mb-3 text-sm text-muted-foreground">Só o dono cadastra. Mesma comissão dos parceiros (nível e CPF ou CNPJ); bônus pelas campanhas da rua. Ele entra em Parceiros com este e-mail.</p>
          <NovoExecutivo />
        </section>
      ) : null}
    </>
  );
}
