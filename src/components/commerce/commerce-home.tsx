import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink, Package, Palette, Plus, ShoppingBag, Users, Wallet } from "lucide-react";
import { OrdersTable } from "@/components/shared/orders-table";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { themeShot } from "@/lib/themes/gallery";
import type { getMerchantOverview } from "@/lib/queries/merchant";
import type { StoreReadiness } from "@/lib/domain/readiness";

type Overview = Awaited<ReturnType<typeof getMerchantOverview>>;
export type Attention = { key: string; title: string; detail: string; count: number; href: string; action: string; icon: LucideIcon };

const THEMES = [{ key: "arena", name: "Arena" }, { key: "editorial", name: "Editorial" }, { key: "signature", name: "Signature" }];

function Delta({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-xs text-muted-foreground">sem período anterior para comparar</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-danger"}`}><Icon className="size-3.5" aria-hidden />{up ? "+" : "−"}{Math.abs(value).toFixed(1).replace(".", ",")}% <span className="font-normal text-muted-foreground">vs. 30 dias anteriores</span></span>;
}

function Kpi({ icon: Icon, label, value, children, i }: { icon: LucideIcon; label: string; value: string; children: React.ReactNode; i: number }) {
  return <div className="cm-glass-fn cm-lift cm-enter p-4 sm:p-5" style={{ "--i": i } as React.CSSProperties}>
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-[var(--product-accent-text)]"><Icon className="size-4" aria-hidden /></span>{label}</div>
    <div className="mt-3 text-[1.4rem] font-semibold leading-none sm:text-[1.75rem] tracking-[-.03em] tabular-nums">{value}</div>
    <div className="mt-2">{children}</div>
  </div>;
}

function Ring({ percent }: { percent: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return <div className="relative size-[88px] shrink-0" role="img" aria-label={`${percent}% pronto`}>
    <svg viewBox="0 0 88 88" className="size-full -rotate-90"><circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="8" /><circle cx="44" cy="44" r={r} fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} /></svg>
    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{percent}%</span>
  </div>;
}

/** Início do painel Commerce: só dados reais (nada de número ou pendência inventada). */
export function CommerceHome({ firstName, greeting, store, o, readiness, attention }: {
  firstName: string; greeting: string;
  store: { name: string; slug: string; status: string; publishedAt: Date | string | null };
  o: Overview; readiness: StoreReadiness | null; attention: Attention[];
}) {
  const ticket = o.last30Count > 0 ? Math.round(o.sales / o.last30Count) : 0;
  const published = !!store.publishedAt;
  const percent = readiness?.percent ?? o.onboarding.percent;
  const QUICK: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/merchant/catalogo/new", label: "Novo produto", icon: Package },
    { href: "/merchant/orders/new", label: "Novo pedido", icon: Plus },
    { href: "/theme-editor", label: "Editar aparência", icon: Palette },
    { href: "/merchant/finance", label: "Financeiro", icon: Wallet },
  ];
  return <div className="mx-auto max-w-[1240px] space-y-6">
    <section className="cm-glass-id cm-enter px-6 py-8 sm:px-10 sm:py-10">
      <div className="cm-hero-glow" aria-hidden />
      <svg className="cm-hero-art" viewBox="0 0 600 240" preserveAspectRatio="xMaxYMid slice" aria-hidden focusable="false">
        <defs><linearGradient id="cm-w1" x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity="0" /><stop offset=".6" stopColor="var(--primary)" stopOpacity=".35" /><stop offset="1" stopColor="var(--accent)" stopOpacity=".55" /></linearGradient></defs>
        <g className="cm-wave" fill="none" stroke="url(#cm-w1)" strokeWidth="1.5">
          {[0, 1, 2, 3, 4, 5].map((n) => <path key={n} d={`M0 ${190 - n * 6} C 140 ${60 + n * 10}, 300 ${230 - n * 14}, 600 ${40 + n * 8}`} />)}
        </g>
      </svg>
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--product-accent-text)]">Visão geral da loja</p>
          <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-.04em]">{greeting}, {firstName}.</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">{store.name}</span><span aria-hidden>·</span><StatusBadge value={store.status} dot /><span aria-hidden>·</span><span>{published ? "Loja publicada" : "Loja não publicada"}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink />Ver loja</a>
          <Link href="/merchant/orders/new" className={buttonVariants()}><Plus />Novo pedido</Link>
        </div>
      </div>
    </section>

    <section aria-label="Resumo dos últimos 30 dias" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Kpi i={1} icon={Wallet} label="Vendas · 30 dias" value={formatBRL(o.sales)}><Delta value={o.salesDelta} /></Kpi>
      <Kpi i={2} icon={ShoppingBag} label="Pedidos · 30 dias" value={String(o.last30Count)}><Delta value={o.countDelta} /></Kpi>
      <Kpi i={3} icon={Users} label="Clientes" value={String(o.customers)}><span className="text-xs text-muted-foreground">base da loja</span></Kpi>
      <Kpi i={4} icon={Package} label="Ticket médio" value={formatBRL(ticket)}><span className="text-xs text-muted-foreground">{o.last30Count ? "vendas ÷ pedidos do período" : "aparece após a primeira venda"}</span></Kpi>
    </section>

    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={{ "--i": 5 } as React.CSSProperties} aria-labelledby="cm-att">
        <h2 id="cm-att" className="text-lg font-semibold tracking-[-.02em]">O que precisa de você</h2>
        {attention.length ? <ol className="mt-3 divide-y divide-border">{attention.map((item) => { const Icon = item.icon; return <li key={item.key}>
          <Link href={item.href} className="group flex min-h-[68px] items-center gap-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--product-accent-text)]"><Icon className="size-[18px]" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--product-accent-text)]">{item.count}</span>
            <span className="hidden text-xs font-semibold text-[var(--product-accent-text)] sm:block">{item.action}</span>
            <ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" aria-hidden />
          </Link></li>; })}</ol>
          : <div className="py-8"><p className="text-base font-medium">Tudo em dia.</p><p className="mt-1 text-sm text-muted-foreground">Nenhuma pendência pedindo sua atenção agora.</p></div>}
      </section>

      <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={{ "--i": 6 } as React.CSSProperties} aria-labelledby="cm-status">
        <h2 id="cm-status" className="text-lg font-semibold tracking-[-.02em]">Status da loja</h2>
        <div className="mt-4 flex items-center gap-5">
          <Ring percent={percent} />
          <dl className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Publicação</dt><dd className="font-medium">{published ? "No ar" : "Não publicada"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Configuração</dt><dd className="font-medium tabular-nums">{o.onboarding.percent}%</dd></div>
            {readiness ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Pronta para vender</dt><dd className="font-medium">{readiness.ready ? "Sim" : `Faltam ${readiness.missingBlocking.length}`}</dd></div> : null}
          </dl>
        </div>
        <Link href="/merchant/storefront" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--product-accent-text)]">Administrar a loja <ArrowRight className="size-4" aria-hidden /></Link>
      </section>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <section className="cm-glass-work cm-enter p-5 sm:p-6" style={{ "--i": 7 } as React.CSSProperties} aria-labelledby="cm-orders">
        <div className="mb-4 flex items-end justify-between"><h2 id="cm-orders" className="text-lg font-semibold tracking-[-.02em]">Pedidos recentes</h2><Link href="/merchant/orders" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--product-accent-text)]">Ver todos <ArrowRight className="size-4" aria-hidden /></Link></div>
        <OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName: store.name, storeSlug: store.slug }))} basePath="/merchant/orders" showStore={false} showCentral={!o.independent} />
      </section>

      <div className="space-y-6">
        <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={{ "--i": 8 } as React.CSSProperties} aria-labelledby="cm-quick">
          <h2 id="cm-quick" className="text-lg font-semibold tracking-[-.02em]">Ações rápidas</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">{QUICK.map((q) => { const Icon = q.icon; return <li key={q.href}><Link href={q.href} className="cm-lift flex min-h-[72px] flex-col items-start justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium"><Icon className="size-[18px] text-[var(--product-accent-text)]" aria-hidden />{q.label}</Link></li>; })}</ul>
        </section>
        <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={{ "--i": 9 } as React.CSSProperties} aria-labelledby="cm-themes">
          <div className="flex items-end justify-between"><h2 id="cm-themes" className="text-lg font-semibold tracking-[-.02em]">Temas profissionais</h2><Link href="/merchant/templates" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--product-accent-text)]">Ver temas <ArrowRight className="size-4" aria-hidden /></Link></div>
          <ul className="mt-2 grid grid-cols-3 gap-2.5">{THEMES.map((t) => <li key={t.key}><Link href="/merchant/templates" className="cm-lift block overflow-hidden rounded-xl border border-border bg-surface"><Image src={themeShot(t.key, "desktop")} alt={`Tema ${t.name}`} width={240} height={150} className="aspect-[8/5] w-full object-cover object-top" /><span className="block px-2 py-1.5 text-xs font-medium">{t.name}</span></Link></li>)}</ul>
        </section>
      </div>
    </div>

    {readiness && !readiness.hasFirstSale ? (
      <section className="cm-glass-work cm-enter p-5 sm:p-6" style={{ "--i": 10 } as React.CSSProperties} aria-labelledby="cm-first">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Até a primeira venda</p><h2 id="cm-first" className="mt-1 text-lg font-semibold tracking-[-.02em]">{readiness.ready ? "Tudo pronto: falta só o primeiro cliente" : "Faltam passos para você vender"}</h2></div><span className="text-sm tabular-nums text-muted-foreground">{readiness.percent}% pronto</span></div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readiness.items.map((i) => <li key={i.key}><Link href={i.fixHref} className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"><span aria-hidden className={i.ok ? "mt-0.5 text-success" : "mt-0.5 text-subtle-foreground"}>{i.ok ? "✓" : "○"}</span><span className="min-w-0"><span className="block font-medium">{i.label}{i.blocking ? "" : " (recomendado)"}</span><span className="block text-xs text-muted-foreground">{i.detail}</span></span></Link></li>)}
        </ul>
      </section>
    ) : null}
  </div>;
}
