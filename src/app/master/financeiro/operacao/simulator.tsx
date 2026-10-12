"use client";
import * as React from "react";
import { Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Switch } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IntField, MoneyField, PercentField } from "@/components/finance/fields";
import { LineArea, StackedColumns, compactBRL, fullBRL, type Series } from "@/components/finance/charts";
import { DEFAULT_SIM, STREAMS, STREAM_LABEL, simulate, type SimInput, type SimSupplier, type Stream } from "@/lib/finance/engine";
import { OFFER_KEYS, OFFER_LABEL, TIER_KEYS, TIER_LABEL, type PriceBook } from "@/lib/finance/price-book";
import { cn } from "@/lib/utils";

const SERIES: Series[] = STREAMS.map((k, i) => ({ key: k, label: STREAM_LABEL[k as Stream], color: `var(--series-${i + 1})` }));

const PRESETS: Record<string, { label: string; apply: (s: SimInput) => SimInput }> = {
  conservative: { label: "Conservador", apply: (s) => ({ ...s, churnBps: 500, templateAttachBps: 800, serviceAttachBps: 1000, suppliers: s.suppliers.map((f) => ({ ...f, newStoresPerMonth: 2, volumePerStoreCents: 300_000 })) }) },
  base: { label: "Base", apply: () => structuredClone(DEFAULT_SIM) },
  optimistic: { label: "Otimista", apply: (s) => ({ ...s, churnBps: 200, templateAttachBps: 2500, serviceAttachBps: 3000, suppliers: s.suppliers.map((f) => ({ ...f, newStoresPerMonth: 8, volumePerStoreCents: 1_000_000 })) }) },
};

const monthLabel = (m: number) => `M${m}`;

export function Simulator({ book: initialBook }: { book: PriceBook }) {
  const [sim, setSim] = React.useState<SimInput>(() => structuredClone(DEFAULT_SIM));
  const [book, setBook] = React.useState<PriceBook>(initialBook);
  const [resetKey, setResetKey] = React.useState(0);
  const [showPrices, setShowPrices] = React.useState(false);
  const result = React.useMemo(() => simulate(sim, book), [sim, book]);
  const priceChanged = JSON.stringify(book) !== JSON.stringify(initialBook);
  const last = result.months[result.months.length - 1];
  const firstPositive = result.months.find((m) => m.cumulativeNet > 0);
  const mixTotal = OFFER_KEYS.reduce((s, k) => s + sim.mix[k], 0);

  const setSupplier = (i: number, patch: Partial<SimSupplier>) => setSim({ ...sim, suppliers: sim.suppliers.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const reset = () => { setSim(structuredClone(DEFAULT_SIM)); setBook(initialBook); setResetKey((k) => k + 1); };
  const applyPreset = (k: string) => { setSim(PRESETS[k]!.apply(sim)); setResetKey((n) => n + 1); };

  const sensitivity = React.useMemo(() => {
    const volumes = [300_000, 600_000, 1_000_000, 1_500_000];
    const news = [2, 4, 8];
    return { volumes, news, cells: volumes.map((v) => news.map((n) => simulate({ ...sim, suppliers: sim.suppliers.map((s) => ({ ...s, volumePerStoreCents: v, newStoresPerMonth: n })) }, book).lastMonthNet)) };
  }, [sim, book]);

  const exportCsv = () => {
    const head = ["mes", "lojas", ...STREAMS.map((k) => STREAM_LABEL[k]), "setup_fornecedores", "receita_bruta", "comissoes_fornecedores", "custos", "resultado", "resultado_acumulado"];
    const rows = result.months.map((m) => [m.month, Math.round(m.stores), ...STREAMS.map((k) => (m.revenue[k] / 100).toFixed(2)), (m.supplierSetup / 100).toFixed(2), (m.grossRevenue / 100).toFixed(2), (m.commissions / 100).toFixed(2), (m.costs / 100).toFixed(2), (m.net / 100).toFixed(2), (m.cumulativeNet / 100).toFixed(2)]);
    const csv = "﻿" + [head, ...rows].map((r) => r.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "simulacao-financeira.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const setOffer = (k: (typeof OFFER_KEYS)[number], patch: Partial<PriceBook["offers"][typeof k]>) => setBook({ ...book, offers: { ...book.offers, [k]: { ...book.offers[k], ...patch } } });

  return (
    <div className="space-y-6">
      {/* Resultado em destaque */}
      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultado em {sim.months} meses</div>
            <div className={cn("mt-1 text-5xl font-semibold tracking-tight tabular-nums", result.totals.net < 0 && "text-danger")}>{compactBRL(result.totals.net)}</div>
            <p className="mt-2 text-sm text-muted-foreground">Receita bruta menos comissões pagas aos fornecedores e custos de operação.{priceChanged ? " Usando preços alterados só neste cenário." : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([k, p]) => <Button key={k} size="sm" variant="secondary" onClick={() => applyPreset(k)}>{p.label}</Button>)}
              <Button size="sm" variant="ghost" onClick={reset}><RotateCcw /> Restaurar</Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Receita recorrente no mês final" value={compactBRL(result.lastMonthMrr)} hint="Mensalidades, taxa de volume e serviços" />
            <Tile label="Receita bruta" value={compactBRL(result.totals.grossRevenue)} hint={`em ${sim.months} meses`} />
            <Tile label="Comissões aos fornecedores" value={compactBRL(result.totals.commissions)} hint={`${(book.channel.setupCommissionBps / 100).toLocaleString("pt-BR")}% do setup das lojas`} />
            <Tile label="Custos" value={compactBRL(result.totals.costs)} hint="Cobrança, infraestrutura, suporte e serviços" />
            <Tile label="Lojas ativas no mês final" value={String(Math.round(last?.stores ?? 0))} hint={`${sim.suppliers.length} fornecedor(es)`} />
            <Tile label="Resultado acumulado positivo" value={firstPositive ? `no mês ${firstPositive.month}` : "não atinge"} hint={firstPositive ? "Primeiro mês com acumulado acima de zero" : "Ajuste volume ou novas lojas"} />
          </dl>
        </CardContent>
      </Card>

      {/* Controles */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Fornecedores</h3>
            <Button size="sm" variant="secondary" disabled={sim.suppliers.length >= 5} onClick={() => setSim({ ...sim, suppliers: [...sim.suppliers, { name: `Fornecedor ${sim.suppliers.length + 1}`, model: "SUPERDROP", tier: "GROWTH", waived: false, startingStores: 10, newStoresPerMonth: 4, volumePerStoreCents: 600_000 }] })}><Plus /> Fornecedor</Button>
          </div>
          {sim.suppliers.map((s, i) => (
            <Card key={`${i}-${resetKey}`}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label="Nome do fornecedor" className="h-8 max-w-56 font-medium" value={s.name} onChange={(e) => setSupplier(i, { name: e.target.value })} />
                  <Select aria-label="Modelo" className="h-8 w-36" value={s.model} onChange={(e) => setSupplier(i, { model: e.target.value as SimSupplier["model"] })}><option value="SUPERDROP">SuperDrop</option><option value="WHITE_LABEL">White Label</option></Select>
                  {s.model === "SUPERDROP" ? <Select aria-label="Faixa" className="h-8 w-32" value={s.tier} onChange={(e) => setSupplier(i, { tier: e.target.value as SimSupplier["tier"] })}>{TIER_KEYS.map((t) => <option key={t} value={t}>{TIER_LABEL[t]}</option>)}</Select> : null}
                  <Switch checked={s.waived} onCheckedChange={(v) => setSupplier(i, { waived: v })} label={`Isento ${Math.ceil(book.billing.waiverDays / 30)} meses`} />
                  <Button className="ml-auto" size="icon-sm" variant="ghost" aria-label="Remover fornecedor" disabled={sim.suppliers.length <= 1} onClick={() => setSim({ ...sim, suppliers: sim.suppliers.filter((_, j) => j !== i) })}><Trash2 /></Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <IntField id={`sl-${i}`} label="Lojas no início" value={s.startingStores} onChange={(v) => setSupplier(i, { startingStores: v })} />
                  <IntField id={`nl-${i}`} label="Lojas novas por mês" value={s.newStoresPerMonth} onChange={(v) => setSupplier(i, { newStoresPerMonth: v })} />
                  <MoneyField id={`vl-${i}`} label="Custo pago à Central por loja/mês" hint="Base da taxa de volume" valueCents={s.volumePerStoreCents} onChange={(c) => setSupplier(i, { volumePerStoreCents: c })} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader><div><CardTitle>Lojistas e extras</CardTitle><CardDescription>Premissas comuns a todos os fornecedores.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4" key={resetKey}>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground"><span>Mix de ofertas</span><span className={cn(mixTotal !== 100 && "text-warning")}>{mixTotal}%{mixTotal !== 100 ? " (normalizado)" : ""}</span></div>
              <div className="grid grid-cols-3 gap-2">
                {OFFER_KEYS.map((k) => <IntField key={k} id={`mix-${k}`} label={OFFER_LABEL[k]} suffix="%" value={sim.mix[k]} onChange={(v) => setSim({ ...sim, mix: { ...sim.mix, [k]: Math.min(100, v) } })} />)}
              </div>
            </div>
            <PercentField id="churn" label="Cancelamento mensal de lojas" bps={sim.churnBps} onChange={(b) => setSim({ ...sim, churnBps: b })} />
            <div className="grid grid-cols-2 gap-2">
              <PercentField id="tpl-a" label="Templates nas lojas novas" bps={sim.templateAttachBps} onChange={(b) => setSim({ ...sim, templateAttachBps: b })} />
              <MoneyField id="tpl-t" label="Ticket do template" valueCents={sim.templateTicketCents} onChange={(c) => setSim({ ...sim, templateTicketCents: c })} />
              <PercentField id="svc-a" label="Lojas com serviço" bps={sim.serviceAttachBps} onChange={(b) => setSim({ ...sim, serviceAttachBps: b })} />
              <MoneyField id="svc-t" label="Ticket do serviço/mês" valueCents={sim.serviceTicketCents} onChange={(c) => setSim({ ...sim, serviceTicketCents: c })} />
            </div>
            <Select aria-label="Horizonte" value={sim.months} onChange={(e) => setSim({ ...sim, months: Number(e.target.value) })}><option value={6}>6 meses</option><option value={12}>12 meses</option><option value={24}>24 meses</option></Select>
            <button type="button" onClick={() => setShowPrices(!showPrices)} className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-muted"><span>Ajustar preços neste cenário</span>{priceChanged ? <Badge tone="warning">alterado</Badge> : <span className="text-xs text-muted-foreground">{showPrices ? "ocultar" : "mostrar"}</span>}</button>
            {showPrices ? (
              <div className="space-y-3 rounded-md border border-border p-3" key={`p-${resetKey}`}>
                <p className="text-xs text-muted-foreground">Não altera a tabela de preços real. Para isso use a aba Regras e preços.</p>
                <div className="grid grid-cols-2 gap-2">
                  <PercentField id="sd-bps" label="Taxa SuperDrop" bps={book.superdrop.volumeFeeBps} onChange={(b) => setBook({ ...book, superdrop: { ...book.superdrop, volumeFeeBps: b } })} />
                  <MoneyField id="sd-min" label="Mínima SuperDrop" valueCents={book.superdrop.minMonthlyFeeCents} onChange={(c) => setBook({ ...book, superdrop: { ...book.superdrop, minMonthlyFeeCents: c } })} />
                  <MoneyField id="t-growth" label="Mensalidade Growth" valueCents={book.supplierTiers.GROWTH.monthlyCents} onChange={(c) => setBook({ ...book, supplierTiers: { ...book.supplierTiers, GROWTH: { ...book.supplierTiers.GROWTH, monthlyCents: c } } })} />
                  <PercentField id="comm" label="Comissão do canal" bps={book.channel.setupCommissionBps} onChange={(b) => setBook({ ...book, channel: { ...book.channel, setupCommissionBps: b } })} />
                  <MoneyField id="wl-setup" label="Setup White Label" valueCents={book.whiteLabel.setupCents} onChange={(c) => setBook({ ...book, whiteLabel: { ...book.whiteLabel, setupCents: c } })} />
                  <PercentField id="wl-bps" label="Taxa White Label" bps={book.whiteLabel.volumeFeeBps} onChange={(b) => setBook({ ...book, whiteLabel: { ...book.whiteLabel, volumeFeeBps: b } })} />
                </div>
                {OFFER_KEYS.map((k) => (
                  <div key={k} className="grid grid-cols-2 gap-2">
                    <MoneyField id={`o-s-${k}`} label={`Setup ${OFFER_LABEL[k]}`} valueCents={book.offers[k].setupCents} onChange={(c) => setOffer(k, { setupCents: c })} />
                    <MoneyField id={`o-m-${k}`} label={`Mensal ${OFFER_LABEL[k]}`} valueCents={book.offers[k].monthlyCents} onChange={(c) => setOffer(k, { monthlyCents: c })} />
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Card>
        <CardHeader><div><CardTitle>Receita bruta por origem</CardTitle><CardDescription>Setup de fornecedores entra no mês 1 quando houver White Label sem isenção.</CardDescription></div></CardHeader>
        <CardContent>
          <StackedColumns ariaLabel="Receita bruta mensal por origem" series={SERIES} columns={result.months.map((m) => ({ label: monthLabel(m.month), values: { ...m.revenue, supplierMonthly: m.revenue.supplierMonthly + m.supplierSetup } }))} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div><CardTitle>Resultado acumulado</CardTitle><CardDescription>Soma mensal de receita bruta menos comissões e custos.</CardDescription></div></CardHeader>
        <CardContent><LineArea ariaLabel="Resultado acumulado por mês" color="var(--series-1)" points={result.months.map((m) => ({ label: monthLabel(m.month), value: m.cumulativeNet }))} /></CardContent>
      </Card>

      {/* Sensibilidade */}
      <Card>
        <CardHeader><div><CardTitle>Sensibilidade do resultado no mês {sim.months}</CardTitle><CardDescription>Resultado do último mês conforme o custo pago à Central por loja e o ritmo de lojas novas por fornecedor.</CardDescription></div></CardHeader>
        <CardContent className="nl-scroll overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">Custo por loja/mês</th>{sensitivity.news.map((n) => <th key={n} className="px-3 py-2 text-right font-medium">{n} lojas novas/mês</th>)}</tr></thead>
            <tbody>{sensitivity.volumes.map((v, r) => <tr key={v} className="border-t border-border"><td className="py-2 pr-4 font-medium">{fullBRL(v)}</td>{sensitivity.cells[r]!.map((c, k) => <td key={k} className={cn("px-3 py-2 text-right", c < 0 && "text-danger")}>{compactBRL(c)}</td>)}</tr>)}</tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tabela mensal */}
      <Card>
        <CardHeader><div><CardTitle>Mês a mês</CardTitle><CardDescription>Valores em reais.</CardDescription></div><Button size="sm" variant="secondary" onClick={exportCsv}><Download /> Baixar CSV</Button></CardHeader>
        <CardContent className="nl-scroll overflow-x-auto px-0 pb-0">
          <table className="w-full text-xs tabular-nums">
            <thead><tr className="border-y border-border text-left text-muted-foreground"><th className="px-4 py-2 font-medium">Mês</th><th className="px-3 py-2 text-right font-medium">Lojas</th>{STREAMS.map((k) => <th key={k} className="px-3 py-2 text-right font-medium">{STREAM_LABEL[k]}</th>)}<th className="px-3 py-2 text-right font-medium">Bruta</th><th className="px-3 py-2 text-right font-medium">Comissões</th><th className="px-3 py-2 text-right font-medium">Custos</th><th className="px-4 py-2 text-right font-medium">Resultado</th></tr></thead>
            <tbody>{result.months.map((m) => <tr key={m.month} className="border-b border-border last:border-0"><td className="px-4 py-1.5">{m.month}</td><td className="px-3 py-1.5 text-right">{Math.round(m.stores)}</td>{STREAMS.map((k) => <td key={k} className="px-3 py-1.5 text-right">{fullBRL(m.revenue[k] + (k === "supplierMonthly" ? m.supplierSetup : 0))}</td>)}<td className="px-3 py-1.5 text-right font-medium">{fullBRL(m.grossRevenue)}</td><td className="px-3 py-1.5 text-right">{fullBRL(m.commissions)}</td><td className="px-3 py-1.5 text-right">{fullBRL(m.costs)}</td><td className={cn("px-4 py-1.5 text-right font-medium", m.net < 0 && "text-danger")}>{fullBRL(m.net)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Simulação com hipóteses editáveis, não é previsão. Impostos e tributos ficam fora do escopo do sistema neste momento.</p>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
