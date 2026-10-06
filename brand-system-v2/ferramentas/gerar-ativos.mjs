// Cópias recoloridas das logos oficiais (só o preenchimento do raio muda) + favicons.
// Os contornos das letras e do raio são copiados byte a byte dos SVGs do kit v1.
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { sistema, NAVY, OFFWHITE, AMARELO } from "./sistema.mjs";

const [KIT, OUT] = process.argv.slice(2);
const S = sistema().filter((m) => m.oficial);
const ORIG = AMARELO; // preenchimento do raio no kit v1
// nome no v2 -> nome no kit v1
const VARIANTES = [["assinatura-completa", "logo-completo"], ["compacta", "wordmark"], ["monograma", "simbolo"]];
const LARG = { "assinatura-completa": [320, 640, 1280, 2400], compacta: [320, 640, 1280, 2400], monograma: [128, 256, 512, 1024] };
const WEBP = { "assinatura-completa": [640, 1280], compacta: [640, 1280], monograma: [512] };
const relatorio = [];

function recolorir(svg, marca, tema) {
  const n = (svg.match(new RegExp(`fill="${ORIG}"`, "g")) || []).length;
  if (n !== 1) throw new Error(`esperava 1 preenchimento do raio, achei ${n}`);
  return svg.replace(`fill="${ORIG}"`, `fill="${marca}"`).replace("<svg ", `<svg data-tema="${tema}" `);
}
const png = (buf, w) => sharp(buf, { density: Math.max(72, Math.ceil((w / 1200) * 96 * 2)) }).resize({ width: w }).png({ compressionLevel: 9 });

for (const m of S) {
  for (const tema of ["claro", "escuro"]) {
    const mark = m[tema]["brand-mark"];
    const dir = `${OUT}/logos/${m.id}/${tema}`; mkdirSync(dir, { recursive: true });
    for (const [v2, v1] of VARIANTES) {
      const svg = recolorir(readFileSync(`${KIT}/${m.pasta}/logos/${tema}/${v1}.svg`, "utf8"), mark, tema);
      writeFileSync(`${dir}/${v2}.svg`, svg);
      const buf = Buffer.from(svg);
      for (const w of LARG[v2]) await png(buf, w).toFile(`${dir}/${v2}-${w}.png`);
      for (const w of WEBP[v2]) await sharp(buf, { density: 300 }).resize({ width: w }).webp({ lossless: true }).toFile(`${dir}/${v2}-${w}.webp`);
    }
    relatorio.push({ marca: m.id, tema, raio: mark });
  }
  // monocromáticas: copiadas sem alteração (preto e branco), mesmos três formatos
  const md = `${OUT}/logos/${m.id}/monocromatico`; mkdirSync(md, { recursive: true });
  for (const [v2, v1] of VARIANTES) for (const cor of ["preto", "branco"]) {
    const svg = readFileSync(`${KIT}/${m.pasta}/logos/monocromatico/${v1}-${cor}.svg`, "utf8");
    writeFileSync(`${md}/${v2}-${cor}.svg`, svg);
    const w = v2 === "monograma" ? 512 : 1280;
    await png(Buffer.from(svg), w).toFile(`${md}/${v2}-${cor}-${w}.png`);
    await sharp(Buffer.from(svg), { density: 300 }).resize({ width: w }).webp({ lossless: true }).toFile(`${md}/${v2}-${cor}-${w}.webp`);
  }

  // ---------------- favicons ----------------
  for (const tema of ["claro", "escuro"]) {
    const mark = m[tema]["brand-mark"];
    const dir = `${OUT}/favicons/${m.id}/${tema}`; mkdirSync(dir, { recursive: true });
    const fav = recolorir(readFileSync(`${KIT}/${m.pasta}/favicons/${tema}/favicon.svg`, "utf8"), mark, tema); // mesmas margens do kit v1
    writeFileSync(`${dir}/favicon.svg`, fav);
    const fb = Buffer.from(fav);
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngs = {};
    for (const s of sizes) { pngs[s] = await sharp(fb, { density: 300 }).resize(s, s).png({ compressionLevel: 9 }).toBuffer(); writeFileSync(`${dir}/favicon-${s}x${s}.png`, pngs[s]); }
    await sharp(fb, { density: 300 }).resize(180, 180).png().toFile(`${dir}/apple-touch-icon.png`);
    await sharp(fb, { density: 300 }).resize(192, 192).png().toFile(`${dir}/android-chrome-192x192.png`);
    await sharp(fb, { density: 300 }).resize(512, 512).png().toFile(`${dir}/android-chrome-512x512.png`);
    writeFileSync(`${dir}/favicon.ico`, ico([16, 32, 48, 64, 128, 256].map((s) => [s, pngs[s]])));
    // maskable: mesmo fundo, monograma reduzido para a zona segura (círculo de 80%): largura do símbolo = 56% do ícone
    const bg = tema === "claro" ? OFFWHITE : NAVY;
    const sym = recolorir(readFileSync(`${KIT}/${m.pasta}/logos/${tema}/simbolo.svg`, "utf8"), mark, tema);
    const vb = sym.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
    const sc = (512 * 0.56) / vb[0], tx = (512 - vb[0] * sc) / 2, ty = (512 - vb[1] * sc) / 2;
    const inner = sym.replace(/^[\s\S]*?<g>/, "").replace(/<\/g>[\s\S]*$/, "");
    const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${sc.toFixed(5)})">${inner}</g></svg>`;
    writeFileSync(`${dir}/maskable.svg`, mask);
    await sharp(Buffer.from(mask), { density: 300 }).resize(512, 512).png().toFile(`${dir}/maskable-512x512.png`);
  }
  // manifestos (caminhos relativos ao manifesto, que fica em favicons/<marca>/)
  for (const tema of ["claro", "escuro"]) {
    const man = { name: m.nome, short_name: m.curto, start_url: "/", scope: "/", display: "standalone", background_color: tema === "claro" ? OFFWHITE : NAVY, theme_color: tema === "claro" ? OFFWHITE : NAVY,
      icons: [{ src: `${tema}/android-chrome-192x192.png`, sizes: "192x192", type: "image/png", purpose: "any" }, { src: `${tema}/android-chrome-512x512.png`, sizes: "512x512", type: "image/png", purpose: "any" }, { src: `${tema}/maskable-512x512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" }] };
    writeFileSync(`${OUT}/favicons/${m.id}/site-${tema}.webmanifest`, JSON.stringify(man, null, 2) + "\n");
  }
}

/** ICO com imagens PNG embutidas (formato aceito por navegadores e Windows Vista+). */
function ico(list) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(list.length, 4);
  const dirs = []; let off = 6 + 16 * list.length; const datas = [];
  for (const [s, data] of list) {
    const d = Buffer.alloc(16); d.writeUInt8(s >= 256 ? 0 : s, 0); d.writeUInt8(s >= 256 ? 0 : s, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
    d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(data.length, 8); d.writeUInt32LE(off, 12);
    off += data.length; dirs.push(d); datas.push(data);
  }
  return Buffer.concat([head, ...dirs, ...datas]);
}
console.log(JSON.stringify(relatorio));
