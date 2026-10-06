import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BadgeCheck, Coins, Link2, Repeat, ShieldCheck, Ticket, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { requireBrandFeature } from "@/lib/brand-server";
import { getPriceBook } from "@/lib/domain/finance";
import { getPartnerSettings } from "@/lib/domain/partners";
import { OFFER_KEYS } from "@/lib/finance/price-book";
import { PartnerCalculator } from "@/components/portal/partner-calculator";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Programa de Parceiros · Tenha um negócio próprio vendendo tecnologia" },
  description: "Indique lojas e receba comissão sobre o setup e sobre as mensalidades. Cadastro gratuito, links rastreáveis, cupons de 7 dias e painel financeiro com saque.",
  alternates: { canonical: "/parceiros" },
};
const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2";

const STEPS = [
  { t: "Cadastre-se grátis", d: "Crie a sua conta de parceiro em 2 minutos e aceite os termos do programa." },
  { t: "Receba links e cupons", d: "Seu link rastreável e cupons de 7 dias já ficam prontos no escritório virtual." },
  { t: "Indique e acompanhe", d: "Cada clique, cadastro e ativação aparece no painel, com a sua faixa de comissão em tempo real." },
  { t: "Receba por Pix", d: "Depois da garantia, o saldo fica disponível e você solicita o saque quando quiser." },
];
const PERKS = [
  { i: BarChart3, t: "Escritório virtual", d: "Indicadores do mês, faixa de comissão, funil e metas em uma tela." },
  { i: Link2, t: "Links rastreáveis + QR code", d: "Um link por campanha e por plano, com contagem de cliques e cadastros." },
  { i: Ticket, t: "Cupons de 7 dias", d: "Seu cliente testa sem cartão e fica atribuído a você." },
  { i: Wallet, t: "Financeiro e saque", d: "Extrato completo, saldos em garantia e disponível e pedidos de saque por Pix." },
  { i: Repeat, t: "Renda que se repete", d: "Além do setup, você recebe sobre as mensalidades dos clientes que indicou." },
  { i: ShieldCheck, t: "Regras claras", d: "Faixas, garantia e metas escritas nos termos. Sem comissão em cascata." },
];
const FAQ = [
  ["Quanto custa participar?", "O cadastro é gratuito. Para continuar captando, é preciso ativar 1 novo cliente por mês. Se passar um mês sem ativação, o cadastro fica inativo e a reativação custa a taxa de manutenção mensal informada acima."],
  ["O que conta como ativação?", "Uma loja indicada por você que paga o primeiro pagamento (setup e primeira mensalidade). O teste de 7 dias só conta quando vira pagamento."],
  ["E se eu ficar inativo?", "Você continua recebendo a manutenção das mensalidades dos clientes que já indicou e vê o financeiro normalmente. Só a captação (links e cupons) fica pausada."],
  ["Quando posso sacar?", "As comissões ficam em garantia por alguns dias. Depois disso passam a disponíveis e você solicita o saque por Pix, respeitando o valor mínimo e o limite semanal."],
  ["Posso indicar outros parceiros?", "Não. O programa comissiona apenas a venda de planos a lojistas, sem ganhos em cascata."],
  ["Tem garantia de ganhos?", "Não. A renda depende das suas vendas. A calculadora é só uma simulação das regras."],
];

export default async function Parceiros() {
  const brand = await requireBrandFeature("partners");
  const db = await getDb();
  const [settings, book] = await Promise.all([getPartnerSettings(db), getPriceBook(db)]);
  const plans = OFFER_KEYS.map((k) => ({ key: k as string, name: book.offers[k].name, setupCents: book.offers[k].setupCents, monthlyCents: book.offers[k].monthlyCents })).filter((p) => p.setupCents > 0 || p.monthlyCents > 0);
  const tiers = [...settings.tiers].sort((a, b) => a.min - b.min);
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden bg-band text-band-foreground">
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden style={{ background: "radial-gradient(60rem 30rem at 85% -10%, rgba(245,158,11,0.25), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24">
          <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-highlight">Programa de Parceiros Oficiais</span>
          <h1 className="nl-display mt-5 max-w-4xl">Tenha um negócio próprio vendendo tecnologia que já funciona.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-band-muted">O {brand.name} é um sistema pronto de loja online. Você indica, acompanha tudo no seu escritório virtual e recebe comissão sobre o setup e sobre as mensalidades de cada cliente.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/parceiros/cadastro" className={`${btn} bg-primary text-primary-foreground hover:bg-primary focus-visible:outline-band-foreground`}>Quero ser parceiro</Link>
            <Link href="/login" className={`${btn} border border-band-foreground/30 hover:bg-band-foreground/10 focus-visible:outline-band-foreground`}>Entrar no escritório</Link>
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-band-muted sm:grid-cols-3">
            {tiers.map((t) => <li key={t.min} className="rounded-xl border border-band-foreground/15 bg-surface/5 p-4"><span className="block text-3xl font-extrabold text-highlight tabular-nums">{t.bps / 100}%</span>{t.max ? (t.min === t.max ? `com ${t.min} ativação no mês` : `de ${t.min} a ${t.max} ativações no mês`) : `a partir de ${t.min} ativações no mês`}<span className="block text-xs text-band-muted">de comissão sobre o setup</span></li>)}
          </ul>
          <p className="mt-4 text-sm text-band-muted">Mais {settings.maintenanceBps / 100}% fixos sobre cada mensalidade paga pelos clientes que você indicou.</p>
        </div>
      </section>

      <section className="bg-canvas py-16" aria-labelledby="calc">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="calc" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Simule o seu potencial</h2>
          <p className="mt-2 text-muted-foreground">Escolha o plano e quantas ativações você quer fazer por mês.</p>
          <div className="mt-6"><PartnerCalculator settings={settings} plans={plans} /></div>
        </div>
      </section>

      <section className="bg-surface py-16" aria-labelledby="como">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="como" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Como funciona</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-4">{STEPS.map((s, n) => (
            <li key={s.t} className="h-full rounded-2xl border border-border p-6"><span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-band-foreground">{n + 1}</span><h3 className="mt-4 text-lg font-bold">{s.t}</h3><p className="mt-1 text-sm text-muted-foreground">{s.d}</p></li>
          ))}</ol>
        </div>
      </section>

      <section className="bg-canvas py-16" aria-labelledby="recebe">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="recebe" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">O que você recebe como parceiro</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{PERKS.map((p) => (
            <li key={p.t} className="rounded-2xl border border-border bg-surface p-6"><span className="flex size-10 items-center justify-center rounded-lg bg-highlight-soft text-link"><p.i className="size-5" aria-hidden /></span><h3 className="mt-4 font-bold">{p.t}</h3><p className="mt-1 text-sm text-muted-foreground">{p.d}</p></li>
          ))}</ul>
          <div className="mt-10 rounded-2xl border border-primary/30 bg-highlight-soft p-6 text-highlight-foreground">
            <h3 className="flex items-center gap-2 text-lg font-bold"><BadgeCheck className="size-5" aria-hidden /> A regra de ouro: 1 ativação por mês</h3>
            <p className="mt-2 text-sm">Para manter o cadastro gratuito e continuar captando, ative {settings.monthlyGoal} novo cliente por mês. Sem ativação, o cadastro fica inativo (reativar custa {formatBRL(settings.inactiveFeeCents)}/mês), mas você <b>continua recebendo a manutenção</b> dos clientes que já trouxe.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16" aria-labelledby="faq">
        <div className="mx-auto max-w-3xl px-4">
          <h2 id="faq" className="font-[family-name:var(--nl-font-display)] text-3xl font-extrabold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border">{FAQ.map(([q, a]) => (
            <details key={q} className="group p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary><p className="mt-2 text-sm text-body">{a}</p></details>
          ))}</div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-band p-6 text-band-foreground">
            <div><p className="flex items-center gap-2 text-lg font-bold"><Coins className="size-5 text-highlight" aria-hidden /> Pronto para começar?</p><p className="text-sm text-band-muted">O cadastro é gratuito e leva 2 minutos.</p></div>
            <Link href="/parceiros/cadastro" className={`${btn} bg-primary text-primary-foreground hover:bg-primary focus-visible:outline-band-foreground`}>Quero ser parceiro</Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Ao participar você aceita os <Link href="/parceiros/termos" className="font-semibold underline">termos do programa</Link>. Os ganhos dependem das suas vendas e não são garantidos.</p>
        </div>
      </section>
    </>
  );
}
