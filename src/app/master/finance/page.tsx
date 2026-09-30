import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { financeOverview, getPriceBook, periodOf } from "@/lib/domain/finance";
import { Overview } from "./overview";
import { RevenueMapView } from "./revenue-map-view";
import { Simulator } from "./simulator";
import { Contracts, type ContractView } from "./contracts";
import { Invoices, type InvoiceView } from "./invoices";
import { Rules } from "./rules";
import { FinanceTabs } from "./finance-tabs";
import { estimateClosing } from "@/lib/domain/finance";
import { suppliers } from "@/db/schema";
import { RationaleList } from "@/components/finance/rationale-list";
import { buildRationale, marginAlerts } from "@/lib/finance/rationale";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireRole("NEXTLEVEL_MASTER");
  const { period: p } = await searchParams;
  const period = p && /^\d{4}-(0[1-9]|1[0-2])$/.test(p) ? p : periodOf(new Date());
  const db = await getDb();
  const [book, overview] = await Promise.all([getPriceBook(db), financeOverview(db, period)]);
  const supplierList = await db.select().from(suppliers).where(eq(suppliers.hidden, false));
  const contracts: ContractView[] = [];
  for (const s of supplierList) {
    const est = await estimateClosing(db, s.id, period, false);
    contracts.push({ supplierId: s.id, name: s.name, model: s.businessModel, access: s.status, tier: est.terms.tier, monthlyFeeCents: est.terms.monthlyFeeCents, setupFeeCents: est.terms.setupFeeCents, volumeFeeBps: est.terms.volumeFeeBps, minMonthlyFeeCents: est.terms.minMonthlyFeeCents, perOrderFeeCents: est.terms.perOrderFeeCents, storeSetupCommissionBps: est.terms.storeSetupCommissionBps, monthlyWaivedUntil: est.terms.monthlyWaivedUntil, setupWaivedUntil: est.terms.setupWaivedUntil, priceLockUntil: est.terms.priceLockUntil, creditBalanceCents: est.terms.creditBalanceCents, notes: (await db.query.supplierContracts.findFirst({ where: (c, { eq }) => eq(c.supplierId, s.id) }))?.notes ?? null, baseCents: est.baseCents, feeCents: est.closing.fee.totalCents, waiverDays: book.billing.waiverDays });
  }
  const names = new Map(supplierList.map((s) => [s.id, s.name]));
  const invoices: InvoiceView[] = overview.invoices.map((i) => ({ id: i.id, kind: i.kind, description: i.description, payer: i.payerType === "STORE" ? "Lojista" : names.get(i.supplierId ?? "") ?? "Fornecedor", period: i.period, amountCents: i.amountCents, status: i.status, dueDate: i.dueDate, paidAt: i.paidAt, lines: i.lines }));

  return (
    <>
      <PageHeader title="Financeiro" description="Mapa completo das receitas da NextLevel, contratos dos fornecedores, cobrança e simulador de ganhos. Fiscal fica fora do escopo por enquanto." />
      <Suspense>
        <FinanceTabs
          initial="overview"
          tabs={[
            { value: "overview", label: "Visão geral", content: <Overview data={overview} /> },
            { value: "map", label: "Mapa de receitas", content: <RevenueMapView book={book} /> },
            { value: "simulator", label: "Simulador", content: <Simulator book={book} /> },
            { value: "contracts", label: "Contratos", content: <Contracts contracts={contracts} /> },
            { value: "invoices", label: "Faturas e fechamento", content: <Invoices invoices={invoices} period={period} /> },
            { value: "why", label: "Por que cobramos", content: (
              <div className="space-y-4">
                {marginAlerts(book).length ? <div role="alert" className="rounded-lg border border-warning/40 bg-warning-soft/50 p-3 text-sm"><b>Margem abaixo da meta ({book.services.targetMarginBps / 100}%):</b> {marginAlerts(book).map((a) => `${a.label} (${(a.marginBps / 100).toFixed(0)}%)`).join(", ")}</div> : <div className="rounded-lg border border-success/30 bg-success-soft/40 p-3 text-sm">Todos os perfis estão acima da meta de margem de {book.services.targetMarginBps / 100}%.</div>}
                <RationaleList items={buildRationale(book)} showMargin />
              </div>
            ) },
            { value: "rules", label: "Regras e preços", content: <Rules book={book} /> },
          ]}
        />
      </Suspense>
    </>
  );
}
