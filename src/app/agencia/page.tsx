import Link from "next/link";
import { AlarmClock, ArrowRight, CalendarClock, CheckCircle2, Clapperboard, ContactRound, HandCoins, Hourglass, Inbox, Receipt, Scissors, UserRoundX, UsersRound, FileWarning, Plus } from "lucide-react";
import { CartaoClienteMes } from "@/components/agencia/producao";
import { minhaFila, producaoDoMes } from "@/lib/agencias/producao";
import { mesRotulo } from "@/lib/agencias/fluxo";
import { listarOportunidades, resumoDoFunil } from "@/lib/agencias/comercial";
import { pendenciasDeCobranca } from "@/lib/agencias/cobranca";
import { solicitacoesDaAgencia } from "@/lib/agencias/portal";
import { contatosSemResposta } from "@/lib/agencias/captacao";
import { ChaveModoDemo } from "@/components/agencia/modo-demo";
import { escopoDaAgencia } from "@/lib/agencias/acesso";
import { hojeEmSaoPaulo } from "@/lib/agencias/clientes";
import { Handshake, MessageSquare } from "lucide-react";
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
  const db = await getDb();
  const [k, prod, fila, oportunidades] = await Promise.all([cockpitDaAgencia(db, session.actor), producaoDoMes(db, session.actor), minhaFila(db, session.actor), listarOportunidades(db, session.actor).catch(() => [])]);
  const cob = await pendenciasDeCobranca(db, session.actor);
  const demo = !!(await escopoDaAgencia(db, session.actor)).agencia.demoDeId;
  const pedidos = await solicitacoesDaAgencia(db, session.actor, { abertas: true });
  const novosSite = await contatosSemResposta(db, session.actor);
  const funil = resumoDoFunil(oportunidades, hojeEmSaoPaulo());
  const t = prod.total;
  const piores = [...prod.clientes].sort((a, b) => b.contagem.atrasadas - a.contagem.atrasadas || a.contagem.percentualPublicado - b.contagem.percentualPublicado).slice(0, 8);
  const pend = k.pendencias;
  const filaDia = [
    ...(novosSite.length ? [{ key: "site", icon: Handshake, title: "Novos contatos pela página de captação", detail: `${novosSite[0]!.empresa}${novosSite.length > 1 ? ` e mais ${novosSite.length - 1}` : ""} esperando resposta. Responder rápido aumenta a chance de fechar.`, count: novosSite.length, action: "Responder", href: novosSite.length === 1 ? `/agencia/comercial/${novosSite[0]!.id}` : "/agencia/comercial", danger: false }] : []),
    ...(pedidos.length ? [{ key: "ped", icon: MessageSquare, title: "Pedidos de clientes pelo portal", detail: `${pedidos[0]!.clienteNome}: "${pedidos[0]!.texto.slice(0, 70)}${pedidos[0]!.texto.length > 70 ? "…" : ""}"`, count: pedidos.length, action: "Responder", href: pedidos.length === 1 ? `/agencia/atendimento/${pedidos[0]!.id}` : "/agencia/atendimento", danger: false }] : []),
    ...(cob.atrasadas ? [{ key: "cob", icon: CalendarClock, title: "Cobranças em atraso", detail: `${formatBRL(cob.atrasadoCents)} vencidos e não pagos.`, count: cob.atrasadas, action: "Cobrar", href: "/agencia/financeiro", danger: true }] : []),
    ...(cob.lembrar ? [{ key: "lem", icon: CalendarClock, title: "Lembrar clientes da cobrança hoje", detail: "A mensagem do WhatsApp já vem pronta no Financeiro.", count: cob.lembrar, action: "Ver", href: "/agencia/financeiro", danger: false }] : []),
    ...(funil.hoje + funil.atrasadas ? [{ key: "com", icon: Handshake, title: "Atividades comerciais para hoje", detail: `${funil.hoje} para hoje${funil.atrasadas ? ` e ${funil.atrasadas} atrasada${funil.atrasadas > 1 ? "s" : ""}` : ""} no funil comercial.`, count: funil.hoje + funil.atrasadas, action: "Ver", href: "/agencia/comercial", danger: funil.atrasadas > 0 }] : []),
    ...(t.atrasadas ? [{ key: "atr", icon: AlarmClock, title: "Peças atrasadas", detail: "Passaram do prazo da etapa. Veja com quem estão e redistribua se precisar.", count: t.atrasadas, action: "Ver", href: "/agencia/producao?atrasadas=1&ver=lista", danger: true }] : []),
    ...(t.aguardandoAprovacao ? [{ key: "apr", icon: Hourglass, title: "Aguardando aprovação do cliente", detail: "Conteúdos prontos esperando o cliente aprovar.", count: t.aguardandoAprovacao, action: "Ver", href: "/agencia/producao?etapa=APROVACAO&ver=lista", danger: false }] : []),
    ...(t.faltaPlanejar && k.verCarteiraToda ? [{ key: "plan", icon: Clapperboard, title: "Conteúdos contratados ainda não planejados", detail: `O pacote de ${mesRotulo(prod.mes)} pede mais peças do que as planejadas.`, count: t.faltaPlanejar, action: "Planejar", href: "/agencia/producao", danger: false }] : []),
    ...(k.verValores && k.vencimentos.length ? [{ key: "venc", icon: CalendarClock, title: "Vencimentos da semana", detail: `${k.vencimentos.slice(0, 3).map((v) => `${v.nome} (${ddmm(v.data)})`).join(", ")}${k.vencimentos.length > 3 ? "…" : ""}. A cobrança automática chega na próxima etapa do piloto.`, count: k.vencimentos.length, action: "Ver lista", href: "#vencimentos", danger: false }] : []),
    ...(pend.semResponsavel.length ? [{ key: "resp", icon: UserRoundX, title: "Clientes sem responsável", detail: "Sem alguém da equipe cuidando, o trabalho do mês fica sem dono.", count: pend.semResponsavel.length, action: "Definir", href: `/agencia/clientes/${pend.semResponsavel[0]!.id}`, danger: true }] : []),
    ...(pend.semContrato.length ? [{ key: "contr", icon: FileWarning, title: "Contratos sem valor ou vencimento", detail: "Complete para a agência saber o que entra e quando.", count: pend.semContrato.length, action: "Completar", href: `/agencia/clientes/${pend.semContrato[0]!.id}`, danger: false }] : []),
    ...(pend.semContato.length ? [{ key: "cont", icon: ContactRound, title: "Clientes sem WhatsApp nem e-mail", detail: "Sem contato não dá para avisar de gravação, aprovação ou cobrança.", count: pend.semContato.length, action: "Completar", href: `/agencia/clientes/${pend.semContato[0]!.id}`, danger: false }] : []),
  ];
  const maxCarga = Math.max(1, ...k.carga.map((p) => p.clientes));
  // Conta nova (D316): enquanto a carteira estiver vazia, o painel mostra os primeiros passos no lugar de números zerados.
  const semCarteira = k.verCarteiraToda && k.ativos === 0 && k.pausados === 0;
  const passos = [
    { titulo: "Monte a equipe", detalhe: "Cada pessoa com login próprio e a função dela: gestor, roteiro, gravação, edição, social media, tráfego, financeiro.", href: "/agencia/equipe", feito: k.carga.length > 1 },
    { titulo: "Traga a carteira de clientes", detalhe: "Cole a planilha ou cadastre um a um, com o pacote do mês, o valor e o vencimento.", href: "/agencia/clientes", feito: k.ativos > 0 },
    { titulo: "Defina quem cuida de cada cliente", detalhe: "Na ficha do cliente, marque o responsável e a equipe: é ela que recebe cada etapa da produção.", href: pend.semResponsavel[0] ? `/agencia/clientes/${pend.semResponsavel[0].id}` : "/agencia/clientes", feito: k.ativos > 0 && pend.semResponsavel.length === 0 },
    { titulo: "Planeje o mês", detalhe: "Em Produção, \"Planejar o mês\" cria as peças pelo pacote de cada cliente.", href: "/agencia/producao", feito: t.planejadas > 0 },
  ];
  const feitos = passos.filter((x) => x.feito).length;
  const mostrarPassos = k.verCarteiraToda && feitos < passos.length && !demo;
  return (
    <div className="mx-auto max-w-[1240px] space-y-5 sm:space-y-6">
      <section className="ds-hero ds-enter px-5 py-6 sm:px-10 sm:py-9">
        <div className="ds-hero-stage" aria-hidden><span className="ds-blade ds-blade--c" /><span className="ds-blade ds-blade--a" /><span className="ds-blade ds-blade--b" /></div>
        <div className="relative max-w-[60%] max-sm:max-w-none">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--ds-link)]">Visão geral da agência</p>
          <h1 className="mt-2 text-[clamp(1.75rem,4.2vw,2.75rem)] font-semibold leading-[1.05] tracking-[-.04em]">{saudacao()}, {session.user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">{k.agencia.nome}</span> · {FUNCAO_ROTULO[k.funcao]}</p>
          {k.funcao === "ADMIN" && !demo ? <div className="mt-3"><ChaveModoDemo ligado={false} /></div> : null}
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

      {mostrarPassos ? (
        <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(2)} aria-labelledby="ag-passos">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Primeiros passos</p><h2 id="ag-passos" className="mt-1 text-base font-semibold tracking-[-.01em]">{feitos === 0 ? "Vamos montar a sua agência aqui dentro" : "Falta pouco para a agência rodar pelo painel"}</h2></div><span className="text-sm tabular-nums text-muted-foreground">{feitos} de {passos.length} feitos</span></div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {passos.map((x, n) => <li key={x.titulo}><Link href={x.href} className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-surface-hover"><span aria-hidden className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${x.feito ? "bg-success-soft text-success" : "bg-accent-soft text-[var(--ds-link)]"}`}>{x.feito ? "✓" : n + 1}</span><span className="min-w-0"><span className="block font-medium">{x.titulo}{x.feito ? <span className="sr-only"> (feito)</span> : null}</span><span className="block text-xs text-muted-foreground">{x.detalhe}</span></span></Link></li>)}
          </ol>
        </section>
      ) : null}

      {semCarteira ? null : (<>
      {k.verCarteiraToda ? (
        <section className="ds-card ds-enter p-5 sm:p-6" style={stagger(2)} aria-labelledby="ag-fila">
          <h2 id="ag-fila" className="text-base font-semibold tracking-[-.01em]">Fila do dia</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">O que precisa de você agora, do mais urgente ao menos urgente.</p>
          {filaDia.length ? (
            <ol className="mt-3 divide-y divide-border">{filaDia.map((item) => { const Icon = item.icon; return <li key={item.key}>
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

      {k.verCarteiraToda ? (
        <section aria-labelledby="ag-prod" className="space-y-3">
          <div className="flex items-end justify-between"><h2 id="ag-prod" className="text-base font-semibold tracking-[-.01em]">Produção de {mesRotulo(prod.mes)}</h2><Link href="/agencia/producao" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--ds-link)]">Ver produção <ArrowRight className="size-4" aria-hidden /></Link></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Kpi i={1} icon={Clapperboard} label="Contratados no mês" value={String(t.contratado)} note={`${t.contratadoVideos} vídeos · ${t.planejadas} planejados`} />
            <Kpi i={2} icon={CheckCircle2} label="Publicados" value={`${t.percentualPublicado}%`} note={`${t.publicadas} publicados · ${t.produzidas} produzidos`} />
            <Kpi i={3} icon={Scissors} label="Em edição" value={String(t.emEdicao)} note={`${t.emCaptacao} aguardando gravação · ${t.emRoteiro} em roteiro`} />
            <Kpi i={4} icon={AlarmClock} label="Atrasadas" value={String(t.atrasadas)} note={`${t.aguardandoAprovacao} aguardando aprovação`} />
          </div>
          {piores.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{piores.map((c) => <CartaoClienteMes key={c.clienteId} id={c.clienteId} nome={c.clienteNome} segmento={c.segmento} c={c.contagem} />)}</div> : null}
        </section>
      ) : (
        <Link href="/agencia/fila" className="ds-card ds-lift flex items-center gap-4 !p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-[var(--ds-link)]"><Inbox className="size-[18px]" aria-hidden /></span>
          <span className="min-w-0 flex-1"><b className="block">Minha fila</b><span className="text-sm text-muted-foreground">{fila.length ? `${fila.length} peça${fila.length > 1 ? "s" : ""} com você${fila.some((p) => p.atrasada) ? `, ${fila.filter((p) => p.atrasada).length} atrasada(s)` : ""}` : "Nada com você agora"}</span></span>
          <ArrowRight className="size-4 text-subtle-foreground" aria-hidden />
        </Link>
      )}

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
      </>)}
    </div>
  );
}
