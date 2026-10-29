import { levarAoEscritorio } from "@/lib/brand-server";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { getCommerceConsole } from "@/lib/domain/commerce-console";
import { formatDate } from "@/lib/utils";
import { CommerceLeadActions } from "@/components/commerce/commerce-lead-actions";
import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export const dynamic = "force-dynamic";

export default async function CommerceLeadsPage() {
  await levarAoEscritorio("/master/comercial"); // D205: tela antiga → área nova do escritório da E-commerce
  const session = await requireRole("NEXTLEVEL_MASTER");
  const data = await getCommerceConsole(await getDb(), session.actor);
  return (
    <>
      <PageHeader eyebrow="Aquisição" title="Interessados" description="Pessoas e empresas interessadas em abrir uma loja na NextLevel E-commerce." />
      <DataTable rows={data.leads} rowKey={(l) => l.id}
        empty={<EmptyState title="Nenhum interessado Commerce ainda" description="Os cadastros de interesse aparecem aqui." />}
        columns={[
          { key: "who", header: "Contato", primary: true, cell: (l) => <div><div className="font-bold">{l.name}</div><div className="text-xs text-muted-foreground">{l.email}</div></div> },
          { key: "store", header: "Loja", cell: (l) => l.storeName ?? "Loja ainda sem nome" },
          { key: "segment", header: "Segmento", cell: (l) => l.segment ?? "Não informado" },
          { key: "state", header: "Situação", cell: (l) => <div><CommerceLeadActions id={l.id} status={l.status} /><div className="mt-1 text-xs text-muted-foreground">{formatDate(l.createdAt)}</div></div> },
        ]} />
    </>
  );
}
