import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listCorporateOrders, listPaymentEvents, listTransactions } from "@/lib/domain/corporate-checkout";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { RefundButton } from "../catalog-admin";
import { FinNav } from "../fin-nav";

export const dynamic = "force-dynamic";
const ORDER: Record<string, { l: string; t: "success" | "warning" | "danger" | "neutral" }> = { PENDING_PAYMENT: { l: "Aguardando pagamento", t: "warning" }, PAID: { l: "Pago", t: "success" }, FAILED: { l: "Falhou", t: "danger" }, EXPIRED: { l: "Expirado", t: "neutral" }, CANCELED: { l: "Cancelado", t: "neutral" }, REFUNDED: { l: "Reembolsado", t: "neutral" }, CHARGEBACK: { l: "Chargeback", t: "danger" } };

export default async function PagamentosMaster() {
  const s = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [orders, txs, events] = await Promise.all([listCorporateOrders(db, s.actor), listTransactions(db, s.actor), listPaymentEvents(db, s.actor)]);
  return (
    <>
      <PageHeader eyebrow="Financeiro corporativo NextLevel" title="Pagamentos" description="Pedidos do catálogo, tentativas de cobrança em cada gateway e notificações recebidas. Faturas de planos e de fornecedores continuam em Financeiro SuperDrop e em Assinaturas." />
      <FinNav active="pagamentos" />
      <SectionTitle title="Pedidos" />
      <DataTable rows={orders} rowKey={(o) => o.id} empty={<p className="text-sm text-muted-foreground">Nenhum pedido do catálogo ainda.</p>} columns={[
        { key: "c", header: "Pedido", primary: true, cell: (o) => <div><div className="font-semibold">{o.code} · {o.snapshot.productName}</div><div className="text-xs text-muted-foreground">{o.buyerName} · {o.buyerType === "STORE" ? "loja" : o.buyerType === "SUPPLIER" ? "fornecedor" : "visitante"}{o.partnerId ? " · parceiro" : ""}</div></div> },
        { key: "v", header: "Valor", cell: (o) => <div className="tabular-nums"><div className="font-semibold">{formatBRL(o.totalCents)}</div><div className="text-xs text-muted-foreground">{o.method === "PIX" ? "Pix" : `cartão ${o.installments}x`} · {o.gateway === "PAGARME" ? "Pagar.me" : "Mercado Pago"}</div></div> },
        { key: "s", header: "Situação", cell: (o) => <Badge tone={ORDER[o.status]?.t ?? "neutral"}>{ORDER[o.status]?.l ?? o.status}</Badge> },
        { key: "d", header: "Criado", cell: (o) => formatDate(o.createdAt) },
        { key: "a", header: "", cell: (o) => (o.status === "PAID" ? <RefundButton orderId={o.id} label={o.code} /> : null) },
      ]} />
      <SectionTitle title="Tentativas de cobrança" />
      <DataTable rows={txs} rowKey={(t) => t.id} empty={<p className="text-sm text-muted-foreground">Nenhuma cobrança criada.</p>} columns={[
        { key: "i", header: "Cobrança", primary: true, cell: (t) => <div><div className="font-mono text-xs">{t.id}</div><div className="text-xs text-muted-foreground">{t.gateway === "PAGARME" ? "Pagar.me" : "Mercado Pago"} · externo {t.externalId ?? "—"}</div></div> },
        { key: "v", header: "Bruto / taxa / líquido", cell: (t) => <span className="tabular-nums text-xs">{formatBRL(t.grossCents)} / {t.feeCents === null ? "—" : formatBRL(t.feeCents)} / {t.netCents === null ? "—" : formatBRL(t.netCents)}</span> },
        { key: "s", header: "Situação", cell: (t) => <span className="text-xs">{t.status}{t.providerStatus ? ` (${t.providerStatus})` : ""}</span> },
        { key: "d", header: "Atualizado", cell: (t) => formatDate(t.updatedAt) },
      ]} />
      <SectionTitle title="Notificações recebidas (webhooks)" description="Cada notificação é registrada uma vez; repetidas são ignoradas. O estado é sempre conferido na API do gateway." />
      <DataTable rows={events} rowKey={(e) => e.id} empty={<p className="text-sm text-muted-foreground">Nenhuma notificação recebida.</p>} columns={[
        { key: "g", header: "Gateway", primary: true, cell: (e) => <span>{e.gateway === "PAGARME" ? "Pagar.me" : "Mercado Pago"} · {e.type}</span> },
        { key: "r", header: "Resultado", cell: (e) => <Badge tone={e.result === "PROCESSED" ? "success" : e.result === "FAILED" || e.result === "REJECTED" ? "danger" : "neutral"}>{e.result}</Badge> },
        { key: "x", header: "Detalhe", cell: (e) => <span className="text-xs">{e.detail ?? ""}</span> },
        { key: "d", header: "Recebido", cell: (e) => formatDate(e.receivedAt) },
      ]} />
    </>
  );
}
