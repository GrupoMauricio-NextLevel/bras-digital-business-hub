/**
 * S1: importação por planilha. Baixa o modelo .xlsx, envia, confere a prévia, importa e vê os produtos na lista;
 * segunda importação com SKU repetido mostra "Ignorar". Formulário individual mostra a grade e o estoque mínimo.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/product-import.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ctx = await b.newContext({ viewport: { width: 1360, height: 1000 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ricardo Menezes/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");

await p.goto(B + "/supplier/products/import", { waitUntil: "networkidle" });
const res = await p.request.get(B + "/supplier/products/import/modelo");
if (res.status() !== 200 || !(res.headers()["content-type"] ?? "").includes("spreadsheetml")) fail("modelo .xlsx não baixou");
mkdirSync("/tmp/pi", { recursive: true }); writeFileSync("/tmp/pi/modelo.xlsx", await res.body());
ok("modelo .xlsx baixado (" + (await res.body()).length + " bytes)");
await p.locator('input[type=file]').setInputFiles("/tmp/pi/modelo.xlsx");
await p.getByText("2. Confira").waitFor({ timeout: 30000 });
const txt = await p.locator("main").innerText();
if (!/3 linha\(s\): 3 para criar/.test(txt)) fail("prévia inesperada: " + txt.slice(0, 300)); else ok("prévia: 3 linhas para criar");
if (!/Masculino · P M G GG XX1 2XL/.test(txt) || !/Infantil · 18 20 22 24 26 28/.test(txt)) fail("grades não aparecem na prévia");
await p.getByRole("button", { name: /Importar 3 produto/ }).click();
await p.locator("#conteudo").getByText(/3 criado\(s\)/).waitFor({ timeout: 30000 }); ok("importação criou 3 produtos");
await p.goto(B + "/supplier/products", { waitUntil: "networkidle" });
if (!(await p.getByText("Manto Exemplo Feminino 2025").count())) fail("produto importado não aparece na lista"); else ok("produtos na lista");
// SKU repetido
await p.goto(B + "/supplier/products/import", { waitUntil: "networkidle" });
await p.locator('input[type=file]').setInputFiles("/tmp/pi/modelo.xlsx");
await p.getByText("2. Confira").waitFor({ timeout: 30000 });
if (!(await p.getByText("SKU já existe").first().count())) fail("SKU repetido sem aviso"); else ok("SKU repetido é ignorado com aviso");
// Formulário individual
await p.goto(B + "/supplier/products/new", { waitUntil: "networkidle" });
if (!(await p.getByRole("button", { name: "Conjunto infantil" }).count())) fail("sem a grade infantil");
await p.getByRole("button", { name: "Conjunto infantil" }).click();
if ((await p.locator('input[aria-label="Tamanho"]').first().inputValue()) !== "18") fail("grade infantil não preencheu 18");
if (!(await p.getByText(/pelo menos 4 peças por tamanho/).count())) fail("sem o aviso do estoque mínimo");
if (!(await p.getByLabel("Peso (g)").count())) fail("sem peso"); else ok("formulário com grade, estoque mínimo e embalagem");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("IMPORTAÇÃO OK");
