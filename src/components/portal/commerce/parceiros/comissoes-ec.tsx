import Link from "next/link";
import { ArrowRight, CalendarClock, Coins, Gift, ShieldCheck, Target, Trophy } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bonusCampanhas } from "@/db/schema";
import { formatBRL } from "@/lib/money";
import { commercePlansView } from "@/lib/domain/commerce-plans";
import { getPartnerSettings } from "@/lib/domain/partners";
import { findRule } from "@/lib/domain/corporate-commissions";
import { garantirCampanhasPadrao, referenciaDoPonto } from "@/lib/domain/bonus";
import { DESCONTO_CPF_BPS, NIVEIS } from "@/lib/finance/niveis-regras";
import { BONUS_ANUAL_BPS, faixaDe } from "@/lib/finance/bonus-regras";
import { MISSOES } from "@/lib/finance/engajamento-regras";
import "@/components/imersiva/imersiva.css";

const pct = (bps: number) => `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const pts = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/**
 * Página pública "Comissões e bônus" (D272, pedido do dono): a regra inteira, clara, com os números lidos do sistema
 * (planos, níveis, garantia, saque e as campanhas de bônus ativas para parceiros online). Sem promessa de ganho.
 */
export async function ComissoesEc() {
  const db = await getDb();
  await garantirCampanhasPadrao(db);
  const [pv, ajustes, regra, ref, campanhas] = await Promise.all([
    commercePlansView(db), getPartnerSettings(db),
    findRule(db, { family: "COMMERCE_PLAN", productKey: "COMMERCE_PRO", cycle: "MONTHLY", partnerKind: "AFFILIATE" }),
    referenciaDoPonto(db),
    db.select().from(bonusCampanhas).where(and(eq(bonusCampanhas.publico, "ONLINE"), eq(bonusCampanhas.ativa, true))).orderBy(asc(bonusCampanhas.periodo)),
  ]);
  const garantia = regra?.holdDays ?? 30;
  const planos = pv.plans.filter((p) => !p.quote && p.monthlyCents);
  const start = planos[0];
  const semana = campanhas.find((c) => c.periodo === "SEMANA");
  const mes = campanhas.find((c) => c.periodo === "MES");
  const pontosDe = (mensalCents: number) => mensalCents / ref.brutoCents;
  // Exemplo: 4 lojas Start numa semana e 12 pontos no mês.
  const exSemana = semana ? faixaDe(semana.faixas, 400).atingida : null;
  const exMes = mes ? faixaDe(mes.faixas, 1200).atingida : null;

  return (
    <div className="im-tema-ecommerce">
      <section className="ec-cabecalho px-4 pb-16 pt-24 md:pb-24 md:pt-32" aria-labelledby="com-t">
        <div className="mx-auto max-w-6xl">
          <p className="ec-tag"><i aria-hidden />Programa de parceiros</p>
          <h1 id="com-t" className="ec-cabecalho-titulo mt-6 max-w-4xl">Comissões e bônus por produção, sem letra miúda.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">Você ganha uma parte de <b className="text-white">toda mensalidade</b> de cada lojista que trouxer, enquanto ele pagar. E, quando produz mais na semana e no mês, soma bônus. Abaixo, a regra inteira, com os números de hoje.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/parceiros/cadastro" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-neutral-950">Quero ser parceiro <ArrowRight className="size-4" aria-hidden /></Link><Link href="/parceiros" className="inline-flex min-h-12 items-center rounded-full border border-white/30 px-6 font-semibold text-white">Voltar ao programa</Link></div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-20" aria-labelledby="niveis-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">1. Comissão recorrente</p>
          <h2 id="niveis-t" className="im-h2 mt-3 max-w-3xl text-foreground">Uma parte de toda mensalidade, enquanto o lojista pagar.</h2>
          <p className="mt-3 max-w-3xl text-body">O percentual vale para a <b>sua carteira inteira</b> e sobe com o número de clientes ativos. Com CNPJ você é parceiro (criador, vendedor ou agência). Com CPF você entra no Programa de Indicações, com {pct(DESCONTO_CPF_BPS)} a menos em cada nível. Nos dois casos você saca por Pix, sem anexar nota fiscal.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Percentual da comissão por nível</caption>
              <thead className="bg-surface-muted"><tr><th scope="col" className="px-4 py-3">Nível</th><th scope="col" className="px-4 py-3">Quando</th><th scope="col" className="px-4 py-3">Com CNPJ</th><th scope="col" className="px-4 py-3">Com CPF</th></tr></thead>
              <tbody>{NIVEIS.map((n) => <tr key={n.tier} className="border-t border-border"><th scope="row" className="px-4 py-3 font-semibold">{n.nome}</th><td className="px-4 py-3">{n.minimo ? `${n.minimo}+ clientes ativos` : "desde o 1º cliente"}</td><td className="px-4 py-3 font-bold tabular-nums">{pct(n.bps)}</td><td className="px-4 py-3 font-bold tabular-nums">{pct(n.bps - DESCONTO_CPF_BPS)}</td></tr>)}</tbody>
            </table>
          </div>
          <h3 className="mt-10 text-lg font-bold text-foreground">Quanto isso dá por cliente, por mês</h3>
          <p className="mt-1 text-sm text-body">Estimativa sobre a mensalidade de hoje. O valor exato desconta a taxa de recebimento e os impostos do pagamento.</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Comissão estimada por plano e nível</caption>
              <thead className="bg-surface-muted"><tr><th scope="col" className="px-4 py-3">Plano (mensal)</th>{NIVEIS.map((n) => <th key={n.tier} scope="col" className="px-4 py-3">{n.nome} · CNPJ</th>)}<th scope="col" className="px-4 py-3">{NIVEIS[0]!.nome} · CPF</th></tr></thead>
              <tbody>{planos.map((p) => <tr key={p.key} className="border-t border-border"><th scope="row" className="px-4 py-3 font-semibold">{p.name.replace(/^Commerce /, "")} · {formatBRL(p.monthlyCents!)}</th>{NIVEIS.map((n) => <td key={n.tier} className="px-4 py-3 tabular-nums">{formatBRL(Math.round((p.monthlyCents! * n.bps) / 10_000))}</td>)}<td className="px-4 py-3 tabular-nums">{formatBRL(Math.round((p.monthlyCents! * (NIVEIS[0]!.bps - DESCONTO_CPF_BPS)) / 10_000))}</td></tr>)}</tbody>
            </table>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[[CalendarClock, "Seu link vale " + ajustes.attributionDays + " dias", `Quem clicar no seu link e assinar em até ${ajustes.attributionDays} dias é seu cliente.`], [ShieldCheck, `${garantia} dias de garantia`, `Cada comissão fica ${garantia} dias em garantia para cobrir estornos; depois, fica disponível.`], [Coins, `Saque a partir de ${formatBRL(ajustes.minPayoutCents)}`, "Por Pix, para o mesmo CPF ou CNPJ do cadastro, sem nota fiscal."]].map(([I, t, x]) => { const Icone = I as typeof Coins; return <li key={t as string} className="ec-cartao"><span className="ec-icone"><Icone className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold text-foreground">{t as string}</h3><p className="mt-2 text-sm text-body">{x as string}</p></li>; })}
          </ul>
        </div>
      </section>

      <section className="ec-cabecalho px-4 py-16 md:py-20" aria-labelledby="bonus-t">
        <div className="mx-auto max-w-6xl">
          <p className="ec-tag"><i aria-hidden />2. Bônus por produção</p>
          <h2 id="bonus-t" className="im-h2 mt-4 max-w-3xl text-white">Produziu mais na semana e no mês? Soma bônus.</h2>
          <p className="mt-3 max-w-3xl text-white/80">Além da comissão, as campanhas de bônus premiam quem traz lojas novas. Cada loja nova soma <b className="text-white">pontos</b> no 1º pagamento. Quem chega a uma faixa recebe o bônus dela, direto no saldo.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {campanhas.map((c) => (
              <article key={c.id} className="rounded-2xl border border-white/15 bg-white/5 p-5 text-white">
                <h3 className="flex items-center gap-2 text-lg font-bold"><Gift className="size-5 text-emerald-300" aria-hidden />{c.nome}</h3>
                <p className="text-sm text-white/70">{c.periodo === "SEMANA" ? "Toda semana, de segunda a domingo" : "Todo mês"}</p>
                <ol className="mt-4 grid gap-2">{c.faixas.map((f) => <li key={f.pontos} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2"><span><b className="tabular-nums">{f.pontos} pontos</b> no período</span><b className="tabular-nums text-emerald-300">{formatBRL(f.valorCents)}</b></li>)}</ol>
                <p className="mt-3 text-xs text-white/70">Vale a faixa mais alta que você atingir no período (as faixas não se somam).</p>
              </article>
            ))}
          </div>
          <h3 className="mt-10 text-lg font-bold text-white">Quantos pontos vale cada loja</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {planos.map((p) => <li key={p.key} className="rounded-2xl border border-white/15 bg-white/5 p-4 text-white"><b>{p.name.replace(/^Commerce /, "")}</b><span className="mt-1 block text-2xl font-bold tabular-nums">{pts(pontosDe(p.monthlyCents!))} ponto{pontosDe(p.monthlyCents!) >= 2 ? "s" : ""}</span><span className="text-xs text-white/70">no mensal · no anual, {pts((pontosDe(p.monthlyCents!) * BONUS_ANUAL_BPS) / 10_000)} por loja</span></li>)}
          </ul>
          <p className="mt-3 text-sm text-white/75">1 ponto = 1 mensalidade do {start?.name.replace(/^Commerce /, "") ?? "Start"} ({formatBRL(ref.brutoCents)} hoje). Os outros planos valem proporcionalmente ao valor pago. O anual vale 20% a mais, porque o lojista paga o ano adiantado. Se a venda teve desconto, os pontos diminuem na mesma proporção.</p>
          {exSemana || exMes ? (
            <div className="mt-8 rounded-2xl border border-emerald-300/40 bg-emerald-300/10 p-5 text-white">
              <h3 className="flex items-center gap-2 font-bold"><Trophy className="size-5 text-amber-300" aria-hidden />Exemplo</h3>
              <p className="mt-2 text-sm text-white/85">Quem traz <b>4 lojas {start?.name.replace(/^Commerce /, "") ?? "Start"} numa semana</b> soma 4 pontos{exSemana && semana ? <> e recebe <b>{formatBRL(exSemana.valorCents)}</b> do {semana.nome}</> : null}. Se chegar a <b>12 pontos no mês</b>{exMes && mes ? <>, recebe também <b>{formatBRL(exMes.valorCents)}</b> da {mes.nome}</> : null}. E continua com a comissão de toda mensalidade dessas lojas. É só um exemplo; não é promessa de ganho.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-20" aria-labelledby="regras-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">3. As regras do bônus</p>
          <h2 id="regras-t" className="im-h2 mt-3 max-w-3xl text-foreground">Claras, iguais para todos e conferidas pelo sistema.</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["Conta a loja nova", "Os pontos nascem no 1º pagamento de cada loja que você trouxe. As mensalidades seguintes já pagam a sua comissão recorrente e não somam pontos."],
              ["Só venda paga e mantida", `O bônus do período é apurado depois dos ${garantia} dias de garantia das vendas. Loja estornada ou cancelada na garantia, teste grátis e acesso de cortesia não contam.`],
              ["Sem venda para si mesmo", "Loja com o mesmo CPF ou CNPJ do parceiro não conta pontos."],
              ["Faixa mais alta do período", "Na semana e no mês, vale a faixa mais alta que você atingir. O bônus entra no seu saldo e segue para saque, como a comissão."],
              ["Campanhas com orçamento", "Cada campanha tem um orçamento por período. Se ele acabar, quem pontuou mais recebe primeiro. As campanhas e os valores podem mudar de um período para outro e aparecem sempre aqui e no seu painel."],
              ["Tudo no seu painel", "Pontos, faixa atual, quanto falta para a próxima, contagem regressiva e o que ainda está em garantia, em tempo real."],
            ].map(([t, x], i) => <li key={t} className="ec-cartao"><span className="font-mono text-xs font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-2 text-lg font-bold text-foreground">{t}</h3><p className="mt-2 text-sm text-body">{x}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="bg-surface-muted px-4 py-16 md:py-20" aria-labelledby="jogo-t">
        <div className="mx-auto max-w-6xl">
          <p className="im-eyebrow im-eyebrow--claro">4. Seu painel é um jogo</p>
          <h2 id="jogo-t" className="im-h2 mt-3 max-w-3xl text-foreground">Missões da semana, sequência, selos e ranking.</h2>
          <p className="mt-3 max-w-3xl text-body">Para manter o ritmo, o seu painel traz missões da semana, a sua sequência de semanas com venda, selos de conquista e o ranking dos parceiros. Missões e selos são reconhecimento: o dinheiro vem da comissão e do bônus por produção.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{MISSOES.ONLINE.map((m) => <li key={m.id} className="ec-cartao"><Target className="size-5 text-[var(--ds-primary)]" aria-hidden /><h3 className="mt-3 font-bold text-foreground">{m.titulo}</h3><p className="mt-1 text-sm text-body">{m.dica}</p></li>)}</ul>
          <div className="mt-10 flex flex-wrap gap-3"><Link href="/parceiros/cadastro" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 font-bold text-surface">Quero ser parceiro <ArrowRight className="size-4" aria-hidden /></Link><Link href="/parceiros/termos" className="inline-flex min-h-12 items-center text-sm font-semibold underline underline-offset-4">Termos do programa</Link></div>
        </div>
      </section>
    </div>
  );
}
