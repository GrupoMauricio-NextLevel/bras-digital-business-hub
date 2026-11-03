import Link from "next/link";
import { getDb } from "@/db/client";
import { anualBlackCents, blackAgora } from "@/lib/domain/campanha-black";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { dueloPrimeiroAno } from "@/lib/marcas/comparativo-ecommerce";
import { formatBRL } from "@/lib/money";
import { ContagemRegressiva } from "./contagem-regressiva";
import "./black.css";

/**
 * "Black deles × Black NextLevel" (D232): custo do 1º ano no plano de entrada para quem vende R$ 10 mil por mês. Só durante
 * a Black. Barras proporcionais; a NextLevel em neon. Texto sem "mais barato" (D221): vantagem e custo total.
 */
const FAT = 1_000_000;
const reais = (c: number) => formatBRL(c).replace(",00", "");

export async function DueloBlack({ cta }: { cta: string }) {
  const db = await getDb();
  const [b, pv] = await Promise.all([blackAgora(db), commercePlansView(db)]);
  const start = pv.plans.find((p) => p.key === "COMMERCE_START");
  if (!b.ativa || !start?.annualCents) return null;
  const d = dueloPrimeiroAno(anualBlackCents(start.annualCents), FAT);
  const maior = Math.max(...d.outras.map((o) => o.totalCents));
  const linhas = [d.nextlevel, ...d.outras];
  return (
    <section aria-labelledby="duelo-t" className="bk-duelo px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="bk-selo"><span aria-hidden className="bk-raio" />BLACK DELES <b>× BLACK NEXTLEVEL</b></p>
            <h2 id="duelo-t" className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">No 1º ano, a Black NextLevel deixa <span className="bk-neon">{reais(d.vantagemCents)}</span> a mais no seu bolso.</h2>
            <p className="mt-4 max-w-2xl text-[#b9c6e4]">Custo do 1º ano no plano de entrada para quem vende {reais(FAT)} por mês: mensalidades + taxa da plataforma usando o Mercado Pago.</p>
          </div>
          <ContagemRegressiva fim={b.fim} restanteMs={b.restanteMs} tamanho="md" rotulo="A Black acaba em" />
        </div>
        <ul className="mt-10 grid gap-3" aria-label="Custo do 1º ano por plataforma">
          {linhas.map((l) => {
            const nos = l.key === "nextlevel";
            return (
              <li key={l.key} className={`bk-duelo-linha${nos ? " bk-duelo-linha--nos" : ""}`}>
                <span className="bk-duelo-nome"><b>{l.nome}</b><span>{l.plano}</span></span>
                <span className="bk-duelo-trilho" aria-hidden><span className="bk-duelo-barra" style={{ width: `${Math.max(4, (l.totalCents / maior) * 100)}%` }} /></span>
                <span className="bk-duelo-valor"><b>{reais(l.totalCents)}</b><span>{nos ? "taxa zero da plataforma" : `${reais(l.mensalidadesCents)} + ${reais(l.taxaCents)} de taxa`}</span></span>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={cta} className="bk-cta bk-cta--lg">Garantir a Black NextLevel</Link>
          <p className="max-w-xl text-xs leading-relaxed text-[#8193b8]">NextLevel: Start anual na Black (2 meses grátis), preço travado enquanto for cliente. Concorrentes: melhor preço anual que divulgam hoje (Loja Integrada: valor trimestral). As Blacks de 2026 deles ainda não foram anunciadas; quando saírem, atualizamos aqui. As taxas do Mercado Pago existem em todas e ficam fora da conta.</p>
        </div>
      </div>
    </section>
  );
}
