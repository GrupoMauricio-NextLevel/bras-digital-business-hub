import { requireRole } from "@/lib/require-session";
import { RequestsTable } from "./catalogo-client";
import { EstudioHeader } from "./header";
import { estudioData } from "./data";

export const dynamic = "force-dynamic";

/** Estúdio da Brás Digital (D92/D93): começa pelos pedidos de compra, o que mais pede ação. Só o Master. */
export default async function Pedidos() {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const d = await estudioData(session.actor);
  return (
    <>
      <EstudioHeader title="Pedidos" description="Pedidos de compra dos membros: confirme caixas e pagamento, marque pago e retirado." {...d} />
      <RequestsTable requests={d.requests.map(({ r, companyName, whatsapp, email }) => ({ id: r.id, number: r.number, status: r.status, createdAt: r.createdAt, productTitle: r.productTitle, importerName: r.importerName, boxes: r.boxes, unitsPerBox: r.unitsPerBox, priceBoxCents: r.priceBoxCents, totalCents: r.totalCents, carrier: r.carrier, shipName: r.shipName, shipAddress: r.shipAddress, shipCity: r.shipCity, shipState: r.shipState, shipZip: r.shipZip, notes: r.notes, companyName, whatsapp, email }))} />
    </>
  );
}
