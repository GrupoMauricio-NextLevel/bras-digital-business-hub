"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntField, MoneyField, PercentField } from "@/components/finance/fields";
import { savePriceBookAction } from "@/app/actions/finance";
import { ACCESS_CAPABILITIES, ACCESS_LABEL, type AccessState } from "@/lib/finance/engine";
import { OFFER_KEYS, OFFER_LABEL, TIER_KEYS, TIER_LABEL, type PriceBook } from "@/lib/finance/price-book";

const CAPS: { key: keyof (typeof ACCESS_CAPABILITIES)["ACTIVE"]; label: string }[] = [
  { key: "canLogin", label: "Entrar no sistema" },
  { key: "canManageCatalog", label: "Gerir catálogo" },
  { key: "canCreateOrders", label: "Receber novos pedidos" },
  { key: "canCreateStores", label: "Criar lojas novas" },
  { key: "canExpedite", label: "Expedir pedidos já pagos" },
];

export function Rules({ book }: { book: PriceBook }) {
  const router = useRouter();
  const [b, setB] = React.useState<PriceBook>(book);
  const [pending, start] = React.useTransition();
  const dirty = JSON.stringify(b) !== JSON.stringify(book);
  const dunningDays: { key: keyof PriceBook["dunning"]; state: AccessState; from: number }[] = [
    { key: "warningDays", state: "WARNING", from: b.dunning.warningDays },
    { key: "partialBlockDays", state: "PARTIAL_BLOCK", from: b.dunning.partialBlockDays },
    { key: "suspendedDays", state: "SUSPENDED", from: b.dunning.suspendedDays },
    { key: "closedDays", state: "CLOSED", from: b.dunning.closedDays },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div><CardTitle>Liberação de acesso por pagamento</CardTitle><CardDescription>Setup e mensalidade são pagos antes de liberar. Taxas são cobradas no fechamento do mês. O atraso é contado a partir do vencimento da fatura mais antiga.</CardDescription></div></CardHeader>
        <CardContent className="space-y-4">
          <div className="nl-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 pr-4 font-medium">Estado</th><th className="px-3 py-2 font-medium">A partir de</th>{CAPS.map((c) => <th key={c.key} className="px-3 py-2 text-center font-medium">{c.label}</th>)}</tr></thead>
              <tbody>
                <tr className="border-t border-border"><td className="py-2 pr-4 font-medium">{ACCESS_LABEL.ACTIVE}</td><td className="px-3 py-2 text-muted-foreground">em dia</td>{CAPS.map((c) => <Cell key={c.key} on={ACCESS_CAPABILITIES.ACTIVE[c.key]} />)}</tr>
                {dunningDays.map((d) => <tr key={d.state} className="border-t border-border"><td className="py-2 pr-4 font-medium">{ACCESS_LABEL[d.state]}</td><td className="px-3 py-2 text-muted-foreground">{d.from} {d.from === 1 ? "dia" : "dias"} de atraso</td>{CAPS.map((c) => <Cell key={c.key} on={ACCESS_CAPABILITIES[d.state][c.key]} />)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">No bloqueio parcial pedidos já pagos continuam sendo expedidos para não punir o consumidor final. Dados administrativos permanecem com a NextLevel mesmo após o encerramento.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {dunningDays.map((d) => <IntField key={d.key} id={`d-${d.key}`} label={ACCESS_LABEL[d.state]} suffix="dias" value={b.dunning[d.key]} onChange={(v) => setB({ ...b, dunning: { ...b.dunning, [d.key]: v } })} />)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Tabela de preços</CardTitle><CardDescription>Valores de lista. Novos contratos nascem daqui. Contratos existentes só mudam se você editar o contrato.</CardDescription></div></CardHeader>
        <CardContent className="space-y-6">
          <Section title="Fornecedor SuperDrop">
            <div className="grid gap-3 sm:grid-cols-3">
              {TIER_KEYS.map((t) => <MoneyField key={t} id={`tier-${t}`} label={`Mensalidade ${TIER_LABEL[t]}`} valueCents={b.supplierTiers[t].monthlyCents} onChange={(v) => setB({ ...b, supplierTiers: { ...b.supplierTiers, [t]: { ...b.supplierTiers[t], monthlyCents: v } } })} />)}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MoneyField id="sd-setup" label="Setup" valueCents={b.superdrop.setupCents} onChange={(v) => setB({ ...b, superdrop: { ...b.superdrop, setupCents: v } })} />
              <PercentField id="sd-bps" label="Taxa de volume" hint="Sobre o custo pago à Central" bps={b.superdrop.volumeFeeBps} onChange={(v) => setB({ ...b, superdrop: { ...b.superdrop, volumeFeeBps: v } })} />
              <MoneyField id="sd-min" label="Taxa mínima mensal" valueCents={b.superdrop.minMonthlyFeeCents} onChange={(v) => setB({ ...b, superdrop: { ...b.superdrop, minMonthlyFeeCents: v } })} />
            </div>
          </Section>
          <Section title="Fornecedor White Label">
            <div className="grid gap-3 sm:grid-cols-3">
              <MoneyField id="wl-setup" label="Setup" valueCents={b.whiteLabel.setupCents} onChange={(v) => setB({ ...b, whiteLabel: { ...b.whiteLabel, setupCents: v } })} />
              <MoneyField id="wl-monthly" label="Manutenção mensal" valueCents={b.whiteLabel.monthlyCents} onChange={(v) => setB({ ...b, whiteLabel: { ...b.whiteLabel, monthlyCents: v } })} />
              <PercentField id="wl-bps" label="Taxa de volume" bps={b.whiteLabel.volumeFeeBps} onChange={(v) => setB({ ...b, whiteLabel: { ...b.whiteLabel, volumeFeeBps: v } })} />
              <MoneyField id="wl-min" label="Taxa mínima mensal" valueCents={b.whiteLabel.minMonthlyFeeCents} onChange={(v) => setB({ ...b, whiteLabel: { ...b.whiteLabel, minMonthlyFeeCents: v } })} />
              <MoneyField id="wl-order" label="Taxa por pedido expedido" hint="Zero = desligada" valueCents={b.whiteLabel.perOrderFeeCents} onChange={(v) => setB({ ...b, whiteLabel: { ...b.whiteLabel, perOrderFeeCents: v } })} />
            </div>
          </Section>
          <Section title="Ofertas para lojistas (pagas diretamente à NextLevel)">
            <div className="grid gap-3 sm:grid-cols-3">
              {OFFER_KEYS.map((k) => (
                <div key={k} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="text-sm font-medium">{OFFER_LABEL[k]}</div>
                  <MoneyField id={`o-s-${k}`} label="Setup" valueCents={b.offers[k].setupCents} onChange={(v) => setB({ ...b, offers: { ...b.offers, [k]: { ...b.offers[k], setupCents: v } } })} />
                  <MoneyField id={`o-m-${k}`} label="Mensalidade" valueCents={b.offers[k].monthlyCents} onChange={(v) => setB({ ...b, offers: { ...b.offers, [k]: { ...b.offers[k], monthlyCents: v } } })} />
                </div>
              ))}
            </div>
          </Section>
          <Section title="Canal, cobrança e custos">
            <div className="grid gap-3 sm:grid-cols-3">
              <PercentField id="ch-bps" label="Comissão do fornecedor sobre o setup" bps={b.channel.setupCommissionBps} onChange={(v) => setB({ ...b, channel: { ...b.channel, setupCommissionBps: v } })} />
              <IntField id="ch-days" label="Garantia da comissão" suffix="dias" value={b.channel.guaranteeDays} onChange={(v) => setB({ ...b, channel: { ...b.channel, guaranteeDays: v } })} />
              <IntField id="bl-due" label="Dia de vencimento" hint="1 a 28" value={b.billing.dueDay} min={1} onChange={(v) => setB({ ...b, billing: { ...b.billing, dueDay: Math.min(28, v) } })} />
              <IntField id="bl-waiver" label="Isenção padrão de parceiro fundador" suffix="dias" value={b.billing.waiverDays} onChange={(v) => setB({ ...b, billing: { ...b.billing, waiverDays: v } })} />
              <IntField id="bl-lock" label="Preço de lista travado por" suffix="meses" value={b.billing.priceLockMonths} onChange={(v) => setB({ ...b, billing: { ...b.billing, priceLockMonths: v } })} />
              <PercentField id="sv-margin" label="Margem alvo dos serviços" bps={b.services.targetMarginBps} onChange={(v) => setB({ ...b, services: { targetMarginBps: v } })} />
              <PercentField id="co-coll" label="Custo de cobrança" hint="Usado no simulador" bps={b.costs.collectionFeeBps} onChange={(v) => setB({ ...b, costs: { ...b.costs, collectionFeeBps: v } })} />
              <MoneyField id="co-infra" label="Infraestrutura por loja/mês" valueCents={b.costs.infraPerStoreCents} onChange={(v) => setB({ ...b, costs: { ...b.costs, infraPerStoreCents: v } })} />
              <MoneyField id="co-sup" label="Suporte por fornecedor/mês" valueCents={b.costs.supportPerSupplierCents} onChange={(v) => setB({ ...b, costs: { ...b.costs, supportPerSupplierCents: v } })} />
            </div>
          </Section>
          <div className="flex justify-end"><Button disabled={!dirty} loading={pending} onClick={() => start(async () => { const r = await savePriceBookAction(b); if (r.ok) { toast.success("Tabela de preços salva"); router.refresh(); } else toast.error(r.error); })}><Save /> Salvar tabela de preços</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3"><h3 className="text-sm font-semibold">{title}</h3>{children}</div>;
}
function Cell({ on }: { on: boolean }) {
  return <td className="px-3 py-2 text-center">{on ? <Check className="mx-auto size-4 text-success" aria-label="Permitido" /> : <Minus className="mx-auto size-4 text-danger" aria-label="Bloqueado" />}</td>;
}
