// Verificação do pacote: XML dos SVGs, ausência de fontes/recursos externos, fidelidade dos contornos ao kit v1,
// transparência dos PNG/WebP, estrutura dos ICO, caminhos do preview/prancha/manifestos.
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, relative } from "node:path";
import sharp from "sharp";
import { sistema } from "./sistema.mjs";

const [OUT, KIT] = process.argv.slice(2);
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(OUT).filter((f) => !f.endsWith(".zip"));
const r = { arquivos: files.length, svg: { total: 0, xml_invalido: [], externos: [], fontes_ou_texto: [], contorno_diferente: [] }, png: { total: 0, logos_sem_transparencia: [], favicons_nao_opacos: [], dimensao_errada: [] }, webp: { total: 0, sem_alfa: [] }, ico: { total: 0, problemas: [] }, caminhos: { quebrados: [] }, cores_do_raio: [] };

const S = sistema().filter((m) => m.oficial);
const v1 = { "assinatura-completa": "logo-completo", compacta: "wordmark", monograma: "simbolo" };
const pathsOf = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((x) => x[1]);

for (const f of files) {
  const rel = relative(OUT, f);
  if (f.endsWith(".svg")) {
    r.svg.total++;
    try { execFileSync("xmllint", ["--noout", f], { stdio: "pipe" }); } catch (e) { r.svg.xml_invalido.push(rel); }
    const s = readFileSync(f, "utf8");
    if (/href=|url\((?!#)|@import|<image|<script/i.test(s)) r.svg.externos.push(rel);
    if (/<text|font-family|@font-face/i.test(s)) r.svg.fontes_ou_texto.push(rel);
    // fidelidade: os contornos (atributo d) devem ser idênticos aos do kit v1
    const mm = rel.match(/^logos\/([^/]+)\/(claro|escuro)\/(assinatura-completa|compacta|monograma)\.svg$/);
    const mf = rel.match(/^favicons\/([^/]+)\/(claro|escuro)\/favicon\.svg$/);
    if (mm || mf) {
      const m = S.find((x) => x.id === (mm || mf)[1]);
      const orig = mm ? `${KIT}/${m.pasta}/logos/${mm[2]}/${v1[mm[3]]}.svg` : `${KIT}/${m.pasta}/favicons/${mf[2]}/favicon.svg`;
      const a = pathsOf(s), b = pathsOf(readFileSync(orig, "utf8"));
      if (a.length !== b.length || a.some((d, i) => d !== b[i])) r.svg.contorno_diferente.push(rel);
      const fills = [...s.matchAll(/fill="(#[0-9A-F]{6})"/gi)].map((x) => x[1].toUpperCase());
      if (mm && mm[3] === "monograma") r.cores_do_raio.push({ arquivo: rel, preenchimentos: fills });
    }
  }
  if (f.endsWith(".png")) {
    r.png.total++;
    const meta = await sharp(f).metadata();
    const isFav = rel.startsWith("favicons/");
    const isLogo = rel.startsWith("logos/");
    if (isLogo || isFav) {
      const st = await sharp(f).ensureAlpha().stats();
      const minAlpha = st.channels[3].min;
      if (isLogo && minAlpha !== 0) r.png.logos_sem_transparencia.push(rel);
      if (isFav && minAlpha !== 255) r.png.favicons_nao_opacos.push(rel);
    }
    const dim = rel.match(/-(\d+)x(\d+)\.png$/) || rel.match(/apple-touch-icon\.png$/);
    if (dim) { const [w, h] = dim[1] ? [+dim[1], +dim[2]] : [180, 180]; if (meta.width !== w || meta.height !== h) r.png.dimensao_errada.push(`${rel} ${meta.width}x${meta.height}`); }
    const lw = rel.match(/logos\/.*-(\d+)\.png$/); if (lw && meta.width !== +lw[1]) r.png.dimensao_errada.push(`${rel} largura ${meta.width}`);
  }
  if (f.endsWith(".webp")) { r.webp.total++; const st = await sharp(f).ensureAlpha().stats(); if (st.channels[3].min !== 0) r.webp.sem_alfa.push(relative(OUT, f)); }
  if (f.endsWith(".ico")) {
    r.ico.total++;
    const b = readFileSync(f); const n = b.readUInt16LE(4);
    if (b.readUInt16LE(2) !== 1 || n !== 6) r.ico.problemas.push(`${rel}: tipo/contagem`);
    for (let i = 0; i < n; i++) { const off = b.readUInt32LE(6 + 16 * i + 12), len = b.readUInt32LE(6 + 16 * i + 8); const img = b.subarray(off, off + len); try { await sharp(img).metadata(); } catch { r.ico.problemas.push(`${rel}: imagem ${i} ilegível`); } }
  }
  if (/\.(html|webmanifest|css)$/.test(f)) {
    const s = readFileSync(f, "utf8");
    const refs = [...s.matchAll(/(?:src|href)="([^"#]+)"/g), ...s.matchAll(/"src":\s*"([^"]+)"/g)].map((x) => x[1]).filter((u) => !/^(https?:|data:|mailto:)/.test(u));
    for (const u of refs) if (!existsSync(join(dirname(f), u))) r.caminhos.quebrados.push(`${rel} -> ${u}`);
    if (/https?:\/\/(?!www\.w3\.org)/.test(s)) r.caminhos.quebrados.push(`${rel}: referência externa`);
  }
}
writeFileSync(`${OUT}/verificacao.json`, JSON.stringify(r, null, 2) + "\n");
const falhas = [r.svg.xml_invalido, r.svg.externos, r.svg.fontes_ou_texto, r.svg.contorno_diferente, r.png.logos_sem_transparencia, r.png.favicons_nao_opacos, r.png.dimensao_errada, r.webp.sem_alfa, r.ico.problemas, r.caminhos.quebrados].flat();
console.log(`arquivos ${r.arquivos} · svg ${r.svg.total} · png ${r.png.total} · webp ${r.webp.total} · ico ${r.ico.total} · falhas ${falhas.length}`);
for (const x of falhas) console.log("  ✖", x);
console.log(r.cores_do_raio.map((x) => `${x.arquivo}: ${x.preenchimentos.join(" ")}`).join("\n"));
