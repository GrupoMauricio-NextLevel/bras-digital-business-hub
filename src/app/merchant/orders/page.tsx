import { Suspense } from "react";
import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";
import { pedidosQuePrecisamDeVoce } from "@/lib/domain/pedidos-agora";
import { AoVivo } from "@/components/master/ao-vivo";
import { formatBRL } from "@/lib/money";
import { OrdersTable } from "@/components/shared/orders-table";
import { FilterBar, FilterChips, FilterTabs } from "@/components/app/filter-bar";
import { listOrdersForActor } from "@/lib/domain/orders";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/domain/order-status";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { SimulateOrderButton } from "./simulate-order-button";
import { CopiarMensagem } from "./copiar-mensagem";
import { isDemoMode } from "@/lib/auth";
import { MetricCard } from "@/components/app/metric-card";
import { perfilAtual } from "@/lib/perfil-loja-server";

const COMMERCE_TABS: OrderStatus[] = ["PENDING", "SHIPPED", "DELIVERED"];

export default async function MerchantOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; ver?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { status, ver } = await searchParams;
  const selectedStatus = ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const db = await getDb();
  const allRows = await listOrdersForActor(db, session.actor);
  const perfil = await perfilAtual(session.store!.id);
  const { independente: independent, ecommerce: commerce } = perfil;
  // Pedido na mesa (D184): na loja independente, atalhos para os marcados com estrela, os não impressos e os suspeitos.
  const VER: Record<string, { rotulo: string; filtro: (o: (typeof allRows)[number]["order"]) => boolean }> = {
    estrela: { rotulo: "Com estrela", filtro: (o) => o.starred },
    "nao-impressos": { rotulo: "Não impressos", filtro: (o) => !o.printedAt && o.customerPaymentStatus === "PAID" && !["SHIPPED", "DELIVERED", "CANCELED"].includes(o.status) },
    suspeita: { rotulo: "Com suspeita", filtro: (o) => !!o.fraudFlag },
  };
  // Precisa de você (D208): os pedidos parados, do mais urgente ao menos, com a mensagem pronta para o cliente.
  const urgentes = commerce ? pedidosQuePrecisamDeVoce(allRows.map((r) => r.order), new Date(), session.store!.name, independent) : [];
  if (commerce) VER.atencao = { rotulo: "Precisa de você", filtro: (o) => urgentes.some((u) => u.id === o.id) };
  const atalho = (independent || commerce) && ver ? VER[ver] : undefined;
  const rows = allRows.filter((row) => (!selectedStatus || row.order.status === selectedStatus) && (!atalho || atalho.filtro(row.order)));
  const statuses = ORDER_STATUSES.filter((s) => !independent || s !== "AWAITING_CENTRAL_PAYMENT");
  const count = (value: OrderStatus) => allRows.filter((row) => row.order.status === value).length;
  const activeCount = allRows.filter((row) => !["DELIVERED", "CANCELED"].includes(row.order.status)).length;
  return (
    <>
      <PageHeader eyebrow={commerce ? "Escritório" : "SuperDrop / Operação"} title="Pedidos" description="Loja virtual, WhatsApp, Instagram e vendas manuais no mesmo fluxo."
        actions={<>{isDemoMode() ? <SimulateOrderButton /> : null}<Link href="/merchant/orders/propostas" className={buttonVariants({ variant: "ghost" })}>{commerce ? "Links de pagamento" : "Propostas"}</Link><Link href="/merchant/orders/new" className={buttonVariants()}><Plus /> Novo pedido</Link></>} />
      {commerce ? (
        <PrecisaDeVoce descricao="Pedidos parados além do normal, do mais urgente ao menos urgente. Avise o cliente com a mensagem pronta." vazio="Nenhum pedido parado. Tudo andando no ritmo certo." verTodos="/merchant/orders?ver=atencao" acoes={<AoVivo segundos={30} />}
          itens={urgentes.map((u) => ({ id: u.id, titulo: `#${u.numero} · ${u.cliente}`, detalhe: `${u.motivo} · ${formatBRL(u.totalCents)}`, tom: u.tom, href: `/merchant/orders/${u.id}`, acao: u.acao,
            extra: u.whatsappHref ? <a href={u.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ds-link)]"><MessageCircle className="size-3.5" aria-hidden />Avisar no WhatsApp</a> : <CopiarMensagem texto={u.mensagem} /> }))} />
      ) : null}
      <section className="ds-kpis mb-6" aria-label="Resumo dos pedidos">
        <MetricCard label="Ativos" value={activeCount} />
        {commerce ? <>
          <MetricCard label="Aguardando pagamento" value={count("PENDING")} />
          <MetricCard label="Em preparação" value={count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP")} />
          <MetricCard label="Enviados" value={count("SHIPPED")} />
        </> : <>
          <MetricCard label="Aguardando saldo" value={count("AWAITING_CENTRAL_PAYMENT")} />
          <MetricCard label="Aguardando etiqueta" value={count("AWAITING_LABEL")} />
          <MetricCard label="Na Central" value={count("READY_TO_PICK") + count("PICKING") + count("READY_TO_SHIP")} />
        </>}
      </section>
      <Suspense><FilterBar>{commerce
        ? <FilterTabs param="status" primary={COMMERCE_TABS.filter((s) => statuses.includes(s)).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], count: count(s) }))} rest={statuses.filter((s) => !COMMERCE_TABS.includes(s)).map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />
        : <FilterChips param="status" options={statuses.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))} />}</FilterBar></Suspense>
      {independent || commerce ? (
        <nav aria-label="Atalhos dos pedidos" className="mb-3 flex flex-wrap gap-2 text-sm">
          {Object.entries(VER).map(([k, v]) => {
            const n = allRows.filter((r) => v.filtro(r.order)).length;
            return <Link key={k} href={ver === k ? "/merchant/orders" : `/merchant/orders?ver=${k}`} aria-current={ver === k ? "page" : undefined} className={`rounded-full border px-3 py-1 ${ver === k ? "border-foreground font-semibold" : "border-border"}`}>{v.rotulo} ({n})</Link>;
          })}
        </nav>
      ) : null}
      <OrdersTable rows={rows} basePath="/merchant/orders" showStore={false} quickView showCentral={!independent} mesa={independent ? { independente: true } : undefined} />
    </>
  );
}
