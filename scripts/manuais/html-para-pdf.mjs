// Imprime um HTML em PDF A4 com o Chromium do Playwright (número de página no rodapé).
// Uso: node scripts/manuais/html-para-pdf.mjs <entrada.html> <saida.pdf> "<texto do rodapé>"
import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
const [inp, out, rodape] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
const p = await b.newPage();
await p.goto(pathToFileURL(inp).href, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.pdf({
  path: out, format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;font-size:8px;color:#7a8396;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>${rodape}</span><span>página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
});
await b.close();
console.log("pdf:", out);
