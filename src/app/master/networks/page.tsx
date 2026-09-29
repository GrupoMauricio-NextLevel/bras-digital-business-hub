import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { listNetworks } from "@/lib/queries/master";
import { Badge } from "@/components/ui/badge";

export default async function NetworksPage() {
  const rows = await listNetworks();
  return (
    <>
      <PageHeader title="Redes" description="Uma rede agrupa as lojas abastecidas por um fornecedor. Futuramente, catálogos poderão ser compartilhados entre redes." />
      <DataTable
        rows={rows}
        rowKey={(r) => r.network.id}
        columns={[
          { key: "name", header: "Rede", primary: true, cell: (r) => <div><div className="font-medium">{r.network.name}</div><div className="text-xs text-muted-foreground">{r.network.slug}</div></div> },
          { key: "supplier", header: "Fornecedor", cell: (r) => r.supplierName },
          { key: "stores", header: "Lojas", className: "text-right", cell: (r) => r.storeCount },
          { key: "visibility", header: "Catálogo", cell: () => <Badge tone="outline">PRIVATE_NETWORK</Badge> },
        ]}
      />
    </>
  );
}
