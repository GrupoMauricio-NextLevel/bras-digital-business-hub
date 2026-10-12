import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { financeInvoices, nextlevelPayments } from "@/db/schema";
import { requireRole } from "@/lib/require-session";
import { getPriceBook } from "@/lib/domain/finance";
import { getNextLevelMp } from "@/lib/domain/nextlevel-billing";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { OFFER_KEYS, TIER_KEYS } from "@/lib/finance/price-book";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";

export default async function SuperdropRacional() {
  await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [book, mp] = await Promise.all([getPriceBook(db), getNextLevelMp(db)]);
  const [paidInv] = await db.select({ n: count() }).from(financeInvoices).where(eq(financeInvoices.status, "PAID"));
  const [mpPaid] = await db.select({ n: count() }).from(nextlevelPayments).where(eq(nextlevelPayments.status, "PAID"));
  const chain = [
    { step: "Fatura emitida (setup, mensalidade, fechamento, taxa por pedido)", ok: true, note: "rotina diária /api/cron/finance + ativação da loja" },
    { step: "Cobrança Pix/cartão na conta Mercado Pago da NextLevel", ok: mp.connected, note: mp.connected ? `conta ${mp.nickname}${mp.isTest ? " (teste)" : ""}` : "conta da NextLevel NÃO conectada: as faturas não podem ser pagas online" },
    { step: "Webhook validado (consulta à API, referência e valor)", ok: true, note: "/api/webhooks/mercadopago-nextlevel" },
    { step: "Fatura quitada uma única vez (atualização condicional, D90)", ok: true, note: "corrigido nesta versão" },
    { step: "Acesso liberado (loja paga, add-on, tema)", ok: true, note: "grantPlanMonths / grantEntitlement" },
    { step: "Comissão do parceiro e e-mail de recibo", ok: true, note: "partners.onInvoicePaid + e-mail INVOICE_PAID" },
    { step: "Pagamentos confirmados registrados", ok: (mpPaid?.n ?? 0) > 0, note: `${mpPaid?.n ?? 0} pagamento(s) online confirmados · ${paidInv?.n ?? 0} fatura(s) pagas no total` },
  ];
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="SuperDrop: racional de cobrança" description="O que o SuperDrop cobra, de quem e como chega à conta da NextLevel. Os preços continuam na tabela do SuperDrop (editável só pelo Master, agora com trilha de cada alteração)." actions={<Link href="/master/financeiro/operacao?tab=rules" className="ds-btn ds-btn--secondary">Editar tabela do SuperDrop</Link>} />
      <FinNav active="superdrop" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="pt-5">
          <SectionTitle title="Fornecedores (pagam à NextLevel)" />
          <ul className="space-y-1 text-sm">
            {TIER_KEYS.map((t) => <li key={t}>{book.supplierTiers[t].name}: <strong>{formatBRL(book.supplierTiers[t].monthlyCents)}/mês</strong></li>)}
            <li>Taxa de volume: <strong>{book.superdrop.volumeFeeBps / 100}%</strong> do custo dos pedidos pagos à Central, mínimo {formatBRL(book.superdrop.minMonthlyFeeCents)}/mês</li>
            <li>White Label do fornecedor: setup {formatBRL(book.whiteLabel.setupCents)}, {formatBRL(book.whiteLabel.monthlyCents)}/mês, {book.whiteLabel.volumeFeeBps / 100}%</li>
            <li>Comissão de canal ao fornecedor: {book.channel.setupCommissionBps / 100}% do setup de cada loja nova, após {book.channel.guaranteeDays} dias</li>
          </ul>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <SectionTitle title="Lojas de membros (pagam à NextLevel)" />
          <ul className="space-y-1 text-sm">
            {OFFER_KEYS.map((o) => <li key={o}>{book.offers[o].name}: setup {formatBRL(book.offers[o].setupCents)} + <strong>{formatBRL(book.offers[o].monthlyCents)}/mês</strong> · taxa por pedido {book.orderFees[o] / 100}%</li>)}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Recargas vão 100% para a conta Mercado Pago do fornecedor; vendas ao cliente final vão 100% para a conta da loja. A NextLevel não guarda saldo de terceiros.</p>
        </CardContent></Card>
      </div>
      <SectionTitle title="Fluxo validado (do código à conta da NextLevel)" />
      <Card><CardContent className="pt-5"><ol className="space-y-2 text-sm">{chain.map((c, i) => <li key={c.step} className="flex flex-wrap items-start gap-2"><Badge tone={c.ok ? "success" : "danger"}>{c.ok ? "ok" : "pendente"}</Badge><span><strong>{i + 1}. {c.step}</strong> <span className="text-muted-foreground">· {c.note}</span></span></li>)}</ol></CardContent></Card>
    </>
  );
}
