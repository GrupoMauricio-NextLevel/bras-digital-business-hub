import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db/client";
import { recordError } from "@/lib/domain/error-log";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Erros do navegador (tela de erro). Aberto a qualquer visitante, por isso: limite por endereço, corpo pequeno e tudo mascarado antes de gravar. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (!rateLimit(`err:${ip}`, 10, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 4000) return NextResponse.json({ ok: false }, { status: 413 });
  let body: { route?: unknown; message?: unknown; digest?: unknown } = {};
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const route = typeof body.route === "string" ? body.route : "/";
  const message = typeof body.message === "string" ? body.message : "Erro no navegador";
  const storeSlug = route.match(/^\/store\/([a-z0-9-]+)/)?.[1] ?? null;
  const ref = typeof body.digest === "string" ? body.digest.slice(0, 20) : null;
  await recordError(await getDb(), { origin: "BROWSER", route, message, context: "tela", storeSlug, ref });
  return NextResponse.json({ ok: true });
}
