import Link from "next/link";
import { Suspense } from "react";
import { Download, ShieldCheck, ShoppingCart, UserCheck, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { FilterBar, SearchInput } from "@/components/app/filter-bar";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listStoreCustomers } from "@/lib/domain/crm";
import { formatBRL } from "@/lib/money";
import { formatDate, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const session = await requireRole("STORE_OWNER");
  const { q, tag } = await searchParams;
  const rows = await listStoreCustomers(await getDb(), session.store!.id, { q, tag });
  const totalSpent = rows.reduce((sum, r) => sum + r.sc.totalSpentCents, 0);
  const repeat = rows.filter((r) => r.sc.ordersCount > 1).length;
  const consented = rows.filter((r) => r.consents.length > 0).length;
  const ordersCount = rows.reduce((sum, r) => sum + r.sc.ordersCount, 0);
  return (
    <>
      <PageHeader title="Clientes" description="Clientes da sua loja. Dados de marketing só são utilizáveis com consentimento registrado." actions={<a href="/api/crm/export" className={buttonVariants({ variant: "secondary" })}><Download /> Exportar contatos com consentimento</a>} />
      {/* eslint-disable @next/next/no-html-link-for-pages -- downloads de arquivo, não navegação */}
      <p className="mb-4 text-sm text-muted-foreground">Seus dados são seus. Baixe em planilha: <a className="font-medium underline underline-offset-2" href="/api/store/export/pedidos">pedidos</a> · <a className="font-medium underline underline-offset-2" href="/api/store/export/produtos">produtos</a> · <a className="font-medium underline underline-offset-2" href="/api/store/export/clientes">clientes</a>. Cada download fica registrado.</p>
      {/* eslint-enable @next/next/no-html-link-for-pages */}
      <OperationalPulse className="mb-5" items={[
        { label: "Clientes", value: rows.length, icon: Users, tone: "neutral", hint: "na base atual" },
        { label: "Compraram novamente", value: repeat, icon: UserCheck, tone: repeat ? "success" : "neutral", hint: "mais de 1 pedido" },
        { label: "Pedidos da base", value: ordersCount, icon: ShoppingCart, tone: "info", hint: "histórico acumulado" },
        { label: "Valor movimentado", value: formatBRL(totalSpent), icon: Wallet, tone: "success", hint: consented + " com consentimento" },
      ]} />
      <Card className="mb-4"><CardContent className="flex items-start gap-3 py-4 text-sm"><ShieldCheck className="mt-0.5 size-4 text-success" /><div><span className="font-medium">Privacidade.</span> <span className="text-muted-foreground">Anotações e etiquetas são só da sua loja. Atender um pedido não autoriza campanhas: a exportação inclui apenas quem consentiu.</span></div></CardContent></Card>
      <Suspense><FilterBar><SearchInput placeholder="Buscar por nome, e-mail ou telefone" /></FilterBar></Suspense>
      <DataTable
        rows={rows}
        rowKey={(r) => r.sc.id}
        rowHref={(r) => `/merchant/customers/${r.sc.id}`}
        columns={[
          { key: "name", header: "Cliente", primary: true, cell: (r) => <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">{initials(r.customer.name)}</span><div><div className="font-medium">{r.customer.name}</div><div className="text-xs text-muted-foreground">{r.customer.email}{r.customer.phone ? ` · ${r.customer.phone}` : ""}</div></div></div> },
          { key: "tags", header: "Etiquetas", mobile: false, cell: (r) => r.sc.tags.length ? <div className="flex flex-wrap gap-1">{r.sc.tags.map((t) => <Link key={t} href={`/merchant/customers?tag=${encodeURIComponent(t)}`} className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{t}</Link>)}</div> : <span className="text-xs text-muted-foreground">—</span> },
          { key: "orders", header: "Pedidos", className: "text-right", cell: (r) => r.sc.ordersCount },
          { key: "spent", header: "Total gasto", className: "text-right", cell: (r) => <span className="font-medium tabular-nums">{formatBRL(r.sc.totalSpentCents)}</span> },
          { key: "last", header: "Último pedido", className: "text-right", cell: (r) => formatDate(r.sc.lastOrderAt) },
          { key: "consent", header: "Marketing", cell: (r) => r.consents.length ? <Badge tone="success" dot>Consentiu ({r.consents.map((c) => c.purpose.split("_")[0]).join(", ")})</Badge> : <Badge tone="outline">Sem consentimento</Badge> },
        ]}
      />
    </>
  );
}
