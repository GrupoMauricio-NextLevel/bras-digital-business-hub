import { levarAoEscritorio } from "@/lib/brand-server";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Badge } from "@/components/ui/badge";
import { brandByCode } from "@/lib/brand";
import { ecosystemTower, OPP_STATUS_LABEL, RULE_LABEL } from "@/lib/domain/ecossistema/torre";
import { OportunidadeForm } from "@/components/ecossistema/oportunidade-form";

export const dynamic = "force-dynamic";
const nameOf = (code: string) => brandByCode(code).name;
const TONE = { NOVA: "info", EM_CONTATO: "warning", ATIVOU: "success", DESCARTADA: "neutral" } as const;

/**
 * Torre do Ecossistema (D135, fase P5M): quantos clientes já estão em mais de uma marca, de onde vêm os cadastros entre
 * marcas, a fila de oportunidades cruzadas (com dono e situação) e o placar do mês da equipe.
 */
export default async function TorrePage() {
  await levarAoEscritorio("/master/agora"); // D205: tela antiga → área nova do escritório da Commerce
  const s = await requireRole("NEXTLEVEL_MASTER");
  const t = await ecosystemTower(await getDb(), s.actor);
  return (
    <>
      <PageHeader eyebrow="Grupo NextLevel" title="Torre do Ecossistema" description="Quem já usa mais de uma marca, o caminho entre elas e a fila de clientes com perfil para a próxima marca. Clientes reconhecidos pelo mesmo CPF/CNPJ; nenhuma conta é juntada." />
      <section className="ds-kpis mb-6" aria-label="Índice do ecossistema">
        <MetricCard label="Clientes com documento" value={String(t.index.total)} hint="lojas, membros e transportadoras" />
        <MetricCard label="Em 2 ou mais marcas" value={`${t.index.two + t.index.threePlus} (${t.index.multiPct}%)`} hint={`${t.index.threePlus} em 3 ou mais`} />
        <MetricCard label="Oportunidades novas" value={String(t.counts.NOVA)} hint={`${t.counts.EM_CONTATO} em contato`} />
        <MetricCard label="Ativaram" value={String(t.counts.ATIVOU)} hint="desde o início da fila" />
      </section>
      <div className="ds-grid ds-grid--main">
        <section aria-labelledby="h-fila" className="ds-card p-4">
          <h2 id="h-fila" className="mb-1 text-lg font-bold">Fila de oportunidades cruzadas</h2>
          <p className="mb-3 text-sm text-muted-foreground">Geradas pelas regras: loja que vende e ainda não compra na Brás; membro da Brás sem frete do grupo; loja no grátis que já pagaria menos num plano. Quem muda a situação vira o dono.</p>
          {t.queue.length ? (
            <ul className="divide-y divide-border">
              {t.queue.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><b>{o.who ?? o.entityId}</b><Badge tone={TONE[o.status]}>{OPP_STATUS_LABEL[o.status]}</Badge><span className="text-xs text-muted-foreground">{RULE_LABEL[o.rule] ?? o.rule} · {nameOf(o.fromBrand)} → {nameOf(o.toBrand)}</span></div>
                    <p className="text-sm text-muted-foreground">{o.reason}{o.ownerName ? ` · dono: ${o.ownerName}` : ""}</p>
                  </div>
                  <OportunidadeForm id={o.id} status={o.status} label={o.who ?? o.entityId} />
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhuma oportunidade agora. As regras rodam a cada visita.</p>}
        </section>
        <div className="space-y-6">
          <section aria-labelledby="h-pares" className="ds-card p-4">
            <h2 id="h-pares" className="mb-2 text-sm font-semibold">Combinações de marcas mais comuns</h2>
            {t.index.pairs.length ? <ul className="text-sm">{t.index.pairs.slice(0, 6).map((p) => <li key={p.pair} className="flex justify-between border-b border-border py-1"><span>{p.pair.split(" + ").map(nameOf).join(" + ")}</span><span className="tabular-nums">{p.n}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Ainda nenhum cliente em duas marcas.</p>}
          </section>
          <section aria-labelledby="h-fluxo" className="ds-card p-4">
            <h2 id="h-fluxo" className="mb-2 text-sm font-semibold">Cadastros vindos de outra marca (90 dias)</h2>
            {t.flow.length ? <ul className="text-sm">{t.flow.map((f) => <li key={f.from} className="flex justify-between border-b border-border py-1"><span>{nameOf(f.from)} → {nameOf(f.to)}</span><span className="tabular-nums">{f.n}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Ainda nenhum (a página de ativação marca a origem).</p>}
          </section>
          <section aria-labelledby="h-placar" className="ds-card p-4">
            <h2 id="h-placar" className="mb-2 text-sm font-semibold">Placar do mês: ativações por pessoa</h2>
            {t.board.length ? <ol className="text-sm">{t.board.map((b, i) => <li key={b.name} className="flex justify-between border-b border-border py-1"><span>{i + 1}. {b.name}</span><span className="tabular-nums">{b.n}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">Nenhuma ativação neste mês ainda.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
