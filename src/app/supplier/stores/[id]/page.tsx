import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, KeyRound, ShoppingCart, Wallet } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { MetricCard, MetricGrid } from "@/components/app/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { OrdersTable } from "@/components/shared/orders-table";
import { requireRole } from "@/lib/require-session";
import { getSupplierStoreDetail } from "@/lib/queries/supplier";
import { formatBRL } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StoreOwnerActions } from "../owner-actions";

export default async function SupplierStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPPLIER_ADMIN");
  const { id } = await params;
  const d = await getSupplierStoreDetail(session.supplier!.id, id);
  if (!d) notFound();

  const activationMessage =
    d.store.status === "PENDING_PAYMENT"
      ? "A loja foi criada, mas só poderá vender depois que a fatura de ativação da NextLevel for paga."
      : d.store.status === "ACTIVE"
        ? "Loja liberada para operar."
        : "A loja está com acesso restrito. Consulte o status e as pendências antes de orientar o lojista.";

  return (
    <>
      <PageHeader
        title={d.store.name}
        description={<span>{d.networkName} · <StatusBadge value={d.store.status} dot /></span>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a href={`/store/${d.store.slug}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}><ExternalLink /> Ver loja</a>
            <Link href="/supplier/stores" className={buttonVariants({ variant: "ghost" })}>Voltar</Link>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Situação operacional</div>
            <p className="text-sm text-muted-foreground">{activationMessage}</p>
          </div>
          {d.invoice ? <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Fatura de ativação</span><StatusBadge value={d.invoice.status} /></div> : null}
        </CardContent>
      </Card>

      <MetricGrid className="mb-6">
        <MetricCard label="Vendas pagas" value={formatBRL(d.stats.gmvCents)} icon={ShoppingCart} tone="success" hint={`${d.stats.paidOrders} pedido(s) pago(s)`} />
        <MetricCard label="Receita da Central" value={formatBRL(d.stats.centralRevenueCents)} />
        <MetricCard label="Saldo do lojista" value={formatBRL(d.balanceCents)} icon={Wallet} tone={d.stats.waitingFunds ? "warning" : "neutral"} />
        <MetricCard label="Produtos ativos" value={d.stats.activeProducts} />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Próximas ações</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {d.store.status === "PENDING_PAYMENT" ? <Action title="Aguardando ativação" text="O lojista precisa quitar a fatura no painel Financeiro. A liberação é automática após a confirmação." href={null} /> : null}
              {d.stats.waitingFunds > 0 ? <Action title={`${d.stats.waitingFunds} pedido(s) sem saldo`} text={`${formatBRL(d.stats.waitingFundsCents)} em custo aguardando recarga.`} href="/supplier/wallets" /> : null}
              {d.stats.waitingLabel > 0 ? <Action title={`${d.stats.waitingLabel} pedido(s) sem etiqueta`} text="O lojista precisa anexar a etiqueta para liberar a separação." href="/supplier/orders?status=AWAITING_LABEL" /> : null}
              {d.stats.activeProducts === 0 ? <Action title="Nenhum produto ativo" text="O lojista ainda não ativou produtos do catálogo da Central." href={null} /> : null}
              {d.store.status === "ACTIVE" && d.stats.waitingFunds === 0 && d.stats.waitingLabel === 0 && d.stats.activeProducts > 0 ? <Action title="Operação em dia" text="Nenhuma pendência crítica detectada para esta loja." href={null} /> : null}
            </CardContent>
          </Card>

          <div>
            <SectionTitle title="Pedidos recentes" />
            <OrdersTable rows={d.recentOrders.map((order) => ({ order, storeName: d.store.name, storeSlug: d.store.slug }))} basePath="/supplier/orders" showCost showStore={false} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Lojista</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {d.owner ? (
                <>
                  <div><div className="text-xs text-muted-foreground">Responsável</div><div className="font-medium">{d.owner.name}</div><div className="text-muted-foreground">{d.owner.email}</div></div>
                  <div><div className="text-xs text-muted-foreground">Acesso</div><div>{d.owner.lastLoginAt ? `Último acesso ${formatDateTime(d.owner.lastLoginAt)}` : d.owner.mustChangePassword ? "Aguardando primeiro acesso" : "Ainda sem acesso registrado"}</div></div>
                  <div className="flex items-center justify-between border-t border-border pt-3"><span className="inline-flex items-center gap-2 text-muted-foreground"><KeyRound className="size-4" /> Credenciais</span><StoreOwnerActions owner={d.owner} /></div>
                </>
              ) : <p className="text-muted-foreground">Nenhum proprietário associado.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Plano e ativação</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Oferta" value={d.store.offer} />
              <Row label="Status da loja" value={d.store.status} badge />
              {d.subscription ? <><Row label="Plano" value={d.subscription.plan.name} /><Row label="Assinatura" value={d.subscription.sub.status} badge /><Row label="Período atual até" value={formatDate(d.subscription.sub.currentPeriodEnd)} /></> : null}
              {d.invoice ? <><Row label="Ativação" value={formatBRL(d.invoice.amountCents)} /><Row label="Fatura" value={d.invoice.status} badge /><Row label="Vencimento" value={formatDate(d.invoice.dueDate)} /></> : null}
              {d.acquisition ? <><Row label="Comissão" value={formatBRL(d.acquisition.commissionCents)} /><Row label="Comissão status" value={d.acquisition.status} badge /></> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span>{badge ? <StatusBadge value={value} /> : <span className="text-right font-medium">{value}</span>}</div>;
}

function Action({ title, text, href }: { title: string; text: string; href: string | null }) {
  const body = <><div className="font-medium">{title}</div><p className="mt-1 text-xs text-muted-foreground">{text}</p></>;
  return href ? <Link href={href} className="rounded-lg border border-border p-3 transition hover:bg-surface-muted">{body}</Link> : <div className="rounded-lg border border-border p-3">{body}</div>;
}
