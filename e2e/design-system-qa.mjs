/**
 * QA do sistema de design compartilhado (painéis de todas as famílias).
 * - Entra com cada conta de demonstração, descobre as telas pelos links reais (menu e páginas) e visita todas.
 * - Varredura (SWEEP): 1440 claro + 390 escuro em cada tela encontrada: status HTTP, erros de console/página, rolagem lateral, axe sério/crítico, fonte.
 * - Amostra (SAMPLE): telas representativas em 1440, 840, 390 e 320, claro e escuro, com captura de tela e medidas de geometria.
 * - Equivalência: compara as MESMAS medidas entre os temas (NextLevel, Commerce, SuperDrop): só cor pode mudar.
 * Uso: bash scripts/restart-demo.sh e depois  E2E_BASE=http://localhost:3100 node e2e/design-system-qa.mjs [--so-varredura|--so-amostra]
 * Saída: docs/design-system/qa/resultado-paineis.json (+ capturas em docs/design-system/capturas).
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const ONLY_SWEEP = process.argv.includes("--so-varredura"), ONLY_SAMPLE = process.argv.includes("--so-amostra");
const ONLY_ACCOUNT = (process.argv.find((a) => a.startsWith("--conta=")) ?? "").slice(8);
const OUT = "docs/design-system/qa", SHOTS = "docs/design-system/capturas";
mkdirSync(OUT, { recursive: true }); mkdirSync(SHOTS, { recursive: true });

const ACCOUNTS = [
  { id: "commerce-lojista", host: "lojas.nextlevelgroup.com.br", email: "completo@commerce.demo", roots: ["/merchant"], sample: ["/merchant", "/merchant/orders", "/merchant/catalogo", "/merchant/finance", "/merchant/settings"] },
  { id: "commerce-equipe", host: "lojas.nextlevelgroup.com.br", email: "paulo@casaaurora.demo", roots: ["/merchant"], sample: ["/merchant/orders"] },
  { id: "superdrop-lojista", host: "superdrop.com.br", email: "loja@mrssports.demo", roots: ["/merchant"], sample: ["/merchant", "/merchant/orders", "/merchant/wallet", "/merchant/products"] },
  { id: "superdrop-fornecedor", host: "superdrop.com.br", email: "megatron@superdrop.demo", roots: ["/supplier"], sample: ["/supplier", "/supplier/orders", "/supplier/products", "/supplier/finance"] },
  { id: "superdrop-expedicao", host: "superdrop.com.br", email: "expedicao@megatron.demo", roots: ["/supplier/dispatch"], sample: ["/supplier/dispatch"] },
  { id: "master-nextlevel", host: "master.nextlevelgroup.com.br", email: "master@nextlevel.demo", roots: ["/master", "/commerce"], sample: ["/master", "/master/orders", "/master/finance", "/commerce", "/commerce/stores"] },
  { id: "parceiro", host: "superdrop.com.br", email: "parceira@demo.superdrop.com.br", roots: ["/partner"], sample: ["/partner", "/partner/finance"] },
];
const SKIP = /logout|sair|\/api\/|\/print|\/etiqueta|pdf|\.csv|exportar|download|\/new$|\/import|\/theme-editor|\/store\//;
const TIMEOUT = 45000;
const results = [], geometry = [];

const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe", "nextjs-portal"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 80))); };

/** Medidas que NÃO podem mudar de um tema para outro (só cor varia). */
const measure = (p) => p.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), radius: c.borderTopLeftRadius, font: c.fontSize, weight: c.fontWeight, family: c.fontFamily.split(",")[0].replace(/["']/g, ""), pad: c.padding }; };
  return { side: box(".ds-side"), top: box(".ds-top"), content: box(".ds-content"), btn: box(".ds-btn:not(.ds-btn--sm)"), card: box(".ds-card"), kpi: box(".ds-kpi"), h1: box(".ds-head h1, main h1"), pill: box(".ds-pill"), theme: document.documentElement.dataset.dsTheme };
});

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const acc of ACCOUNTS.filter((a) => !ONLY_ACCOUNT || a.id === ONLY_ACCOUNT)) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": acc.host } });
  const p = await ctx.newPage(); p.setDefaultTimeout(TIMEOUT);
  let errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource|Hydration/.test(m.text())) errs.push("console: " + m.text().slice(0, 140)); });
  await p.goto(`${B}/login`, { waitUntil: "networkidle" });
  await p.fill("#email", acc.email); await p.fill("#password", "demo1234"); await p.getByRole("button", { name: /Entrar/ }).click();
  try { await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }); } catch { results.push({ account: acc.id, route: "(login)", problems: ["login não concluiu"] }); await ctx.close(); continue; }
  await p.waitForLoadState("networkidle");
  const hide = () => p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  const setTheme = async (t) => { await p.evaluate((x) => localStorage.setItem("nl-theme", x), t); };

  // ---- descoberta pelos links reais ----
  const seen = new Set(), queue = [...acc.roots];
  const prefixes = acc.roots.map((r) => r.split("/")[1]);
  const found = [];
  if (!ONLY_SAMPLE) {
    while (queue.length && found.length < 140) {
      const route = queue.shift(); if (seen.has(route)) continue; seen.add(route); console.error("[rastreio]", acc.id, route);
      let r; try { r = await p.goto(B + route, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle").catch(() => {}); } catch { continue; }
      if (!r || r.status() >= 400 || new URL(p.url()).pathname.startsWith("/login")) { found.push({ route, status: r?.status() ?? 0 }); continue; }
      found.push({ route, status: r.status() });
      const hrefs = await p.$$eval("a[href^='/']", (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
      for (const h of hrefs) {
        const path = h.split("#")[0].split("?")[0];
        if (!path || SKIP.test(path) || seen.has(path) || queue.includes(path)) continue;
        if (!prefixes.includes(path.split("/")[1])) continue;
        if (path.split("/").length > 4) continue; // evita explodir em detalhes por id
        queue.push(path);
      }
    }
  } else for (const r of acc.sample) found.push({ route: r, status: 200 });

  // ---- varredura: 1440 claro + 390 escuro ----
  if (!ONLY_SAMPLE) for (const [theme, w] of [["light", 1440], ["dark", 390]]) {
    await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 }); await setTheme(theme);
    for (const f of found) {
      errs = []; console.error("[render]", acc.id, theme, f.route);
      const problems = [];
      let status = f.status;
      try {
        const r = await p.goto(B + f.route, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle").catch(() => {});
        status = r?.status() ?? 0; await hide();
        if (status >= 400) problems.push(`HTTP ${status}`);
        if (new URL(p.url()).pathname.startsWith("/login")) problems.push("redirecionou ao login");
        const text = (await p.locator("main, body").first().innerText().catch(() => "")).trim();
        if (/Não foi possível carregar esta página|Ocorreu um erro inesperado|Application error/i.test(text)) problems.push("página de erro");
        if (status < 400) {
          if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push("rolagem lateral");
          const fam = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family === "display" && f.status === "loaded") ? "carregada" : "NÃO carregada"; });
          if (fam !== "carregada") problems.push("fonte Plus Jakarta Sans não carregada");
          const v = await axeOf(p); if (v.length) problems.push("axe: " + v.slice(0, 4).join(" | "));
        }
      } catch (e) { problems.push("falha: " + String(e.message).slice(0, 100)); }
      if (errs.length) problems.push(...errs.slice(0, 3));
      results.push({ account: acc.id, route: f.route, theme, width: w, status, problems });
    }
  }

  // ---- amostra: 4 larguras x 2 temas, com captura e geometria ----
  if (!ONLY_SWEEP) for (const theme of ["light", "dark"]) {
    await setTheme(theme);
    for (const w of [1440, 840, 390, 320]) {
      await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const route of acc.sample) {
        errs = [];
        const problems = [];
        try {
          await p.goto(B + route, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle").catch(() => {}); await hide();
          if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push("rolagem lateral");
          const v = await axeOf(p); if (v.length) problems.push("axe: " + v.slice(0, 3).join(" | "));
          geometry.push({ account: acc.id, route, theme, width: w, ...(await measure(p)) });
          const name = `${acc.id}-${route.replace(/\W+/g, "_").replace(/^_/, "") || "inicio"}-${theme}-${w}`;
          await p.screenshot({ path: `${SHOTS}/${name}.png` });
        } catch (e) { problems.push("falha: " + String(e.message).slice(0, 100)); }
        if (errs.length) problems.push(...errs.slice(0, 2));
        results.push({ account: acc.id, route, theme, width: w, mode: "amostra", status: 200, problems });
      }
    }
  }
  await ctx.close();
  console.log("conta", acc.id, "telas descobertas:", found.length);
}
await b.close();

// ---- equivalência entre temas: a MESMA geometria em todos os temas e contas (só cor varia) ----
const diffs = [];
const refs = new Map(); // largura+elemento -> {valor, id}: compara cada elemento só onde ele existe na tela
for (const g of geometry) {
  const parts = { side: g.side && { w: g.side.w }, top: g.top && { h: g.top.h }, btn: g.btn && { h: g.btn.h, r: g.btn.radius, f: g.btn.family }, kpi: g.kpi && { r: g.kpi.radius } };
  for (const [k, v] of Object.entries(parts)) {
    if (!v) continue;
    const key = g.width + k, val = JSON.stringify(v), ref = refs.get(key);
    if (!ref) refs.set(key, { val, id: `${g.account} ${g.route} ${g.theme}` });
    else if (ref.val !== val) diffs.push({ width: g.width, elemento: k, ref: ref.id, refVal: ref.val, outro: `${g.account} ${g.route} ${g.theme}`, val });
  }
}
writeFileSync(`${OUT}/${ONLY_SAMPLE ? "amostra" : ONLY_SWEEP ? "varredura" : "resultado-paineis"}${ONLY_ACCOUNT ? "-" + ONLY_ACCOUNT : ""}.json`, JSON.stringify({ results, geometry, diffsGeometria: diffs }, null, 2));
const bad = results.filter((r) => r.problems.length);
console.log(`\nrenderizações: ${results.length} · com problema: ${bad.length} · diferenças de geometria entre temas/contas: ${diffs.length}`);
for (const r of bad.slice(0, 80)) console.log(`✖ ${r.account} ${r.route} [${r.theme} ${r.width}] ${r.problems.join(" ; ").slice(0, 220)}`);
for (const d of diffs.slice(0, 10)) console.log("≠ geometria", JSON.stringify(d).slice(0, 300));
process.exit(bad.length ? 1 : 0);
