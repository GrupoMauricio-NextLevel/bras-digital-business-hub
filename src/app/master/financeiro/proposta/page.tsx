import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { PROPOSAL_BRANDS, proposalReport } from "@/lib/domain/precos/proposta";
import { PropostaForm } from "@/components/descoberta/proposta-form";
import { clubTierComparison } from "@/lib/domain/club/assinatura";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

const SC_LABEL = { PESSIMISTA: "Pessimista", BASE: "Base", OTIMISTA: "Otimista" } as const;
const pctTxt = (bps: number) => `${(bps / 100).toLocaleString("pt-BR")}%`;
const brl0 = (c: number) => formatBRL(Math.round(c / 100) * 100).replace(/,00$/, "");

/**
 * Proposta de preço em rascunho (D125, fase P4): a escada sugerida, os guarda-corpos (o grátis cobre o custo, nenhum
 * plano dá prejuízo, quando cada plano se paga) e 12 meses em 3 cenários contra o modelo de hoje. Não muda preço nenhum.
 */
export default async function PropostaPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [r, club] = await Promise.all([proposalReport(db, s.actor), clubTierComparison(db, s.actor)]);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Proposta de preço" description="“Grátis para começar, paga quando cresce”: a escada sugerida, a conta de cada plano e 12 meses em três cenários, comparados com o modelo de hoje. É rascunho: nenhum preço muda por aqui." />
      <FinNav active="proposta" />
      <p role="note" className="mb-6 rounded-lg bg-warning-soft px-4 py-3 text-sm">
        <Badge tone="warning">{r.proposal.status === "APROVADA" ? "Aprovada" : "Rascunho"}</Badge>{" "}
        Os cenários são hipóteses até a Descoberta trazer os números reais. Custos usados (tabela do SuperDrop): infraestrutura {formatBRL(r.costs.infraPerStoreCents)} por cliente/mês, cobrança {pctTxt(r.costs.collectionFeeBps)}, margem dos serviços {pctTxt(r.costs.serviceMarginBps)} (o ponto do Club custa menos que o valor de face).
      </p>
      {r.brands.map((b) => (
        <section key={b.brand} id={b.brand.toLowerCase()} aria-labelledby={`h-${b.brand}`} className="ds-card mb-6 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2"><h2 id={`h-${b.brand}`} className="text-lg font-bold">{b.label}</h2><Badge tone={b.checks.ok ? "success" : "danger"}>{b.checks.ok ? "Passa nos guarda-corpos (cenário base)" : "Não passa nos guarda-corpos"}</Badge></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Hoje × proposta</h3>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <caption className="sr-only">Escada de planos de hoje e proposta em {b.label}</caption>
                <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Modelo</th><th scope="col" className="p-2">Plano</th><th scope="col" className="p-2 text-right">Mensal</th><th scope="col" className="p-2 text-right">Taxa</th></tr></thead>
                <tbody>
                  {b.current.ladder.map((p, i) => <tr key={`c-${p.key}`} className="border-b border-border"><td className="p-2 text-muted-foreground">{i === 0 ? "Hoje" : ""}</td><th scope="row" className="p-2 text-left font-medium">{p.name}</th><td className="p-2 text-right tabular-nums">{formatBRL(p.monthlyCents)}</td><td className="p-2 text-right tabular-nums">{pctTxt(p.feeBps)}</td></tr>)}
                  {b.proposed.ladder.map((p, i) => <tr key={`p-${p.key}`} className="border-b border-border last:border-0"><td className="p-2 text-muted-foreground">{i === 0 ? "Proposta" : ""}</td><th scope="row" className="p-2 text-left font-medium">{p.name}</th><td className="p-2 text-right tabular-nums">{p.monthlyCents ? formatBRL(p.monthlyCents) : "Grátis"}</td><td className="p-2 text-right tabular-nums">{pctTxt(p.feeBps)}</td></tr>)}
                </tbody>
              </table></div>
              <p className="mt-2 text-xs text-muted-foreground">Hoje: {b.current.annual.paidMonths < 12 ? `anual paga ${b.current.annual.paidMonths} de 12 meses` : "sem anual"}, sem plano grátis (quem não assina sai). Proposta: anual paga {r.proposal.annual.paidMonths} de {r.proposal.annual.getMonths} no Pix, {pctTxt(r.proposal.cashbackBps)} da mensalidade em pontos do Club, teste reverso de {r.proposal.reverseTrialDays} dias.</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">A conta de cada plano (cenário base, por cliente/mês)</h3>
              <ul className="space-y-2 text-sm">
                {b.checks.free && <li className="rounded-lg border border-border p-3"><b>{b.proposed.ladder[0]!.name} (grátis):</b> rende {formatBRL(b.checks.free.revenueCents)} e custa {formatBRL(b.checks.free.costCents)} em média, contando quem ainda não vende. <Badge tone={b.checks.free.ok ? "success" : "danger"}>{b.checks.free.ok ? "cobre o custo" : "não cobre o custo"}</Badge></li>}
                {b.checks.plans.map((p) => (
                  <li key={p.key} className="rounded-lg border border-border p-3">
                    <b>{p.name}:</b> rende {formatBRL(p.chargeCents)}, custa {formatBRL(p.costCents)} · margem {formatBRL(p.marginCents)} <Badge tone={p.ok ? "success" : "danger"}>{p.ok ? "sem prejuízo" : "dá prejuízo"}</Badge>
                    {p.breakEvenGmvCents !== null && <span className="mt-1 block text-muted-foreground">Sai mais barato que o grátis para quem vende a partir de <b className="text-foreground">{brl0(p.breakEvenGmvCents)}</b> por mês (é o que o painel vai mostrar ao cliente).</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <h3 className="mb-2 text-sm font-semibold">12 meses: hoje × proposta</h3>
              <p className="mb-2 text-xs text-muted-foreground">Resultado = receita menos infraestrutura, cobrança e o custo do cashback. A última coluna repete a proposta supondo que a mesma porcentagem de hoje assine: se ela também ganha de hoje, o grátis com taxa se paga sozinho, mesmo sem a conversão subir.</p>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <caption className="sr-only">Simulação de 12 meses em {b.label}</caption>
                <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Cenário</th><th scope="col" className="p-2 text-right">Receita em 12 meses (hoje)</th><th scope="col" className="p-2 text-right">Receita em 12 meses (proposta)</th><th scope="col" className="p-2 text-right">Resultado em 12 meses (hoje)</th><th scope="col" className="p-2 text-right">Resultado em 12 meses (proposta)</th><th scope="col" className="p-2 text-right">Proposta com a conversão de hoje</th><th scope="col" className="p-2 text-right">Clientes no mês 12 (proposta)</th></tr></thead>
                <tbody>{b.scenarios.map((x) => (
                  <tr key={x.key} className="border-b border-border last:border-0">
                    <th scope="row" className="p-2 text-left font-medium">{SC_LABEL[x.key]}</th>
                    <td className="p-2 text-right tabular-nums">{brl0(x.current.revenueCents)}</td>
                    <td className="p-2 text-right tabular-nums font-semibold">{brl0(x.proposed.revenueCents)}</td>
                    <td className="p-2 text-right tabular-nums">{brl0(x.current.netCents)}</td>
                    <td className="p-2 text-right tabular-nums font-semibold">{brl0(x.proposed.netCents)}</td>
                    <td className="p-2 text-right tabular-nums">{brl0(x.proposedSameConversion.netCents)}</td>
                    <td className="p-2 text-right tabular-nums">{x.proposed.months.at(-1)!.paidStores} pagantes · {x.proposed.months.at(-1)!.freeStores} no grátis</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        </section>
      ))}
      <section aria-labelledby="h-club" className="ds-card mb-6 p-4">
        <div className="mb-1 flex flex-wrap items-center gap-2"><h2 id="h-club" className="text-lg font-bold">O Club como assinatura do ecossistema</h2><Badge tone="warning">Rascunho</Badge></div>
        <p className="mb-4 text-sm text-muted-foreground">Club+ e Club Total estão no catálogo em rascunho (Financeiro → Catálogo e preços). Nada é cobrado nem aparece para o cliente até a sua aprovação.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border p-3 text-sm"><b>Club (grátis)</b><p className="text-muted-foreground">Pontos normais em todas as marcas.</p></div>
          {club.tiers.map((t) => (
            <div key={t.key} className="rounded-lg border border-border p-3 text-sm">
              <b>{t.name}</b> <span className="tabular-nums">{t.monthlyCents === null ? "sem preço" : `${formatBRL(t.monthlyCents)}/mês`}</span>{t.annualCents ? <span className="text-muted-foreground"> · anual {formatBRL(t.annualCents)} no Pix</span> : null}
              <p className="text-muted-foreground">{t.key === "CLUB_PLUS" ? `Pontos ×${club.rules.PLUS.pointsMultiplierPct / 100}, ${pctTxt(club.rules.PLUS.planDiscountBps)} de desconto nos planos.` : `Pontos ×${club.rules.TOTAL.pointsMultiplierPct / 100}${club.rules.TOTAL.unlocksEntryPlans ? ", plano de entrada de todas as marcas liberado" : ""}; a taxa sobre a venda continua.`}</p>
            </div>
          ))}
        </div>
        <h3 className="mb-2 mt-4 text-sm font-semibold">Quem usa o plano de entrada de todas as marcas</h3>
        <ul className="text-sm">{club.entry.map((e) => <li key={e.brand} className="flex justify-between gap-2 border-b border-border py-1"><span>{e.brand}: {e.plan}</span><span className="tabular-nums">{formatBRL(e.cents)}</span></li>)}</ul>
        <p className="mt-2 text-sm">Separado: <b>{formatBRL(club.separateCents)}/mês</b>{club.savingsWithTotalCents !== null ? <> · com o Club Total: <b>{club.savingsWithTotalCents >= 0 ? `${formatBRL(club.savingsWithTotalCents)} a menos por mês` : `${formatBRL(-club.savingsWithTotalCents)} a mais por mês`}</b></> : null}.</p>
      </section>
      <section aria-labelledby="h-edit" className="ds-card mb-6 p-4">
        <h2 id="h-edit" className="mb-1 text-lg font-bold">Ajustar o rascunho</h2>
        <p className="mb-4 text-sm text-muted-foreground">Mude valores e cenários e grave: a conta acima é refeita. Nada vai para cliente: ligar as peças é a próxima fase, com a sua aprovação.</p>
        <PropostaForm value={r.proposal} brands={PROPOSAL_BRANDS} />
      </section>
    </>
  );
}
