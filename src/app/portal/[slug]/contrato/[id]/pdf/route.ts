import { cookies } from "next/headers";
import { getDb } from "@/db/client";
import { COOKIE_PORTAL, agenciaDoPortal } from "@/lib/agencias/portal";
import { contratoParaPdfDoPortal, pdfDoContratoDaAgencia } from "@/lib/agencias/contratos";

export const dynamic = "force-dynamic";
/** PDF do contrato no portal do cliente (D321): só o cliente dono, com a sessão do portal daquela agência. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const { slug, id } = await params; const db = await getDb();
    const a = await agenciaDoPortal(db, slug);
    const token = (await cookies()).get(`${COOKIE_PORTAL}-${a.slug}`)?.value;
    const c = await contratoParaPdfDoPortal(db, a.id, token, new URL(req.url).searchParams.get("cliente") ?? "", id);
    return new Response(Buffer.from(await pdfDoContratoDaAgencia(c)), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="Contrato-${c.numero}.pdf"`, "cache-control": "private, no-store" } });
  } catch { return new Response("Contrato não encontrado.", { status: 404 }); }
}
