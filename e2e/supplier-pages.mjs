/**
 * V7: páginas públicas de Alpha Outfit e MantosShop. Sem custo na tela, aviso de conteúdo demonstrativo, sem rolagem horizontal.
 * Uso: E2E_BASE=http://localhost:3100 [SHOTS=/pasta] node e2e/supplier-pages.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
for (const [slug, name, coupon] of [["alpha-outfit", "Alpha Outfit", "ALPHA7"], ["mantosshop", "MantosShop", "MANTOSSHOP7"]]) {
  for (const w of [1360, 768, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } }); p.on("pageerror", (e) => fail(`${slug}: pageerror ${e.message}`));
    const r = await p.goto(`${B}/f/${slug}`, { waitUntil: "networkidle" });
    if (r?.status() !== 200) { fail(`${slug}: HTTP ${r?.status()}`); await p.close(); continue; }
    const body = (await p.locator("body").textContent()) ?? "";
    if (!body.includes(name)) fail(`${slug}: sem o nome`);
    if (!/conteúdo a fornecer/i.test(body)) fail(`${slug}: sem o aviso de conteúdo demonstrativo`);
    if (!body.includes(coupon)) fail(`${slug}: sem o cupom ${coupon}`);
    if (/R\$\s*80,00|custo/i.test(body.replace(/Custo de cada pedido[^.]*\./gi, "").replace(/o custo de cada pedido[^.]*\./gi, ""))) fail(`${slug}: custo apareceu na tela`);
    if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${slug}@${w}: rolagem horizontal`);
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${slug}-${w}.png`, fullPage: true });
    await p.close();
  }
  ok(`${name}: 3 larguras`);
}
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("PÁGINAS DE FORNECEDORES OK");
