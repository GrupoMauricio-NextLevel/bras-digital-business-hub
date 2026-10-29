import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Check, Infinity as Sem, UsersRound, X } from "lucide-react";
import { formatBRL } from "@/lib/money";
import { CONCORRENTES, COLETADO_EM, degraus } from "@/lib/marcas/comparativo-ecommerce";

export type DegrauNL = { nome: string; mensalCents: number; anualMesCents: number };
const pct = (bps: number | null) => (bps === null ? "não divulga" : bps === 0 ? "0%" : `${(bps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const data = new Date(`${COLETADO_EM}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const reais = (c: number) => formatBRL(c).replace(",00", "");

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
    { icon: Banknote, titulo: "Taxa zero nas vendas", texto: "Com o checkout do Mercado Pago, nosso parceiro oficial, a NextLevel não cobra nada sobre as suas vendas. Você paga só a mensalidade." },
    { icon: BadgeCheck, titulo: "Preço mais competitivo em todos os planos", texto: `Mensalidade a partir de ${entrada ? reais(entrada.mensalCents) : "—"} (ou ${entrada ? reais(entrada.anualMesCents) : "—"}/mês no anual). Plano a plano, a NextLevel vence a Nuvemshop e a Tray no preço.` },
    { icon: Sem, titulo: "Sem limite de produtos e pedidos", texto: "Em todos os planos. Você não troca de plano porque cadastrou mais produtos ou vendeu mais." },
    { icon: UsersRound, titulo: "Gente de verdade perto de você", texto: "Equipe NextLevel em São Paulo, na rua do atacado: monta a loja junto, migra de outra plataforma e atende no WhatsApp." },
  ];
  return (
    <section id="por-que" aria-labelledby="porque-t" className="scroll-mt-16 bg-surface px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-3"><p className="im-eyebrow im-eyebrow--claro">Por que a NextLevel</p><SeloMercadoPago /></div>
        <h2 id="porque-t" className="im-h2 mt-4 max-w-4xl text-foreground">Taxa zero nas vendas. Você paga só a mensalidade.</h2>
        <p className="mt-4 max-w-2xl text-lg text-body">Pix e cartão pelo Mercado Pago, referência em pagamentos na América Latina, com 100% das vendas caindo direto na sua conta.</p>
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
    { rotulo: "Tarifa da plataforma sobre as vendas", nl: <b className="text-emerald-300">Zero com Mercado Pago</b>, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.some((p) => p.taxaBps !== null) ? c.planos.filter((p) => p.mensalCents > 0).map((p) => pct(p.taxaBps)).join(" · ") : "não divulga"])) },
    { rotulo: "Produtos sem limite em todos os planos", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.filter((p) => p.mensalCents > 0).every((p) => p.produtos === null) ? sim : nao])) },
    { rotulo: "Pedidos sem limite por mês", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.planos.every((p) => p.pedidosMes === null) ? sim : nao])) },
    { rotulo: "Cobrança em reais", nl: sim, vals: Object.fromEntries(CONCORRENTES.map((c) => [c.key, c.moeda === "BRL" ? sim : nao])) },
  ];
  return (
    <section id="comparativo" aria-labelledby="comp-t" className="ds-tema-escuro scroll-mt-16 px-4 py-16 md:py-24" style={{ background: "var(--ec-marinho, #101a33)" }}>
      <div className="mx-auto max-w-6xl text-white">
        <p className="im-eyebrow" style={{ color: "#7dd3fc" }}>Comparativo</p>
        <h2 id="comp-t" className="im-h2 mt-3 max-w-3xl">Mais vantajosa que a Nuvemshop e a Tray em todos os planos.</h2>
        <p className="mt-4 max-w-2xl text-lg text-white/80">Plano a plano, no mensal e no anual. E sem tarifa da NextLevel sobre as suas vendas com o Mercado Pago.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {linhas.map((l) => {
            const n = l.nextlevel!;
            const prox = Math.min(...l.outras.map((o) => o.mensalCents));
            return (
              <div key={l.degrau} className="rounded-3xl border border-white/15 bg-white/[0.06] p-6">
                <p className="text-sm font-semibold text-white/70">Plano {l.degrau.toLowerCase()}</p>
                <div className="mt-4 rounded-2xl bg-white p-4 text-[#101a33]">
                  <p className="flex items-baseline justify-between gap-2"><b>NextLevel {n.nome}</b><span><b className="text-2xl tabular-nums">{reais(n.mensalCents)}</b><span className="text-xs">/mês</span></span></p>
                  <p className="mt-1 text-right text-xs">ou <b>{reais(n.anualMesCents)}/mês</b> no anual</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {l.outras.map((o) => <li key={o.key} className="flex items-baseline justify-between gap-3 px-1"><span>{o.nome} <span className="text-xs text-white/60">{o.plano}</span></span><span className="text-right tabular-nums text-white/85">{reais(o.mensalCents)}<span className="block text-[11px] text-white/55">{o.anualMesCents ? `${reais(o.anualMesCents)} no anual` : ""}</span></span></li>)}
                </ul>
                <p className="mt-4 text-sm font-semibold text-emerald-300">{reais(prox - n.mensalCents)} por mês de vantagem sobre a próxima opção</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 overflow-x-auto rounded-3xl border border-white/15">
          <table className="w-full min-w-[44rem] text-left text-sm">
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
