import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { stores } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { aparelhoDe, ehRobo, origemDe, produtoDaPagina, registrarVisita } from "@/lib/domain/visitas";

export const dynamic = "force-dynamic";

/**
 * Conta uma visita da loja (W2, D185). Chamado pelo navegador depois que a página abriu (sendBeacon): nunca atrasa a
 * página. Sem cookie, sem IP gravado; robôs e excesso de chamadas são ignorados. Sempre responde 204.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const vazio = new NextResponse(null, { status: 204 });
  try {
    const ua = req.headers.get("user-agent");
    if (ehRobo(ua)) return vazio;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`visita:${ip}`, 120, 60_000)) return vazio;
    const { slug } = await params;
    const corpo = (await req.json().catch(() => ({}))) as { caminho?: string; ref?: string; utm?: string };
    const db = await getDb();
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, slug), columns: { id: true, publishedAt: true } });
    if (!store?.publishedAt) return vazio;
    const caminho = String(corpo.caminho ?? "").slice(0, 300);
    await registrarVisita(db, {
      storeId: store.id,
      productId: await produtoDaPagina(db, store.id, caminho),
      source: origemDe({ utmSource: corpo.utm, referrer: corpo.ref, hostDaLoja: req.headers.get("x-forwarded-host") ?? req.headers.get("host") }),
      device: aparelhoDe(ua),
    });
  } catch { /* contagem nunca derruba nada */ }
  return vazio;
}
