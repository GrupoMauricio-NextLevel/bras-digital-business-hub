import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { parcelasDoContrato, verContrato } from "@/lib/domain/contratos";
import { podeOperarCaixa } from "@/lib/domain/caixa";
import type { DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";
import { Parcelas } from "@/components/contratos/parcelas";
import { PageHeader } from "@/components/app/page-header";
import { ContratoView } from "@/components/contratos/contrato-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contrato" };

export default async function ContratoMasterPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("NEXTLEVEL_MASTER");
  const db = await getDb();
  const c = await verContrato(db, session.actor, (await params).id).catch(() => null);
  if (!c) notFound();
  const d = c.dados as unknown as DadosLojaPronta;
  const parcelas = podeOperarCaixa(session.actor) ? await parcelasDoContrato(db, session.actor, c.id) : [];
  return (
    <>
      <PageHeader eyebrow="Contratos" title={`Contrato ${c.numero}`} description={c.status === "ACEITO" ? "Assinado pelas duas partes." : c.status === "ENVIADO" ? "Assinado pela NextLevel; aguardando o aceite do cliente no painel." : "Cancelado."} />
      <p className="mb-4 flex gap-4 text-sm"><Link className="underline" href="/master/contratos">← Contratos</Link><Link className="underline" href={`/master/contratos/${c.id}/pdf`} target="_blank">Baixar PDF</Link></p>
      <div className="grid gap-5">
        {parcelas.length > 0 && <Parcelas parcelas={parcelas} lado="master" chavePix={d.contratada.chavePix} banco={d.contratada.banco} favorecido={d.contratada.favorecido} emailComprovante={d.contratada.emailRepresentante} />}
        <ContratoView c={c} />
      </div>
    </>
  );
}
