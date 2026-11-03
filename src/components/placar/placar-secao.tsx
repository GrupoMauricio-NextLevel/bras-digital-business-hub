import { getDb } from "@/db/client";
import { rodada, sumulaAtual } from "@/lib/domain/placar";
import { PlacarGoleada } from "./placar-goleada";
import "./placar.css";

/** Seção do placar (D230): calcula a rodada no servidor e entrega só as vitórias para a peça. */
export async function PlacarSecao({ cta, titulo = true, id = "placar" }: { cta: string; titulo?: boolean; id?: string }) {
  const s = await sumulaAtual(await getDb());
  const { noAr } = rodada(s);
  if (!noAr.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="pl-secao scroll-mt-16 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        {titulo ? <>
          <p className="im-eyebrow" style={{ color: "#8ff5c7" }}>O Clássico do E-commerce</p>
          <h2 id={`${id}-t`} className="im-h2 mt-3 max-w-3xl text-white">NextLevel em campo. Os concorrentes no placar.</h2>
          <p className="mt-4 max-w-2xl text-lg text-white/75">Escolha o plano e o adversário. Cada vantagem nossa é um gol; o placar se atualiza sozinho quando a súmula muda.</p>
        </> : <h2 id={`${id}-t`} className="sr-only">Placar da NextLevel contra os concorrentes</h2>}
        <div className="mt-10"><PlacarGoleada jogos={noAr} atualizadoEm={s.atualizadoEm} cta={cta} /></div>
      </div>
    </section>
  );
}
