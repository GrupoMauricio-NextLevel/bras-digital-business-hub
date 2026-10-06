// Renderiza comparativo.png, capturas do preview (claro/escuro, 1440 e 390) e simulações de visão cromática.
import { chromium } from "playwright-core";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { CVD, toLin, fromLin, clamp01 } from "./cores.mjs";
const OUT = process.argv[2];
mkdirSync(`${OUT}/capturas`, { recursive: true }); mkdirSync(`${OUT}/simulacoes`, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const erros = [];
// prancha em alta resolução
{ const ctx = await b.newContext({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); p.on("requestfailed", (r) => erros.push("falhou: " + r.url()));
  await p.goto(`file://${OUT}/ferramentas/prancha.html`); await p.waitForLoadState("networkidle");
  await p.screenshot({ path: `${OUT}/comparativo.png`, fullPage: true }); await ctx.close(); }
// preview
for (const [t, w] of [["light", 1440], ["dark", 1440], ["light", 390], ["dark", 390]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); p.on("requestfailed", (r) => erros.push("falhou: " + r.url())); p.on("pageerror", (e) => erros.push("js: " + e.message));
  await p.goto(`file://${OUT}/preview.html`); await p.evaluate((t) => document.documentElement.setAttribute("data-theme", t), t);
  await p.waitForLoadState("networkidle");
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (ov) erros.push(`rolagem lateral em ${t} ${w}`);
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== "none").map((i) => i.src));
  if (broken.length) erros.push("imagens quebradas: " + broken.join(", "));
  await p.screenshot({ path: `${OUT}/capturas/preview-${t === "light" ? "claro" : "escuro"}-${w}.png`, fullPage: true }); await ctx.close();
}
await b.close();
// simulações sobre a prancha
const { data, info } = await sharp(`${OUT}/comparativo.png`).resize({ width: 2400 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const lut = new Float64Array(256).map((_, i) => toLin(i / 255));
for (const kind of ["protanopia", "deuteranopia", "tritanopia", "cinza"]) {
  const outb = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    const r = lut[data[i]], g = lut[data[i + 1]], bl = lut[data[i + 2]];
    let o;
    if (kind === "cinza") { const y = 0.2126 * r + 0.7152 * g + 0.0722 * bl; o = [y, y, y]; }
    else { const M = CVD[kind]; o = M.map((row) => row[0] * r + row[1] * g + row[2] * bl); }
    for (let k = 0; k < 3; k++) outb[i + k] = Math.round(fromLin(clamp01(o[k])) * 255);
  }
  await sharp(outb, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toFile(`${OUT}/simulacoes/comparativo-${kind}.png`);
}
console.log(erros.length ? erros.join("\n") : "sem erros de carregamento, imagens ou rolagem lateral");
