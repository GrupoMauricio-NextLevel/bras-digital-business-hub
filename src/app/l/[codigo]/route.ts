import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/base-url";
import { HOLDING_CODE, brandByCode, brandOfHostStrict } from "@/lib/brand";
import { groupSiteUrl } from "@/lib/host-routing";
import { getDb } from "@/db/client";
import { resolverClique } from "@/lib/domain/trafego/links";
import { ehRobo } from "@/lib/trafego/canal";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Link rastreado (TR1, D290): conta o clique e leva à página com as etiquetas da campanha; o proxy grava a origem ao abrir
 * a página. No endereço da marca do link (ou em endereço técnico: demonstração, localhost) o destino fica no mesmo
 * endereço; noutro endereço, vai ao da marca do link. Link desligado ou inexistente: página inicial.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const origem = requestOrigin(req);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const robo = ehRobo(req.headers.get("user-agent")) || !rateLimit(`l:${ip}`, 120, 60_000);
  const r = await resolverClique(await getDb(), codigo, { robo, busca: req.nextUrl.searchParams });
  if (!r) return NextResponse.redirect(new URL("/", origem), 302);
  const hostBrand = brandOfHostStrict((req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0]!);
  // Links do grupo (Soluções) vão ao site do grupo, não ao endereço do Master.
  const base = !hostBrand || hostBrand.code === r.brand ? origem : r.brand === HOLDING_CODE ? groupSiteUrl() : brandByCode(r.brand).baseUrl.replace(/\/$/, "");
  const res = NextResponse.redirect(new URL(r.caminho, base), 302);
  res.headers.set("cache-control", "no-store");
  res.headers.set("x-robots-tag", "noindex");
  return res;
}
