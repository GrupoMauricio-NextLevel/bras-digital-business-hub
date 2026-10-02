/**
 * Varredura das telas novas do lojista (conta simples Commerce): sem rolagem horizontal em 360/768/1280, sem erro de página e
 * (em 390 e 1280) sem violações graves de acessibilidade; guarda capturas em /tmp/claude-0/shots/novas/.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/novas-telas.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = "/tmp/claude-0/shots/novas"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m);
const PAGES = ["/merchant/orders", "/merchant/orders/new", "/merchant/orders/propostas", "/merchant/customers", "/merchant/catalogo", "/merchant/catalogo/categorias", "/merchant/descontos", "/merchant/atacado", "/merchant/campanhas", "/merchant/avaliacoes", "/merchant/avise-me", "/merchant/team", "/merchant/labels"];
const axeOf = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 90)}`)); };
for (const w of [360, 768, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail(`@${w}: pageerror ${e.message}`));
  await p.goto(B + "/lojas", { waitUntil: "networkidle" });
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.fill("#email", "lojista@commerce.demo"); await p.fill("#password", "demo1234"); await p.getByRole("button", { name: /Entrar/ }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
  for (const path of PAGES) {
    try {
      const r = await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 }); await p.waitForTimeout(400);
      if (!r || r.status() >= 400) fail(`${path} @${w}: HTTP ${r?.status()}`);
      if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${path} @${w}: rolagem horizontal`);
      if (w !== 768) { const v = await axeOf(p); if (v.length) fail(`${path} @${w}: axe ${v.join(" | ")}`); }
      if (w === 360 || w === 1280) await p.screenshot({ path: `${OUT}/${path.replace(/\W+/g, "_")}-${w}.png` });
    } catch (e) { fail(`${path} @${w}: ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.log("PROBLEMAS (" + bad.length + "):\n" + [...new Set(bad)].join("\n")); process.exit(1); }
console.log("NOVAS TELAS OK");
