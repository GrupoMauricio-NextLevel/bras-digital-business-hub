import { Network, Store } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OperationalPulse } from "@/components/app/operational-pulse";
import { DataTable } from "@/components/app/data-table";
import { listNetworks } from "@/lib/queries/master";
import { Badge } from "@/components/ui/badge";

export default async function NetworksPage() {
  const rows = await listNetworks();
  const stores = rows.reduce((sum, r) => sum + r.storeCount, 0);
  const suppliers = new Set(rows.map((r) => r.supplierName)).size;
  return (
    <>
      <PageHeader title="Redes" description="Uma rede agrupa as lojas abastecidas por um fornecedor. Futuramente, catálogos poderão ser compartilhados entre redes." />
      <OperationalPulse className="mb-5" items={[
        { label: "Redes", value: rows.length, icon: Network, tone: "neutral", hint: suppliers + " fornecedor(es)" },
        { label: "Lojas vinculadas", value: stores, icon: Store, tone: "info", hint: "somadas entre as redes" },
        { label: "Visibilidade", value: "Privada", icon: Network, tone: "neutral", hint: "modelo atual" },
        { label: "Compartilhamento", value: "Preparado", icon: Network, tone: "info", hint: "estrutura prevista para expansão" },
      ]} />
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
