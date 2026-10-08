import { requireRole } from "@/lib/require-session";
import { ImportersManager } from "../catalogo-client";
import { EstudioHeader } from "../header";
import { estudioData } from "../data";

export const dynamic = "force-dynamic";

export default async function Importadoras() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  return (
    <>
      <EstudioHeader title="Importadoras" description="As importadoras das ofertas. Sem login: quando houver o Balcão, cada uma verá só o envio dos pedidos dela." {...d} />
      <ImportersManager importers={d.importers.map((i) => ({ id: i.id, name: i.name, notes: i.notes, active: i.active }))} />
    </>
  );
}
