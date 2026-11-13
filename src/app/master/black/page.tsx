import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { getDb } from "@/db/client";
import { anualBlackCents, campanhaBlack, estadoBlack } from "@/lib/domain/campanha-black";
import { PRECOS_D220 } from "@/lib/finance/revisao-d220";
import { PRECOS_D228 } from "@/lib/finance/revisao-d228";
import { formatBRL } from "@/lib/money";
import { ContagemRegressiva } from "@/components/black/contagem-regressiva";
import { FormBlack } from "./form-black";
import "@/components/black/black.css";

export const dynamic = "force-dynamic";

const NOMES: Record<string, string> = { COMMERCE_START: "Start", COMMERCE_PRO: "Pro", COMMERCE_SCALE: "Scale" };
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Black NextLevel (D229): estado, contagem, preços na Black e depois dela, e o controle do Master. */
export default async function BlackPage() {
  await requireRole("NEXTLEVEL_MASTER");
  const c = await campanhaBlack(await getDb());
  const e = estadoBlack(c);
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Black Friday" description="Uma configuração para o site, os painéis e a cobrança. A contagem é a mesma em todo canto e, no fim, o preço novo entra sozinho." />
      <section className="bk-faixa bk-faixa--painel" aria-label="Situação da Black">
        <span className="bk-selo"><span aria-hidden className="bk-raio" />{e.ativa ? "NO AR" : "FORA DO AR"}<b>{e.prorrogada ? "PRORROGADA" : "BLACK 2026"}</b></span>
        <span className="bk-faixa-texto">De {quando(c.inicio)} até {quando(c.fim)}</span>
        {e.ativa ? <ContagemRegressiva fim={e.fim} restanteMs={e.restanteMs} tamanho="md" /> : null}
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="ds-card overflow-x-auto p-0">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Preços na Black e depois</caption>
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-4">Plano</th><th className="p-4">Black: mensal</th><th className="p-4">Black: anual (2 meses grátis)</th><th className="p-4">Depois: mensal</th><th className="p-4">Depois: anual</th></tr></thead>
            <tbody>{Object.keys(PRECOS_D220).map((k) => { const b = PRECOS_D220[k]!, d = PRECOS_D228[k]!; return (
              <tr key={k} className="border-b border-border last:border-0"><th className="p-4 text-left">{NOMES[k]}</th><td className="p-4 tabular-nums">{formatBRL(b.mensal)}</td><td className="p-4 tabular-nums">{formatBRL(anualBlackCents(b.anual))} <span className="text-xs text-muted-foreground">({formatBRL(Math.round(anualBlackCents(b.anual) / 12))}/mês)</span></td><td className="p-4 tabular-nums">{formatBRL(d.mensal)}</td><td className="p-4 tabular-nums">{formatBRL(d.anual)} <span className="text-xs text-muted-foreground">({formatBRL(Math.round(d.anual / 12))}/mês)</span></td></tr>
            ); })}</tbody>
          </table>
          <p className="border-t border-border p-4 text-xs text-muted-foreground">Quem assina na Black mantém o valor enquanto a assinatura estiver ativa (congelado na assinatura). O preço depois da Black é uma versão agendada do catálogo (D228).</p>
        </div>
        <FormBlack ativa={c.ativa} fim={c.fim} chamada={c.chamada} />
      </div>
    </>
  );
}
