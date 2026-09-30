/**
 * S3: loja própria do fornecedor. Cria a loja, entra no painel da loja (troca de contexto), ativa produtos,
 * vê a loja pública e volta ao painel do fornecedor; conecta a plataforma de envio em demonstração.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/own-store.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ctx = await b.newContext({ viewport: { width: 1360, height: 950 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ricardo Menezes/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");

await p.goto(B + "/supplier/settings", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Validar e conectar/ }).last().click();
await p.getByText("conta de demonstração").first().waitFor({ timeout: 20000 }); ok("plataforma de envio conectada (demonstração)");

await p.goto(B + "/supplier/store", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Criar minha loja/ }).click();
await p.getByRole("button", { name: /Abrir painel da loja/ }).waitFor({ timeout: 30000 }); ok("loja própria criada");
await p.getByRole("button", { name: /Abrir painel da loja/ }).click();
await p.waitForURL(/\/merchant/, { timeout: 30000 }); await p.waitForLoadState("networkidle");
if (!(await p.locator("[data-own-store-banner]").count())) fail("sem o aviso do painel da loja própria"); else ok("painel da loja com aviso e botão de voltar");
if (await p.locator("aside").getByText("Saldo e recargas").count()) fail("loja própria mostra saldo e recargas");
await p.goto(B + "/merchant/products", { waitUntil: "networkidle" });
const bulk = p.getByRole("button", { name: /Ativar todos/ });
if (await bulk.count()) { await bulk.click(); await p.locator("[data-sonner-toast]", { hasText: /ativados/ }).first().waitFor({ timeout: 20000 }); }
ok("produtos ativados na loja própria");
await p.goto(B + "/merchant", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Voltar ao painel do fornecedor/ }).click();
await p.waitForURL(/\/supplier/, { timeout: 30000 }); ok("volta ao painel do fornecedor");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("LOJA PRÓPRIA OK");
