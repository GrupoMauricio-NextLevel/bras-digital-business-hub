import { PageHeader } from "@/components/app/page-header";
import { requireStoreAdmin } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { listTeam } from "@/lib/domain/store-team";
import { TeamManager } from "./team-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireStoreAdmin();
  const rows = await listTeam(await getDb(), session.actor);
  return (
    <>
      <PageHeader title="Equipe" description="Dê acesso a quem trabalha com você. A equipe cuida de pedidos, catálogo, clientes, etiquetas e pós-venda; finanças, configurações, preços e cupons ficam só com você." />
      <TeamManager rows={rows.map((m) => ({ id: m.id, name: m.name, email: m.email, owner: m.storeRole === "OWNER", disabled: !!m.disabledAt }))} />
    </>
  );
}
