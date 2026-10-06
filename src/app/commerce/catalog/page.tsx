import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatBRL } from "@/lib/money";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CommerceCatalogPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  const names = new Map(data.stores.map(({ store }) => [store.id, store.name]));
  return (
    <>
      <PageHeader eyebrow="Catálogos" title="Produtos publicados" description="Visão transversal dos catálogos próprios das lojas Commerce — não é o catálogo central de distribuição do SuperDrop." />
      <DataTable rows={data.catalog} rowKey={(p) => `${p.storeId}:${p.productId}`}
        empty={<EmptyState title="Nenhum produto Commerce encontrado" description="Os produtos das lojas aparecem aqui." />}
        columns={[
          { key: "name", header: "Produto", primary: true, cell: (p) => <div><div className="font-bold">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku}</div></div> },
          { key: "store", header: "Loja", cell: (p) => names.get(p.storeId) ?? "Loja" },
          { key: "price", header: "Preço", className: "text-right", cell: (p) => <span className="font-bold tabular-nums">{formatBRL(p.priceCents)}</span> },
          { key: "state", header: "Situação", cell: (p) => <Badge tone={p.active ? "success" : "outline"}>{p.active ? "Publicado" : "Oculto"}{p.featured ? " · destaque" : ""}</Badge> },
        ]} />
    </>
  );
}
