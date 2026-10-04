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
/** Pendências de preparo (cobertas pelo próximo passo e pelo checklist) não se repetem na lista de operação. */
const SETUP_KEYS = new Set(["readiness", "publish", "onboarding"]);

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

function Delta({ value }: { value?: number }) {
  if (value === undefined) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-danger"}`}><Icon className="size-3.5" aria-hidden />{up ? "+" : "−"}{Math.abs(value).toFixed(1).replace(".", ",")}%</span>;
}

function Kpi({ icon: Icon, label, value, note, i }: { icon: LucideIcon; label: string; value: string; note?: React.ReactNode; i: number }) {
  return <div className="cm-glass-fn cm-lift cm-enter p-3.5 sm:p-5" style={stagger(i)}>
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[var(--product-accent-text)] sm:size-8 sm:rounded-xl"><Icon className="size-4" aria-hidden /></span><span className="truncate">{label}</span></div>
    <div className="mt-2.5 text-[1.3rem] font-semibold leading-none tracking-[-.03em] tabular-nums sm:mt-3 sm:text-[1.75rem]">{value}</div>
    {note ? <div className="mt-1.5 text-xs text-muted-foreground">{note}</div> : null}
  </div>;
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 34, c = 2 * Math.PI * r, pct = total ? Math.round((done / total) * 100) : 0;
  return <div className="relative size-[84px] shrink-0" role="img" aria-label={`${done} de ${total} requisitos prontos`}>
    <svg viewBox="0 0 88 88" className="size-full -rotate-90"><circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="8" /><circle cx="44" cy="44" r={r} fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} /></svg>
    <span className="absolute inset-0 flex flex-col items-center justify-center leading-none"><span className="text-lg font-semibold tabular-nums">{done}/{total}</span></span>
  </div>;
}

/** Início do painel Commerce: só dados reais (nada de número ou pendência inventada). */
export function CommerceHome({ firstName, greeting, store, o, readiness, attention }: {
  firstName: string; greeting: string;
  store: { name: string; slug: string; status: string; publishedAt: Date | string | null };
  o: Overview; readiness: StoreReadiness | null; attention: Attention[];
}) {
  const ticket = o.last30Count > 0 ? Math.round(o.sales / o.last30Count) : null;
  const published = !!store.publishedAt;
  const firstAccess = !!readiness && !readiness.hasFirstSale && o.last30Count === 0;
  const next = attention.find((a) => SETUP_KEYS.has(a.key)) ?? null;
  const operational = attention.filter((a) => !SETUP_KEYS.has(a.key));
  const reqDone = readiness ? readiness.items.filter((i) => i.ok).length : 0;
  const reqTotal = readiness ? readiness.items.length : 0;
  const stepsDone = o.onboarding.steps.filter((s) => s.done).length;
  const noPrev = o.salesDelta === undefined && o.countDelta === undefined;
  const QUICK: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/merchant/catalogo/new", label: "Novo produto", icon: Package },
    { href: "/merchant/orders/new", label: "Novo pedido", icon: Plus },
    { href: "/theme-editor", label: "Editar aparência", icon: Palette },
    { href: "/merchant/finance", label: "Financeiro", icon: Wallet },
  ];

  const status = <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={stagger(3)} aria-labelledby="cm-status">
    <h2 id="cm-status" className="text-base font-semibold tracking-[-.01em]">Status da loja</h2>
    <div className="mt-4 flex items-center gap-5">
      {readiness ? <Ring done={reqDone} total={reqTotal} /> : null}
      <dl className="min-w-0 flex-1 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Conta</dt><dd className="font-medium">{store.status === "ACTIVE" ? "Ativa" : store.status}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Vitrine</dt><dd className="font-medium">{published ? "Publicada" : "Ainda não publicada"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Configuração</dt><dd className="font-medium tabular-nums">{stepsDone} de {o.onboarding.steps.length} etapas</dd></div>
        {readiness ? <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Para vender</dt><dd className="font-medium tabular-nums">{reqDone} de {reqTotal} requisitos</dd></div> : null}
      </dl>
    </div>
  </section>;

  const nextStep = next ? <section className="cm-glass-fn cm-enter relative overflow-hidden p-5 sm:p-6" style={stagger(2)} aria-labelledby="cm-next">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--product-accent-text)]">Próximo passo</p>
    <h2 id="cm-next" className="mt-2 text-xl font-semibold leading-snug tracking-[-.02em]">{next.title}</h2>
    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{next.detail}</p>
    <Link href={next.href} className={buttonVariants({ size: "lg" }) + " mt-5"}>{next.action}<ArrowRight /></Link>
  </section> : <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={stagger(2)} aria-labelledby="cm-next">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--product-accent-text)]">Próximo passo</p>
    <h2 id="cm-next" className="mt-2 text-xl font-semibold tracking-[-.02em]">Sua loja está pronta para vender.</h2>
    <p className="mt-2 text-sm text-muted-foreground">Divulgue o endereço da vitrine ou registre uma venda manual.</p>
    <Link href="/merchant/orders/new" className={buttonVariants({ size: "lg" }) + " mt-5"}><Plus />Novo pedido</Link>
  </section>;

  return <div className="mx-auto max-w-[1240px] space-y-5 sm:space-y-6">
    <section className="cm-glass-id cm-hero cm-enter px-5 py-6 sm:px-10 sm:py-9">
      <div className="cm-hero-line" aria-hidden />
      <div className="cm-hero-glow" aria-hidden />
      <div className="cm-hero-stage" aria-hidden><span className="cm-blade cm-blade-c" /><span className="cm-blade cm-blade-a" /><span className="cm-blade cm-blade-b" /></div>
      <div className="relative max-w-[60%] max-sm:max-w-none">
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--product-accent-text)]">Visão geral da loja</p>
        <h1 className="mt-2 text-[clamp(1.75rem,4.2vw,2.75rem)] font-semibold leading-[1.05] tracking-[-.04em]">{greeting}, {firstName}.</h1>
        <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{store.name}</span></p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-line)] bg-[var(--glass-fn)] px-2.5 py-1 font-medium">{store.status === "ACTIVE" ? "Conta ativa" : <StatusBadge value={store.status} dot />}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-line)] bg-[var(--glass-fn)] px-2.5 py-1 font-medium"><span aria-hidden className={`size-1.5 rounded-full ${published ? "bg-success" : "bg-subtle-foreground"}`} />{published ? "Loja publicada" : "Loja ainda não publicada"}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink />Ver loja</a>
          <Link href="/merchant/orders/new" className={buttonVariants()}><Plus />Novo pedido</Link>
        </div>
      </div>
    </section>

    {firstAccess ? <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">{nextStep}{status}</div> : null}

    <section aria-label="Resumo dos últimos 30 dias">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi i={1} icon={Wallet} label="Vendas · 30 dias" value={formatBRL(o.sales)} note={o.salesDelta === undefined ? undefined : <Delta value={o.salesDelta} />} />
        <Kpi i={2} icon={ShoppingBag} label="Pedidos · 30 dias" value={String(o.last30Count)} note={o.countDelta === undefined ? undefined : <Delta value={o.countDelta} />} />
        <Kpi i={3} icon={Users} label="Clientes" value={String(o.customers)} />
        <Kpi i={4} icon={Package} label="Ticket médio" value={ticket === null ? "—" : formatBRL(ticket)} />
      </div>
      <p className="mt-2 px-1 text-xs text-muted-foreground">{noPrev ? "Variações aparecem quando houver 30 dias anteriores para comparar." : "Variação em relação aos 30 dias anteriores."}{ticket === null ? " O ticket médio aparece após o primeiro pedido." : ""}</p>
    </section>

    {!firstAccess ? <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
      {operational.length || next ? <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={stagger(5)} aria-labelledby="cm-att">
        <h2 id="cm-att" className="text-base font-semibold tracking-[-.01em]">O que precisa de você</h2>
        <ol className="mt-3 divide-y divide-border">{[...(next ? [next] : []), ...operational].map((item) => { const Icon = item.icon; return <li key={item.key}>
          <Link href={item.href} className="group flex min-h-[64px] items-center gap-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--product-accent-text)]"><Icon className="size-[18px]" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--product-accent-text)]">{item.count}</span>
            <ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" aria-hidden />
          </Link></li>; })}</ol>
      </section> : <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={stagger(5)}><h2 className="text-base font-semibold">O que precisa de você</h2><p className="mt-3 text-sm text-muted-foreground">Tudo em dia. Nenhuma pendência pedindo sua atenção agora.</p></section>}
      {status}
    </div> : null}

    {firstAccess && readiness ? (
      <section className="cm-glass-work cm-enter p-5 sm:p-6" style={stagger(4)} aria-labelledby="cm-first">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Até a primeira venda</p><h2 id="cm-first" className="mt-1 text-base font-semibold tracking-[-.01em]">{readiness.ready ? "Tudo pronto: falta só o primeiro cliente" : "Faltam passos para você vender"}</h2></div><span className="text-sm tabular-nums text-muted-foreground">{reqDone} de {reqTotal} requisitos</span></div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readiness.items.map((i) => <li key={i.key}><Link href={i.fixHref} className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"><span aria-hidden className={i.ok ? "mt-0.5 text-success" : "mt-0.5 text-subtle-foreground"}>{i.ok ? "✓" : "○"}</span><span className="min-w-0"><span className="block font-medium">{i.label}{i.blocking ? "" : " (recomendado)"}</span><span className="block text-xs text-muted-foreground">{i.detail}</span></span></Link></li>)}
        </ul>
      </section>
    ) : null}

    <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="cm-glass-work cm-enter p-5 sm:p-6" style={stagger(6)} aria-labelledby="cm-orders">
        <div className="mb-3 flex items-end justify-between"><h2 id="cm-orders" className="text-base font-semibold tracking-[-.01em]">Pedidos recentes</h2>{o.recentOrders.length ? <Link href="/merchant/orders" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--product-accent-text)]">Ver todos <ArrowRight className="size-4" aria-hidden /></Link> : null}</div>
        {o.recentOrders.length ? <OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName: store.name, storeSlug: store.slug }))} basePath="/merchant/orders" showStore={false} showCentral={!o.independent} />
          : <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-5"><p className="max-w-sm text-sm text-muted-foreground">Os pedidos da vitrine e as vendas manuais aparecem aqui assim que existirem.</p><Link href="/merchant/orders/new" className={buttonVariants({ variant: "secondary" })}><Plus />Registrar venda manual</Link></div>}
      </section>

      <div className="space-y-5 sm:space-y-6">
        <section className="cm-glass-fn cm-enter p-5 sm:p-6" style={stagger(7)} aria-labelledby="cm-quick">
          <h2 id="cm-quick" className="text-base font-semibold tracking-[-.01em]">Ações rápidas</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">{QUICK.map((q) => { const Icon = q.icon; return <li key={q.href}><Link href={q.href} className="cm-lift flex min-h-[64px] flex-col items-start justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium"><Icon className="size-[18px] text-[var(--product-accent-text)]" aria-hidden />{q.label}</Link></li>; })}</ul>
        </section>
        <section className="cm-glass-fn cm-warm cm-enter p-5 sm:p-6" style={stagger(8)} aria-labelledby="cm-themes">
          <div className="flex items-end justify-between"><h2 id="cm-themes" className="cm-warm-title text-base font-semibold tracking-[-.01em]">Aparência da loja</h2><Link href="/merchant/templates" className="cm-warm-title inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold">Ver temas <ArrowRight className="size-4" aria-hidden /></Link></div>
          <ul className="mt-1 grid grid-cols-3 gap-2.5">{THEMES.map((t) => <li key={t.key}><Link href="/merchant/templates" className="cm-lift block overflow-hidden rounded-xl border border-border bg-surface"><Image src={themeShot(t.key, "desktop")} alt={`Tema ${t.name}`} width={240} height={150} className="aspect-[8/5] w-full object-cover object-top" /><span className="block px-2 py-1.5 text-xs font-medium">{t.name}</span></Link></li>)}</ul>
        </section>
      </div>
    </div>
  </div>;
}
