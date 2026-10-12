/**
 * V8: varredura de acabamento. Páginas públicas e dos painéis em 4 larguras: sem rolagem horizontal, sem erro de página
 * e (em 390 e 1280) sem violações graves de acessibilidade. Uso: E2E_BASE=http://localhost:3100 node e2e/polish-v8.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m);
const WIDTHS = [360, 390, 768, 1280];
const axeOf = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 80))); };

const PUBLIC = ["/", "/planos", "/como-funciona", "/faq", "/loja-nextlevel", "/parceiros", "/parceiros/cadastro", "/parceiros/termos", "/seja-fornecedor", "/cadastro", "/login", "/esqueci-senha", "/f/mantosshop", "/store/mantos-shop"];
const ROLES = [
  [/Equipe NextLevel/, ["/master", "/master/orders?tab=lojas", "/master/orders?tab=fornecedores", "/master/office", "/master/crm", "/master/partners", "/master/partners?tab=regras", "/master/financeiro/operacao", "/master/services", "/master/suppliers", "/master/settings"]],
  [/Alex \(Alpha Outfit\)/, ["/supplier", "/supplier/products", "/supplier/invoices", "/supplier/store", "/supplier/stores", "/supplier/orders"]],
  [/Ana Paula Ribeiro/, ["/merchant", "/merchant/orders", "/merchant/products", "/merchant/templates", "/merchant/finance", "/merchant/customers", "/merchant/services", "/merchant/analytics"]],
  [/Camila Duarte/, ["/partner", "/partner/links", "/partner/coupons", "/partner/referrals", "/partner/finance", "/partner/profile"]],
];

async function sweep(ctxOpts, pages, label) {
  for (const w of WIDTHS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, ...ctxOpts.context }); const p = await ctx.newPage();
    p.on("pageerror", (e) => fail(`${label} @${w}: pageerror ${e.message}`));
    if (ctxOpts.login) { await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: ctxOpts.login }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle"); }
    for (const path of pages) {
      try {
        await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 }); await p.waitForTimeout(w === 390 || w === 1280 ? 900 : 200);
        if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${label} ${path} @${w}: rolagem horizontal`);
        if (w === 390 || w === 1280) { const v = await axeOf(p); if (v.length) fail(`${label} ${path} @${w}: axe ${v.join(" | ")}`); }
      } catch (e) { fail(`${label} ${path} @${w}: ${e.message.split("\n")[0]}`); }
    }
    await ctx.close();
  }
  console.log("✔", label, pages.length, "páginas ×", WIDTHS.length, "larguras");
}

await sweep({}, PUBLIC, "públicas");
for (const [name, pages] of ROLES) await sweep({ login: name }, pages, String(name));
await b.close();
if (bad.length) { console.log("PROBLEMAS (" + bad.length + "):\n" + [...new Set(bad)].join("\n")); process.exit(1); }
console.log("ACABAMENTO OK");
