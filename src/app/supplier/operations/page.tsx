import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { getOps } from "@/lib/domain/operations";
import { OpsForm } from "./ops-form";

export default async function OperationsPage() {
  const session = await requireRole("SUPPLIER_ADMIN");
  const ops = await getOps(await getDb(), session.actor.supplierId!);
  return (
    <>
      <PageHeader title="Corte e operação" description="Defina até que horas os pedidos liberados saem no mesmo dia. Depois do corte, o pedido entra na expedição do próximo dia útil e o lojista vê isso na hora." />
      <OpsForm initial={{ timezone: ops.timezone, cutoffs: ops.cutoffs, holidays: ops.holidays, minActivationStock: ops.minActivationStock }} configured={ops.configured} />
    </>
  );
}
