import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { CommerceStoreActions } from "@/components/commerce/commerce-store-actions";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { lojistasAgora } from "@/lib/domain/master-agora";
import { hospedagemAutomatica } from "@/lib/domain/dominio-proprio";
import { PrecisaDeVoce } from "@/components/app/precisa-de-voce";

export const dynamic = "force-dynamic";

export default async function CommerceStoresPage() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="NextLevel Commerce" title="Lojistas" description="Cada loja da Commerce com a situação de pagamento (a mesma regra em todo o Master), o plano e o atalho para ver como o lojista vê." />
      <PrecisaDeVoce itens={lojistasAgora(data.stores.map(({ store, situacao }) => ({ id: store.id, nome: store.name, publicada: !!store.publishedAt, criadaEm: store.createdAt, pagamentoLoja: store.paymentStatus, s: situacao, dominio: store.customDomain, dominioStatus: store.domainStatus })), new Date(), hospedagemAutomatica())} vazio="Todas as lojas andando: nenhuma parada, sem Mercado Pago ou vencida." descricao="Lojas que travaram: vencidas, criadas e não publicadas, ou publicadas sem receber pagamento." />
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
