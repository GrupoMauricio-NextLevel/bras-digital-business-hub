import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listCommissionRules, listOffers } from "@/lib/domain/nl-catalog";
import { getFinanceSettings } from "@/lib/domain/corporate-commissions";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { FAMILY_LABEL, CYCLE_LABEL } from "@/lib/finance/catalog-labels";
import { PARTNER_KIND_LABEL } from "@/lib/domain/corporate-sales";
import { OfferVersionForm, RuleVersionForm, TaxSettingForm } from "../catalog-admin";
import { FinNav } from "../fin-nav";
import { listDoors } from "@/lib/domain/precos/porta-entrada";
import { PortaForm } from "@/components/descoberta/porta-form";

export const dynamic = "force-dynamic";

export default async function OfertasComissoes() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [offers, rules, fin] = await Promise.all([listOffers(db, s.actor), listCommissionRules(db), getFinanceSettings(db)]);
  const entry = offers.find((o) => o.key === "COMMERCE_ENTRADA");
  const doors = await listDoors(db, s.actor);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Ofertas e comissões" description="Oferta de entrada da Commerce e regras de comissão dos parceiros, sempre em versões: quem já recebeu uma condição mantém a dela." />
      <FinNav active="ofertas" />
      {entry ? (
        <Card className="mb-6"><CardContent className="pt-5">
          <SectionTitle title={`Oferta de entrada Commerce (versão ${entry.version})`} description="Vale uma vez por CPF/CNPJ, para clientes novos." />
          <p className="mb-4 text-sm"><Badge tone={entry.status === "ACTIVE" ? "success" : "warning"}>{entry.status === "ACTIVE" ? "Ativa" : "Pausada"}</Badge> <span className="ml-2">{entry.rules.trialDays} dias grátis · 1º mês {entry.rules.firstPeriodCents === null ? "sem preço especial" : formatBRL(entry.rules.firstPeriodCents)} · taxa de plataforma zero por {entry.rules.feeHolidayMonths} meses</span></p>
          <OfferVersionForm offerKey={entry.key} rules={entry.rules} />
        </CardContent></Card>
      ) : null}
      {doors.map(({ brand, offer }) => offer ? (
        <Card key={brand} className="mb-6"><CardContent className="pt-5">
          <SectionTitle title={`Porta de entrada ${brand === "SUPERDROP" ? "SuperDrop" : "Commerce"} (versão ${offer.version})`} description="“Grátis para começar, paga quando cresce” (D126): teste do plano pago que cai no grátis, dias por conquista, anual no Pix e cashback em pontos. Ligar vale só para novos clientes; quem já entrou mantém a condição." />
          <p className="mb-4 text-sm"><Badge tone={offer.status === "ACTIVE" ? "success" : "warning"}>{offer.status === "ACTIVE" ? "Ligada" : "Desligada"}</Badge> <span className="ml-2">{offer.rules.trialDays} dias de teste · grátis com {(offer.rules.freeTierFeeBps ?? 0) / 100}% por venda · até {offer.rules.milestoneCapDays ?? 0} dias com conquistas · anual {offer.rules.annualPromo ? `pague ${offer.rules.annualPromo.paidMonths}, leve 12` : "sem promoção"} · cashback {(offer.rules.cashbackBps ?? 0) / 100}% · {offer.rules.priceSource === "PROPOSTA" ? <b>preços da Proposta</b> : "preços de hoje"}</span></p>
          <PortaForm brand={brand} label={brand === "SUPERDROP" ? "SuperDrop" : "E-commerce"} value={{ status: offer.status, mode: offer.rules.mode === "FREE_TIER" ? "FREE_TIER" : "REVERSE_TRIAL", trialDays: offer.rules.trialDays, freeTierFeeBps: offer.rules.freeTierFeeBps ?? 0, publishDays: offer.rules.milestoneDays?.find((m) => m.event === "STORE_PUBLISHED")?.days ?? 0, firstSaleDays: offer.rules.milestoneDays?.find((m) => m.event === "FIRST_SALE")?.days ?? 0, milestoneCapDays: offer.rules.milestoneCapDays ?? 0, annualPaidMonths: offer.rules.annualPromo?.paidMonths ?? 0, cashbackBps: offer.rules.cashbackBps ?? 0, useProposalPrices: offer.rules.priceSource === "PROPOSTA" }} />
        </CardContent></Card>
      ) : null)}
      <SectionTitle title="Regras de comissão vigentes" description="Base = valor recebido − imposto − taxa do gateway. Estorno e chargeback anulam ou lançam débito. Verba de mídia nunca entra." />
      <DataTable rows={rules.latest} rowKey={(r) => r.id} columns={[
        { key: "k", header: "Regra", primary: true, cell: (r) => <div><div className="font-semibold">{r.key} <span className="text-xs font-normal text-muted-foreground">v{r.version}</span></div><div className="text-xs text-muted-foreground">{FAMILY_LABEL[r.family]}{r.productKey ? ` · ${r.productKey}` : ""}{r.cycle ? ` · ${CYCLE_LABEL[r.cycle]}` : ""}{r.partnerKind ? ` · ${PARTNER_KIND_LABEL[r.partnerKind]}` : ""}</div></div> },
        { key: "c", header: "Comissão", cell: (r) => <span className="tabular-nums">{r.firstBps / 100}%{r.recurringBps ? ` + ${r.recurringBps / 100}% por ${r.recurringMonths} meses` : ""}</span> },
        { key: "h", header: "Carência", cell: (r) => `${r.holdDays} dias` },
        { key: "b", header: "Benefício ao cliente", cell: (r) => <span className="text-xs">{r.benefit}</span> },
        { key: "s", header: "Situação", cell: (r) => <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Ativa" : "Desativada"}</Badge> },
        { key: "a", header: "", cell: (r) => <RuleVersionForm ruleKey={r.key} rule={{ firstBps: r.firstBps, recurringBps: r.recurringBps, recurringMonths: r.recurringMonths, holdDays: r.holdDays, benefit: r.benefit, active: r.active }} /> },
      ]} />
      <Card className="mt-6"><CardContent className="pt-5"><SectionTitle title="Imposto na base de comissão" /><TaxSettingForm taxBps={fin.taxBps} /></CardContent></Card>
      <SectionTitle title="Histórico de versões" />
      <DataTable rows={[...rules.history.map((r) => ({ id: r.id, what: `${r.key} v${r.version}`, detail: `${r.firstBps / 100}% + ${r.recurringBps / 100}% · ${r.holdDays} dias${r.active ? "" : " · desativada"}`, reason: r.reason, at: r.createdAt })), ...offers.map((o) => ({ id: o.id, what: `${o.key} v${o.version}`, detail: `${o.rules.trialDays} dias · 1º mês ${o.rules.firstPeriodCents === null ? "-" : formatBRL(o.rules.firstPeriodCents)} · ${o.rules.feeHolidayMonths} meses sem taxa · ${o.status}`, reason: o.reason, at: o.createdAt }))].sort((a, b) => b.at.localeCompare(a.at))} rowKey={(r) => r.id} columns={[
        { key: "w", header: "Versão", primary: true, cell: (r) => <span className="font-semibold">{r.what}</span> },
        { key: "d", header: "Condição", cell: (r) => <span className="text-xs">{r.detail}</span> },
        { key: "r", header: "Motivo", cell: (r) => <span className="text-xs">{r.reason}</span> },
        { key: "t", header: "Quando", cell: (r) => formatDate(r.at) },
      ]} />
    </>
  );
}
