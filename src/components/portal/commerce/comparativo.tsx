import Link from "next/link";
import { ContagemRegressiva } from "@/components/black/contagem-regressiva";
import "@/components/black/black.css";
import { ArrowRight, BadgeCheck, Banknote, Check, Infinity as Sem, UsersRound, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { ATACADO_CONCORRENTES, CONCORRENTES, COLETADO_EM, COTACAO_DOLAR, FAT_REFERENCIA_CENTS, degraus, taxasNoMercadoPago } from "@/lib/marcas/comparativo-ecommerce";

export type DegrauNL = { nome: string; mensalCents: number; anualMesCents: number };
const pct = (bps: number | null) => (bps === null ? "não divulga" : bps === 0 ? "0%" : `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const data = new Date(`${COLETADO_EM}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const reais = (c: number) => formatBRL(c).replace(",00", "");
const mil = (c: number) => `R$ ${c / 100_000} mil`;

/** Selo do parceiro oficial (D220): texto, sem o logotipo do Mercado Pago (o uso do logo depende do material deles). */
export function SeloMercadoPago({ escuro = false }: { escuro?: boolean }) {
  return <span className={`ec-tag ${escuro ? "" : "ec-tag--claro"}`}><i aria-hidden />Parceiro oficial Mercado Pago</span>;
}

/** Por que a NextLevel (D219/D220, visual D222): a taxa zero da plataforma na frente, depois preço, limites e equipe. */
export function PorQueNextLevel({ degrausNl }: { degrausNl: DegrauNL[] }) {
  const entrada = degrausNl[0];
  const MOTIVOS = [
    { icon: Banknote, titulo: "Taxa zero da plataforma", texto: "Com o checkout do Mercado Pago, nosso parceiro oficial, a NextLevel não cobra taxa sobre as suas vendas. Da NextLevel, você paga só a mensalidade.", dado: "0%" },
    { icon: BadgeCheck, titulo: "Preço mais competitivo", texto: `No custo total (mensalidade + taxa), vence Nuvemshop, Loja Integrada, WBuy e Tray plano a plano. Anual a partir de ${entrada ? reais(entrada.anualMesCents) : "—"}/mês.`, dado: entrada ? reais(entrada.mensalCents) : "—" },
    { icon: Sem, titulo: "Sem limite de produtos e pedidos", texto: "Em todos os planos. Você não troca de plano porque cadastrou mais produtos ou vendeu mais.", dado: "∞" },
    { icon: UsersRound, titulo: "Gente de verdade perto de você", texto: "Equipe NextLevel em São Paulo, na rua do atacado: monta a loja junto, migra de outra plataforma e atende no WhatsApp.", dado: "SP" },
  ];
  return (
    <section id="por-que" aria-labelledby="porque-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3"><p className="im-eyebrow im-eyebrow--claro">Por que a NextLevel</p><SeloMercadoPago /></div>
        <h2 id="porque-t" className="im-h2 mt-4 max-w-4xl text-foreground">Tecnologia de loja virtual sem taxa da plataforma nas vendas.</h2>
        <p className="mt-4 max-w-2xl text-lg text-body">Pix e cartão pelo checkout do Mercado Pago, referência em pagamentos na América Latina, com o dinheiro caindo direto na sua conta. O Mercado Pago cobra só as taxas dele, como em qualquer plataforma.</p>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MOTIVOS.map((m, i) => (
            <li key={m.titulo} className={`ec-cartao flex flex-col ${i === 0 ? "ec-cartao--escuro" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="ec-icone"><m.icon className="size-5" aria-hidden /></span>
                <span className="ec-indice">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className={`ec-num mt-6 text-4xl font-semibold ${i === 0 ? "text-[var(--ec-verde)]" : "text-foreground"}`} aria-hidden>{m.dado}</p>
              <h3 className={`mt-3 text-lg font-bold ${i === 0 ? "text-white" : "text-foreground"}`}>{m.titulo}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${i === 0 ? "text-white/75" : "text-body"}`}>{m.texto}</p>
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
    { rotulo: "Taxa da plataforma sobre as vendas, usando o Mercado Pago", nl: <b className="ec-num text-[var(--ec-verde)]">0%</b>, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.some((p) => p.taxaBps !== null) ? c.planos.filter((p) => p.mensalCents > 0).map((p) => pct(p.taxaBps)).join(" · ") : "não divulga"])) },
    { rotulo: "Atacado nativo: grade, preço por quantidade, pedido mínimo", nl: <b className="text-[var(--ec-verde,#6ee7b7)]">Em todos os planos</b>, vals: Object.fromEntries(CONCORRENTES.map((c) => { const a = ATACADO_CONCORRENTES[c.key]; return [c.key, !a ? "—" : a.tem === false ? nao : <span className="text-xs">{a.texto}</span>]; })) },
    { rotulo: "Pedidos sem limite por mês", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.every((p) => p.pedidosMes === null) ? sim : nao])) },
    { rotulo: "Cobrança em reais", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.moeda === "BRL" ? sim : nao])) },
  ];
  return (
    <section id="comparativo" aria-labelledby="comp-t" className="ds-tema-escuro scroll-mt-16 px-4 py-16 md:py-24" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="mx-auto max-w-6xl text-white">
        <p className="im-eyebrow" style={{ color: "#7dd3fc" }}>Comparativo</p>
        <h2 id="comp-t" className="im-h2 mt-3 max-w-3xl">Mais vantajosa em todos os planos.</h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80">Contra Nuvemshop, Loja Integrada, WBuy, Tray e Shopify, plano a plano: a mensalidade, a taxa que cada uma cobra quando você usa o Mercado Pago e o custo total de quem vende {mil(FAT_REFERENCIA_CENTS)} por mês. Na NextLevel, a taxa é zero.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {linhas.map((l) => {
            const n = l.nextlevel!;
            const prox = Math.min(...l.outras.map((o) => o.totalCents));
            return (
              <div key={l.degrau} className="ec-painel flex flex-col p-6">
                <p className="ec-mono text-[#7dd3fc]">Plano {l.degrau.toLowerCase()}</p>
                <div className="mt-4 rounded-2xl bg-white p-4 text-[#101a33]">
                  <p className="flex items-baseline justify-between gap-2"><b>NextLevel {n.nome}</b><span><b className="ec-num text-2xl">{reais(n.mensalCents)}</b><span className="text-xs">/mês</span></span></p>
                  <p className="mt-1 flex justify-between gap-2 text-xs"><span className="font-bold text-emerald-700">+ 0% de taxa da plataforma</span><span>ou <b>{reais(n.anualMesCents)}/mês</b> no anual</span></p>
                </div>
                <table className="mt-3 w-full text-sm">
                  <caption className="sr-only">Plano {l.degrau.toLowerCase()} das outras plataformas</caption>
                  <thead><tr className="text-[11px] text-white/55"><th scope="col" className="px-1 pb-1 text-left font-medium">Plataforma</th><th scope="col" className="pb-1 text-right font-medium">Mensal + taxa</th><th scope="col" className="pb-1 text-right font-medium">Total</th></tr></thead>
                  <tbody>{l.outras.map((o) => <tr key={o.key} className="border-t border-white/10"><th scope="row" className="px-1 py-1.5 text-left font-normal">{o.nome} <span className="block text-[11px] text-white/55">{o.plano}</span></th><td className="ec-num py-1.5 text-right text-white/85">{reais(o.mensalCents)} <span className="text-rose-300">+ {pct(o.taxaBps)}</span></td><td className="ec-num py-1.5 pl-2 text-right font-semibold">{reais(o.totalCents)}</td></tr>)}</tbody>
                </table>
                <p className="mt-auto pt-4 text-sm font-semibold text-emerald-300">Vendendo {mil(FAT_REFERENCIA_CENTS)}/mês: {reais(n.totalCents)} na NextLevel, {reais(prox - n.totalCents)} de vantagem sobre a próxima opção</p>
              </div>
            );
          })}
        </div>
        {/* Celular (D233): um cartão por item, a NextLevel em destaque e os concorrentes em grade; sem rolagem lateral. */}
        <ul className="mt-10 grid gap-3 md:grid-cols-2 lg:hidden" aria-label="Taxas e limites das plataformas">
          {tabela.map((l) => (
            <li key={l.rotulo} className="ec-painel p-4">
              <p className="text-sm font-semibold text-white">{l.rotulo}</p>
              <p className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 ring-1 ring-emerald-300/40"><b className="text-white">NextLevel</b><span className="font-semibold [&_svg]:mx-0">{l.nl}</span></p>
              <dl className="mt-2 grid gap-1 text-sm">
                {CONCORRENTES.map((c) => <div key={c.key} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white/[.04] px-2.5 py-2"><dt className="shrink-0 text-white/65">{c.nome}</dt><dd className="ec-num text-right text-white/85 [&_svg]:mx-0 [&_svg]:size-4">{l.vals[c.key]}</dd></div>)}
              </dl>
            </li>
          ))}
        </ul>
        <div className="ec-painel mt-10 hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Taxas e limites das plataformas</caption>
            <thead><tr className="border-b border-white/15 text-white/70"><th scope="col" className="p-4 font-semibold">O que comparar</th><th scope="col" className="bg-white/10 p-4 text-center font-bold text-white">NextLevel</th>{CONCORRENTES.map((c) => <th key={c.key} scope="col" className="p-4 text-center font-semibold">{c.nome}</th>)}</tr></thead>
            <tbody>{tabela.map((l) => <tr key={l.rotulo} className="border-b border-white/10 last:border-0"><th scope="row" className="p-4 font-medium text-white/85">{l.rotulo}</th><td className="bg-white/10 p-4 text-center font-semibold">{l.nl}</td>{CONCORRENTES.map((c) => <td key={c.key} className="p-4 text-center text-white/80">{l.vals[c.key]}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/60">Dados públicos dos sites oficiais, consultados em {data}. Anual = valor por mês divulgado no plano anual. Taxa da plataforma sobre a venda usando o Mercado Pago; nas outras plataformas, ela zera só com o meio de pagamento delas. As taxas do Mercado Pago (Pix e cartão) existem em todas e ficam fora da comparação. Shopify cobra em dólar: convertemos a {formatBRL(COTACAO_DOLAR.reais * 100)} por dólar, abaixo do câmbio do dia e sem o IOF. As marcas citadas não têm vínculo com a NextLevel.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={cta} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#101a33]">{comecar}<ArrowRight className="size-4" aria-hidden /></Link>
          {linkCompleto ? <Link href="/comparativo" className="font-semibold text-white underline underline-offset-4">Ver o comparativo completo</Link> : null}
        </div>
      </div>
    </section>
  );
}

/**
 * Faixa da taxa zero logo abaixo do topo (D220, visual D222): painel escuro com o 0% em destaque e, ao lado, as barras com a
 * taxa da plataforma que cada concorrente cobra quando o lojista usa o Mercado Pago (dados de `CONCORRENTES`).
 */
export function FaixaTaxaZero({ black = null }: { black?: { fim: string; restanteMs: number } | null }) {
  const outras = taxasNoMercadoPago().sort((a, b) => b.maxBps - a.maxBps);
  const maior = Math.max(...outras.map((o) => o.maxBps));
  return (
    <section aria-labelledby="taxa-zero-t" className="px-4 pb-16 pt-2" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="ec-painel mx-auto grid max-w-6xl gap-10 p-6 md:grid-cols-[1.05fr_1fr] md:items-center md:p-12">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3"><SeloMercadoPago escuro />{black ? <ContagemRegressiva fim={black.fim} restanteMs={black.restanteMs} tamanho="sm" rotulo="Black termina em" /> : null}</div>
          <p className="mt-6 flex items-end gap-4">
            <span className="sr-only">0% de taxa da plataforma por venda</span>
            <span className="ec-zero" aria-hidden>0<small>%</small></span>
            <span className="ec-mono pb-3 leading-relaxed text-[#9fb3d9]" aria-hidden>taxa da<br />plataforma<br />por venda</span>
          </p>
          <h2 id="taxa-zero-t" className="mt-6 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">A única plataforma com taxa zero no checkout do Mercado Pago.</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#b9c6e4]">Nas outras, além da taxa do Mercado Pago, você paga uma taxa da própria plataforma sobre cada venda. Na NextLevel, essa taxa não existe: da plataforma, você paga só a mensalidade.</p>
        </div>
        <div>
          <p className="ec-mono text-[#7dd3fc]">Taxa da plataforma · usando Mercado Pago</p>
          <ul className="ec-barras mt-5" aria-label="Taxa da plataforma sobre cada venda, usando o Mercado Pago">
            <li className="ec-barra ec-barra--nl"><b className="text-white">NextLevel</b><span className="ec-barra-trilho" aria-hidden><span className="ec-barra-cheia" /></span><span className="ec-barra-valor text-[var(--ec-verde)]">0,00%</span></li>
            {outras.map((o) => (
              <li key={o.key} className="ec-barra"><span className="text-[#c9d4ee]">{o.nome}</span><span className="ec-barra-trilho" aria-hidden><span className="ec-barra-cheia" style={{ "--w": `${(o.maxBps / maior) * 100}%` } as React.CSSProperties} /></span><span className="ec-barra-valor text-[#ff8fae]">{(o.maxBps / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%</span></li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-[#8193b8]">Maior taxa de cada plataforma, entre as comparadas. Nelas, a taxa da plataforma zera só com o meio de pagamento delas. As taxas do Mercado Pago (Pix e cartão) são cobradas por ele em todas, inclusive na NextLevel. Fontes e data no <Link href="/comparativo" className="underline">comparativo</Link>.</p>
        </div>
      </div>
    </section>
  );
}
