import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { contratoParaPdfDaAgencia, pdfDoContratoDaAgencia } from "@/lib/agencias/contratos";

export const dynamic = "force-dynamic";
/** PDF do contrato da agência com o cliente (D321): administrador e financeiro da própria agência. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return new Response("Entre na sua conta.", { status: 401 });
  try {
    const c = await contratoParaPdfDaAgencia(await getDb(), s.actor, (await params).id);
    return new Response(Buffer.from(await pdfDoContratoDaAgencia(c)), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="Contrato-${c.numero}.pdf"`, "cache-control": "private, no-store" } });
  } catch { return new Response("Contrato não encontrado.", { status: 404 }); }
}
