import { getSession } from "@/lib/auth";
import { podeUsarCaixa } from "@/lib/domain/caixa-entrada";
import { baixarAnexo } from "@/lib/integrations/hostinger-mail";

export const dynamic = "force-dynamic";

/** Download de anexo da caixa (D296): só o dono; o arquivo passa pelo servidor, o token nunca vai ao navegador. */
export async function GET(req: Request) {
  const s = await getSession();
  if (!s || !podeUsarCaixa(s.actor)) return new Response("Sem acesso.", { status: 403 });
  const u = new URL(req.url);
  const pasta = u.searchParams.get("pasta") ?? "INBOX", uid = Number(u.searchParams.get("uid")), id = u.searchParams.get("id") ?? "", nome = (u.searchParams.get("nome") ?? "anexo").replace(/[^\w.\- ]/g, "_");
  if (!uid || !id) return new Response("Pedido inválido.", { status: 400 });
  const r = await baixarAnexo(pasta, uid, id);
  if (!r.ok) return new Response("Não foi possível baixar o anexo.", { status: 502 });
  const tipo = r.headers.get("content-type") ?? "application/octet-stream";
  // O conteúdo pode vir em JSON com base64 (padrão da API para binários).
  if (tipo.includes("application/json")) {
    const j = (await r.json()) as { data?: { content?: string; body?: string; contentType?: string } } & { body?: string; body_encoding?: string };
    const b64 = j.data?.content ?? j.data?.body ?? j.body ?? "";
    return new Response(Buffer.from(b64, "base64"), { headers: { "content-type": j.data?.contentType ?? "application/octet-stream", "content-disposition": `attachment; filename="${nome}"`, "cache-control": "no-store" } });
  }
  return new Response(r.body, { headers: { "content-type": tipo, "content-disposition": `attachment; filename="${nome}"`, "cache-control": "no-store" } });
}
