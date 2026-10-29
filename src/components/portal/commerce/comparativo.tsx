import Link from "next/link";
import { ArrowRight, Banknote, Check, Infinity as Sem, Percent, UsersRound, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { CONCORRENTES, COLETADO_EM, custosPorFaixa, type Plataforma } from "@/lib/marcas/comparativo-ecommerce";

type NL = Pick<Plataforma, "moeda" | "planos">;
const pct = (bps: number | null) => (bps === null ? "não divulga" : `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const data = new Date(`${COLETADO_EM}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** Por que a NextLevel (D219): quatro motivos objetivos, cada um verificável no sistema e nos planos. */
export function PorQueNextLevel({ nl }: { nl: NL }) {
  const taxas = nl.planos.map((p) => p.taxaBps!).sort((a, b) => b - a);
  const MOTIVOS = [
    { icon: Percent, titulo: `A menor taxa sobre as vendas`, texto: `${taxas.map(pct).join(", ")} conforme o plano. Nas plataformas mais conhecidas, a tarifa com o seu meio de pagamento chega a 2%.` },
    { icon: Banknote, titulo: "100% das vendas na sua conta", texto: "Pix e cartão caem direto no Mercado Pago da sua loja. A NextLevel cobra o plano e a taxa em fatura separada." },
    { icon: Sem, titulo: "Sem limite de produtos e pedidos", texto: "Em todos os planos. Você não troca de plano porque cadastrou mais produtos ou vendeu mais." },
    { icon: UsersRound, titulo: "Gente de verdade com você", texto: "Equipe NextLevel na sede em São Paulo: monta a loja junto, migra de outra plataforma e atende no WhatsApp." },
  ];
  return (
    <section id="por-que" aria-labelledby="porque-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="im-eyebrow im-eyebrow--claro">Por que a NextLevel</p>
        <h2 id="porque-t" className="im-h2 mt-3 max-w-3xl text-foreground">Quanto mais você vende, menos você paga.</h2>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MOTIVOS.map((m) => (
            <li key={m.titulo} className="rounded-3xl border border-border bg-canvas p-6">
              <m.icon className="size-7 text-[var(--im-acao,var(--ds-primary))]" aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-foreground">{m.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body">{m.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Comparativo na home (D219): custo total por mês (mensalidade + tarifa sobre a venda) em três faixas de faturamento,
 * com o plano mais barato de cada plataforma, e a tabela de taxas e limites. Fontes e data no rodapé da seção.
 */
export function ComparativoHome({ nl, cta, comecar, linkCompleto = true }: { nl: NL; cta: string; comecar: string; linkCompleto?: boolean }) {
  const faixas = custosPorFaixa(nl, [3_000_000, 5_000_000, 10_000_000]);
  const linhas: { rotulo: string; nl: React.ReactNode; vals: Record<string, React.ReactNode> }[] = [
    { rotulo: "Tarifa sobre a venda com o seu meio de pagamento", nl: nl.planos.map((p) => pct(p.taxaBps)).join(" · "), vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.some((p) => p.taxaBps !== null) ? c.planos.filter((p) => p.mensalCents > 0).map((p) => pct(p.taxaBps)).join(" · ") : "não divulga"])) },
    { rotulo: "Produtos sem limite em todos os planos pagos", nl: <Check className="mx-auto size-5 text-success" aria-label="Sim" />, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.filter((p) => p.mensalCents > 0).every((p) => p.produtos === null) ? <Check className="mx-auto size-5 text-success" aria-label="Sim" /> : <X className="mx-auto size-5 text-danger" aria-label="Não" />])) },
    { rotulo: "Pedidos sem limite por mês", nl: <Check className="mx-auto size-5 text-success" aria-label="Sim" />, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.every((p) => p.pedidosMes === null) ? <Check className="mx-auto size-5 text-success" aria-label="Sim" /> : <X className="mx-auto size-5 text-danger" aria-label="Não" />])) },
    { rotulo: "Cobrança em reais", nl: <Check className="mx-auto size-5 text-success" aria-label="Sim" />, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.moeda === "BRL" ? <Check className="mx-auto size-5 text-success" aria-label="Sim" /> : <X className="mx-auto size-5 text-danger" aria-label="Não (dólar)" />])) },
  ];
  return (
    <section id="comparativo" aria-labelledby="comp-t" className="ds-tema-escuro scroll-mt-16 px-4 py-16 md:py-24" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="mx-auto max-w-6xl text-white">
        <p className="im-eyebrow" style={{ color: "#7dd3fc" }}>Comparativo</p>
        <h2 id="comp-t" className="im-h2 mt-3 max-w-3xl">Vendendo a partir de R$ 30 mil por mês, a NextLevel sai mais barata.</h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80">Mensalidade mais a tarifa sobre as vendas, no plano mais barato de cada plataforma para o seu faturamento. Abaixo de R$ 30 mil, os planos de entrada de outras plataformas podem custar menos.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {faixas.map((f) => {
            const outras = [...f.outras].sort((a, b) => a.melhor!.totalCents - b.melhor!.totalCents);
            const prox = outras[0];
            return (
              <div key={f.faturamentoCents} className="rounded-3xl border border-white/15 bg-white/[0.06] p-6">
                <p className="text-sm font-semibold text-white/70">Vendendo {formatBRL(f.faturamentoCents).replace(",00", "")} por mês</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 text-[#101a33]"><span><b>NextLevel</b> <span className="text-xs opacity-70">{f.nextlevel?.nome}</span></span><b className="tabular-nums">{formatBRL(f.nextlevel!.totalCents)}</b></li>
                  {outras.map((o) => <li key={o.key} className="flex items-center justify-between gap-3 px-3"><span>{o.nome} <span className="text-xs text-white/60">{o.melhor!.nome}</span></span><span className="tabular-nums text-white/85">{formatBRL(o.melhor!.totalCents)}</span></li>)}
                </ul>
                {prox ? <p className="mt-4 text-sm font-semibold text-emerald-300">Você economiza {formatBRL(prox.melhor!.totalCents - f.nextlevel!.totalCents)} por mês</p> : null}
              </div>
            );
          })}
        </div>
        <div className="mt-10 overflow-x-auto rounded-3xl border border-white/15">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Taxas e limites das plataformas</caption>
            <thead><tr className="border-b border-white/15 text-white/70"><th scope="col" className="p-4 font-semibold">O que comparar</th><th scope="col" className="bg-white/10 p-4 text-center font-bold text-white">NextLevel</th>{CONCORRENTES.map((c) => <th key={c.key} scope="col" className="p-4 text-center font-semibold">{c.nome}</th>)}</tr></thead>
            <tbody>{linhas.map((l) => <tr key={l.rotulo} className="border-b border-white/10 last:border-0"><th scope="row" className="p-4 font-medium text-white/85">{l.rotulo}</th><td className="bg-white/10 p-4 text-center font-semibold">{l.nl}</td>{CONCORRENTES.map((c) => <td key={c.key} className="p-4 text-center text-white/80">{l.vals[c.key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/60">Dados públicos dos sites oficiais, consultados em {data}, planos mensais. Tarifa da plataforma sobre a venda usando o próprio meio de pagamento; as taxas de cartão e Pix existem em todas e ficam fora da conta. Shopify cobra em dólar e a Loja Integrada não divulga a tarifa com outro meio de pagamento, por isso ficam fora do custo total. Pedidos estimados com tíquete médio de R$ 150. As marcas citadas não têm vínculo com a NextLevel.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={cta} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#101a33]">{comecar}<ArrowRight className="size-4" aria-hidden /></Link>
          {linkCompleto ? <Link href="/comparativo" className="font-semibold text-white underline underline-offset-4">Ver o comparativo completo</Link> : null}
        </div>
      </div>
    </section>
  );
}
