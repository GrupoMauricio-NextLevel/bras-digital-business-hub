import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Package, Printer, Store, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { getPublicSupplierPage } from "@/lib/domain/supplier-page";
import { ProductArt } from "@/components/app/product-art";
import { formatBRL } from "@/lib/money";
import { readableOn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicSupplierPage(await getDb(), slug);
  return p ? { title: { absolute: `${p.name} · ${p.headline}` }, description: p.subheadline } : { title: "Página não encontrada" };
}

const STEPS = [
  { icon: Package, title: "Escolha o catálogo", text: "Ative os produtos que quer vender e defina o seu preço." },
  { icon: Wallet, title: "Recarregue por Pix", text: "O custo de cada pedido é debitado do seu saldo." },
  { icon: Printer, title: "Anexe a etiqueta", text: "Gere no SuperFrete e envie o PDF. A Central separa e despacha." },
  { icon: Store, title: "Venda e acompanhe", text: "Loja online, pós-venda e financeiro em um só painel." },
];

/** Página de vendas pública do fornecedor: ele em destaque, SuperDrop discreto no rodapé. */
export default async function SupplierLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicSupplierPage(await getDb(), slug);
  if (!p) notFound();
  const wa = p.whatsapp ? `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`Olá! Quero conhecer a ${p.name} e testar por 7 dias.`)}` : null;
  const cta = wa ?? "/login";
  const vars = { "--lp-primary": p.primaryColor, "--lp-accent": p.accentColor, "--lp-on-primary": readableOn(p.primaryColor), "--lp-on-accent": readableOn(p.accentColor) } as React.CSSProperties;
  const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition hover:opacity-90";
  return (
    <div style={vars} className="min-h-screen bg-white text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg text-sm font-extrabold" style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>{p.logoText}</span><span className="text-lg font-bold">{p.name}</span></div>
          <nav className="flex items-center gap-4 text-sm font-medium"><a href="#planos" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">Planos</a><a href="#faq" className="hidden text-neutral-600 hover:text-neutral-900 sm:inline">Dúvidas</a><Link href="/login" className="rounded-lg border border-neutral-300 px-4 py-2 hover:bg-neutral-50">Entrar</Link></nav>
        </div>
      </header>

      <section style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Teste grátis por 7 dias · sem cartão</span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{p.headline}</h1>
            <p className="mt-4 max-w-xl text-lg opacity-90">{p.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={cta} target={wa ? "_blank" : undefined} rel="noreferrer" className={btn} style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Quero testar por 7 dias <ArrowRight className="size-5" aria-hidden /></a>
              <a href="#como-funciona" className={`${btn} border border-white/40`}>Como funciona</a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3" aria-hidden>
            {p.products.slice(0, 6).map((pr) => <div key={pr.id} className="rounded-xl bg-white/10 p-2"><ProductArt images={pr.images} /></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Tudo que você precisa para começar</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.benefits.map((b) => <li key={b} className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}><Check className="size-4" aria-hidden /></span><span>{b}</span></li>)}
        </ul>
      </section>

      <section id="como-funciona" className="bg-neutral-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => { const Icon = s.icon; return <li key={s.title} className="rounded-xl bg-white p-5 shadow-sm"><span className="flex size-10 items-center justify-center rounded-lg" style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}><Icon className="size-5" aria-hidden /></span><h3 className="mt-3 font-semibold">{i + 1}. {s.title}</h3><p className="mt-1 text-sm text-neutral-600">{s.text}</p></li>; })}
          </ol>
        </div>
      </section>

      {p.products.length ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Catálogo em destaque</h2>
          <p className="mt-1 text-neutral-600">Preço de venda sugerido. Você define o seu.</p>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {p.products.map((pr) => <li key={pr.id} className="rounded-xl border border-neutral-200 p-3"><ProductArt images={pr.images} alt={pr.name} /><h3 className="mt-2 text-sm font-semibold">{pr.name}</h3><p className="text-sm text-neutral-600">Sugestão {formatBRL(pr.suggestedPriceCents)}</p></li>)}
          </ul>
        </section>
      ) : null}

      <section id="planos" className="bg-neutral-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Planos</h2>
          <p className="mt-1 text-neutral-600">Comece pelo teste de 7 dias. Semestral e anual têm desconto.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {p.plans.map((pl) => (
              <li key={pl.key} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">{pl.name}</h3>
                <p className="mt-1 flex-1 text-sm text-neutral-600">{pl.description}</p>
                <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatBRL(pl.monthlyCents)}<span className="text-sm font-medium text-neutral-500">/mês</span></p>
                {pl.setupCents > 0 ? <p className="text-sm text-neutral-500">+ setup de {formatBRL(pl.setupCents)}</p> : <p className="text-sm text-neutral-500">Sem setup</p>}
                <a href={cta} target={wa ? "_blank" : undefined} rel="noreferrer" className={`${btn} mt-4 w-full`} style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>Testar por 7 dias</a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">Valores de demonstração; confirme as condições com o time comercial.</p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mt-6 space-y-3">{p.faq.map((f) => <details key={f.q} className="rounded-xl border border-neutral-200 p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-neutral-600">{f.a}</p></details>)}</div>
      </section>

      <section style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">Pronto para vender sem estoque?</h2>
          <a href={cta} target={wa ? "_blank" : undefined} rel="noreferrer" className={btn} style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Falar com a {p.name} <ArrowRight className="size-5" aria-hidden /></a>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">© {new Date().getFullYear()} {p.name} · Tecnologia <span className="font-medium">SuperDrop</span></footer>
    </div>
  );
}
