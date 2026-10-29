import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, Infinity as Sem, UsersRound, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { CONCORRENTES, COLETADO_EM, FAT_REFERENCIA_CENTS, degraus, taxasNoMercadoPago } from "@/lib/marcas/comparativo-ecommerce";

export type DegrauNL = { nome: string; mensalCents: number; anualMesCents: number };
const pct = (bps: number | null) => (bps === null ? "não divulga" : bps === 0 ? "0%" : `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const data = new Date(`${COLETADO_EM}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const reais = (c: number) => formatBRL(c).replace(",00", "");
const mil = (c: number) => `R$ ${c / 100_000} mil`;

/** Selo do parceiro oficial (D220): texto, sem o logotipo do Mercado Pago (o uso do logo depende do material deles). */
export function SeloMercadoPago({ escuro = false }: { escuro?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ${escuro ? "bg-[#00b1ea]/15 text-[#7fdcff] ring-1 ring-[#00b1ea]/40" : "bg-[#e6f7fd] text-[#00648a] ring-1 ring-[#00b1ea]/40"}`}>
      <BadgeCheck className="size-4" aria-hidden />Parceiro oficial Mercado Pago
    </span>
  );
}

/** Por que a NextLevel (D219/D220): a taxa zero com o Mercado Pago na frente, depois preço, conta própria, limites e equipe. */
export function PorQueNextLevel({ degrausNl }: { degrausNl: DegrauNL[] }) {
  const entrada = degrausNl[0];
  const MOTIVOS = [
    { icon: Banknote, titulo: "Taxa zero da plataforma", texto: "Com o checkout do Mercado Pago, nosso parceiro oficial, a NextLevel não cobra taxa sobre as suas vendas. Da NextLevel, você paga só a mensalidade." },
    { icon: BadgeCheck, titulo: "Preço mais competitivo em todos os planos", texto: `Mensalidade a partir de ${entrada ? reais(entrada.mensalCents) : "—"} (ou ${entrada ? reais(entrada.anualMesCents) : "—"}/mês no anual). No custo total (mensalidade + taxa), vence Nuvemshop, Loja Integrada, WBuy e Tray plano a plano.` },
    { icon: Sem, titulo: "Sem limite de produtos e pedidos", texto: "Em todos os planos. Você não troca de plano porque cadastrou mais produtos ou vendeu mais." },
    { icon: UsersRound, titulo: "Gente de verdade perto de você", texto: "Equipe NextLevel em São Paulo, na rua do atacado: monta a loja junto, migra de outra plataforma e atende no WhatsApp." },
  ];
  return (
    <section id="por-que" aria-labelledby="porque-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3"><p className="im-eyebrow im-eyebrow--claro">Por que a NextLevel</p><SeloMercadoPago /></div>
        <h2 id="porque-t" className="im-h2 mt-4 max-w-4xl text-foreground">Taxa zero da plataforma nas vendas. Da NextLevel, você paga só a mensalidade.</h2>
        <p className="mt-4 max-w-2xl text-lg text-body">Pix e cartão pelo Mercado Pago, referência em pagamentos na América Latina, com o dinheiro das vendas caindo direto na sua conta. O Mercado Pago cobra só as taxas dele, de Pix e cartão, como em qualquer plataforma.</p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MOTIVOS.map((m, i) => (
            <li key={m.titulo} className={`rounded-3xl border p-6 ${i === 0 ? "border-transparent bg-[var(--ec-marinho,#101a33)] text-white" : "border-border bg-canvas"}`}>
              <m.icon className={`size-7 ${i === 0 ? "text-[#7fdcff]" : "text-[var(--im-acao,var(--ds-primary))]"}`} aria-hidden />
              <h3 className={`mt-4 text-lg font-bold ${i === 0 ? "" : "text-foreground"}`}>{m.titulo}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${i === 0 ? "text-white/80" : "text-body"}`}>{m.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Comparativo na home (D220): plano a plano (entrada, intermediário, avançado), no mensal e no anual, contra Nuvemshop e
 * Tray; depois a tabela de taxa e limites. Fontes e data no rodapé da seção.
 */
export function ComparativoHome({ degrausNl, cta, comecar, linkCompleto = true }: { degrausNl: DegrauNL[]; cta: string; comecar: string; linkCompleto?: boolean }) {
  const linhas = degraus(degrausNl);
  const sim = <Check className="mx-auto size-5 text-emerald-300" aria-label="Sim" />, nao = <X className="mx-auto size-5 text-rose-300" aria-label="Não" />;
  const tabela: { rotulo: string; nl: React.ReactNode; vals: Record<string, React.ReactNode> }[] = [
    { rotulo: "Taxa da plataforma sobre as vendas, usando o Mercado Pago", nl: <b className="text-emerald-300">Zero com Mercado Pago</b>, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.some((p) => p.taxaBps !== null) ? c.planos.filter((p) => p.mensalCents > 0).map((p) => pct(p.taxaBps)).join(" · ") : "não divulga"])) },
    { rotulo: "Produtos sem limite em todos os planos", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.filter((p) => p.mensalCents > 0).every((p) => p.produtos === null) ? sim : nao])) },
    { rotulo: "Pedidos sem limite por mês", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.every((p) => p.pedidosMes === null) ? sim : nao])) },
    { rotulo: "Cobrança em reais", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.moeda === "BRL" ? sim : nao])) },
  ];
  return (
    <section id="comparativo" aria-labelledby="comp-t" className="ds-tema-escuro scroll-mt-16 px-4 py-16 md:py-24" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="mx-auto max-w-6xl text-white">
        <p className="im-eyebrow" style={{ color: "#7dd3fc" }}>Comparativo</p>
        <h2 id="comp-t" className="im-h2 mt-3 max-w-3xl">Mais vantajosa em todos os planos.</h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80">Contra Nuvemshop, Loja Integrada, WBuy e Tray, plano a plano: a mensalidade, a taxa que cada uma cobra quando você usa o Mercado Pago e o custo total de quem vende {mil(FAT_REFERENCIA_CENTS)} por mês. Na NextLevel, a taxa é zero.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {linhas.map((l) => {
            const n = l.nextlevel!;
            const prox = Math.min(...l.outras.map((o) => o.totalCents));
            return (
              <div key={l.degrau} className="flex flex-col rounded-3xl border border-white/15 bg-white/[0.06] p-6">
                <p className="text-sm font-semibold text-white/70">Plano {l.degrau.toLowerCase()}</p>
                <div className="mt-4 rounded-2xl bg-white p-4 text-[#101a33]">
                  <p className="flex items-baseline justify-between gap-2"><b>NextLevel {n.nome}</b><span><b className="text-2xl tabular-nums">{reais(n.mensalCents)}</b><span className="text-xs">/mês</span></span></p>
                  <p className="mt-1 flex justify-between gap-2 text-xs"><span className="font-bold text-emerald-700">+ 0% de taxa da plataforma</span><span>ou <b>{reais(n.anualMesCents)}/mês</b> no anual</span></p>
                </div>
                <table className="mt-3 w-full text-sm">
                  <caption className="sr-only">Plano {l.degrau.toLowerCase()} das outras plataformas</caption>
                  <thead><tr className="text-[11px] text-white/55"><th scope="col" className="px-1 pb-1 text-left font-medium">Plataforma</th><th scope="col" className="pb-1 text-right font-medium">Mensal + taxa</th><th scope="col" className="pb-1 text-right font-medium">Total</th></tr></thead>
                  <tbody>{l.outras.map((o) => <tr key={o.key} className="border-t border-white/10"><th scope="row" className="px-1 py-1.5 text-left font-normal">{o.nome} <span className="block text-[11px] text-white/55">{o.plano}</span></th><td className="py-1.5 text-right tabular-nums text-white/85">{reais(o.mensalCents)} <span className="text-rose-300">+ {pct(o.taxaBps)}</span></td><td className="py-1.5 pl-2 text-right font-semibold tabular-nums">{reais(o.totalCents)}</td></tr>)}</tbody>
                </table>
                <p className="mt-auto pt-4 text-sm font-semibold text-emerald-300">Vendendo {mil(FAT_REFERENCIA_CENTS)}/mês: {reais(n.totalCents)} na NextLevel, {reais(prox - n.totalCents)} de vantagem sobre a próxima opção</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 overflow-x-auto rounded-3xl border border-white/15">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">Taxas e limites das plataformas</caption>
            <thead><tr className="border-b border-white/15 text-white/70"><th scope="col" className="p-4 font-semibold">O que comparar</th><th scope="col" className="bg-white/10 p-4 text-center font-bold text-white">NextLevel</th>{CONCORRENTES.map((c) => <th key={c.key} scope="col" className="p-4 text-center font-semibold">{c.nome}</th>)}</tr></thead>
            <tbody>{tabela.map((l) => <tr key={l.rotulo} className="border-b border-white/10 last:border-0"><th scope="row" className="p-4 font-medium text-white/85">{l.rotulo}</th><td className="bg-white/10 p-4 text-center font-semibold">{l.nl}</td>{CONCORRENTES.map((c) => <td key={c.key} className="p-4 text-center text-white/80">{l.vals[c.key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/60">Dados públicos dos sites oficiais, consultados em {data}. Anual = valor por mês divulgado no plano anual. Tarifa da plataforma sobre a venda usando outro meio de pagamento; nas outras plataformas, ela também zera com o meio de pagamento delas. As taxas de processamento de cartão e Pix existem em todas e ficam fora da comparação. Shopify cobra em dólar. As marcas citadas não têm vínculo com a NextLevel.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={cta} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#101a33]">{comecar}<ArrowRight className="size-4" aria-hidden /></Link>
          {linkCompleto ? <Link href="/comparativo" className="font-semibold text-white underline underline-offset-4">Ver o comparativo completo</Link> : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Faixa da taxa zero logo abaixo do topo (D220): "a única com taxa zero no checkout do Mercado Pago", com a taxa que cada
 * concorrente cobra quando o lojista usa o Mercado Pago (dados de `CONCORRENTES`, com fonte e data no comparativo).
 */
export function FaixaTaxaZero() {
  const outras = taxasNoMercadoPago().sort((a, b) => b.maxBps - a.maxBps);
  return (
    <section aria-labelledby="taxa-zero-t" className="px-4 pb-14 pt-2" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] bg-white p-6 text-[#101a33] shadow-[0_30px_80px_-30px_rgb(0_177_234/0.55)] md:grid-cols-[1.1fr_1fr] md:items-center md:p-10">
        <div>
          <SeloMercadoPago />
          <p className="mt-5 flex items-end gap-3"><span className="text-7xl font-black leading-none tracking-tight text-[#00a650] md:text-8xl">0%</span><span className="pb-2 text-lg font-bold leading-tight">de taxa da<br />plataforma</span></p>
          <h2 id="taxa-zero-t" className="mt-4 text-2xl font-bold leading-tight tracking-tight md:text-3xl">A única plataforma com taxa zero no checkout do Mercado Pago.</h2>
          <p className="mt-3 text-base text-[#3b4660]">Nas outras plataformas, além da taxa do Mercado Pago, você paga uma taxa da própria plataforma sobre cada venda. Na NextLevel, essa taxa não existe: da plataforma, você paga só a mensalidade.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#3b4660]">Taxa da plataforma sobre cada venda, usando o Mercado Pago</p>
          <ul className="mt-3 divide-y divide-[#e3e8f2] rounded-2xl border border-[#e3e8f2]">
            <li className="flex items-center justify-between gap-3 rounded-t-2xl bg-[#e9f9ef] px-4 py-3"><b>NextLevel E-commerce</b><b className="text-xl tabular-nums text-[#00a650]">0%</b></li>
            {outras.map((o) => <li key={o.key} className="flex items-center justify-between gap-3 px-4 py-3"><span>{o.nome}</span><span className="tabular-nums text-[#c0264b]">até <b className="text-lg">{pct(o.maxBps)}</b></span></li>)}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#5b6680]">Entre as plataformas comparadas. Nelas, a taxa da plataforma zera só com o meio de pagamento delas. As taxas do Mercado Pago (Pix e cartão) são cobradas por ele em todas, inclusive na NextLevel. Fontes e data no <Link href="/comparativo" className="underline">comparativo</Link>.</p>
        </div>
      </div>
    </section>
  );
}
