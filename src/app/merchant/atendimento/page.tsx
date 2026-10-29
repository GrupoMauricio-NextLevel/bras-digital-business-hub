import { getDb } from "@/db/client";
import { requireRole } from "@/lib/require-session";
import { listarAtendimentoDaLoja } from "@/lib/domain/atendimento-loja";
import { PageHeader } from "@/components/app/page-header";
import { AoVivo } from "@/components/master/ao-vivo";
import { CaixaDaLoja } from "./caixa";

export const dynamic = "force-dynamic";

/** Atendimento da loja (D206): as perguntas dos clientes feitas no botão "Dúvidas?" da loja, para o lojista responder. */
export default async function AtendimentoLojaPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const s = await requireRole("STORE_OWNER");
  const inicial = await listarAtendimentoDaLoja(await getDb(), s.actor, "ABERTAS");
  return (
    <>
      <PageHeader eyebrow="Escritório" actions={<AoVivo segundos={30} />} title="Atendimento" description="Perguntas dos seus clientes feitas no botão “Dúvidas?” da loja. Responda por aqui: o cliente vê a resposta na loja. Se preferir, chame no WhatsApp." />
      <CaixaDaLoja inicial={JSON.parse(JSON.stringify(inicial))} abrirId={(await searchParams).c} />
    </>
  );
}
