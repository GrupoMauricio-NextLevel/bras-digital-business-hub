/**
 * Família Moda (Trama Urbana) nos quatro níveis: home, coleção, produto, carrinho e fechamento simulado em 360, 768 e 1440.
 * Confere: status, erros no navegador, rolagem lateral, axe (graves/críticas), banners por posição e o aviso de demonstração.
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/temas-moda.mjs [--capturas]
 * Saída: docs/temas-modulares/evidencias/e3/resultado.json (+ capturas em evidencias/e3/capturas)
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const SHOTS = process.argv.includes("--capturas");
const OUT = "docs/temas-modulares/evidencias/e3", DIR = `${OUT}/capturas`;
mkdirSync(DIR, { recursive: true });
const STORES = (process.env.TEMAS ?? "trama,lume,editorial,atelier").split(",");
const WIDTHS = [360, 768, 1440];
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe", "nextjs-portal"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 80))); };

const results = [];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const key of STORES) {
  const base = `${B}/store/demo-${key}`;
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 800 : 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage(); p.setDefaultTimeout(45000);
    let errs = [];
    p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errs.push("console: " + m.text().slice(0, 140)); });
    const check = async (name, extra = {}) => {
      await p.waitForTimeout(400);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const axe = await axeOf(p);
      const r = { key, w, page: name, url: p.url().replace(B, ""), errors: errs, overflow, axe, ...extra };
      results.push(r); errs = [];
      if (SHOTS && name === "home") { await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); }); await p.waitForLoadState("networkidle"); await p.waitForTimeout(500); }
      if (SHOTS) await p.screenshot({ path: `${DIR}/${key}-${name}-${w}.png`, fullPage: name === "home" });
      console.log(`${key} ${w} ${name}: ${overflow > 1 ? "ROLAGEM " + overflow : "ok"}${axe.length ? " axe=" + axe.join(" | ") : ""}${r.errors.length ? " erros=" + r.errors.join(" | ") : ""}`);
      return r;
    };
    const st = (await p.goto(base, { waitUntil: "networkidle" }))?.status();
    const banners = await p.evaluate(() => [...document.querySelectorAll("[data-banner-position]")].map((e) => e.getAttribute("data-banner-position")));
    const slides = await p.locator("[data-banner-slide]").count();
    const sections = await p.evaluate(() => document.querySelectorAll("main section").length);
    await check("home", { status: st, banners, slides, sections });
    const catHref = await p.locator('a[href*="/catalog?category="]').first().getAttribute("href").catch(() => null);
    await p.goto(catHref ? new URL(catHref, B).href : `${base}/catalog`, { waitUntil: "networkidle" });
    await check("colecao", { products: await p.locator('a[href*="/product/"]').count() });
    // Primeiro produto com estoque (o esgotado mostra "Esgotado" e não deixa comprar).
    const hrefs = [...new Set(await p.locator('main a[href*="/product/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href"))))];
    let soldOutSeen = false;
    for (const h of hrefs) {
      await p.goto(new URL(h, B).href, { waitUntil: "networkidle" });
      if (await p.locator("main button:visible", { hasText: /Adicionar ao carrinho/ }).count()) break;
      soldOutSeen = soldOutSeen || (await p.locator("main button:visible", { hasText: /Esgotado/ }).count()) > 0;
    }
    const size = p.locator('main button:not([disabled]):visible').filter({ hasText: /^(PP|P|M|G|GG|U|Único|3[4-9]|4[0-4])$/ }).first();
    if (await size.count()) await size.click();
    await check("produto", { soldOutSeen });
    await p.locator("main button:visible", { hasText: /Adicionar ao carrinho/ }).first().click();
    await p.waitForTimeout(500);
    await p.goto(`${base}/cart`, { waitUntil: "networkidle" });
    await check("carrinho", { lines: await p.locator("main li").count() });
    await p.goto(`${base}/checkout`, { waitUntil: "networkidle" });
    const note = await p.getByText("Compra de demonstração.").count();
    await check("checkout", { demoNote: note > 0 });
    await p.getByRole("button", { name: "Simular pedido" }).click();
    await p.getByRole("heading", { name: /Pedido de demonstração DEMO-/ }).waitFor();
    await check("confirmacao");
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/resultado.json`, JSON.stringify(results, null, 1));
const bad = results.filter((r) => r.overflow > 1 || r.axe.length || r.errors.length || (r.status && r.status !== 200));
console.log(`\n${results.length} verificações; ${bad.length} com problema.`);
process.exit(bad.length ? 1 : 0);
