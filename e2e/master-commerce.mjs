/**
 * Master no endereço da Commerce: abre na área da marca (lojas, interessados, receita, lista do que falta para lançar).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/master-commerce.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ctx = await b.newContext({ viewport: { width: 1360, height: 950 }, extraHTTPHeaders: { "x-forwarded-host": "lojas.nextlevelgroup.com.br" } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
await p.waitForURL(/\/commerce/, { timeout: 90000 }); await p.waitForLoadState("networkidle");
ok("no endereço da Commerce o Master abre direto na área da marca");
for (const t of [/bloqueios? para lançamento/, /Mercado Pago da NextLevel/, /Lojas em operação/, /Prontidão/, /Interessados/]) if (!(await p.getByText(t).first().count())) fail("página sem " + t);
ok("página da marca com lista de lançamento, lojas e interessados");
if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail("rolagem horizontal");
await p.evaluate(axeSource);
const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90)));
if (v.length) fail("axe: " + v.join(" | ")); else ok("axe sem violações graves");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("MASTER COMMERCE OK");
