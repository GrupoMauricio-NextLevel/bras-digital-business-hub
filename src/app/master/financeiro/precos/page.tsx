import Link from "next/link";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { groupPriceTable, type GroupPriceRow } from "@/lib/domain/precos/tabela-grupo";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<GroupPriceRow["kind"], string> = { MENSAL: "Mensal", ANUAL: "Anual", SETUP: "Setup", AVULSO: "Avulso", TAXA: "Taxa", TESTE: "Entrada", DESCONTO: "Desconto", COMISSAO: "Comissão", PONTOS: "Pontos", SOB_CONSULTA: "Sob consulta" };
const STATUS_TONE = { VALENDO: "success", RASCUNHO: "warning", DESLIGADO: "neutral" } as const;
const STATUS_LABEL = { VALENDO: "Valendo", RASCUNHO: "Rascunho", DESLIGADO: "Desligado" } as const;

/**
 * Tabela de preços do grupo (D123): tudo o que vale hoje em todas as marcas, numa tela só, com a origem de cada valor
 * e o atalho para editar. Só leitura: os valores continuam sendo editados nas telas de origem.
 */
export default async function PrecosDoGrupo() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const { rows, divergences } = await groupPriceTable(await getDb(), s.actor);
  const brands = [...new Set(rows.map((r) => r.brand))];
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Preços do grupo" description="O que vale hoje em cada marca: mensalidades, taxas, testes, descontos, comissões e pontos. Cada linha mostra de onde vem e onde se edita." />
      <FinNav active="precos" />
      <section aria-labelledby="pg-div" className="ds-card mb-6 p-4">
        <h2 id="pg-div" className="mb-1 text-base font-semibold">O que impede uma regra única do grupo ({divergences.length})</h2>
        <p className="mb-3 text-sm text-muted-foreground">Divergências entre as fontes de preço. Cada uma tem a sugestão aprovada no prompt de público e preço.</p>
        <ul className="space-y-2 text-sm">{divergences.map((d) => <li key={d.topic} className="rounded-lg border border-border p-3"><b>{d.topic}:</b> {d.detail}<span className="mt-1 block text-muted-foreground">Caminho: {d.suggestion}</span></li>)}</ul>
      </section>
      <nav aria-label="Marcas" className="mb-4 flex flex-wrap gap-2 text-sm">{brands.map((b) => <a key={b} href={`#m-${b.replace(/\W+/g, "-")}`} className="ds-pill ds-pill--outline">{b}</a>)}</nav>
      {brands.map((b) => {
        const list = rows.filter((r) => r.brand === b);
        return (
          <section key={b} id={`m-${b.replace(/\W+/g, "-")}`} aria-labelledby={`h-${b.replace(/\W+/g, "-")}`} className="ds-card mb-6 p-4">
            <h2 id={`h-${b.replace(/\W+/g, "-")}`} className="mb-3 text-base font-semibold">{b} <span className="font-normal text-muted-foreground">({list.length})</span></h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <caption className="sr-only">Preços de {b}</caption>
              <thead><tr className="border-b border-border text-left"><th scope="col" className="p-2">Item</th><th scope="col" className="p-2">Tipo</th><th scope="col" className="p-2 text-right">Valor</th><th scope="col" className="p-2">Situação</th><th scope="col" className="p-2">Origem</th></tr></thead>
              <tbody>{list.map((r, i) => (
                <tr key={`${r.source}-${r.item}-${i}`} className="border-b border-border last:border-0">
                  <th scope="row" className="p-2 text-left font-medium">{r.item}</th>
                  <td className="p-2 text-muted-foreground">{KIND_LABEL[r.kind]}</td>
                  <td className="p-2 text-right font-semibold tabular-nums">{r.value}</td>
                  <td className="p-2"><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                  <td className="p-2"><Link href={r.editHref} className="font-mono text-xs text-link underline">{r.source}</Link></td>
                </tr>
              ))}</tbody>
            </table></div>
          </section>
        );
      })}
    </>
  );
}
