import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { rateLimit } from "@/lib/rate-limit";
import { aparelhoDe, ehRobo, origemDe, registrarVisita } from "@/lib/domain/visitas";
import { paginaDaAcademia } from "@/lib/domain/business/academia";

export const dynamic = "force-dynamic";

/** Conta uma visita da página da academia (A1, D307), igual à da loja (D185): sem cookie, sem IP gravado. Sempre 204. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const vazio = new NextResponse(null, { status: 204 });
  try {
    const ua = req.headers.get("user-agent");
    if (ehRobo(ua)) return vazio;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    if (!rateLimit(`visita-academia:${ip}`, 60, 60_000)) return vazio;
    const corpo = (await req.json().catch(() => ({}))) as { ref?: string; utm?: string };
    const db = await getDb();
    const pagina = await paginaDaAcademia(db, (await params).slug);
    if (!pagina) return vazio;
    await registrarVisita(db, { storeId: pagina.storeId, source: origemDe({ utmSource: corpo.utm, referrer: corpo.ref, hostDaLoja: req.headers.get("x-forwarded-host") ?? req.headers.get("host") }), device: aparelhoDe(ua) });
  } catch { /* contagem nunca derruba nada */ }
  return vazio;
}
