import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getDb } from "@/db/client";
import { rodada, sumulaAtual } from "@/lib/domain/placar";
import { NOME_DEGRAU } from "@/lib/marcas/placar-seed";
import { EditorSumula } from "./editor";

export const dynamic = "force-dynamic";

/** Súmula do placar da goleada (D230): resultado de cada jogo (calculado) e o editor dos dados. */
export default async function PlacarMasterPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const s = await sumulaAtual(await getDb());
  const { jogos } = rodada(s);
  return (
    <>
      <PageHeader eyebrow="NextLevel E-commerce" title="Placar (súmula)" description="Você atualiza os dados dos concorrentes; o placar do site e dos painéis se recalcula. Jogo que deixar de ser vitória sai do ar sozinho." />
      <div className="ds-card mb-6 overflow-x-auto p-0">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">Resultado dos jogos</caption>
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-4">Jogo</th><th className="p-4">Plano</th><th className="p-4">Placar</th><th className="p-4">No site</th></tr></thead>
          <tbody>{jogos.map((j) => (
            <tr key={`${j.rivalKey}:${j.degrau}`} className="border-b border-border last:border-0">
              <th scope="row" className="p-4 text-left">NextLevel × {j.rival}</th><td className="p-4">{NOME_DEGRAU[j.degrau]}{j.rivalKey === "selecao" ? "" : ` (${j.plano})`}</td>
              <td className="p-4 tabular-nums font-semibold">{j.nextlevel} × {j.adversario}{j.goleada ? " · goleada" : ""}</td>
              <td className="p-4">{j.vitoria ? <span className="text-success">No ar</span> : <span className="text-danger">Fora do ar (não é vitória)</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <EditorSumula inicial={s} />
    </>
  );
}
