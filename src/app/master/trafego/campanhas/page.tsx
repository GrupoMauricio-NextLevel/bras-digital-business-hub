import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { painelCampanhas } from "@/lib/domain/trafego/meta-leitura";
import { formatDateTime } from "@/lib/utils";
import { AbasTrafego } from "../abas";
import { AtualizarMeta } from "./atualizar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campanhas · Tráfego" };

const PERIODOS = [7, 30, 90] as const;
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number) => n.toLocaleString("pt-BR");
const ou = (v: number | null, f: (x: number) => string) => (v === null ? "—" : f(v));

/** Tráfego e campanhas → Campanhas (TR6, D302): gasto da Meta ao lado do resultado real (contatos, contas, pagantes). */
export default async function CampanhasPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const pedido = Number((await searchParams).dias);
  const dias = (PERIODOS as readonly number[]).includes(pedido) ? (pedido as 7 | 30 | 90) : 30;
  const p = await painelCampanhas(await getDb(), s.actor, dias);
  const th = "px-3 py-2 text-left font-semibold whitespace-nowrap";
  const td = "px-3 py-2 tabular-nums whitespace-nowrap";
  const t = p.total;
  return (
    <>
      <PageHeader eyebrow="Crescimento" title="Tráfego e campanhas" description="Quanto cada campanha gastou na Meta e quantos contatos, lojas criadas e pagantes ela trouxe de verdade, pelo nosso sistema." actions={<AtualizarMeta />} />
      <AbasTrafego ativa="campanhas" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {PERIODOS.map((d) => <Link key={d} href={`/master/trafego/campanhas?dias=${d}`} aria-current={d === dias ? "page" : undefined} className={`ds-btn ds-btn--sm ${d === dias ? "" : "ds-btn--ghost"}`}>Últimos {d} dias</Link>)}
        </nav>
        <p className="text-xs text-muted-foreground">{p.estado.em ? `Última leitura da Meta: ${formatDateTime(p.estado.em)}` : "A Meta ainda não foi lida."}{p.estado.motivo ? ` · ${p.estado.motivo}` : ""}</p>
      </div>
      {!p.conta ? <p role="note" className="mb-4 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm">Para ver o gasto, informe o número da conta de anúncios da NextLevel e o token da Meta em <Link href="/master/trafego/retorno" className="font-semibold text-link underline">Retorno às plataformas</Link>. Sem isso, a tabela mostra só o que o nosso sistema mede por campanha.</p> : null}
      <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {([["Investido na Meta", brl(t.gastoCents)], ["Contatos", num(t.contatos)], ["Custo por contato", ou(t.gastoCents && t.contatos ? Math.round(t.gastoCents / t.contatos) : null, brl)], ["Pagantes", num(t.pagantes)], ["Custo por pagante", ou(t.gastoCents && t.pagantes ? Math.round(t.gastoCents / t.pagantes) : null, brl)]] as const).map(([k, v]) => <div key={k} className="ds-card"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{v}</dd></div>)}
      </dl>
      <section className="ds-card min-w-0 text-sm" aria-labelledby="camp-t">
        <h2 id="camp-t" className="text-lg font-bold">Por campanha</h2>
        <p className="mt-1 text-muted-foreground">A campanha é ligada pelo nome: nos anúncios, o link leva utm_campaign={"{{campaign.name}}"} (padrão de nomes da aba Links rastreados).</p>
        {p.linhas.length === 0 ? <p className="mt-4 rounded-xl bg-surface-muted px-4 py-6 text-center text-muted-foreground">Nenhuma campanha com gasto ou visita neste período.</p> : (
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de campanhas (role para os lados)">
            <table className="w-full min-w-[60rem] border-collapse">
              <caption className="sr-only">Campanhas dos últimos {dias} dias: gasto da Meta e resultado no sistema</caption>
              <thead className="border-b border-border text-muted-foreground"><tr>
                <th scope="col" className={th}>Campanha</th><th scope="col" className={th}>Investido</th><th scope="col" className={th}>Cliques</th><th scope="col" className={th}>Visitas</th><th scope="col" className={th}>Contatos</th><th scope="col" className={th}>Custo/contato</th><th scope="col" className={th}>Lojas criadas</th><th scope="col" className={th}>Pagantes</th><th scope="col" className={th}>Custo/pagante</th><th scope="col" className={th}>Receita</th><th scope="col" className={th}>Retorno</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {p.linhas.map((l) => (
                  <tr key={l.chave}>
                    <th scope="row" className="min-w-[13rem] max-w-[18rem] break-words px-3 py-2 text-left font-semibold">{l.nome}</th>
                    <td className={td}>{l.gastoCents ? brl(l.gastoCents) : "—"}</td><td className={td}>{num(l.cliques)}</td><td className={td}>{num(l.visitas)}</td>
                    <td className={td}>{num(l.contatos)}{l.leadsMeta ? <span className="block text-xs text-muted-foreground">Meta diz {num(l.leadsMeta)}</span> : null}</td>
                    <td className={td}>{ou(l.custoContatoCents, brl)}</td><td className={td}>{num(l.contas)}</td><td className={`${td} font-semibold`}>{num(l.pagantes)}</td>
                    <td className={`${td} font-semibold`}>{ou(l.custoPaganteCents, brl)}</td><td className={td}>{l.receitaCents ? brl(l.receitaCents) : "—"}</td>
                    <td className={td}>{l.retorno === null ? "—" : `${l.retorno.toLocaleString("pt-BR")}×`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Investido e cliques: lidos da Meta (os últimos dias ainda mudam). Visitas, contatos, lojas criadas, pagantes e receita: contados pelo nosso sistema, pela etiqueta da campanha. Receita = primeira mensalidade dos pagantes e negócios fechados no Comercial. Retorno = receita ÷ investido. Quando a Meta conta mais contatos que nós, vale o nosso número.</p>
      </section>
    </>
  );
}
