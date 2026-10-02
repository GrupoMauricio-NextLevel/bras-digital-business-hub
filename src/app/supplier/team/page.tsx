import { PageHeader } from "@/components/app/page-header";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { dispatchSeats, listTeam } from "@/lib/domain/operations";
import { formatDateTime } from "@/lib/utils";
import { TeamPanel } from "./team-panel";
import { RemoveMemberButton } from "./remove-member-button";

const ROLE = { SUPPLIER_ADMIN: "Gestor", SUPPLIER_DISPATCH: "Expedição" } as const;

export default async function TeamPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const db = await getDb();
  const [team, seats] = await Promise.all([listTeam(db, session.actor), dispatchSeats(db, session.actor.supplierId!)]);
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
          { key: "a", header: "", className: "text-right", cell: (u) => u.role === "SUPPLIER_DISPATCH" ? <RemoveMemberButton userId={u.id} name={u.name} /> : null },
        ]} />
      </div>
    </>
  );
}
