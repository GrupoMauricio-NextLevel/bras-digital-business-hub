import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, LockOpen, Zap } from "lucide-react";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { caixaDaSemana, caixaDoDia, listaDeLancamentos, opcoesDoCaixa, podeOperarCaixa, type LinhaDoCaixa } from "@/lib/domain/caixa";
import { MEIOS, NOME_DA_ORIGEM, NOME_DO_DESTINO, NOME_DO_MEIO, ORIGENS, ehData, somarDias, type Destino, type Meio, type Origem } from "@/lib/finance/caixa-regras";
import { formatBRL } from "@/lib/money";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { LinkTabs } from "@/components/app/link-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { AbrirCaixa, AcoesDaAssinatura, AcoesDoLancamento, EstornarRecebimento, FecharCaixa, NovoLancamento, ReabrirCaixa, ReceberAssinatura } from "./caixa-forms";
import { FILTROS_ASSINATURA, NOME_DO_FILTRO, historicoDaLoja, painelDeAssinaturas, type FiltroAssinatura } from "@/lib/domain/assinaturas-master";
import { commercePlansView } from "@/lib/domain/commerce-plans";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caixa" };

type Busca = { aba?: string; data?: string; de?: string; ate?: string; meio?: string; origem?: string; filtro?: string; loja?: string };
const dataBR = (d: string) => d.split("-").reverse().join("/");
const DIA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const diaDaSemana = (d: string) => DIA_SEMANA[new Date(`${d}T12:00:00Z`).getUTCDay()]!;
const hora = (iso: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Caixa do Master (CX1, D269): abre e fecha por dia, cada real com o meio de onde veio, edição sempre com motivo. */
export default async function CaixaPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  if (!podeOperarCaixa(session.actor)) redirect("/master/receita");
  const sp = await searchParams;
  const db = await getDb();
  const aba = sp.aba === "semana" ? "semana" : sp.aba === "lancamentos" ? "lancamentos" : sp.aba === "assinaturas" ? "assinaturas" : "hoje";
  const [opcoes, painel, vitrine] = await Promise.all([opcoesDoCaixa(db, session.actor), painelDeAssinaturas(db, session.actor), commercePlansView(db)]);
  const planos = vitrine.plans.filter((p) => !p.quote).map((p) => ({ key: p.key, name: p.name, monthlyCents: p.monthlyCents, annualCents: p.annualCents }));
  const lojas = painel.linhas.map((l) => ({ id: l.storeId, nome: l.loja, productKey: l.productKey, ciclo: l.ciclo })).sort((a, b) => a.nome.localeCompare(b.nome));
  const dia = await caixaDoDia(db, session.actor, sp.data && ehData(sp.data) ? sp.data : undefined);
  const url = (p: Busca) => `/master/receita/caixa?${new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString()}`;

  return (
    <>
      <PageHeader eyebrow="Receita" title="Caixa" description="Abra o caixa de manhã, lance o que entrou e saiu com o meio certo e feche contando a gaveta. O Mercado Pago entra sozinho." />
      <LinkTabs label="Caixa" active={aba} items={[{ key: "hoje", label: dia.data === dia.hoje ? "Hoje" : `Dia ${dataBR(dia.data)}`, href: url({ data: sp.data }) }, { key: "semana", label: "Semana", href: url({ aba: "semana", data: sp.data }) }, { key: "assinaturas", label: `Assinaturas${painel.contagem.vencidas + painel.contagem.vencendo ? ` · ${painel.contagem.vencidas + painel.contagem.vencendo}` : ""}`, href: url({ aba: "assinaturas" }) }, { key: "lancamentos", label: "Lançamentos", href: url({ aba: "lancamentos" }) }]} />
      {aba === "hoje" ? <Dia dia={dia} opcoes={opcoes} url={url} receber={<ReceberAssinatura lojas={lojas} planos={planos} parceiros={opcoes.parceiros} lojaInicial={sp.loja} />} /> : aba === "assinaturas" ? <Assinaturas painel={painel} planos={planos} filtro={(FILTROS_ASSINATURA as readonly string[]).includes(sp.filtro ?? "") ? (sp.filtro as FiltroAssinatura) : "todas"} historico={sp.loja ? await historicoDaLoja(db, session.actor, sp.loja) : null} url={url} /> : aba === "semana" ? <Semana d={await caixaDaSemana(db, session.actor, dia.data)} url={url} /> : <Lancamentos l={await listaDeLancamentos(db, session.actor, { de: ehData(sp.de ?? "") ? sp.de : undefined, ate: ehData(sp.ate ?? "") ? sp.ate : undefined, meio: (MEIOS as readonly string[]).includes(sp.meio ?? "") ? (sp.meio as Meio) : undefined, origem: (ORIGENS as readonly string[]).includes(sp.origem ?? "") ? (sp.origem as Origem) : undefined })} sp={sp} />}
    </>
  );
}

type Dia = Awaited<ReturnType<typeof caixaDoDia>>;
type Opcoes = Awaited<ReturnType<typeof opcoesDoCaixa>>;

function Dia({ dia, opcoes, url, receber }: { dia: Dia; opcoes: Opcoes; url: (p: Busca) => string; receber: React.ReactNode }) {
  const r = dia.resumo;
  const aberto = dia.dia?.status === "ABERTO";
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1" aria-label="Escolher o dia">
          <Link href={url({ data: somarDias(dia.data, -1) })} className="ds-btn ds-btn--sm ds-btn--secondary" aria-label="Dia anterior"><ChevronLeft className="size-4" aria-hidden /></Link>
          <span className="px-2 text-sm font-semibold tabular-nums">{diaDaSemana(dia.data)}, {dataBR(dia.data)}</span>
          {dia.data < dia.hoje ? <Link href={url({ data: somarDias(dia.data, 1) })} className="ds-btn ds-btn--sm ds-btn--secondary" aria-label="Próximo dia"><ChevronRight className="size-4" aria-hidden /></Link> : null}
          {dia.data !== dia.hoje ? <Link href={url({})} className="ds-btn ds-btn--sm">Hoje</Link> : null}
        </nav>
        {dia.dia ? <Badge tone={aberto ? "success" : "outline"}>{aberto ? <><LockOpen className="size-3.5" aria-hidden /> Caixa aberto</> : <><Lock className="size-3.5" aria-hidden /> Caixa fechado</>}</Badge> : <Badge tone="warning">Caixa não aberto</Badge>}
      </div>

      <section className="ds-kpis" aria-label="Números do dia">
        <MetricCard label="Entradas" value={formatBRL(r.entradasCents)} hint={`${r.quantidade} lançamento${r.quantidade === 1 ? "" : "s"}`} tone="success" />
        <MetricCard label="Saídas" value={formatBRL(r.saidasCents)} hint="sangrias, comissões e ajustes" />
        <MetricCard label="Saldo do dia" value={formatBRL(r.saldoCents)} hint="entradas menos saídas, todos os meios" />
        <MetricCard label="Dinheiro na gaveta" value={formatBRL(dia.dia?.status === "FECHADO" ? dia.dia.contadoCents ?? 0 : r.esperadoGavetaCents)} hint={dia.dia?.status === "FECHADO" ? `contado · esperado ${formatBRL(dia.dia.esperadoCents ?? 0)}` : `esperado · começou com ${formatBRL(dia.dia?.saldoInicialCents ?? 0)}`} tone={dia.dia?.diferencaCents ? "warning" : "neutral"} />
      </section>

      {dia.porDestino.length ? <PorDestino titulo="Por conta de destino" itens={dia.porDestino} /> : null}
      {r.porMeio.length ? (
        <section className="ds-card p-5" aria-labelledby="meios-t">
          <h2 id="meios-t" className="text-base font-semibold">Por meio de pagamento</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {r.porMeio.map((m) => <li key={m.meio} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"><span className="font-medium">{NOME_DO_MEIO[m.meio]}</span><span className="tabular-nums"><span className="text-success">+{formatBRL(m.entradasCents)}</span>{m.saidasCents ? <span className="text-danger"> −{formatBRL(m.saidasCents)}</span> : null}</span></li>)}
          </ul>
        </section>
      ) : null}

      {!dia.dia ? (
        dia.data <= dia.hoje ? <section className="ds-card p-5" aria-labelledby="abrir-t"><h2 id="abrir-t" className="mb-3 text-base font-semibold">Abrir o caixa de {dataBR(dia.data)}</h2><AbrirCaixa data={dia.data} sugestaoCents={dia.sugestaoCents} /></section> : null
      ) : aberto ? (<>
        {dia.data === dia.hoje ? <section className="ds-card p-5" aria-labelledby="receber-t"><h2 id="receber-t" className="mb-1 text-base font-semibold">Receber assinatura</h2><p className="mb-3 text-sm text-muted-foreground">Pagamento fora do checkout online: renova, libera a loja e lança no caixa de uma vez.</p>{receber}</section> : null}
        <section className="ds-card p-5" aria-labelledby="novo-t"><h2 id="novo-t" className="mb-1 text-base font-semibold">Template, serviço adicional, outros ou saída</h2><p className="mb-3 text-sm text-muted-foreground">Toda entrada fica ligada ao que foi pago; em &quot;Outros&quot;, escreva o que é.</p><NovoLancamento data={dia.data} opcoes={opcoes} /></section>
      </>) : null}

      <section className="ds-card" aria-labelledby="lanc-t">
        <SectionTitle title="Lançamentos do dia" description="Errou? Edite ou estorne com o motivo: nada se apaga e tudo fica no histórico." />
        <h2 id="lanc-t" className="sr-only">Lançamentos do dia</h2>
        {dia.linhas.length ? <Tabela linhas={dia.linhas} opcoes={aberto || dia.dono ? opcoes : null} /> : <EmptyState compact title="Nada lançado neste dia" description={dia.dia ? "Use o formulário acima para lançar entradas e saídas." : "Abra o caixa para começar a lançar."} />}
      </section>

      {dia.dia ? (
        <section className="ds-card p-5" aria-labelledby="fechar-t">
          <h2 id="fechar-t" className="mb-3 text-base font-semibold">{aberto ? "Fechar o caixa" : "Fechamento"}</h2>
          {aberto ? <FecharCaixa key={r.esperadoGavetaCents} data={dia.data} esperadoCents={r.esperadoGavetaCents} /> : (
            <div className="grid gap-3 text-sm">
              <p>Contado <b className="tabular-nums">{formatBRL(dia.dia.contadoCents ?? 0)}</b> · esperado <b className="tabular-nums">{formatBRL(dia.dia.esperadoCents ?? 0)}</b> · {dia.dia.diferencaCents ? <b className={dia.dia.diferencaCents > 0 ? "text-warning" : "text-danger"}>{dia.dia.diferencaCents > 0 ? "sobrou" : "faltou"} {formatBRL(Math.abs(dia.dia.diferencaCents))}</b> : <b className="text-success">bateu</b>}{dia.dia.motivoDiferenca ? <> · motivo: {dia.dia.motivoDiferenca}</> : null}</p>
              {dia.dono ? <div><ReabrirCaixa data={dia.data} /></div> : <p className="text-muted-foreground">Dia fechado: só o dono reabre.</p>}
            </div>
          )}
          {dia.historico.length ? <ol className="mt-4 grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground" aria-label="Histórico do dia">{dia.historico.map((h, i) => <li key={i}>{hora(h.quando)} · <b className="text-foreground">{({ ABRIR: "Abriu", FECHAR: "Fechou", REABRIR: "Reabriu", LANCAR: "Lançou", EDITAR: "Editou", ESTORNAR: "Estornou" } as const)[h.acao]}</b>{h.quem ? ` · ${h.quem}` : ""}{h.motivo ? ` · ${h.motivo}` : ""}</li>)}</ol> : null}
        </section>
      ) : null}
    </div>
  );
}

function Tabela({ linhas, opcoes, mostraData }: { linhas: LinhaDoCaixa[]; opcoes: Opcoes | null; mostraData?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {linhas.map((l) => (
        <li key={l.id} className={`grid gap-2 py-3 ${l.estornado ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground tabular-nums">{mostraData ? `${dataBR(l.data)} · ` : ""}{hora(l.ocorridoEm)} · {NOME_DA_ORIGEM[l.origem]}{l.quem ? ` · por ${l.quem}` : ""}</p>
              <p className={`font-semibold ${l.estornado ? "line-through" : ""}`}>{l.descricao || NOME_DA_ORIGEM[l.origem]}</p>
              <p className="flex flex-wrap gap-1.5 pt-1 text-xs">
                <Badge tone={l.meio === "DINHEIRO" ? "warning" : l.meio === "MERCADO_PAGO" ? "info" : "outline"}>{l.automatico ? <Zap className="size-3" aria-hidden /> : null}{NOME_DO_MEIO[l.meio]}</Badge>
                {l.destino ? <Badge tone="outline">→ {NOME_DO_DESTINO[l.destino]}</Badge> : null}
                {l.loja ? <Badge tone="outline">{l.loja}</Badge> : null}
                {l.parceiro ? <Badge tone="outline">{l.parceiro}</Badge> : null}
                {l.editado ? <Badge tone="outline">editado</Badge> : null}
                {l.estornado ? <Badge tone="danger">estornado{l.estornoMotivo ? `: ${l.estornoMotivo}` : ""}</Badge> : null}
                {l.automatico ? <span className="text-muted-foreground">entrou sozinho</span> : null}
              </p>
            </div>
            <span className={`shrink-0 text-base font-bold tabular-nums ${l.tipo === "ENTRADA" ? "text-success" : "text-danger"} ${l.estornado ? "line-through" : ""}`}>{l.tipo === "ENTRADA" ? "+" : "−"}{formatBRL(l.valorCents)}</span>
          </div>
          {opcoes && !l.automatico && !l.estornado ? <AcoesDoLancamento l={l} opcoes={opcoes} /> : null}
        </li>
      ))}
    </ul>
  );
}

function Semana({ d, url }: { d: Awaited<ReturnType<typeof caixaDaSemana>>; url: (p: Busca) => string }) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-1">
        <Link href={url({ aba: "semana", data: somarDias(d.datas[0]!, -7) })} className="ds-btn ds-btn--sm ds-btn--secondary" aria-label="Semana anterior"><ChevronLeft className="size-4" aria-hidden /></Link>
        <span className="px-2 text-sm font-semibold tabular-nums">{dataBR(d.datas[0]!)} a {dataBR(d.datas[6]!)}</span>
        {d.datas[6]! < d.hoje ? <Link href={url({ aba: "semana", data: somarDias(d.datas[0]!, 7) })} className="ds-btn ds-btn--sm ds-btn--secondary" aria-label="Próxima semana"><ChevronRight className="size-4" aria-hidden /></Link> : null}
      </div>
      <section className="ds-kpis" aria-label="Números da semana">
        <MetricCard label="Entradas da semana" value={formatBRL(d.total.entradasCents)} tone="success" />
        <MetricCard label="Saídas da semana" value={formatBRL(d.total.saidasCents)} />
        <MetricCard label="Saldo da semana" value={formatBRL(d.total.saldoCents)} />
        <MetricCard label="Diferenças de fechamento" value={formatBRL(d.porDia.reduce((t, x) => t + (x.dia?.diferencaCents ?? 0), 0))} hint={`${d.porDia.filter((x) => x.dia?.diferencaCents).length} dia(s) com diferença`} />
      </section>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {d.porDia.map((x) => (
          <li key={x.data}>
            <Link href={url({ data: x.data })} className="ds-card block p-4 hover:border-foreground/30">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold capitalize">{diaDaSemana(x.data)} {dataBR(x.data).slice(0, 5)}</span>{x.dia ? <Badge tone={x.dia.status === "ABERTO" ? "success" : x.dia.diferencaCents ? "warning" : "outline"}>{x.dia.status === "ABERTO" ? "aberto" : x.dia.diferencaCents ? `fechado · ${x.dia.diferencaCents > 0 ? "+" : "−"}${formatBRL(Math.abs(x.dia.diferencaCents))}` : "fechado"}</Badge> : <Badge tone="outline">{x.data > d.hoje ? "—" : "sem caixa"}</Badge>}</div>
              <p className="mt-2 text-xl font-bold tabular-nums">{formatBRL(x.resumo.saldoCents)}</p>
              <ul className="mt-2 grid gap-0.5 text-xs text-muted-foreground">{x.resumo.porMeio.map((m) => <li key={m.meio} className="flex justify-between gap-2"><span>{NOME_DO_MEIO[m.meio]}</span><span className="tabular-nums">{formatBRL(m.entradasCents - m.saidasCents)}</span></li>)}{!x.resumo.porMeio.length ? <li>sem movimento</li> : null}</ul>
            </Link>
          </li>
        ))}
      </ul>
      {d.porDestino.length ? <PorDestino titulo="Semana por conta de destino" itens={d.porDestino} /> : null}
      {d.total.porMeio.length ? (
        <section className="ds-card p-5" aria-labelledby="sem-meios-t"><h2 id="sem-meios-t" className="text-base font-semibold">Semana por meio</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{d.total.porMeio.map((m) => <li key={m.meio} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"><span className="font-medium">{NOME_DO_MEIO[m.meio]}</span><span className="tabular-nums">{formatBRL(m.entradasCents - m.saidasCents)}</span></li>)}</ul>
        </section>
      ) : null}
    </div>
  );
}

function Lancamentos({ l, sp }: { l: Awaited<ReturnType<typeof listaDeLancamentos>>; sp: Busca }) {
  return (
    <div className="grid gap-6">
      <form className="ds-card flex flex-wrap items-end gap-3 p-4" action="/master/receita/caixa" aria-label="Filtrar lançamentos">
        <input type="hidden" name="aba" value="lancamentos" />
        <label className="grid gap-1 text-xs font-medium">De<input type="date" name="de" defaultValue={l.de} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-medium">Até<input type="date" name="ate" defaultValue={l.ate} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm" /></label>
        <label className="grid gap-1 text-xs font-medium">Meio<select name="meio" defaultValue={sp.meio ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Todos</option>{MEIOS.map((m) => <option key={m} value={m}>{NOME_DO_MEIO[m]}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-medium">Origem<select name="origem" defaultValue={sp.origem ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"><option value="">Todas</option>{ORIGENS.map((o) => <option key={o} value={o}>{NOME_DA_ORIGEM[o]}</option>)}</select></label>
        <button className="ds-btn ds-btn--sm h-10">Filtrar</button>
      </form>
      <p className="text-sm text-muted-foreground">{dataBR(l.de)} a {dataBR(l.ate)} · {l.resumo.quantidade} lançamento{l.resumo.quantidade === 1 ? "" : "s"} · entradas <b className="text-success tabular-nums">{formatBRL(l.resumo.entradasCents)}</b> · saídas <b className="text-danger tabular-nums">{formatBRL(l.resumo.saidasCents)}</b></p>
      <section className="ds-card" aria-label="Lançamentos do período">{l.linhas.length ? <Tabela linhas={l.linhas} opcoes={null} mostraData /> : <EmptyState compact title="Nenhum lançamento no período" description="Mude as datas ou os filtros." />}</section>
    </div>
  );
}

type Painel = Awaited<ReturnType<typeof painelDeAssinaturas>>;
type Historico = Awaited<ReturnType<typeof historicoDaLoja>>;
const dataCurta = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(iso)) : "—");

function Assinaturas({ painel, planos, filtro, historico, url }: { painel: Painel; planos: { key: string; name: string; monthlyCents: number | null; annualCents: number | null }[]; filtro: FiltroAssinatura; historico: Historico | null; url: (p: Busca) => string }) {
  const linhas = filtro === "todas" ? painel.linhas : painel.linhas.filter((l) => l.grupos.includes(filtro));
  return (
    <div className="grid gap-6">
      <nav className="flex flex-wrap gap-2" aria-label="Filtrar assinaturas">
        {FILTROS_ASSINATURA.map((f) => <Link key={f} href={url({ aba: "assinaturas", filtro: f === "todas" ? undefined : f })} aria-current={filtro === f ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${filtro === f ? "border-foreground bg-foreground text-surface" : "border-border hover:border-foreground/40"}`}>{NOME_DO_FILTRO[f]} <span className="tabular-nums opacity-70">{painel.contagem[f]}</span></Link>)}
      </nav>
      {historico ? <HistoricoDaLoja h={historico} url={url} /> : null}
      <section className="ds-card" aria-label="Assinaturas">
        {linhas.length ? (
          <ul className="divide-y divide-border">
            {linhas.map((l) => (
              <li key={l.storeId} className="grid gap-2 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{l.loja}</p>
                    <p className="text-sm text-muted-foreground">{l.plano ? `${l.plano} · ${l.ciclo === "ANNUAL" ? "anual" : "mensal"} · ${formatBRL(l.valorCents ?? 0)}` : "Sem plano"}{l.parceiro ? ` · indicada por ${l.parceiro}` : ""}</p>
                    <p className="flex flex-wrap gap-1.5 pt-1 text-xs">
                      <Badge tone={l.grupos.includes("vencidas") ? "danger" : l.grupos.includes("vencendo") ? "warning" : l.grupos.includes("teste") ? "info" : "outline"}>{l.status}{l.cancelando ? " · cancela no fim" : ""}</Badge>
                      <Badge tone="outline">{l.pagoAte ? `pago até ${dataCurta(l.pagoAte)}` : l.testeAte ? `teste até ${dataCurta(l.testeAte)}` : "nunca pagou"}</Badge>
                      {l.ultimoManual ? <Badge tone="outline">último à mão: {l.ultimoManual.nome}</Badge> : null}
                    </p>
                  </div>
                  <span className="flex flex-wrap gap-1">
                    <Link href={url({ loja: l.storeId })} className="ds-btn ds-btn--sm">Receber</Link>
                    <Link href={url({ aba: "assinaturas", filtro: filtro === "todas" ? undefined : filtro, loja: l.storeId })} className="ds-btn ds-btn--sm ds-btn--secondary">Histórico</Link>
                  </span>
                </div>
                <AcoesDaAssinatura storeId={l.storeId} planos={planos} productKey={l.productKey} ciclo={l.ciclo} />
              </li>
            ))}
          </ul>
        ) : <EmptyState compact title="Nenhuma assinatura neste filtro" description="Tudo em dia por aqui." />}
      </section>
    </div>
  );
}

function HistoricoDaLoja({ h, url }: { h: Historico; url: (p: Busca) => string }) {
  return (
    <section className="ds-card p-5" aria-labelledby="hist-t">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 id="hist-t" className="text-base font-semibold">Histórico de {h.loja.nome}</h2><p className="text-sm text-muted-foreground">{h.assinatura ? `${h.assinatura.plano} · ${h.assinatura.ciclo === "ANNUAL" ? "anual" : "mensal"} · ${h.assinatura.status}` : "Sem assinatura"} · {h.loja.pagoAte ? `pago até ${dataCurta(h.loja.pagoAte)}` : "sem período pago"}</p></div>
        <Link href={url({ aba: "assinaturas" })} className="ds-btn ds-btn--sm ds-btn--secondary">Fechar</Link>
      </div>
      {h.pagamentos.length ? (
        <ul className="mt-3 divide-y divide-border">
          {h.pagamentos.map((p) => (
            <li key={p.id} className={`flex flex-wrap items-center justify-between gap-3 py-2 text-sm ${p.estornado || p.status === "CANCELED" ? "opacity-60" : ""}`}>
              <span className="min-w-0 flex-1"><b>{p.descricao}</b><span className="block text-xs text-muted-foreground">{p.pagoEm ? `pago em ${dataCurta(p.pagoEm)}` : `criada em ${dataCurta(p.criadoEm)}`}{p.meio ? ` · ${p.meio}` : ""}{p.quem ? ` · recebido por ${p.quem}` : ""}{p.parceiro ? ` · vendeu: ${p.parceiro}` : ""}</span></span>
              <Badge tone={p.estornado ? "danger" : p.status === "PAID" ? "success" : p.status === "CANCELED" ? "outline" : "warning"}>{p.estornado ? "estornado" : ({ PAID: "paga", OPEN: "em aberto", OVERDUE: "vencida", CANCELED: "cancelada", WAIVED: "isenta" } as const)[p.status]}</Badge>
              <b className="tabular-nums">{formatBRL(p.valorCents)}</b>
              {p.lancamentoId && !p.estornado && p.status === "PAID" ? <EstornarRecebimento lancamentoId={p.lancamentoId} /> : null}
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted-foreground">Nenhuma cobrança ainda.</p>}
    </section>
  );
}

function PorDestino({ titulo, itens }: { titulo: string; itens: { destino: Destino; entradasCents: number; saidasCents: number }[] }) {
  return (
    <section className="ds-card p-5" aria-label={titulo}>
      <h2 className="text-base font-semibold">{titulo}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {itens.map((x) => <li key={x.destino} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"><span className="font-medium">{NOME_DO_DESTINO[x.destino]}</span><span className="shrink-0 tabular-nums"><span className="text-success">+{formatBRL(x.entradasCents)}</span>{x.saidasCents ? <span className="text-danger"> −{formatBRL(x.saidasCents)}</span> : null}</span></li>)}
      </ul>
    </section>
  );
}
