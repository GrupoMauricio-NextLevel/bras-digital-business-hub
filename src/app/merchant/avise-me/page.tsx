import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/lib/require-session";
import { getDb } from "@/db/client";
import { stockDemand } from "@/lib/domain/stock-alerts";
import { DemandList } from "./demand-list";

export const dynamic = "force-dynamic";

export default async function AviseMePage() {
  const session = await requireRole("STORE_OWNER");
  const groups = await stockDemand(await getDb(), session.store!.id);
  return (
    <>
      <PageHeader title="Avise-me" description="Clientes que pediram aviso de tamanhos esgotados. Nada é enviado sozinho: quando o tamanho voltar, chame pelo WhatsApp ou e-mail e marque como avisado." />
      <DemandList groups={groups} />
    </>
  );
}
