import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/db/client";
import { sincronizarSuporte } from "@/lib/domain/suporte-email";

export const dynamic = "force-dynamic";

/**
 * Aviso da Hostinger de e-mail novo (D300). O segredo do webhook chega como Bearer e é conferido aqui; o corpo é
 * ignorado: o aviso só dispara a busca na própria caixa. Segredo em HOSTINGER_MAIL_WEBHOOK_SECRET (colado no Render).
 */
export async function POST(req: Request) {
  const segredo = process.env.HOSTINGER_MAIL_WEBHOOK_SECRET ?? "";
  const veio = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = segredo.length >= 16 && veio.length === segredo.length && timingSafeEqual(Buffer.from(veio), Buffer.from(segredo));
  if (!ok) return Response.json({ ok: false }, { status: 401 });
  try {
    const r = await sincronizarSuporte(await getDb());
    return Response.json({ ok: true, ...r });
  } catch {
    return Response.json({ ok: false }, { status: 502 }); // a Hostinger tenta de novo
  }
}
