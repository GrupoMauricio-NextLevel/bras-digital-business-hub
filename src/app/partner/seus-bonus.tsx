import { Flame, Gift, ShieldCheck, Timer, Trophy } from "lucide-react";
import { formatBRL } from "@/lib/money";
import type { BonusDoParceiro } from "@/lib/domain/bonus";

const pts = (c: number) => (c / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
function faltaTempo(fimIso: string, agora: Date) {
  const ms = new Date(fimIso).getTime() - agora.getTime();
  const d = Math.floor(ms / 86_400_000), h = Math.floor((ms % 86_400_000) / 3_600_000);
  return ms <= 0 ? "encerrado" : d >= 1 ? `${d} dia${d === 1 ? "" : "s"} e ${h} h` : `${h} h`;
}

/**
 * "Seus bônus" (BG1, D271): progresso de cada campanha ativa do público do parceiro, com a próxima faixa, o "quase lá",
 * a contagem regressiva e o que ainda está em garantia. Sem promessa de ganho: a regra aparece junto.
 */
export function SeusBonus({ b, agora = new Date() }: { b: BonusDoParceiro; agora?: Date }) {
  if (!b.cards.length) return null;
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#0b1020,#1c1640)] p-5 text-white" aria-labelledby="bonus-t" data-seus-bonus>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">{b.publico === "RUA" ? "Executivo NextLevel" : "Parceiro NextLevel"} · bônus ativos</p>
          <h2 id="bonus-t" className="mt-1 flex items-center gap-2 text-xl font-bold"><Gift className="size-5 text-emerald-300" aria-hidden />Seus bônus</h2>
        </div>
        {b.totalRecebidoCents ? <p className="rounded-full bg-white/10 px-3 py-1 text-sm"><Trophy className="mr-1 inline size-4 text-amber-300" aria-hidden />Já recebeu <b className="tabular-nums">{formatBRL(b.totalRecebidoCents)}</b> em bônus</p> : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {b.cards.map((c) => {
          const topo = c.faixas.at(-1)!;
          const pct = Math.min(100, Math.round((c.pontos / (topo.pontos * 100)) * 100));
          const quase = !!c.proxima && c.faltaCent <= Math.max(100, c.proxima.pontos * 20);
          return (
            <article key={c.id} className={`rounded-xl border p-4 ${quase ? "border-amber-300/70 bg-amber-300/10" : "border-white/15 bg-white/5"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{c.nome}</h3>
                <span className="inline-flex items-center gap-1 text-xs text-white/75"><Timer className="size-3.5" aria-hidden />termina em {faltaTempo(c.terminaEm, agora)}</span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">{pts(c.pontos)} <span className="text-base font-medium text-white/70">ponto{c.pontos === 100 ? "" : "s"}</span></p>
              <div className="relative mt-3 h-3 rounded-full bg-white/15" role="progressbar" aria-label={`Progresso em ${c.nome}`} aria-valuemin={0} aria-valuemax={topo.pontos} aria-valuenow={Number(pts(c.pontos).replace(",", "."))}>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${pct}%` }} />
                {c.faixas.map((f) => <span key={f.pontos} aria-hidden className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1c1640] bg-white" style={{ left: `${(f.pontos / topo.pontos) * 100}%` }} />)}
              </div>
              <ol className="mt-3 flex flex-wrap gap-1.5 text-xs" aria-label="Faixas">
                {c.faixas.map((f) => <li key={f.pontos} className={`rounded-full px-2 py-0.5 tabular-nums ${c.pontos >= f.pontos * 100 ? "bg-emerald-400 font-semibold text-emerald-950" : "bg-white/10"}`}>{f.pontos} pts · {formatBRL(f.valorCents)}</li>)}
              </ol>
              <p className="mt-3 text-sm" aria-live="polite">
                {c.proxima ? <>{quase ? <Flame className="mr-1 inline size-4 text-amber-300" aria-hidden /> : null}<b>Falta {pts(c.faltaCent)} ponto{c.faltaCent === 100 ? "" : "s"}</b> para {formatBRL(c.proxima.valorCents)}{c.atingida ? <> · você já garantiu a faixa de {formatBRL(c.atingida.valorCents)}</> : null}.</> : <b className="text-emerald-300">Faixa máxima: {formatBRL(c.atingida!.valorCents)}!</b>}
              </p>
              {c.emGarantia ? <p className="mt-1 flex items-center gap-1 text-xs text-white/70"><ShieldCheck className="size-3.5" aria-hidden />{pts(c.emGarantia)} ponto{c.emGarantia === 100 ? "" : "s"} em garantia: contam se a loja seguir paga por 30 dias.</p> : null}
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-white/70">Como funciona: cada loja nova que você traz soma pontos no 1º pagamento (Start = 1 ponto; Pro e Scale valem mais; anual vale 20% a mais). Ao fim do período, depois da garantia das vendas, você recebe a faixa mais alta que atingiu, direto no seu saldo. Campanhas e valores podem mudar a cada período.</p>
    </section>
  );
}
