import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { isSupplierSide } from "@/lib/domain/access";
import { ordersVersion } from "@/lib/domain/operations";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Esteira ao vivo do fornecedor.
 * - `?poll=1`: devolve a versão atual (fallback para ambientes sem streaming).
 * - padrão: SSE que emite `version` quando algo muda; encerra em ~4 min e o cliente reconecta.
 * Autenticado e escopado ao fornecedor da sessão.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isSupplierSide(session.actor) || !session.actor.supplierId) return new NextResponse("Não autorizado", { status: 401 });
  const supplierId = session.actor.supplierId;
  const db = await getDb();
  if (new URL(req.url).searchParams.get("poll")) return NextResponse.json({ version: await ordersVersion(db, supplierId), at: Date.now() }, { headers: { "cache-control": "no-store" } });

  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      const started = Date.now();
      const send = (event: string, data: string) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${data}\n\n`));
      const tick = async () => {
        try {
          if (Date.now() - started > 240_000) { send("bye", "reconnect"); clearInterval(timer); controller.close(); return; }
          const v = await ordersVersion(db, supplierId);
          if (v !== last) { last = v; send("version", JSON.stringify({ version: v, at: Date.now() })); } else controller.enqueue(enc.encode(": ping\n\n"));
        } catch { clearInterval(timer); try { controller.close(); } catch { /* já fechado */ } }
      };
      await tick();
      timer = setInterval(tick, 3000);
      req.signal.addEventListener("abort", () => { clearInterval(timer); try { controller.close(); } catch { /* já fechado */ } });
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store, no-transform", connection: "keep-alive", "x-accel-buffering": "no" } });
}
