import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, SectionTitle } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { RecursosPorPlano } from "@/components/commerce/recursos-por-plano";
import { PLANOS_ECOMMERCE, RECURSOS_ECOMMERCE, ROTULO_ECOMMERCE, tabelaRecursos } from "@/lib/domain/perfil-loja";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "danger" | "warning" | "outline" }> = { PAID: { label: "Paga", tone: "success" }, OVERDUE: { label: "Vencida", tone: "danger" }, OPEN: { label: "Em aberto", tone: "warning" } };

const NOME_PLANO: Record<(typeof PLANOS_ECOMMERCE)[number], string> = { COMMERCE_START: "Start", COMMERCE_PRO: "Pro", COMMERCE_SCALE: "Scale" };

export default async function CommercePlansPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const [data, tabela] = await Promise.all([getCommerceConsole(db, session.actor), tabelaRecursos(db)]);
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
      <section className="mt-10" aria-label="O que cada plano libera">
        <SectionTitle title="O que cada plano libera" description="Marque o que a loja pode usar em cada plano. Vale na hora para todas as lojas da E-commerce; sem plano, vale o Start. Saldo e etiqueta da Central são do SuperDrop e não entram aqui." />
        <RecursosPorPlano planos={PLANOS_ECOMMERCE.map((k) => ({ key: k, nome: NOME_PLANO[k] }))} recursos={RECURSOS_ECOMMERCE.map((k) => ({ key: k, nome: ROTULO_ECOMMERCE[k as keyof typeof ROTULO_ECOMMERCE] }))} inicial={tabela} podeEditar={!session.actor.masterFunction || session.actor.masterFunction === "FINANCEIRO"} />
      </section>
    </>
  );
}
