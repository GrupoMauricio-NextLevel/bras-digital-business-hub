/**
 * M1: loja do membro. Assinatura NextLevel no rodapé, selos, botão do WhatsApp, acompanhamento de pedido,
 * editor com a página de produto e envio da logo.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/storefront-journey.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
import { writeFileSync, mkdirSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
mkdirSync("/tmp/sj", { recursive: true }); writeFileSync("/tmp/sj/logo.png", png);

const anon = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
anon.on("pageerror", (e) => fail("pageerror: " + e.message));
for (const s of ["mantos-shop", "arena-10", "mrs-sports"]) {
  await anon.goto(`${B}/store/${s}`, { waitUntil: "networkidle" });
  if (!(await anon.locator("[data-nextlevel-footer]").count())) fail(`${s}: sem a assinatura da NextLevel no rodapé`);
  if (!(await anon.locator('[aria-label="Segurança da compra"]').count())) fail(`${s}: sem selos de segurança`);
}
ok("assinatura NextLevel e selos nas lojas");
await anon.goto(`${B}/store/mantos-shop/acompanhar?pedido=1001&email=nao@existe.com`, { waitUntil: "networkidle" });
if (!(await anon.getByText("Não encontramos um pedido").count())) fail("busca inválida deveria avisar"); else ok("acompanhar pedido: dado errado não revela nada");
const link = await anon.locator('a[href$="/acompanhar"]').count(); if (!link) fail("sem link Acompanhar pedido no cabeçalho");

const ctx = await b.newContext({ viewport: { width: 1360, height: 950 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ana Paula Ribeiro/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
await p.goto(B + "/theme-editor", { waitUntil: "networkidle" });
await p.locator("#page-select").selectOption("product");
await p.getByText("Selos de segurança").first().waitFor({ timeout: 20000 }); ok("editor abre a página de produto com os selos");
await p.getByRole("button", { name: /Cores, fontes e estilo/ }).click();
await p.locator('[aria-label="Logo da loja"] input[type=file]').setInputFiles("/tmp/sj/logo.png");
await p.locator('img[alt="Logo atual"]').waitFor({ timeout: 30000 }); ok("logo enviada no editor");
await anon.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
if (!(await anon.locator("header img[alt]").count())) fail("logo não apareceu no cabeçalho da loja"); else ok("logo aparece no cabeçalho");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("LOJA DO MEMBRO OK");
