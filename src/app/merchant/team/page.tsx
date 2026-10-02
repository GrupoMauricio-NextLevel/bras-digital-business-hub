import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listTeam } from "@/lib/domain/store-team";
import { TeamManager } from "./team-manager";\nimport { getDb } from "@/db/client";\nimport { isCommerceStore } from "@/lib/store-brand";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireStoreAdmin();
  const db = await getDb();\n  const rows = await listTeam(db, session.actor);\n  const commerce = await isCommerceStore(db, session.store!);
  return (
    <>
      <PageHeader title="Equipe" description={commerce ? "Dê acesso operacional à sua equipe para cuidar de vendas, produtos, clientes e pós-venda. Financeiro, configurações, preços e cupons continuam restritos ao proprietário." : "Dê acesso a quem trabalha com você. A equipe cuida de pedidos, catálogo, clientes, etiquetas e pós-venda; finanças, configurações, preços e cupons ficam só com você."} />
      <TeamManager rows={rows.map((m) => ({ id: m.id, name: m.name, email: m.email, owner: m.storeRole === "OWNER", disabled: !!m.disabledAt }))} />
    </>
  );
}
