import { requireRole } from "@/lib/require-session";
import { DefaultCommission, ImportersManager } from "../catalogo-client";
import { getDb } from "@/db/client";
import { getBrasDefaultCommissionBps } from "@/lib/domain/bras/comissoes";
import { brasPanelsEnabled } from "@/lib/bras/panels";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Importadoras() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  const defaultBps = await getBrasDefaultCommissionBps(await getDb());
  return (
    <>
      <EstudioHeader title="Importadoras" description="As importadoras das ofertas. Sem login: quando houver o Balcão, cada uma verá só o envio dos pedidos dela." {...d} />
      <DefaultCommission bps={defaultBps} />
      <ImportersManager balcao={brasPanelsEnabled()} defaultBps={defaultBps} importers={d.importers.map((i) => ({ id: i.id, name: i.name, notes: i.notes, active: i.active, pickupAddress: i.pickupAddress, commissionBps: i.commissionBps, hasBalcaoLink: !!i.balcaoTokenHash }))} />
    </>
  );
}
