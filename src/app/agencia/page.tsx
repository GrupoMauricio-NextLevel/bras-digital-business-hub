import Link from "next/link";
import { ArrowRight, CalendarClock, ContactRound, HandCoins, Receipt, UserRoundX, UsersRound, FileWarning, Plus } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { Kpi } from "@/components/commerce/commerce-home";
import { buttonVariants } from "@/components/ui/button";
import { cockpitDaAgencia, inclusoTexto } from "@/lib/agencias/clientes";
import { FUNCAO_ROTULO } from "@/lib/agencias/acesso";
import { saudacao } from "@/lib/finance/executivo-regras";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoje na agência" };

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const quando = (dias: number) => (dias === 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `vence em ${dias} dias`);
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;
const chip = "inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-line)] bg-[var(--glass-fn)] px-2.5 py-1 font-medium";

/**
 * Hoje na agência (D313): o cockpit do dono da agência, com a mesma casca e os mesmos componentes da visão geral da
 * NextLevel Commerce (capa roxa, fila do dia, cartões de números). Cada função vê o que é dela.
 */
export default async function HojeNaAgencia() {
  const session = await requireRole("AGENCY");
  const k = await cockpitDaAgencia(await getDb(), session.actor);
  const pend = k.pendencias;
  const fila = [
    ...(k.verValores && k.vencimentos.length ? [{ key: "venc", icon: CalendarClock, title: "Vencimentos da semana", detail: `${k.vencimentos.slice(0, 3).map((v) => `${v.nome} (${ddmm(v.data)})`).join(", ")}${k.vencimentos.length > 3 ? "…" : ""}. A cobrança automática chega na próxima etapa do piloto.`, count: k.vencimentos.length, action: "Ver lista", href: "#vencimentos", danger: false }] : []),
    ...(pend.semResponsavel.length ? [{ key: "resp", icon: UserRoundX, title: "Clientes sem responsável", detail: "Sem alguém da equipe cuidando, o trabalho do mês fica sem dono.", count: pend.semResponsavel.length, action: "Definir", href: `/agencia/clientes/${pend.semResponsavel[0]!.id}`, danger: true }] : []),
    ...(pend.semContrato.length ? [{ key: "contr", icon: FileWarning, title: "Contratos sem valor ou vencimento", detail: "Complete para a agência saber o que entra e quando.", count: pend.semContrato.length, action: "Completar", href: `/agencia/clientes/${pend.semContrato[0]!.id}`, danger: false }] : []),
    ...(pend.semContato.length ? [{ key: "cont", icon: ContactRound, title: "Clientes sem WhatsApp nem e-mail", detail: "Sem contato não dá para avisar de gravação, aprovação ou cobrança.", count: pend.semContato.length, action: "Completar", href: `/agencia/clientes/${pend.semContato[0]!.id}`, danger: false }] : []),
  ];
  const maxCarga = Math.max(1, ...k.carga.map((p) => p.clientes));
  return (
    <div className="mx-auto max-w-[1240px] space-y-5 sm:space-y-6">
      <section className="ds-hero ds-enter px-5 py-6 sm:px-10 sm:py-9">
        <div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
        <div className="relative max-w-[60%] max-sm:max-w-none">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">Visão geral da agência</p>
          <h1 className="mt-2 text-[clamp(1.75rem,4.2vw,2.75rem)] font-semibold leading-[1.05] tracking-[-.04em]">{saudacao()}, {session.user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{k.agencia.nome}</span> · {FUNCAO_ROTULO[k.funcao]}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {k.agencia.fundadora ? <span className={chip}>Agência Fundadora</span> : null}
            <span className={chip}><span aria-hidden className="size-1.5 rounded-full bg-success" />{k.agencia.situacao === "PILOTO" ? "Piloto em andamento" : "Conta ativa"}</span>
            <span className={chip}>{k.verCarteiraToda ? `${k.ativos} cliente${k.ativos === 1 ? "" : "s"} ativo${k.ativos === 1 ? "" : "s"}` : `${k.meus.length} cliente${k.meus.length === 1 ? "" : "s"} com você`}</span>
            {k.verValores ? <span className={chip}><span className="tabular-nums">{formatBRL(k.receitaContratadaCents ?? 0)}</span> por mês</span> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/agencia/clientes" className={buttonVariants({ variant: "secondary" })}><UsersRound />Ver carteira</Link>
            {k.verCarteiraToda ? <Link href="/agencia/clientes?novo=1" className={buttonVariants()}><Plus />Novo cliente</Link> : null}
          </div>
        </div>
      </section>

      {k.verCarteiraToda ? (
        <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(2)} aria-labelledby="ag-fila">
          <h2 id="ag-fila" className="text-base font-semibold tracking-[-.01em]">Fila do dia</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">O que precisa de você agora, do mais urgente ao menos urgente.</p>
          {fila.length ? (
            <ol className="mt-3 divide-y divide-border">{fila.map((item) => { const Icon = item.icon; return <li key={item.key}>
              <Link href={item.href} className="group flex min-h-[64px] items-center gap-4 py-3">
                <span className={item.danger ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger" : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--ds-link)]"}><Icon className="size-[18px]" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span></span>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">{item.count}</span>
                <span className="hidden text-xs font-bold text-[var(--ds-link)] sm:block">{item.action}</span>
                <ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" aria-hidden />
              </Link></li>; })}</ol>
          ) : <p className="mt-3 text-sm text-muted-foreground">Tudo em dia. Nenhuma pendência pedindo sua atenção agora.</p>}
        </section>
      ) : null}

      {k.verValores ? (
        <section aria-label="Números da agência">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Kpi i={1} icon={UsersRound} label="Clientes ativos" value={String(k.ativos)} note={[k.pausados ? `${k.pausados} pausado${k.pausados > 1 ? "s" : ""}` : "nenhum pausado", k.encerradosNoMes ? `${k.encerradosNoMes} saiu este mês` : "nenhum saiu este mês"].join(" · ")} />
            <Kpi i={2} icon={HandCoins} label="Receita contratada" value={formatBRL(k.receitaContratadaCents ?? 0)} note="por mês, clientes ativos" />
            <Kpi i={3} icon={CalendarClock} label="Vence em 7 dias" value={formatBRL(k.aReceber7DiasCents ?? 0)} note={`${k.vencimentos.length} cobrança${k.vencimentos.length === 1 ? "" : "s"}`} />
            <Kpi i={4} icon={Receipt} label="Ticket médio" value={k.ticketMedioCents ? formatBRL(k.ticketMedioCents) : "—"} note="por cliente ativo" />
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
        {k.verCarteiraToda ? (
          <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(5)} aria-labelledby="ag-carga">
            <div className="flex items-end justify-between"><h2 id="ag-carga" className="text-base font-semibold tracking-[-.01em]">Carga da equipe</h2><Link href="/agencia/equipe" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ds-link)]">Ver equipe <ArrowRight className="size-4" aria-hidden /></Link></div>
            <p className="mt-0.5 text-xs text-muted-foreground">Clientes ativos em que cada pessoa trabalha, como responsável ou na equipe do cliente.</p>
            <ul className="mt-4 space-y-3">
              {k.carga.map((p) => (
                <li key={p.id} className="text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2"><span><span className="font-medium">{p.nome}</span> <span className="text-muted-foreground">· {FUNCAO_ROTULO[p.funcao]}</span></span><span className="text-xs tabular-nums text-muted-foreground">{p.clientes} cliente{p.clientes === 1 ? "" : "s"}{p.responsavel ? ` · responsável por ${p.responsavel}` : ""}</span></div>
                  <div className="mt-1.5 h-2 rounded-full bg-accent-soft" aria-hidden><div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${Math.round((p.clientes / maxCarga) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {k.verValores ? (
          <section id="vencimentos" className="ds-card ds-enter p-5 sm:p-6" style={stagger(6)} aria-labelledby="ag-venc">
            <h2 id="ag-venc" className="text-base font-semibold tracking-[-.01em]">Vencimentos da semana</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Pelos contratos dos clientes ativos.</p>
            {k.vencimentos.length ? (
              <ul className="mt-3 divide-y divide-border">
                {k.vencimentos.map((v) => (
                  <li key={v.id}><Link href={`/agencia/clientes/${v.id}`} className="flex min-h-[56px] items-center gap-3 py-2.5">
                    <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-xs font-semibold tabular-nums text-[var(--ds-link)]">{ddmm(v.data)}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{v.nome}</span><span className="block text-xs text-muted-foreground">{quando(v.emDias)}</span></span>
                    <span className="text-sm font-semibold tabular-nums">{formatBRL(v.valorCents)}</span>
                  </Link></li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Nenhum vencimento nos próximos 7 dias.</p>}
          </section>
        ) : null}

        {k.meus.length || !k.verCarteiraToda ? (
          <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(7)} aria-labelledby="ag-meus">
            <h2 id="ag-meus" className="text-base font-semibold tracking-[-.01em]">Seus clientes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Onde você é responsável ou faz parte da equipe.</p>
            {k.meus.length ? (
              <ul className="mt-3 divide-y divide-border">
                {k.meus.map((c) => <li key={c.id}><Link href={`/agencia/clientes/${c.id}`} className="group flex min-h-[56px] items-center gap-3 py-2.5"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--ds-link)]"><UsersRound className="size-[18px]" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{c.nome}</span><span className="block text-xs text-muted-foreground">{[c.pacote, inclusoTexto(c.incluso)].filter(Boolean).join(" · ") || "sem pacote definido"}</span></span><ArrowRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-1" aria-hidden /></Link></li>)}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Quando o administrador colocar você como responsável ou na equipe de um cliente, ele aparece aqui.</p>}
          </section>
        ) : null}
      </div>
    </div>
  );
}
