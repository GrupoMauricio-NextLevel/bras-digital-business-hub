/**
 * V1: casca e painéis. Menu agrupado, barra flutuante no celular, início com variação e gráfico,
 * gaveta de pedido na lista e acessibilidade (axe).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/panels-v1.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
const axe = async (label) => {
  await p.evaluate(axeSource);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" ") })));
  const bad2 = r.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (bad2.length) fail(`axe (${label}): ` + JSON.stringify(bad2)); else ok(`axe ok (${label})`);
};
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ana Paula Ribeiro/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
await p.goto(B + "/merchant", { waitUntil: "networkidle" });
if (!(await p.getByRole("heading", { name: /^(Bom dia|Boa tarde|Boa noite), Ana/ }).count())) fail("sem saudação");
for (const g of ["Vendas", "Catálogo", "Loja virtual", "Financeiro"]) if (!(await p.locator("aside").getByText(g, { exact: true }).count())) fail(`menu sem o grupo ${g}`);
if (!(await p.locator("figure svg[role=img]").count())) fail("sem gráfico de vendas");
ok("início: saudação, grupos do menu e gráfico");
await axe("início desktop");
await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Ver pedido \d+ rapidamente/ }).first().click();
await p.getByRole("dialog").getByText("Produtos").waitFor({ timeout: 15000 });
if (!(await p.getByRole("dialog").getByRole("link", { name: /Abrir pedido completo/ }).count())) fail("gaveta sem link para o pedido completo");
ok("gaveta do pedido abre com produtos e histórico");
await p.keyboard.press("Escape");
await p.setViewportSize({ width: 390, height: 800 });
await p.goto(B + "/merchant", { waitUntil: "networkidle" });
const nav = p.locator('nav[aria-label="Atalhos"] ul');
const box = await nav.boundingBox();
if (!box || box.x < 4 || box.x + box.width > 386 || box.y + box.height > 800) fail("barra flutuante fora da tela");
if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail("rolagem horizontal em 390");
ok("barra flutuante no celular");
await axe("início celular");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("PAINÉIS V1 OK");
