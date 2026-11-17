import { BadgeDollarSign } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { escopoDaAgencia, FUNCAO_ROTULO, pode } from "@/lib/agencias/acesso";
import { executivosDoMes } from "@/lib/agencias/gestao";
import { mesRotulo } from "@/lib/agencias/fluxo";
import { formatBRL } from "@/lib/money";
import { Comissao } from "@/components/agencia/gestao-cliente";

export const dynamic = "force-dynamic";
export const metadata = { title: "Executivos de venda" };

/** Executivos de venda da agência (D325), como os Executivos de venda do Master. */
export default async function Executivos() {
  const session = await requireRole("AGENCY");
  const db = await getDb();
  const { membro } = await escopoDaAgencia(db, session.actor);
  if (!pode.verValores(membro)) return <><PageHeader title="Executivos de venda" /><EmptyState icon={BadgeDollarSign} title="As comissões são do administrador e do financeiro" description="Fale com o administrador da agência." /></>;
  const e = await executivosDoMes(db, session.actor);
  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <PageHeader backHref="/agencia/comercial" eyebrow="Comercial" title="Executivos de venda" description={`Quem fechou cada cliente (o responsável da negociação ao virar cliente) e a comissão de ${mesRotulo(e.mes)} sobre o que esses clientes pagaram no mês.`} />
      <section className="ds-card p-5 sm:p-6" aria-labelledby="ex-lista">
        <h2 id="ex-lista" className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-base font-semibold"><span>Comissões de {mesRotulo(e.mes)}</span><span className="text-sm tabular-nums">Total {formatBRL(e.total)}</span></h2>
        {e.linhas.length ? <ul className="divide-y divide-border text-sm">{e.linhas.map((l) => <li key={l.userId} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><b className="block">{l.nome}</b><span className="text-xs text-muted-foreground">{FUNCAO_ROTULO[l.funcao]} · {l.carteira} cliente(s) fechados · {l.fechadosNoMes} no mês</span></span><span className="text-right text-xs text-muted-foreground"><b className="block text-sm text-foreground tabular-nums">{formatBRL(l.comissaoCents)}</b>{l.comissaoPct ?? 0}% de {formatBRL(l.recebidoCents)} recebidos</span></li>)}</ul> : <EmptyState icon={BadgeDollarSign} title="Ninguém com venda ou comissão ainda" description="Ao virar cliente no Comercial, quem cuidava da negociação fica como vendedor." />}
      </section>
      {e.podeDefinir ? <section className="ds-card p-5 sm:p-6" aria-labelledby="ex-pct"><h2 id="ex-pct" className="mb-3 text-base font-semibold">Comissão de cada pessoa</h2><ul className="divide-y divide-border text-sm">{e.equipe.map((p) => { const l = e.linhas.find((x) => x.userId === p.id); return <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{p.nome}</span><Comissao userId={p.id} pct={l?.comissaoPct ?? null} /></li>; })}</ul></section> : null}
    </div>
  );
}
