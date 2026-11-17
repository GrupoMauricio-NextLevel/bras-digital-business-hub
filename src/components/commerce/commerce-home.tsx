import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Eye, ExternalLink, Package, Palette, Plus, ShoppingBag, Users, Wallet } from "lucide-react";
import { NumeroVivo, Variacao } from "@/components/vida/numero-vivo";
import { GraficoVendas } from "@/components/graficos/grafico-vendas";
import { RoscaCanais } from "@/components/graficos/rosca-canais";
import { comparaHoje, conversaoConfiavel, fatiasDeCanal, fraseDoPeriodo, miniSerie, serieDoPeriodo, type Periodo } from "@/lib/domain/painel-vivo";
import { OrdersTable } from "@/components/shared/orders-table";
import { StatusBadge } from "@/components/app/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBRL, formatCompactBRL } from "@/lib/money";
import { themeShot } from "@/lib/themes/gallery";
import type { getMerchantOverview } from "@/lib/queries/merchant";
import type { StoreReadiness } from "@/lib/domain/readiness";

type Overview = Awaited<ReturnType<typeof getMerchantOverview>>;
export type Attention = { key: string; title: string; detail: string; count: number; href: string; action: string; icon: LucideIcon; tone?: "danger" | "warning" | "info" };

const THEMES = [{ key: "arena", name: "Arena" }, { key: "editorial", name: "Editorial" }, { key: "signature", name: "Signature" }];
/** Pendências de preparo (cobertas pelo próximo passo e pelo checklist) não se repetem na lista de operação. */
const SETUP_KEYS = new Set(["readiness", "publish", "onboarding"]);

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;


/** Cartão de número do painel Commerce; reaproveitado no Painel da Agência (D313). */
export function Kpi({ icon: Icon, label, value, note, i }: { icon: LucideIcon; label: string; value: string; note?: React.ReactNode; i: number }) {
  return <div className="ds-card ds-kpi-card ds-lift ds-enter !p-3.5 sm:!p-5" style={stagger(i)}>
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-[var(--ds-link)] sm:size-8 sm:rounded-xl"><Icon className="size-4" aria-hidden /></span><span className="truncate">{label}</span></div>
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
export function CommerceHome({ firstName, greeting, store, o, readiness, attention, pulso, negocio, periodo = 30, visitas30 = null, rodape }: {
  firstName: string; greeting: string;
  store: { name: string; slug: string; status: string; publishedAt: Date | string | null };
  o: Overview; readiness: StoreReadiness | null; attention: Attention[];
  /** Pulso da loja (D169): vendas de hoje, pedidos parados e situação, logo abaixo da saudação. */
  pulso?: React.ReactNode;
  /** NextLevel Business (NB1, D306): nome do gerenciador e se o negócio é site (sem vitrine de loja). Ausente = como antes. */
  negocio?: { nome: string; site: boolean };
  /** Painéis com vida (D328): período do gráfico (7 ou 30 dias), visitas dos últimos 30 dias e o que vai ao pé da tela. */
  periodo?: Periodo; visitas30?: number | null; rodape?: React.ReactNode;
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

  const status = <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(3)} aria-labelledby="cm-status">
    <h2 id="cm-status" className="text-base font-semibold tracking-[-.01em]">{negocio?.site ? "Status do site" : "Status da loja"}</h2>
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

  const nextStep = next ? <section className="ds-card ds-enter relative overflow-hidden p-5 sm:p-6" style={stagger(2)} aria-labelledby="cm-next">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--ds-link)]">Próximo passo</p>
    <h2 id="cm-next" className="mt-2 text-xl font-semibold leading-snug tracking-[-.02em]">{next.title}</h2>
    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{next.detail}</p>
    <Link href={next.href} className={buttonVariants({ size: "lg" }) + " mt-5"}>{next.action}<ArrowRight /></Link>
  </section> : <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(2)} aria-labelledby="cm-next">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--ds-link)]">Próximo passo</p>
    <h2 id="cm-next" className="mt-2 text-xl font-semibold tracking-[-.02em]">Sua loja está pronta para vender.</h2>
    <p className="mt-2 text-sm text-muted-foreground">Divulgue o endereço da vitrine ou registre uma venda manual.</p>
    <Link href="/merchant/orders/new" className={buttonVariants({ size: "lg" }) + " mt-5"}><Plus />Novo pedido</Link>
  </section>;

  // Painéis com vida (D328): números do dia e do mês na primeira dobra, com cor por assunto e gráfico com a conclusão.
  const hoje = comparaHoje(o.daily);
  const serie = serieDoPeriodo(o.daily, o.prevDaily, periodo);
  const conv = visitas30 === null ? null : conversaoConfiavel(o.last30Count, visitas30);
  const mini = miniSerie(o.daily);
  const fatias = fatiasDeCanal(o.byChannel);
  const hrefPeriodo = (p: Periodo) => (p === 30 ? "/merchant" : `/merchant?periodo=${p}d`);

  const numeros = <section aria-label="Resumo dos últimos 30 dias">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <NumeroVivo i={1} familia="dinheiro" icone={Wallet} rotulo="Vendas · 30 dias" valor={formatCompactBRL(o.sales)} valorCompleto={formatBRL(o.sales)} variacao={o.salesDelta === undefined ? null : o.salesDelta} serie={mini} href="/merchant/analytics" />
      <NumeroVivo i={2} familia="pedidos" icone={ShoppingBag} rotulo="Pedidos · 30 dias" valor={String(o.last30Count)} variacao={o.countDelta === undefined ? null : o.countDelta} href="/merchant/orders" />
      {conv !== null
        ? <NumeroVivo i={3} familia="visitas" icone={Eye} rotulo="Visitas que viram venda" valor={`${conv.toFixed(1).replace(".", ",")}%`} nota={`${(visitas30 ?? 0).toLocaleString("pt-BR")} visitas`} href="/merchant/analytics" />
        : <NumeroVivo i={3} familia="clientes" icone={Users} rotulo="Clientes" valor={o.customers.toLocaleString("pt-BR")} nota="na base da loja" href="/merchant/customers" />}
      <NumeroVivo i={4} familia="crescimento" icone={Package} rotulo="Ticket médio" valor={ticket === null ? "—" : formatBRL(ticket)} nota={ticket === null ? "aparece após o 1º pedido" : "por pedido pago"} />
    </div>
    <p className="mt-2 px-1 text-xs text-muted-foreground">{noPrev ? "As variações aparecem quando houver 30 dias anteriores para comparar." : "Variação em relação aos 30 dias anteriores."}</p>
  </section>;

  const grafico = <GraficoVendas titulo={fraseDoPeriodo(serie, periodo)} atual={serie.atual} anterior={serie.anterior} total={serie.totalAtual} delta={serie.delta} melhor={serie.melhor} periodo={periodo} hrefPeriodo={hrefPeriodo} />;

  const fila = operational.length || next ? <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(6)} aria-labelledby="cm-att">
    <h2 id="cm-att" className="text-base font-semibold tracking-[-.01em]">Fila do dia</h2>
    <p className="mt-0.5 text-xs text-muted-foreground">O que precisa de você agora, do mais urgente ao menos urgente.</p>
    <ol className="mt-3 divide-y divide-border">{[...(next ? [next] : []), ...operational].slice(0, 6).map((item) => { const Icon = item.icon; return <li key={item.key}>
      <Link href={item.href} className="group flex min-h-[60px] items-center gap-3 py-2.5">
        <span className={item.tone === "danger" ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger" : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--ds-link)]"}><Icon className="size-[18px]" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span>
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">{item.count}</span>
        <ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" aria-hidden />
      </Link></li>; })}</ol>
    {operational.length + (next ? 1 : 0) > 6 ? <Link href="/merchant/orders" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ds-link)]">Ver tudo <ArrowRight className="size-4" aria-hidden /></Link> : null}
  </section> : <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(6)}><h2 className="text-base font-semibold">Fila do dia</h2><p className="mt-3 text-sm text-muted-foreground">Tudo em dia. Nenhuma pendência pedindo sua atenção agora.</p></section>;

  return <div className="mx-auto max-w-[1240px] space-y-5 sm:space-y-6">
    {/* Abertura compacta (D328): saudação à esquerda, o número de hoje em destaque à direita. */}
    <section className="ds-hero ds-enter !py-5 px-5 sm:!py-6 sm:px-8">
      <div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">{negocio ? `${negocio.nome} · Visão geral` : "Visão geral da loja"}</p>
          <h1 className="mt-1.5 text-[clamp(1.5rem,3.2vw,2.25rem)] font-semibold leading-[1.05] tracking-[-.04em]">{greeting}, {firstName}.</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs"><span className="text-sm font-medium">{store.name}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-line)] bg-[var(--glass-fn)] px-2.5 py-0.5 font-medium">{store.status === "ACTIVE" ? "Conta ativa" : <StatusBadge value={store.status} dot />}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-line)] bg-[var(--glass-fn)] px-2.5 py-0.5 font-medium"><span aria-hidden className={`size-1.5 rounded-full ${published ? "bg-success" : "bg-subtle-foreground"}`} />{negocio?.site ? (published ? "Site publicado" : "Site ainda não publicado") : published ? "Loja publicada" : "Loja ainda não publicada"}</span>
          </p>
          {pulso}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={"/store/" + store.slug} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}><ExternalLink />{negocio?.site ? "Ver site" : "Ver loja"}</a>
            {negocio?.site ? <Link href="/theme-editor" className={buttonVariants({ size: "sm" })}>Editar o site</Link> : <Link href="/merchant/orders/new" className={buttonVariants({ size: "sm" })}><Plus />Novo pedido</Link>}
          </div>
        </div>
        {negocio?.site ? null : <div className="min-w-0 text-left sm:text-right" aria-label="Vendas de hoje">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em]"><span className="vida-aovivo" aria-hidden />Hoje</p>
          <p className="mt-1 text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-none tracking-[-.045em] tabular-nums" style={{ fontFamily: "var(--nl-font-display)" }}>{formatBRL(hoje.hojeCents)}</p>
          <p className="mt-1.5 text-xs">{o.today.orders === 1 ? "1 venda paga" : `${o.today.orders} vendas pagas`}{hoje.delta !== null ? <> · <Variacao valor={hoje.delta} base={`vs. ${hoje.rotuloBase}`} /></> : null}</p>
        </div>}
      </div>
    </section>

    {numeros}

    {firstAccess ? <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">{nextStep}{status}</div>
      : <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.45fr_1fr]">{grafico}{fila}</div>}

    {firstAccess && readiness ? (
      <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(4)} aria-labelledby="cm-first">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Até a primeira venda</p><h2 id="cm-first" className="mt-1 text-base font-semibold tracking-[-.01em]">{readiness.ready ? "Tudo pronto: falta só o primeiro cliente" : "Faltam passos para você vender"}</h2></div><span className="text-sm tabular-nums text-muted-foreground">{reqDone} de {reqTotal} requisitos</span></div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readiness.items.map((i) => <li key={i.key}><Link href={i.fixHref} className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"><span aria-hidden className={i.ok ? "mt-0.5 text-success" : "mt-0.5 text-subtle-foreground"}>{i.ok ? "✓" : "○"}</span><span className="min-w-0"><span className="block font-medium">{i.label}{i.blocking ? "" : " (recomendado)"}</span><span className="block text-xs text-muted-foreground">{i.detail}</span></span></Link></li>)}
        </ul>
      </section>
    ) : null}

    {firstAccess ? <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.45fr_1fr]">{grafico}{fila}</div>
      : <div className={`grid gap-5 sm:gap-6 ${fatias.length ? "lg:grid-cols-2" : ""}`}>{status}<RoscaCanais fatias={fatias} total={o.sales} /></div>}

    <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(6)} aria-labelledby="cm-orders">
        <div className="mb-3 flex items-end justify-between"><h2 id="cm-orders" className="text-base font-semibold tracking-[-.01em]">Pedidos recentes</h2>{o.recentOrders.length ? <Link href="/merchant/orders" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ds-link)]">Ver todos <ArrowRight className="size-4" aria-hidden /></Link> : null}</div>
        {o.recentOrders.length ? <OrdersTable rows={o.recentOrders.map((order) => ({ order, storeName: store.name, storeSlug: store.slug }))} basePath="/merchant/orders" showStore={false} showCentral={!o.independent} />
          : <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-5"><p className="max-w-sm text-sm text-muted-foreground">Os pedidos da vitrine e as vendas manuais aparecem aqui assim que existirem.</p><Link href="/merchant/orders/new" className={buttonVariants({ variant: "secondary" })}><Plus />Registrar venda manual</Link></div>}
      </section>

      <div className="space-y-5 sm:space-y-6">
        <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(7)} aria-labelledby="cm-quick">
          <h2 id="cm-quick" className="text-base font-semibold tracking-[-.01em]">Ações rápidas</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2.5">{QUICK.map((q) => { const Icon = q.icon; return <li key={q.href}><Link href={q.href} className="ds-lift flex min-h-[64px] flex-col items-start justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium"><Icon className="size-[18px] text-[var(--ds-link)]" aria-hidden />{q.label}</Link></li>; })}</ul>
        </section>
        <section className="ds-card ds-warm ds-enter p-5 sm:p-6" style={stagger(8)} aria-labelledby="cm-themes">
          <div className="flex items-end justify-between"><h2 id="cm-themes" className="ds-warm-title text-base font-semibold tracking-[-.01em]">Aparência da loja</h2><Link href="/merchant/templates" className="ds-warm-title inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold">Ver temas <ArrowRight className="size-4" aria-hidden /></Link></div>
          <ul className="mt-1 grid grid-cols-3 gap-2.5">{THEMES.map((t) => <li key={t.key}><Link href="/merchant/templates" className="ds-lift block overflow-hidden rounded-xl border border-border bg-surface"><Image src={themeShot(t.key, "desktop")} alt={`Tema ${t.name}`} width={240} height={150} className="aspect-[8/5] w-full object-cover object-top" /><span className="block px-2 py-1.5 text-xs font-medium">{t.name}</span></Link></li>)}</ul>
        </section>
      </div>
    </div>
    {rodape}
  </div>;
}
