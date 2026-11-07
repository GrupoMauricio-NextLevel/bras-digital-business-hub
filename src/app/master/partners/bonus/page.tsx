import { ShieldCheck, Trophy } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { painelDeBonus } from "@/lib/domain/bonus";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { EditorDeCampanha } from "./editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bônus e metas" };

const pts = (c: number) => (c / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const NOME_PUBLICO = { ONLINE: "Parceiros online", RUA: "Executivos de rua" } as const;

/** Bônus gamificado (BG1, D271): campanhas por público e período, com teto de custo por loja e orçamento. */
export default async function BonusPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await painelDeBonus(await getDb(), session.actor);
  const ref = d.referencia;
  const total = d.campanhas.reduce((t, c) => t + c.pagoTotalCents, 0);
  return (
    <>
      <PageHeader eyebrow="Parceiros" title="Bônus e metas" description={`Bônus pago uma vez por loja nova, depois da garantia de ${d.garantiaDias} dias, só de venda paga e mantida. 1 ponto = 1 mensalidade do Start (${formatBRL(ref.brutoCents)} hoje); Pro e Scale valem proporcionalmente; anual vale 20% a mais.`} />

      <section className="ds-kpis mb-6" aria-label="Resumo">
        <MetricCard label="Bônus já pagos" value={formatBRL(total)} hint="desde o início das campanhas" />
        {(["ONLINE", "RUA"] as const).map((p) => (
          <MetricCard key={p} label={`Custo máximo por loja Start · ${NOME_PUBLICO[p]}`} value={formatBRL(d.teto[p].custoPorPontoCents)} hint={`${d.teto[p].percentual}% de uma mensalidade · teto ${p === "RUA" ? "75%" : "50%"}`} tone={d.teto[p].cabe ? "success" : "danger"} />
        ))}
        <MetricCard label="Em jogo agora" value={formatBRL(d.campanhas.reduce((t, c) => t + c.potencialAtualCents, 0))} hint="se as vendas do período passarem da garantia" />
      </section>

      <p className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-surface p-3 text-sm"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />Sua margem fica protegida por 4 travas: só a 1ª venda de cada loja, só depois da garantia, teto de custo por loja somando as campanhas e orçamento por período. Somando tudo, comissão e bônus ficam abaixo de 35% da receita do 1º ano de cada loja.</p>

      {(["RUA", "ONLINE"] as const).map((pub) => (
        <section key={pub} className="mb-8" aria-labelledby={`pub-${pub}`}>
          <h2 id={`pub-${pub}`} className="mb-3 text-lg font-semibold">{NOME_PUBLICO[pub]}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {d.campanhas.filter((c) => c.publico === pub).map((c) => (
              <article key={c.id} className="ds-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-semibold">{c.nome}</h3><p className="text-xs text-muted-foreground">{c.periodo === "SEMANA" ? "Toda semana (segunda a domingo)" : "Todo mês"} · agora: {c.periodoAtual.rotulo} · orçamento {formatBRL(c.orcamentoCents)} por período</p></div>
                  <Badge tone={c.ativa ? "success" : "outline"}>{c.ativa ? "Ativa" : "Pausada"}</Badge>
                </div>
                <ol className="mt-3 flex flex-wrap gap-2" aria-label="Faixas">
                  {c.faixas.map((f) => <li key={f.pontos} className="rounded-xl border border-border px-3 py-2 text-sm"><b className="tabular-nums">{f.pontos} pts</b> → <b className="tabular-nums">{formatBRL(f.valorCents)}</b></li>)}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground">Custo máximo por loja Start nesta campanha: {formatBRL(c.custoPorPontoCents)} ({Math.round((c.custoPorPontoCents / ref.refCents) * 100)}% de uma mensalidade) · pago até hoje {formatBRL(c.pagoTotalCents)}{c.semOrcamento ? ` · ${c.semOrcamento} sem orçamento` : ""}</p>
                <div className="mt-4 border-t border-border pt-3">
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Trophy className="size-4" aria-hidden />Quem está no jogo ({c.periodoAtual.rotulo})</h4>
                  {c.participantes.length ? (
                    <ol className="grid gap-1.5 text-sm">
                      {c.participantes.map((p, i) => (
                        <li key={p.partnerId} className="flex flex-wrap items-center justify-between gap-2">
                          <span><span className="font-mono text-xs text-muted-foreground">{i + 1}º</span> {p.nome} · <b className="tabular-nums">{pts(p.pontos)} pts</b>{p.emGarantia ? <span className="text-xs text-muted-foreground"> ({pts(p.emGarantia)} em garantia)</span> : null}</span>
                          <span className="text-xs">{p.faixa ? <Badge tone="success">{formatBRL(p.faixa.valorCents)}</Badge> : null} {p.proxima ? <span className="text-muted-foreground">falta {pts(p.falta)} para {formatBRL(p.proxima.valorCents)}</span> : <span className="text-success">faixa máxima</span>}</span>
                        </li>
                      ))}
                    </ol>
                  ) : <EmptyState compact title="Ninguém pontuou neste período ainda" description="As vendas aparecem aqui assim que o 1º pagamento da loja é confirmado." />}
                </div>
                <div className="mt-4 border-t border-border pt-3"><EditorDeCampanha c={{ id: c.id, nome: c.nome, faixas: c.faixas, orcamentoCents: c.orcamentoCents, ativa: c.ativa }} refCents={ref.refCents} /></div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
