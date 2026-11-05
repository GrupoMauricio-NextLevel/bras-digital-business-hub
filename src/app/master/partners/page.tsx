import Link from "next/link";
import { Download, Handshake } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb } from "@/db/client";
import { agenciasPedindo } from "@/lib/domain/parceiros-ec";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";
import { requireRole } from "@/lib/require-session";
import { fraudQueue, getPartnerSettings, listPartners, payoutQueue } from "@/lib/domain/partners";
import { periodOf } from "@/lib/domain/finance";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { FraudActions, PayoutActions, SettingsForm } from "./partners-client";
import { QuadroFunil } from "./funil";
import { AcoesDoSegmento, EncerrarDesafio, NovoDesafio, RemoverSegmento } from "./segmentos";
import { ETAPAS, cartoesDeParceiros, desafiosDoParceiro, equipeNextLevel, filaDoCrm, filtrar, filtroSchema, listarDesafios, ranking, segmentos as listarSegmentos } from "@/lib/domain/crm-parceiros";
import { Input, Select } from "@/components/ui/input";

export const dynamic = "force-dynamic";
const TABS = [{ key: "funil", label: "Funil" }, { key: "parceiros", label: "Lista" }, { key: "ranking", label: "Ranking do mês" }, { key: "desafios", label: "Desafios" }, { key: "saques", label: "Saques" }, { key: "antifraude", label: "Antifraude" }, { key: "regras", label: "Regras" }];
const STATUS = { ACTIVE: { label: "Ativo", tone: "success" }, INACTIVE: { label: "Inativo", tone: "warning" }, SUSPENDED: { label: "Suspenso", tone: "danger" } } as const;
const PAYOUT = { REQUESTED: "Solicitado", APPROVED: "Aprovado", PAID: "Pago", REJECTED: "Recusado" } as const;
const num = "text-right tabular-nums";

const TIPO: Record<string, string> = { AFFILIATE: "Criadores", REPRESENTATIVE: "Representantes", AGENCY: "Agências", AGENCY_ELITE: "Agências Elite", WHITE_LABEL: "White label" };
type SP = { tab?: string; status?: string; p?: string; q?: string; kind?: string; tier?: string; etapa?: string; region?: string; owner?: string };

export default async function MasterPartners({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const sp = await searchParams;
  const { tab: raw, status } = sp;
  const tab = TABS.some((t) => t.key === raw) ? raw! : "funil";
  const db = await getDb();
  const filtro = filtroSchema.parse(Object.fromEntries(Object.entries({ q: sp.q, kind: sp.kind, tier: sp.tier, etapa: sp.etapa, region: sp.region, owner: sp.owner }).filter(([, v]) => v)));
  const [list, queue, fraud, settings, agencias, cartoes, equipe, segs, desafios] = await Promise.all([tab === "parceiros" ? listPartners(db, session.actor) : Promise.resolve([]), payoutQueue(db, session.actor), fraudQueue(db, session.actor), getPartnerSettings(db), agenciasPedindo(db, session.actor), cartoesDeParceiros(db, session.actor), equipeNextLevel(db), listarSegmentos(db), tab === "desafios" ? listarDesafios(db) : Promise.resolve([])]);
  const filtrados = filtrar(cartoes, filtro);
  const filaCrm = filaDoCrm(cartoes).map((f) => ({ id: f.id, titulo: f.titulo, detalhe: f.detalhe, tom: f.tom, href: `/master/partners?tab=funil&p=${f.partnerId}`, acao: "Abrir ficha" }));
  const qs = (f: Record<string, string | undefined>) => new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const progresso = tab === "desafios" ? await Promise.all(desafios.filter((d) => d.active && d.period === periodOf(new Date())).map(async (d) => ({ d, batidos: (await Promise.all(cartoes.filter((c) => c.status === "ACTIVE" && (!d.kinds.length || d.kinds.includes(c.kind))).map((c) => desafiosDoParceiro(db, c.id)))).flat().filter((x) => x.id === d.id && x.batido).length }))) : [];
  const openPayouts = queue.filter((p) => p.status === "REQUESTED" || p.status === "APPROVED");
  const period = periodOf(new Date());
  const shown = list.filter((p) => !status || p.status === status);
  return (
    <>
      <PageHeader title="Programa de Parceiros" description="Indicadores e agências que trazem lojistas: cadastros, comissões, saques e antifraude." actions={<a href={`/master/partners/export?period=${period}`} className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground hover:underline"><Download className="size-4" aria-hidden /> Exportar CSV do mês</a>} />
      <PrecisaDeVoce itens={[...filaCrm.filter((f) => f.tom === "danger"), ...agencias, ...openPayouts.slice(0, 5).map((p) => ({ id: `saque-${p.id}`, titulo: `Saque pedido: ${formatBRL(p.amountCents)}`, detalhe: "Confira e aprove o pagamento por Pix.", tom: "warning" as const, href: "/master/partners?tab=saques", acao: "Ver saques" })), ...filaCrm.filter((f) => f.tom !== "danger")]} limite={8} vazio="Nenhum parceiro, agência ou saque esperando você." descricao="Ações marcadas, parceiros sem a 1ª venda, em risco, agências pedindo aprovação (50% + 25%) e saques." />
      <MetricGrid className="mb-8">
        <MetricCard label="Parceiros" value={cartoes.length} icon={Handshake} hint={`${cartoes.filter((p) => p.status === "ACTIVE").length} ativos · ${cartoes.filter((p) => p.status === "INACTIVE").length} inativos`} />
        <MetricCard label="Clientes novos no mês" value={cartoes.reduce((t, p) => t + p.ativacoesMes, 0)} tone="success" hint={`${cartoes.filter((c) => c.etapa === "EM_RISCO").length} parceiros em risco`} />
        <MetricCard label="Saques em aberto" value={openPayouts.length} tone={openPayouts.length ? "warning" : "neutral"} hint={formatBRL(openPayouts.reduce((t, p) => t + p.amountCents, 0))} />
        <MetricCard label="Em revisão" value={fraud.length} tone={fraud.length ? "danger" : "neutral"} hint="Possível autoindicação" />
      </MetricGrid>
      <LinkTabs label="Programa de parceiros" active={tab} items={TABS.map((t) => ({ ...t, href: `/master/partners?tab=${t.key}` }))} />

      {tab === "funil" ? (
        <>
          <form method="get" className="mb-3 grid gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]" aria-label="Filtrar parceiros">
            <input type="hidden" name="tab" value="funil" />
            <label className="sr-only" htmlFor="f-q">Buscar</label><Input id="f-q" name="q" defaultValue={filtro.q} placeholder="Nome ou código" className="h-9" />
            <label className="sr-only" htmlFor="f-k">Tipo</label><Select id="f-k" name="kind" defaultValue={filtro.kind ?? ""} className="h-9"><option value="">Tipo</option>{Object.entries(TIPO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
            <label className="sr-only" htmlFor="f-t">Nível</label><Select id="f-t" name="tier" defaultValue={filtro.tier ?? ""} className="h-9"><option value="">Nível</option><option value="INICIAL">Inicial</option><option value="PRATA">Prata</option><option value="OURO">Ouro</option><option value="DIAMANTE">Diamante</option></Select>
            <label className="sr-only" htmlFor="f-r">Região</label><Input id="f-r" name="region" defaultValue={filtro.region} placeholder="Região" className="h-9" />
            <label className="sr-only" htmlFor="f-o">Quem cuida</label><Select id="f-o" name="owner" defaultValue={filtro.owner ?? ""} className="h-9"><option value="">Quem cuida</option>{equipe.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
            <button type="submit" className="ds-btn ds-btn--sm ds-btn--primary h-9">Filtrar</button>
          </form>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-label="Segmentos salvos">
              <span className="text-xs font-medium text-muted-foreground">Segmentos:</span>
              {segs.length ? segs.map((g) => <span key={g.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs"><Link href={`/master/partners?${qs({ tab: "funil", ...g.filtro })}`} className="hover:underline">{g.nome}</Link><RemoverSegmento id={g.id} nome={g.nome} /></span>) : <span className="text-xs text-muted-foreground">nenhum salvo</span>}
              <span className="text-xs text-muted-foreground">· {filtrados.length} de {cartoes.length} parceiros</span>
              <a href={`/master/partners/crm-csv?${qs(filtro)}`} className="text-xs font-medium underline">Exportar CSV</a>
            </div>
            <AcoesDoSegmento filtro={filtro} total={filtrados.length} />
          </div>
          <QuadroFunil etapas={ETAPAS} cartoes={filtrados} equipe={equipe} />
        </>
      ) : null}

      {tab === "ranking" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(ranking(cartoes)).map(([k, rs]) => (
            <Card key={k} className="p-5">
              <h2 className="text-base font-semibold">{TIPO[k] ?? k}</h2>
              <p className="text-xs text-muted-foreground">Clientes novos no mês e receita gerada para a NextLevel.</p>
              <ol className="mt-3 grid gap-1.5">{rs.map((c, i) => <li key={c.id} className="flex items-center justify-between gap-3 text-sm"><span><b className="mr-2 tabular-nums text-muted-foreground">{i + 1}º</b><Link className="hover:underline" href={`/master/partners?tab=funil&p=${c.id}`}>{c.nome}</Link></span><span className="tabular-nums">{c.ativacoesMes} novo{c.ativacoesMes === 1 ? "" : "s"} · {formatBRL(c.receitaMesCents)}</span></li>)}</ol>
            </Card>
          ))}
          {!Object.keys(ranking(cartoes)).length ? <EmptyState icon={Handshake} title="Sem parceiros ativos" /> : null}
        </div>
      ) : null}

      {tab === "desafios" ? (
        <>
          <Card className="mb-6 p-5"><SectionTitle title="Novo desafio do mês" description="Ex.: 3 lojas novas no mês = bônus de R$ 100. O bônus entra sozinho no extrato de quem bater a meta, uma vez por desafio." /><NovoDesafio periodo={periodOf(new Date())} /></Card>
          {desafios.length ? <Card><Table><THead><TR><TH>Desafio</TH><TH>Mês</TH><TH className={num}>Meta</TH><TH className={num}>Bônus</TH><TH>Quem participa</TH><TH className={num}>Bateram</TH><TH /></TR></THead><TBody>{desafios.map((d) => <TR key={d.id}><TD className="font-medium">{d.title}{d.active ? null : <Badge className="ml-2">encerrado</Badge>}</TD><TD>{d.period}</TD><TD className={num}>{d.target}</TD><TD className={num}>{formatBRL(d.bonusCents)}</TD><TD>{d.kinds.length ? d.kinds.map((k) => TIPO[k] ?? k).join(", ") : "Todos"}</TD><TD className={num}>{progresso.find((x) => x.d.id === d.id)?.batidos ?? "—"}</TD><TD>{d.active ? <EncerrarDesafio id={d.id} /> : null}</TD></TR>)}</TBody></Table></Card> : <EmptyState icon={Handshake} title="Nenhum desafio ainda" description="Crie o primeiro acima." />}
        </>
      ) : null}

      {tab === "parceiros" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
            {[["", "Todos"], ["ACTIVE", "Ativos"], ["INACTIVE", "Inativos"], ["SUSPENDED", "Suspensos"]].map(([k, l]) => <Link key={k} href={k ? `/master/partners?status=${k}` : "/master/partners"} aria-current={(status ?? "") === k ? "true" : undefined} className={`rounded-full border px-3 py-1 text-xs font-medium ${(status ?? "") === k ? "border-accent bg-accent-soft" : "border-border text-muted-foreground"}`}>{l}</Link>)}
          </div>
          {shown.length === 0 ? <EmptyState icon={Handshake} title="Nenhum parceiro" description="Os cadastros de /parceiros/cadastro aparecem aqui." /> : (
            <Card><Table>
              <THead><TR><TH>Parceiro</TH><TH>Código</TH><TH>Situação</TH><TH className={num}>Indicados</TH><TH className={num}>Ativações (mês)</TH><TH className={num}>Em garantia</TH><TH className={num}>Disponível</TH><TH className={num}>Pago</TH></TR></THead>
              <TBody>{shown.map((p) => (
                <TR key={p.id}><TD className="font-medium"><Link className="hover:underline" href={`/master/partners/${p.id}`}>{p.displayName}</Link>{p.flagged ? <Badge tone="danger" className="ml-2">revisão</Badge> : null}</TD><TD className="font-mono text-xs">{p.code}</TD><TD><Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge></TD><TD className={num}>{p.referrals}</TD><TD className={num}>{p.activationsMonth}</TD><TD className={num}>{formatBRL(p.pendingCents)}</TD><TD className={num}>{formatBRL(p.availableCents)}</TD><TD className={num}>{formatBRL(p.paidCents)}</TD></TR>
              ))}</TBody>
            </Table></Card>
          )}
        </>
      ) : null}

      {tab === "saques" ? (
        queue.length === 0 ? <EmptyState icon={Handshake} title="Nenhum saque solicitado" /> : (
          <ul className="space-y-3">{queue.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium"><Link className="hover:underline" href={`/master/partners/${p.partnerId}`}>{p.partnerName}</Link> <span className="text-xs text-muted-foreground">({p.partnerCode})</span></p><p className="text-xs text-muted-foreground">Pedido em {formatDate(p.requestedAt)} · CPF/CNPJ {p.taxId} · chave Pix <code>{p.pixKeySnapshot}</code></p></div><div className="text-right"><p className="text-lg font-semibold tabular-nums">{formatBRL(p.amountCents)}</p><p className="text-xs text-muted-foreground">{PAYOUT[p.status]}{p.receiptNote ? ` · ${p.receiptNote}` : ""}</p></div></div>
              <div className="mt-3"><PayoutActions id={p.id} status={p.status} /></div>
            </li>
          ))}</ul>
        )
      ) : null}

      {tab === "antifraude" ? (
        fraud.length === 0 ? <EmptyState icon={Handshake} title="Nada em revisão" description="Lojas indicadas com o mesmo CPF/CNPJ ou e-mail do parceiro aparecem aqui e não geram comissão até você decidir." /> : (
          <ul className="space-y-3">{fraud.map((f) => (
            <li key={f.storeId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-soft/40 p-4"><div><p className="font-medium">{f.storeName}</p><p className="text-sm text-muted-foreground">Indicada por <Link className="underline" href={`/master/partners/${f.partnerId}`}>{f.partnerName}</Link> · mesmo CPF/CNPJ ou e-mail do parceiro</p></div><FraudActions storeId={f.storeId} /></li>
          ))}</ul>
        )
      ) : null}

      {tab === "regras" ? (<><SectionTitle title="Regras do programa" description="Nada de percentual fixo no código: tudo é lido daqui. Vale para novas ativações; ajustes de faixa usam o valor vigente no fechamento." /><Card className="p-5"><SettingsForm settings={settings} /></Card></>) : null}
    </>
  );
}
