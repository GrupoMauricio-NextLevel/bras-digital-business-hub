import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/app/page-header";
import { LinkTabs } from "@/components/app/link-tabs";
import { brasStaffCan, listImporterRequests, myImporter } from "@/lib/domain/bras/importadora";
import { PedidoCard } from "../pedido-card";

export const dynamic = "force-dynamic";

/** Pedidos da importadora: Recebido → Confirmado → Pago → Retirado. O comprador aparece só pelo envio (D92). */
export default async function Pedidos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const session = await requireRole("BRAS_IMPORTER");
  const db = await getDb();
  const ver = (await searchParams).ver === "retirados" ? "RETIRADOS" : (await searchParams).ver === "todos" ? "TODOS" : "ABERTOS";
  const [me, rows] = await Promise.all([myImporter(db, session.actor), listImporterRequests(db, session.actor, { status: ver })]);
  const can = { disponibilidade: brasStaffCan(me.staffRole, "pedidos_disponibilidade"), balcao: brasStaffCan(me.staffRole, "pedidos_balcao") };
  return (
    <>
      <PageHeader eyebrow="Importadora" title="Pedidos" description="Pedidos da Brás Digital para a sua importadora. Atendimento e pagamento com o comprador são da equipe da Brás." />
      <LinkTabs label="Filtro" active={ver} items={[{ key: "ABERTOS", label: "Em aberto", href: "/importadora/pedidos" }, { key: "RETIRADOS", label: "Retirados", href: "/importadora/pedidos?ver=retirados" }, { key: "TODOS", label: "Todos", href: "/importadora/pedidos?ver=todos" }]} />
      {rows.length ? <ul className="mt-6 grid gap-3 lg:grid-cols-2">{rows.map((r) => <PedidoCard key={r.id} r={r} can={can} />)}</ul> : <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">Nenhum pedido aqui.</p>}
    </>
  );
}
