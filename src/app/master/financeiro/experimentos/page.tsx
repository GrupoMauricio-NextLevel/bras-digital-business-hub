import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { listExperiments, PIECE_LABEL, readExperiment } from "@/lib/domain/experimentos";
import { EncerrarExperimento, IniciarExperimento, NovoExperimento } from "@/components/descoberta/experimentos-forms";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";
const TONE = { RASCUNHO: "neutral", RODANDO: "info", ENCERRADO: "success" } as const;
const METRIC = { ATIVACAO_30: "1ª venda em 30 dias", PAGANTE_30: "pagou em 30 dias" } as const;

/** Experimentos (D136, fase P6): grupo de controle × grupo novo, leitura com a incerteza explicada e decisão do dono. */
export default async function ExperimentosPage() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const list = await listExperiments(db, s.actor);
  const reads = await Promise.all(list.map((e) => readExperiment(db, s.actor, e.id)));
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Experimentos" description="Cada peça nova roda primeiro com uma parte dos clientes novos. Combine antes a métrica, o tamanho e a data; leia com calma; nada vira padrão sem a sua decisão escrita." />
      <FinNav active="experimentos" />
      <section aria-labelledby="h-novo" className="ds-card mb-6 p-4">
        <h2 id="h-novo" className="mb-3 text-lg font-bold">Novo experimento</h2>
        <NovoExperimento />
        <p className="mt-3 text-xs text-muted-foreground">O sorteio é fixo por loja: a mesma loja cai sempre no mesmo grupo. Sem experimento rodando, a peça vale para todos quando ligada.</p>
      </section>
      {reads.length ? reads.map(({ experiment: e, groups, primary, guard, ready }) => (
        <section key={e.id} aria-labelledby={`h-${e.id}`} className="ds-card mb-6 p-4">
          <div className="flex flex-wrap items-center gap-2"><h2 id={`h-${e.id}`} className="text-lg font-bold">{e.name}</h2><Badge tone={TONE[e.status]}>{e.status === "RASCUNHO" ? "Rascunho" : e.status === "RODANDO" ? "Rodando" : "Encerrado"}</Badge></div>
          <p className="mb-3 text-sm text-muted-foreground">{PIECE_LABEL[e.piece]} · {e.treatmentPct}% no grupo novo · principal: {METRIC[e.primaryMetric]} · guarda: {e.guardMetric === "RECEITA_POR_CLIENTE" ? "receita por cliente" : "saída em 30 dias"} · mínimo {e.minPerGroup} por grupo · leitura em {formatDate(e.readAt)}</p>
          {e.status === "RASCUNHO" ? <IniciarExperimento id={e.id} /> : null}
          {groups && primary && guard ? (
            <>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <caption className="sr-only">Resultado por grupo</caption>
                <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Grupo</th><th scope="col" className="p-2 text-right">Lojas com 30 dias</th><th scope="col" className="p-2 text-right">{METRIC[e.primaryMetric]}</th><th scope="col" className="p-2 text-right">Receita por cliente</th></tr></thead>
                <tbody>
                  <tr className="border-b border-border"><th scope="row" className="p-2 text-left font-medium">Controle (como hoje)</th><td className="p-2 text-right tabular-nums">{groups.control.n}</td><td className="p-2 text-right tabular-nums">{primary.controlPct}%</td><td className="p-2 text-right tabular-nums">{formatBRL(guard.controlCents)}</td></tr>
                  <tr><th scope="row" className="p-2 text-left font-medium">Grupo novo</th><td className="p-2 text-right tabular-nums">{groups.treatment.n}</td><td className="p-2 text-right tabular-nums">{primary.treatmentPct}%</td><td className="p-2 text-right tabular-nums">{formatBRL(guard.treatmentCents)}</td></tr>
                </tbody>
              </table></div>
              <p className="mt-2 text-sm"><b>Leitura:</b> {primary.verdict} {ready ? "Já passou da data e do tamanho combinados." : "Ainda antes da data ou do tamanho combinados: não decida por estes números."}</p>
            </>
          ) : null}
          {e.status === "RODANDO" ? <EncerrarExperimento id={e.id} /> : null}
          {e.status === "ENCERRADO" ? <p className="mt-2 text-sm"><b>Leitura registrada:</b> {e.reading} <b>Decisão:</b> {e.decision}</p> : null}
        </section>
      )) : <p className="text-sm text-muted-foreground">Nenhum experimento ainda.</p>}
    </>
  );
}
