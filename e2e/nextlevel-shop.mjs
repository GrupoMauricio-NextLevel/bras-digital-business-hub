/**
 * X1: Loja NextLevel pública (compra em 1 clique), CRM do Master, pedidos separados por comissão e escritório virtual.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/nextlevel-shop.mjs   (reinicie o servidor demo antes: muda dados)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const axe = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const login = async (p, name) => {
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
};

// Visitante compra sem login
const vctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const v = await vctx.newPage();
v.on("pageerror", (e) => fail("pageerror: " + e.message));
await v.goto(B + "/loja-nextlevel", { waitUntil: "networkidle" });
if (!(await v.getByRole("heading", { level: 1 }).innerText()).includes("NextLevel")) fail("sem o título da página");
if (await v.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail("rolagem horizontal no celular");
await v.waitForTimeout(1500);
const av = await axe(v);
if (av.length) fail("axe: " + av.join(" | "));
else ok("LP da Loja NextLevel sem violações graves (celular)");
await v.getByRole("button", { name: /Comprar Assessoria de Lançamento/ }).click();
await v.getByLabel("Nome completo").fill("Maria da Silva");
await v.getByLabel("E-mail").fill("maria@exemplo.com");
await v.getByLabel(/WhatsApp/).fill("11958784061");
await v.getByRole("button", { name: /Pagar R\$\s*[\d.,]+\s*por Pix/ }).click();
await v.waitForSelector("[data-testid=nl-pix-code]", { timeout: 30000 });
await v.getByRole("button", { name: /Simular pagamento/ }).click();
await v.waitForURL(/\/loja-nextlevel\/pedido\//, { timeout: 30000 });
await v.waitForSelector("text=Pagamento recebido", { timeout: 20000 });
ok("compra em 1 clique (Pix demo) leva ao acompanhamento com pagamento confirmado");
const orderUrl = v.url();

// Master: CRM
const mctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const m = await mctx.newPage();
m.on("pageerror", (e) => fail("pageerror master: " + e.message));
await login(m, /Equipe NextLevel/);
await m.goto(B + "/master/crm", { waitUntil: "networkidle" });
const card = m.locator("[data-testid=crm-board] a", { hasText: "Maria da Silva" }).first();
if (!(await card.count())) fail("pedido não apareceu no CRM"); else {
  await card.click(); await m.waitForLoadState("networkidle");
  await m.getByRole("button", { name: "Marcar contato feito" }).click(); await m.waitForSelector("text=Etapa: Em contato", { timeout: 20000 });
  await m.getByLabel("Anotação").fill("Falei no WhatsApp"); await m.getByRole("button", { name: "Anotar" }).click(); await m.waitForSelector("text=Falei no WhatsApp", { timeout: 20000 });
  await m.getByRole("button", { name: "Iniciar execução" }).click(); await m.waitForSelector("text=Etapa: Em execução", { timeout: 20000 });
  await m.getByRole("button", { name: "Marcar entregue" }).click(); await m.waitForSelector("text=Etapa: Entregue", { timeout: 20000 });
  ok("CRM: contato, anotação, execução e entrega");
  await v.goto(orderUrl, { waitUntil: "networkidle" });
  if (!(await v.getByText("Pedido entregue").count())) fail("acompanhamento público não refletiu a entrega"); else ok("cliente vê a entrega no acompanhamento");
}
// Vitrine editável
await m.goto(B + "/master/crm", { waitUntil: "networkidle" });
if (!(await m.getByText("Vitrine pública").count())) fail("sem a vitrine editável no CRM");

// Pedidos separados
for (const [tab, marker] of [["lojas", "Comissão por loja"], ["fornecedores", "Comissão por fornecedor"]]) {
  await m.goto(`${B}/master/orders?tab=${tab}`, { waitUntil: "networkidle" });
  if (!(await m.getByText(marker).count())) fail(`sem "${marker}"`);
}
ok("pedidos das lojas e dos fornecedores em telas separadas");
for (const tab of ["assinaturas", "ativacoes", "servicos", "vendas"]) {
  await m.goto(`${B}/master/office?tab=${tab}`, { waitUntil: "networkidle" });
  if (!(await m.getByRole("heading", { name: "Escritório virtual" }).count())) fail(`escritório ${tab} sem título`);
}
const a2 = await axe(m);
if (a2.length) fail("axe master: " + a2.join(" | ")); else ok("escritório virtual e abas sem violações graves");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("LOJA NEXTLEVEL / CRM / ESCRITÓRIO OK");
