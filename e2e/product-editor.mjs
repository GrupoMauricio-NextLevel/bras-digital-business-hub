/**
 * V2: editor de produto. Fotos com capa e ordem, prévia na loja, SEO ao vivo, rascunho automático recuperável,
 * cadastro, duplicar e edição em lote (arquivar) na lista.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/product-editor.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
mkdirSync("/tmp/pe", { recursive: true }); writeFileSync("/tmp/pe/a.png", png); writeFileSync("/tmp/pe/b.png", png);
const ctx = await b.newContext({ viewport: { width: 1360, height: 1000 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ricardo Menezes/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");

await p.goto(B + "/supplier/products/new", { waitUntil: "networkidle" });
await p.getByLabel("Nome", { exact: true }).fill("Manto Editor Teste");
await p.getByLabel("SKU", { exact: true }).fill("ED-TESTE");
await p.locator("#sug").fill("149,90"); await p.locator("#cost").fill("59,00");
await p.locator("#seot").fill("Manto oficial do editor");
if (!(await p.getByText("Manto oficial do editor").count())) fail("prévia de SEO não reflete o título");
if (!(await p.locator('[aria-label="Prévia do cartão do produto"]').getByText("Manto Editor Teste").count())) fail("prévia na loja não reflete o nome");
if (!(await p.locator('[aria-label="Prévia do cartão do produto"]').getByText(/149,90/).count())) fail("prévia na loja sem preço");
ok("prévias de SEO e da loja ao vivo");
await p.locator('input[type=file]').first().setInputFiles(["/tmp/pe/a.png", "/tmp/pe/b.png"]);
await p.waitForSelector('ul[aria-label^="Fotos"] li img', { timeout: 15000 });
if ((await p.locator('ul[aria-label^="Fotos"] li img').count()) !== 2) fail("esperava 2 fotos");
if (!(await p.getByText("Capa").first().count())) fail("sem selo de capa");
ok("fotos enviadas, com capa");
await p.getByRole("button", { name: /Tornar a foto 2 a capa/ }).click(); ok("trocar capa");
// Rascunho automático
await p.waitForTimeout(1300);
await p.goto(B + "/supplier/products/new", { waitUntil: "networkidle" });
if (!(await p.getByText(/Encontramos um rascunho/).count())) fail("rascunho não foi guardado");
await p.getByRole("button", { name: "Recuperar" }).click();
if ((await p.getByLabel("Nome", { exact: true }).inputValue()) !== "Manto Editor Teste") fail("rascunho não recuperou o nome");
ok("rascunho automático recuperado");
await p.getByRole("button", { name: "Cadastrar produto" }).click();
await p.waitForURL(/\/supplier\/products\/prd_/, { timeout: 30000 });
ok("produto cadastrado");
// Duplicar
await p.getByRole("button", { name: /Duplicar/ }).click();
await p.waitForSelector("text=(cópia)", { timeout: 20000 });
ok("duplicado como rascunho");
// Lista: edição em lote
await p.goto(B + "/supplier/products", { waitUntil: "networkidle" });
const row = p.locator("tr", { hasText: "Manto Editor Teste (cópia)" }).first();
await row.getByRole("checkbox").check();
await p.getByRole("button", { name: /Arquivar/ }).click();
await p.locator("[data-sonner-toast]", { hasText: /arquivado/ }).first().waitFor({ timeout: 20000 });
ok("edição em lote (arquivar)");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("EDITOR DE PRODUTO OK");
