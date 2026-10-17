import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "danger" | "warning" | "outline" }> = { PAID: { label: "Paga", tone: "success" }, OVERDUE: { label: "Vencida", tone: "danger" }, OPEN: { label: "Em aberto", tone: "warning" } };

export default async function CommercePlansPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  const names = new Map(data.stores.map(({ store }) => [store.id, store.name]));
  return (
    <>
      <PageHeader eyebrow="Receita recorrente" title="Assinaturas" description="Cobranças dos planos das lojas da NextLevel E-commerce: mensalidades, testes e atrasos." />
      <DataTable rows={data.invoices} rowKey={(i) => i.id}
        empty={<EmptyState title="Nenhuma cobrança de plano Commerce encontrada" description="As cobranças dos planos aparecem aqui." />}
        columns={[
          { key: "store", header: "Loja", primary: true, cell: (i) => <div><div className="font-bold">{names.get(i.storeId ?? "") ?? "Loja"}</div><div className="text-xs text-muted-foreground">{i.description}</div></div> },
          { key: "period", header: "Período", cell: (i) => i.period ?? formatDate(i.createdAt) },
          { key: "amount", header: "Valor", className: "text-right", cell: (i) => <span className="font-bold tabular-nums">{formatBRL(i.amountCents)}</span> },
          { key: "status", header: "Situação", cell: (i) => { const s = STATUS[i.status] ?? { label: i.status, tone: "outline" as const }; return <Badge tone={s.tone}>{s.label}</Badge>; } },
        ]} />
    </>
  );
}
