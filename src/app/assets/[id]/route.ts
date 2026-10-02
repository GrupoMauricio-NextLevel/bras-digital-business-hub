import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { storeAssets } from "@/db/schema";

/** Serve as imagens enviadas pelos lojistas. O id é aleatório e o conteúdo nunca muda, então o cache é longo. */
const WIDTHS = [160, 320, 480, 640, 800, 960, 1280];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^ast_[a-z0-9]+$/i.test(id)) return new Response("Não encontrado", { status: 404 });
  const row = await (await getDb()).query.storeAssets.findFirst({ where: eq(storeAssets.id, id) });
  if (!row) return new Response("Não encontrado", { status: 404 });
  const bytes = Buffer.from(row.dataBase64, "base64");
  // ?w=640 devolve a imagem reduzida e em WebP (só larguras da lista, para o cache não crescer sem limite).
  const w = Number(new URL(req.url).searchParams.get("w"));
  if (w && WIDTHS.includes(w) && /^image\/(jpeg|png|webp)$/.test(row.mime)) {
    try {
      const sharp = (await import("sharp")).default;
      const out = await sharp(bytes).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      return new Response(new Uint8Array(out), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
    } catch { /* se a redução falhar, serve o original */ }
  }
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" } });
}
