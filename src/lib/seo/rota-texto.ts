import { getDb } from "@/db/client";
import { getBrand } from "@/lib/brand-server";
import { fatosPublicos, type FatosPublicos } from "./fatos-publicos";

/**
 * Resposta em texto puro para as rotas `/llms.txt`, `/llms-full.txt`, `/planos.md` e `/faq.md` (D303). Só na NextLevel
 * Commerce; nas outras marcas, "não encontrado". Cache curto no navegador e na rede (os preços vêm do sistema).
 */
export async function respostaTexto(montar: (baseUrl: string, f: FatosPublicos) => string, tipo: "text/plain" | "text/markdown"): Promise<Response> {
  const brand = await getBrand();
  if (brand.code !== "NEXTLEVEL_COMMERCE" || brand.soon) return new Response("Não encontrado.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const corpo = montar(brand.baseUrl, await fatosPublicos(await getDb()));
  return new Response(corpo, { headers: { "content-type": `${tipo}; charset=utf-8`, "cache-control": "public, max-age=600", "x-robots-tag": "noindex" } });
}
