/**
 * Gera a base compacta de localização por IP (TR2b, D292) a partir da "IP to City Lite" da DB-IP (licença CC BY 4.0,
 * https://db-ip.com). Brasil com cidade e UF; outros países só o país. IPv4 inteiro e IPv6 pelos primeiros 64 bits.
 * Uso (uma vez por mês, ou quando quiser atualizar):
 *   curl -o /tmp/city.csv.gz https://download.db-ip.com/free/dbip-city-lite-AAAA-MM.csv.gz
 *   node scripts/geo/gerar-base-geo.mjs /tmp/city.csv.gz AAAA-MM
 * Saída: src/lib/trafego/base-geo.bin.gz (lida por src/lib/trafego/geo.ts). Nenhum IP de visitante entra aqui.
 */
import { createReadStream, writeFileSync } from "node:fs";
import { createGunzip, gzipSync } from "node:zlib";
import { createInterface } from "node:readline";

const [arquivo, versao = "?"] = process.argv.slice(2);
if (!arquivo) { console.error("uso: node scripts/geo/gerar-base-geo.mjs <dbip-city-lite.csv.gz> <AAAA-MM>"); process.exit(1); }

const UF = { Acre: "AC", Alagoas: "AL", "Amapá": "AP", Amazonas: "AM", Bahia: "BA", "Ceará": "CE", "Federal District": "DF", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", Pernambuco: "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", "Rondônia": "RO", Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP", Sergipe: "SE", Tocantins: "TO" };
const cidades = []; const idxCidade = new Map();
const paises = []; const idxPais = new Map();
const semUf = new Set();
function valor(pais, regiao, cidade) {
  if (!pais || pais === "ZZ") return 0;
  if (pais === "BR") {
    const uf = UF[regiao] ?? ""; if (regiao && !uf) semUf.add(regiao);
    const k = `${cidade}|${uf}`;
    if (!idxCidade.has(k)) { idxCidade.set(k, cidades.length); cidades.push(k); }
    return idxCidade.get(k) + 1;
  }
  if (!idxPais.has(pais)) { idxPais.set(pais, paises.length); paises.push(pais); }
  return 65536 + idxPais.get(pais);
}
const csv = (linha) => { const out = []; let cur = ""; let q = false; for (const ch of linha) { if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; };
const ip4 = (s) => s.split(".").reduce((a, p) => a * 256 + Number(p), 0);
function ip6(s) { // primeiros 64 bits como BigInt
  const [cab, cauda = ""] = s.split("::");
  const a = cab ? cab.split(":") : []; const b = cauda ? cauda.split(":") : [];
  const g = s.includes("::") ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b] : a;
  return g.slice(0, 4).reduce((acc, h) => (acc << 16n) | BigInt(parseInt(h || "0", 16)), 0n);
}

const v4 = []; const v6 = [];
const rl = createInterface({ input: createReadStream(arquivo).pipe(createGunzip()), crlfDelay: Infinity });
for await (const linha of rl) {
  const [ini, fim, , pais, regiao, cidade] = csv(linha);
  const v = valor(pais, regiao, cidade);
  if (ini.includes(":")) v6.push([ip6(ini), ip6(fim), v]); else v4.push([ip4(ini), ip4(fim), v]);
}
/** Faixas contíguas com o mesmo valor viram uma; buracos ganham valor 0. */
function compactar(faixas, um) {
  const s = []; const val = [];
  let fimAnterior = null;
  for (const [ini, fim, v] of faixas) {
    if (fimAnterior !== null && ini <= fimAnterior) continue; // sobreposição (IPv6 abaixo de /64): fica a primeira
    if (fimAnterior !== null && ini > fimAnterior + um && val.at(-1) !== 0) { s.push(fimAnterior + um); val.push(0); }
    if (val.at(-1) !== v) { s.push(ini); val.push(v); }
    fimAnterior = fim;
  }
  return { s, val };
}
const c4 = compactar(v4, 1);
const c6 = compactar(v6, 1n);
const cab = Buffer.from(JSON.stringify({ versao, fonte: "DB-IP IP to City Lite (CC BY 4.0, https://db-ip.com)", cidades, paises }));
const n4 = c4.s.length; const n6 = c6.s.length;
const buf = Buffer.alloc(4 + cab.length + 4 + n4 * 8 + 4 + n6 * 12);
let o = 0;
buf.writeUInt32LE(cab.length, o); o += 4; cab.copy(buf, o); o += cab.length;
buf.writeUInt32LE(n4, o); o += 4;
for (const x of c4.s) { buf.writeUInt32LE(x, o); o += 4; }
for (const x of c4.val) { buf.writeUInt32LE(x, o); o += 4; }
buf.writeUInt32LE(n6, o); o += 4;
for (const x of c6.s) { buf.writeBigUInt64LE(x, o); o += 8; }
for (const x of c6.val) { buf.writeUInt32LE(x, o); o += 4; }
const gz = gzipSync(buf, { level: 9 });
writeFileSync("src/lib/trafego/base-geo.bin.gz", gz);
console.log(`cidades ${cidades.length}, países ${paises.length}, faixas IPv4 ${n4}, IPv6 ${n6}, ${(buf.length / 1e6).toFixed(1)} MB → ${(gz.length / 1e6).toFixed(1)} MB comprimido`);
if (semUf.size) console.log("regiões do Brasil sem UF:", [...semUf].slice(0, 20));
