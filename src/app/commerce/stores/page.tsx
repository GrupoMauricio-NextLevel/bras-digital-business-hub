import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { CommerceStoreActions } from "@/components/commerce/commerce-store-actions";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export const dynamic = "force-dynamic";

export default async function CommerceStoresPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Portfólio" title="Lojas" description="Cada loja da NextLevel E-commerce, com situação, plano e vendas." />
      <DataTable rows={data.stores} rowKey={({ store }) => store.id}
        empty={<EmptyState title="Nenhuma loja Commerce encontrada" description="As lojas aparecem aqui assim que forem criadas." />}
        columns={[
          { key: "store", header: "Loja", primary: true, cell: ({ store }) => <div><div className="font-bold">{store.name}</div><div className="text-xs text-muted-foreground">/{store.slug}</div></div> },
          { key: "pub", header: "Publicação", cell: ({ store }) => store.publishedAt ? "Publicada" : "Rascunho" },
          { key: "access", header: "Situação", cell: ({ situacao }) => <span><b>{situacao.rotulo}</b>{situacao.plano ? <span className="ml-1 text-xs text-muted-foreground">· {situacao.plano}</span> : null}{situacao.diasParaVencer !== null && situacao.diasParaVencer > 0 ? <span className="ml-2 text-xs text-muted-foreground">{situacao.diasParaVencer} dia(s)</span> : null}</span> },
          { key: "domain", header: "Domínio", cell: ({ store }) => store.domainStatus === "CONNECTED" ? (store.customDomain ?? "Conectado") : "Sem domínio próprio" },
          { key: "actions", header: "Gestão", className: "text-right", cell: ({ store, access }) => <CommerceStoreActions storeId={store.id} status={store.status} slug={store.slug} canExtendTrial={access.state === "TRIAL" || access.state === "BLOCKED"} /> },
        ]} />
    </>
  );
}
