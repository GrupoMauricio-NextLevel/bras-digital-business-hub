import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { requireStoreAdmin } from "@/lib/require-session";
import { verContrato } from "@/lib/domain/contratos";
import type { DadosLojaPronta } from "@/lib/contratos/loja-pronta-express";
import { PageHeader } from "@/components/app/page-header";
import { ContratoView } from "@/components/contratos/contrato-view";
import { AceiteContrato } from "./aceite";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contrato" };

export default async function ContratoLojaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStoreAdmin();
  const c = await verContrato(await getDb(), session.actor, (await params).id).catch(() => null);
  if (!c) notFound();
  const d = c.dados as unknown as DadosLojaPronta;
  return (
    <>
      <PageHeader eyebrow="Contratos" title={`Contrato ${c.numero}`} description={c.status === "ACEITO" ? "Assinado pelas duas partes. A cópia está no seu e-mail e você pode baixar o PDF aqui." : "Leia com calma. Se estiver tudo certo, dê o aceite no fim da página."} />
      <p className="mb-4 flex flex-wrap gap-4 text-sm"><Link className="underline" href="/merchant/contratos">← Contratos</Link><Link className="underline" href={`/merchant/contratos/${c.id}/pdf`} target="_blank">Baixar PDF</Link></p>
      <div className="grid gap-5">
        <ContratoView c={c} />
        {c.status === "ENVIADO" && <AceiteContrato id={c.id} hash={c.hash} nomeSugerido={d.cliente.nome} />}
      </div>
    </>
  );
}
