import Link from "next/link";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { BRAS_PANELS, type BrasPanelKey } from "@/lib/bras/panels";

export type ShellRegion = { title: string; description: string; dependsOn: string };

/**
 * Casca comum: cabeçalho, aviso de prévia e regiões vazias com o motivo de estarem vazias.
 * Nada aqui busca ou mostra preço, estoque, importadora, vídeo ou dado pessoal.
 */
export function BrasShell({ panel, regions }: { panel: BrasPanelKey; regions: ShellRegion[] }) {
  const p = BRAS_PANELS.find((x) => x.key === panel)!;
  return (
    <>
      <PageHeader backHref="/master/bras" eyebrow="Brás Digital · prévia da casca" title={p.name} description={`Para: ${p.audience}. Estrutura sem dados: as funções entram quando as decisões pendentes forem tomadas.`} />
      <p role="note" className="mb-6 rounded-lg border border-warning/40 bg-warning-soft/40 p-4 text-sm">
        <strong>Depende de decisão do dono:</strong> {p.pending}
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {regions.map((r) => (
          <section key={r.title} aria-labelledby={`r-${panel}-${r.title}`} className="ds-card p-4">
            <h2 id={`r-${panel}-${r.title}`} className="text-base font-semibold">{r.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
            <EmptyState compact icon={Construction} title="Ainda sem dados" description={`Depende de: ${r.dependsOn}`} className="mt-3" />
          </section>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">Outras cascas: {BRAS_PANELS.filter((x) => x.key !== panel).map((x, i) => <span key={x.key}>{i ? " · " : ""}<Link className="font-semibold text-link underline" href={x.path}>{x.name}</Link></span>)}</p>
    </>
  );
}
