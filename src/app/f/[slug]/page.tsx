/* eslint-disable @next/next/no-img-element -- logo e foto vêm do fornecedor (endereço livre) */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Package, Printer, Store, Wallet } from "lucide-react";
import { getDb } from "@/db/client";
import { getPublicSupplierPage } from "@/lib/domain/supplier-page";
import { Logo } from "@/components/brand/logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
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
  { icon: Printer, title: "Anexe a etiqueta", text: "Gere na sua plataforma de envio (SuperFrete, Melhor Envio ou Onlog) e envie o PDF. A Central separa e despacha." },
  { icon: Store, title: "Venda e acompanhe", text: "Loja online, pós-venda e financeiro em um só painel." },
];

/** Página de vendas pública do fornecedor: ele em destaque, SuperDrop discreto no rodapé. */
export default async function SupplierLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicSupplierPage(await getDb(), slug);
  if (!p) notFound();
  const wa = p.whatsapp ? `https://wa.me/${p.whatsapp}?text=${encodeURIComponent(`Olá! Quero conhecer a ${p.name} e testar por 7 dias.`)}` : null;
  const signup = `/cadastro?fornecedor=${p.slug}${p.couponCode ? `&cupom=${p.couponCode}` : ""}`;
  const vars = { "--lp-primary": p.primaryColor, "--lp-accent": p.accentColor, "--lp-on-primary": readableOn(p.primaryColor), "--lp-on-accent": readableOn(p.accentColor) } as React.CSSProperties;
  const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition hover:opacity-90";
  return (
    <div style={vars} className="min-h-screen bg-surface text-foreground">
      {p.demoContent ? <p role="note" className="bg-warning-soft px-4 py-1.5 text-center text-xs font-medium text-warning">Página de demonstração: logo, fotos e depoimentos reais serão enviados pelo fornecedor (conteúdo a fornecer).</p> : null}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">{p.logoUrl ? <span className="flex items-center rounded-lg px-3 py-1.5" style={{ background: "var(--lp-primary)" }}><img src={p.logoUrl} alt={p.name} className="h-9 w-auto max-w-44 object-contain" /></span> : <><span className="flex size-10 items-center justify-center rounded-lg text-sm font-extrabold" style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>{p.logoText}</span><span className="text-lg font-bold">{p.name}</span></>}</div>
          <nav className="flex items-center gap-4 text-sm font-medium"><a href="#planos" className="hidden text-muted-foreground hover:text-foreground sm:inline">Planos</a><a href="#faq" className="hidden text-muted-foreground hover:text-foreground sm:inline">Dúvidas</a><Link href="/login" className="hidden rounded-lg px-3 py-2 text-body hover:bg-surface-muted sm:inline">Área de membros</Link><Link href={signup} className="rounded-lg px-4 py-2 font-semibold" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Criar conta</Link></nav>
        </div>
      </header>

      <section style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Teste grátis por 7 dias · sem cartão</span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">{p.headline}</h1>
            <p className="mt-4 max-w-xl text-lg opacity-90">{p.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signup} className={btn} style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>{p.couponCode ? "Quero testar por 7 dias" : "Criar minha loja"} <ArrowRight className="size-5" aria-hidden /></Link>
              <a href="#como-funciona" className={`${btn} border border-band-foreground/40`}>Como funciona</a>
            </div>
          </div>
          {p.heroUrl ? (
            <img src={p.heroUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
          ) : (
            <div className="grid grid-cols-3 gap-3" aria-hidden>
              {p.products.slice(0, 6).map((pr) => <div key={pr.id} className="rounded-xl bg-band-foreground/10 p-2"><ProductArt images={pr.images} /></div>)}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Tudo que você precisa para começar</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.benefits.map((b) => <li key={b} className="flex items-start gap-3 rounded-xl border border-border p-4"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}><Check className="size-4" aria-hidden /></span><span>{b}</span></li>)}
        </ul>
      </section>

      <section id="como-funciona" className="bg-surface-muted py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => { const Icon = s.icon; return <li key={s.title} className="rounded-xl bg-surface p-5 shadow-sm"><span className="flex size-10 items-center justify-center rounded-lg" style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}><Icon className="size-5" aria-hidden /></span><h3 className="mt-3 font-semibold">{i + 1}. {s.title}</h3><p className="mt-1 text-sm text-muted-foreground">{s.text}</p></li>; })}
          </ol>
        </div>
      </section>

      {p.products.length ? (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Catálogo em destaque</h2>
          <p className="mt-1 text-muted-foreground">Preço de venda sugerido. Você define o seu.</p>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {p.products.map((pr) => <li key={pr.id} className="rounded-xl border border-border p-3"><ProductArt images={pr.images} alt={pr.name} /><h3 className="mt-2 text-sm font-semibold">{pr.name}</h3><p className="text-sm text-muted-foreground">Sugestão {formatBRL(pr.suggestedPriceCents)}</p></li>)}
          </ul>
        </section>
      ) : null}

      <section id="planos" className="bg-surface-muted py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Planos</h2>
          <p className="mt-1 text-muted-foreground">Pague por Pix e o acesso é liberado na hora, ou teste 7 dias grátis com o cupom.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {p.plans.map((pl) => (
              <li key={pl.key} className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
                <h3 className="text-lg font-semibold">{pl.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{pl.description}</p>
                <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatBRL(pl.monthlyCents)}<span className="text-sm font-medium text-muted-foreground">/mês</span></p>
                {pl.setupCents > 0 ? <p className="text-sm text-muted-foreground">+ setup de {formatBRL(pl.setupCents)}</p> : <p className="text-sm text-muted-foreground">Sem setup</p>}
                <Link href={`/cadastro?plano=${pl.key}&fornecedor=${p.slug}`} className={`${btn} mt-4 w-full`} style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>Assinar por Pix</Link>
                {p.couponCode ? <Link href={`/cadastro?plano=${pl.key}&fornecedor=${p.slug}&cupom=${p.couponCode}`} className="mt-2 text-center text-sm font-semibold underline">ou testar 7 dias grátis</Link> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Pagamento por Pix. A taxa por pedido depende do plano.</p>
        </div>
      </section>

      {p.testimonials.length ? (
        <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="prova">
          <h2 id="prova" className="text-2xl font-bold">Quem vende com a {p.name}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {p.testimonials.map((t, i) => <li key={i}><figure className="h-full rounded-xl border border-border p-5"><blockquote className="text-body">“{t.text}”</blockquote><figcaption className="mt-3 text-sm"><span className="font-semibold">{t.name}</span> · <span className="text-muted-foreground">{t.role}</span></figcaption></figure></li>)}
          </ul>
        </section>
      ) : null}

      <section id="faq" className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mt-6 space-y-3">{p.faq.map((f) => <details key={f.q} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-muted-foreground">{f.a}</p></details>)}</div>
      </section>

      <section style={{ background: "var(--lp-primary)", color: "var(--lp-on-primary)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-bold">Pronto para vender sem estoque?</h2>
          <Link href={signup} className={btn} style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Criar minha loja <ArrowRight className="size-5" aria-hidden /></Link>
        </div>
      </section>

      {wa ? <a href={wa} target="_blank" rel="noreferrer" aria-label={`Falar com a ${p.name} no WhatsApp`} className="fixed inset-x-4 bottom-4 z-30 flex h-12 items-center justify-center gap-2 rounded-full text-base font-semibold shadow-lg md:hidden" style={{ background: "var(--lp-accent)", color: "var(--lp-on-accent)" }}>Falar no WhatsApp</a> : null}

      <footer className="border-t border-border py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <p>© {new Date().getFullYear()} {p.name} · Tecnologia <Logo tone="on-light" className="ml-1 inline h-4 align-middle" /></p>
          <NextLevelSignature product="SuperDrop" />
        </div>
      </footer>
    </div>
  );
}
