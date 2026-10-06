/**
 * QA do sistema de design nas PÁGINAS PÚBLICAS (SuperDrop, Commerce, NextLevel) e nas telas de entrada.
 * Cada rota pública x cada marca (endereço) x claro/escuro x 1440, 840, 390 e 320: status, erros, rolagem lateral, axe, fonte.
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/design-system-public-qa.mjs [--capturas]
 * Saída: docs/design-system/qa/resultado-publico.json
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const SHOTS = process.argv.includes("--capturas");
const OUT = "docs/design-system/qa", DIR = "docs/design-system/capturas-publicas";
mkdirSync(OUT, { recursive: true }); if (SHOTS) mkdirSync(DIR, { recursive: true });

const HOSTS = [
  { id: "superdrop", host: "superdrop.com.br" },
  { id: "commerce", host: "lojas.nextlevelgroup.com.br" },
  { id: "nextlevel", host: "master.nextlevelgroup.com.br" },
];
const COMMON = ["/", "/login", "/esqueci-senha", "/cadastro", "/planos", "/faq", "/como-funciona", "/loja-nextlevel", "/temas", "/temas/arena", "/quero-minha-loja", "/seja-fornecedor", "/parceiros", "/parceiros/termos", "/parceiros/entrar", "/parceiros/cadastro", "/fornecedores"];
const EXTRA = { superdrop: ["/f/alpha-outfit", "/f/mantosshop", "/demo/arena"], commerce: ["/demo/arena"], nextlevel: [] };
const WIDTHS = [1440, 840, 390, 320];
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe", "nextjs-portal"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 80))); };

const results = [];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const h of HOSTS) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": h.host } });
  const p = await ctx.newPage(); p.setDefaultTimeout(45000);
  let errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource|Hydration/.test(m.text())) errs.push("console: " + m.text().slice(0, 120)); });
  await p.goto(`${B}/login`, { waitUntil: "domcontentloaded" });
  for (const theme of ["light", "dark"]) {
    await p.evaluate((t) => localStorage.setItem("nl-theme", t), theme);
    for (const w of WIDTHS) {
      await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const route of [...COMMON, ...EXTRA[h.id]]) {
        errs = []; const problems = [];
        let status = 0;
        try {
          const r = await p.goto(B + route, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle").catch(() => {});
          status = r?.status() ?? 0;
          await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
          if (status >= 400) problems.push(`HTTP ${status}`);
          else {
            if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push("rolagem lateral");
            const fam = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family === "display" && f.status === "loaded") ? "carregada" : "NÃO carregada"; });
            if (fam !== "carregada") problems.push("fonte Plus Jakarta Sans não carregada");
            await p.waitForTimeout(900); const v = await axeOf(p); if (v.length) problems.push("axe: " + v.slice(0, 4).join(" | "));
            if (SHOTS && (w === 1440 || w === 390)) await p.screenshot({ path: `${DIR}/${h.id}-${route.replace(/\W+/g, "_").replace(/^_/, "") || "inicio"}-${theme}-${w}.png` });
          }
        } catch (e) { problems.push("falha: " + String(e.message).slice(0, 100)); }
        if (errs.length) problems.push(...errs.slice(0, 2));
        results.push({ host: h.id, route, theme, width: w, status, problems });
      }
    }
  }
  await ctx.close();
  console.log("marca", h.id, "ok");
}
await b.close();
writeFileSync(`${OUT}/resultado-publico.json`, JSON.stringify(results, null, 2));
const bad = results.filter((r) => r.problems.length && !(r.status === 404 && r.problems.length === 1));
const missing = results.filter((r) => r.status === 404 || r.status === 307);
console.log(`\nrenderizações: ${results.length} · com problema: ${bad.length} · rotas 404/redirecionadas (ex.: recurso de outra marca): ${new Set(missing.map((r) => r.host + r.route)).size}`);
for (const r of bad.slice(0, 120)) console.log(`✖ ${r.host} ${r.route} [${r.theme} ${r.width}] ${r.problems.join(" ; ").slice(0, 220)}`);
process.exit(bad.length ? 1 : 0);
