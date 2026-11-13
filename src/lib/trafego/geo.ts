import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Localização aproximada pelo IP (D292): cidade e UF no Brasil, país fora dele. O IP é usado só em memória, nesta
 * consulta, e NUNCA é gravado. Primeiro vale o que a rede de entrega já informar (cabeçalhos de cidade/país da
 * Cloudflare, quando existirem); senão, a base local da DB-IP (CC BY 4.0) gerada por scripts/geo/gerar-base-geo.mjs.
 * A cidade pelo IP é aproximada: no celular, às vezes aparece a cidade da central da operadora.
 */
export type Local = { cidade: string | null; uf: string | null; pais: string | null };
type Base = { versao: string; cidades: string[]; paises: string[]; s4: Uint32Array; v4: Uint32Array; s6: BigUint64Array; v6: Uint32Array };

let base: Base | null | undefined;
function carregar(): Base | null {
  if (base !== undefined) return base;
  try {
    const buf = gunzipSync(readFileSync(join(process.cwd(), "src/lib/trafego/base-geo.bin.gz")));
    let o = 0;
    const tCab = buf.readUInt32LE(o); o += 4;
    const cab = JSON.parse(buf.subarray(o, o + tCab).toString("utf8")) as { versao: string; cidades: string[]; paises: string[] }; o += tCab;
    const copia = (bytes: number) => { const c = new ArrayBuffer(bytes); new Uint8Array(c).set(buf.subarray(o, o + bytes)); o += bytes; return c; };
    const n4 = buf.readUInt32LE(o); o += 4;
    const s4 = new Uint32Array(copia(n4 * 4)); const v4 = new Uint32Array(copia(n4 * 4));
    const n6 = buf.readUInt32LE(o); o += 4;
    const s6 = new BigUint64Array(copia(n6 * 8)); const v6 = new Uint32Array(copia(n6 * 4));
    base = { ...cab, s4, v4, s6, v6 };
  } catch (e) { console.error("[geo] base indisponível", e); base = null; }
  return base;
}

function buscar<T extends number | bigint>(starts: ArrayLike<T>, alvo: T): number {
  let lo = 0, hi = starts.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m]! <= alvo) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}

function ip4(s: string): number | null {
  const p = s.split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || Number(x) > 255)) return null;
  return p.reduce((a, x) => a * 256 + Number(x), 0);
}
function ip6hi(s: string): bigint | null {
  if (!/^[0-9a-f:]+$/i.test(s) || !s.includes(":")) return null;
  const [cab, cauda = ""] = s.split("::");
  const a = cab ? cab.split(":") : []; const b = cauda ? cauda.split(":") : [];
  if (a.length + b.length > 8) return null;
  const g = s.includes("::") ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b] : a;
  if (g.length !== 8) return null;
  return g.slice(0, 4).reduce((acc, h) => (acc << 16n) | BigInt(parseInt(h || "0", 16)), 0n);
}

function decodificar(b: Base, v: number): Local {
  if (!v) return { cidade: null, uf: null, pais: null };
  if (v >= 65536) return { cidade: null, uf: null, pais: b.paises[v - 65536] ?? null };
  const [cidade = "", uf = ""] = (b.cidades[v - 1] ?? "|").split("|");
  return { cidade: cidade || null, uf: uf || null, pais: "BR" };
}

/** Cidade/UF/país de um IP pela base local. IP privado, inválido ou sem base: tudo nulo. */
export function localDoIp(ipBruto: string | null | undefined): Local {
  const vazio: Local = { cidade: null, uf: null, pais: null };
  const ip = (ipBruto ?? "").trim().replace(/^::ffff:/i, "").replace(/^\[|\]$/g, "");
  if (!ip) return vazio;
  const b = carregar();
  if (!b) return vazio;
  const n4 = ip4(ip);
  if (n4 !== null) { const i = buscar(b.s4, n4); return i < 0 ? vazio : decodificar(b, b.v4[i]!); }
  const n6 = ip6hi(ip);
  if (n6 !== null) { const i = buscar(b.s6, n6); return i < 0 ? vazio : decodificar(b, b.v6[i]!); }
  return vazio;
}

const cabecalho = (h: Headers, k: string) => { const v = h.get(k); try { return v ? decodeURIComponent(v).trim().slice(0, 60) || null : null; } catch { return v?.slice(0, 60) || null; } };

/** IP de quem visita, como a rede de entrega informa (Cloudflare/Render). Nunca gravar. */
export function ipDaRequisicao(h: Headers): string | null {
  return h.get("cf-connecting-ip") ?? h.get("true-client-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

/** Local da requisição: cabeçalhos da rede de entrega quando trazem a cidade; senão, a base local; o país do cabeçalho completa. */
export function localDaRequisicao(h: Headers): Local {
  const cidadeCab = cabecalho(h, "cf-ipcity") ?? cabecalho(h, "x-vercel-ip-city");
  const paisCab = (h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country"))?.toUpperCase().slice(0, 2) ?? null;
  const ufCab = paisCab === "BR" ? (h.get("cf-region-code") ?? h.get("x-vercel-ip-country-region"))?.toUpperCase().slice(0, 2) ?? null : null;
  if (cidadeCab) return { cidade: cidadeCab, uf: ufCab, pais: paisCab };
  const l = localDoIp(ipDaRequisicao(h));
  return { cidade: l.cidade, uf: l.uf, pais: l.pais ?? (paisCab && paisCab !== "XX" && paisCab !== "T1" ? paisCab : null) };
}

export const versaoDaBaseGeo = () => carregar()?.versao ?? null;
