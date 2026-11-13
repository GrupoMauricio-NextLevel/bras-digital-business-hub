import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { registrarSinal, SESSAO_MIN, TIPOS_SINAL } from "@/lib/domain/trafego/coletor";
import { ehRobo } from "@/lib/trafego/canal";
import { CONSENT_COOKIE, lerConsentimento, podeMedir } from "@/lib/trafego/consentimento";
import { rateLimit } from "@/lib/rate-limit";
import { ipDaRequisicao, localDaRequisicao } from "@/lib/trafego/geo";

export const dynamic = "force-dynamic";

const corpo = z.object({ t: z.enum(TIPOS_SINAL), p: z.string().max(300), s: z.string().max(800).optional(), r: z.string().max(400).optional(), d: z.record(z.string().max(12), z.union([z.string().max(60), z.number()])).optional() });
const VID = /^v_[A-Za-z0-9]{16}$/;
const novoVisitante = () => `v_${Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[b % 56]).join("")}`;

/**
 * Coletor do site (TR2, D291): recebe o sinal da página (sendBeacon). Responde sempre 204, sem corpo. Não grava nada se a
 * pessoa recusou a medição, se é robô ou se passou do limite. Sem IP gravado: o visitante é um código aleatório (13 meses);
 * o IP só serve, em memória, para achar a cidade aproximada (D292).
 */
export async function POST(req: NextRequest) {
  const vazio = new NextResponse(null, { status: 204 });
  try {
    if (!podeMedir(lerConsentimento(req.cookies.get(CONSENT_COOKIE)?.value))) return vazio;
    const ua = req.headers.get("user-agent");
    if (ehRobo(ua)) return vazio;
    const ip = ipDaRequisicao(req.headers) ?? "0.0.0.0";
    if (!rateLimit(`t:${ip}`, 90, 60_000)) return vazio;
    const dados = corpo.safeParse(JSON.parse((await req.text()).slice(0, 2000)));
    if (!dados.success) return vazio;
    const brand = await getBrand();
    const vidAtual = req.cookies.get("nl-vid")?.value;
    const visitanteId = vidAtual && VID.test(vidAtual) ? vidAtual : novoVisitante();
    const r = await registrarSinal(await getDb(), {
      brand: brand.code, visitanteId, sessaoId: req.cookies.get("nl-sid")?.value ?? null, tipo: dados.data.t, caminho: dados.data.p,
      busca: dados.data.s, referrer: dados.data.r, hostProprio: req.headers.get("x-forwarded-host") ?? req.headers.get("host"), ua,
      // Cidade aproximada só na abertura de página (é quando uma visita pode nascer); o IP é usado aqui e descartado.
      local: dados.data.t === "PAGE_VIEW" ? localDaRequisicao(req.headers) : null, extras: dados.data.d,
    });
    if (!r) return vazio;
    const secure = (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https";
    vazio.cookies.set("nl-vid", visitanteId, { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: 395 * 86_400 });
    vazio.cookies.set("nl-sid", r.sessaoId, { path: "/", sameSite: "lax", secure, httpOnly: true, maxAge: SESSAO_MIN * 60 });
    // Código da visita (TR3, D293): legível pela página só para entrar na mensagem do WhatsApp; não identifica ninguém.
    if (r.codigo) vazio.cookies.set("nl-cv", r.codigo, { path: "/", sameSite: "lax", secure, httpOnly: false, maxAge: SESSAO_MIN * 60 });
  } catch (e) { console.error("[trafego] sinal", e); }
  return vazio;
}
