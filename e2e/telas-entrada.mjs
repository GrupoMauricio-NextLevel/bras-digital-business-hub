/**
 * Telas de entrada no padrão "foto + cartão" (login) e "faixa de foto + folha" (parceiros): capturas em 360/768/1440,
 * sem rolagem horizontal, sem erro e (em 390 e 1440) sem violação grave de acessibilidade.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/telas-entrada.mjs  (capturas em /tmp/claude-0/shots/entrada/)
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = "/tmp/claude-0/shots/entrada"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m);
const PAGES = [["login-commerce", "/lojas", "/login"], ["login-area-loja", null, "/login?area=loja&nome=fio-linha"], ["parceiro-cadastro", "/lojas/sair", "/parceiros/cadastro"], ["parceiro-entrar", "/lojas/sair", "/parceiros/entrar"]];
for (const w of [360, 768, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail(`@${w}: pageerror ${e.message}`));
  await p.goto(B + "/lojas", { waitUntil: "networkidle" });
  for (const [name, brandPath, path] of PAGES) {
    try {
      if (brandPath) await p.goto(B + brandPath, { waitUntil: "networkidle" });
      const r = await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 }); await p.waitForTimeout(500);
      if (!r || r.status() >= 400) fail(`${path} @${w}: HTTP ${r?.status()}`);
      if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${path} @${w}: rolagem horizontal`);
      if (w !== 768) {
        await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource);
        const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}(${x.nodes.length}) ${x.nodes[0]?.html.slice(0, 90)}`));
        if (v.length) fail(`${path} @${w}: axe ${v.join(" | ")}`);
      }
      await p.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: w === 360 });
    } catch (e) { fail(`${path} @${w}: ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.log("PROBLEMAS (" + bad.length + "):\n" + [...new Set(bad)].join("\n")); process.exit(1); }
console.log("TELAS DE ENTRADA OK");
