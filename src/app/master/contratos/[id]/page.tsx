import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { verContrato } from "@/lib/domain/contratos";
import { PageHeader } from "@/components/app/page-header";
import { ContratoView } from "@/components/contratos/contrato-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contrato" };

export default async function ContratoMasterPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const c = await verContrato(await getDb(), session.actor, (await params).id).catch(() => null);
  if (!c) notFound();
  return (
    <>
      <PageHeader eyebrow="Contratos" title={`Contrato ${c.numero}`} description={c.status === "ACEITO" ? "Assinado pelas duas partes." : c.status === "ENVIADO" ? "Assinado pela NextLevel; aguardando o aceite do cliente no painel." : "Cancelado."} />
      <p className="mb-4 flex gap-4 text-sm"><Link className="underline" href="/master/contratos">← Contratos</Link><Link className="underline" href={`/master/contratos/${c.id}/pdf`} target="_blank">Baixar PDF</Link></p>
      <ContratoView c={c} />
    </>
  );
}
