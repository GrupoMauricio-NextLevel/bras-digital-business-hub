import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { requireAreaRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { dispatchSeats, listTeam } from "@/lib/domain/operations";
import { requireSupplierId } from "@/lib/domain/access";
import { formatDateTime } from "@/lib/utils";
import { TeamPanel } from "./team-panel";

const ROLE = { SUPPLIER_ADMIN: "Gestor", SUPPLIER_DISPATCH: "Expedição" } as const;

export default async function TeamPage() {
  const session = await requireAreaRole("SUPERDROP", "SUPPLIER_ADMIN");
  const db = await getDb();
  const supplierId = requireSupplierId(session.actor);
  const [team, seats] = await Promise.all([listTeam(db, session.actor), dispatchSeats(db, supplierId)]);
  return (
    <>
      <PageHeader title="Equipe" description="Gestores e funcionários da expedição. A expedição só vê a fila, etiquetas e listas de separação: nenhum valor." />
      <TeamPanel seatsUsed={seats.used} seatsTotal={seats.total} />
      <div className="mt-6">
        <DataTable rows={team} rowKey={(u) => u.id} columns={[
          { key: "n", header: "Nome", primary: true, cell: (u) => <div><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
          { key: "r", header: "Papel", cell: (u) => <StatusBadge value={u.role === "SUPPLIER_ADMIN" ? "ACTIVE" : "READY"} dot={false} /> },
          { key: "p", header: "Perfil", cell: (u) => ROLE[u.role as keyof typeof ROLE] ?? u.role },
          { key: "l", header: "Último acesso", cell: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : u.mustChangePassword ? "Aguardando primeiro acesso" : "—"), mobile: false },
        ]} />
      </div>
    </>
  );
}
