import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { storeAssets } from "@/db/schema";

/** Serve as imagens enviadas pelos lojistas. O id é aleatório e o conteúdo nunca muda, então o cache é longo. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^ast_[a-z0-9]+$/i.test(id)) return new Response("Não encontrado", { status: 404 });
  const row = await (await getDb()).query.storeAssets.findFirst({ where: eq(storeAssets.id, id) });
  if (!row) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(row.dataBase64, "base64")), { headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" } });
}
