import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { BRAS_PANELS } from "@/lib/bras/panels";
import { requireBrasPanelPreview } from "./guard";

export const dynamic = "force-dynamic";

export default async function BrasPrevia() {
  await requireBrasPanelPreview();
  return (
    <>
      <PageHeader eyebrow="Brás Digital · Fase 0" title="Cascas dos painéis" description="Prévia visível só ao Master. Os endereços e quem acessa cada área serão definidos pelas decisões pendentes; nada aqui é operação real." />
      <ul className="grid gap-4 md:grid-cols-3">
        {BRAS_PANELS.map((p) => (
          <li key={p.key} className="ds-card p-5">
            <h2 className="text-lg font-semibold"><Link href={p.path} className="text-link underline">{p.name}</Link></h2>
            <p className="mt-1 text-sm">{p.audience}</p>
            <p className="mt-2 text-xs text-muted-foreground">Pendente: {p.pending}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
