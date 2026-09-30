/**
 * P1 (frete): checkout cota por CEP no servidor, mostra opções, soma no total e grava o serviço no pedido.
 * O lojista ajusta as regras (frete grátis, retirada) em Configurações.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/frete.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const login = async (p, name) => { await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle"); };

// 1) Lojista define as regras: sem frete grátis, entrega padrão R$ 31,90, retirada na loja
const mc = await b.newContext({ viewport: { width: 1280, height: 900 } }); const m = await mc.newPage();
m.on("pageerror", (e) => fail("pageerror lojista: " + e.message));
await login(m, /Ana Paula Ribeiro/);
await m.goto(B + "/merchant/settings", { waitUntil: "networkidle" });
const form = m.getByRole("form", { name: "Regras de frete" });
await form.locator("#free").fill(""); await form.locator("#flat").fill("31,90"); await form.locator("#flatdays").fill("5");
const pickup = form.getByRole("checkbox", { name: /retirada/i }); if (!(await pickup.isChecked())) await pickup.check();
await form.getByLabel("Endereço de retirada").fill("Rua do Brás, 10");
await form.getByRole("button", { name: "Salvar regras de frete" }).click();
await m.locator("[data-sonner-toast]", { hasText: /Regras de frete salvas/ }).first().waitFor({ timeout: 30000 });
ok("lojista salva as regras de frete");

// 2) Cliente: CEP → opções → escolher → pedido
const cc = await b.newContext({ viewport: { width: 1280, height: 900 } }); const c = await cc.newPage();
c.on("pageerror", (e) => fail("pageerror cliente: " + e.message));
await c.goto(B + "/store/mantos-shop/catalog", { waitUntil: "networkidle" });
await c.locator('a[href*="/product/"]').first().click(); await c.waitForLoadState("networkidle");
const size = c.getByRole("button", { name: /^(P|M|G|GG|\d+)$/ }).first(); if (await size.count()) await size.click();
await c.getByRole("button", { name: /Adicionar ao carrinho/ }).click(); await c.waitForTimeout(600);
await c.goto(B + "/store/mantos-shop/checkout", { waitUntil: "networkidle" });
if (!(await c.getByRole("button", { name: /Ir para o pagamento/ }).isDisabled())) fail("botão deveria ficar bloqueado sem CEP");
await c.getByPlaceholder("Nome completo").fill("Cliente Frete"); await c.getByPlaceholder("E-mail").fill("frete@teste.com");
await c.getByPlaceholder("CEP").fill("20040-020"); await c.getByPlaceholder("Endereço e número").fill("Rua A, 1"); await c.getByPlaceholder("Cidade").fill("Rio de Janeiro");
await c.waitForSelector("[data-shipping-options] input[type=radio]", { timeout: 30000 });
const opts = await c.locator("[data-shipping-options] label").allInnerTexts();
if (!opts.some((t) => /31,90/.test(t))) fail("entrega padrão R$ 31,90 ausente: " + opts.join(" | "));
if (!opts.some((t) => /Retirar na loja/.test(t))) fail("retirada ausente");
ok("opções por CEP: " + opts.map((t) => t.replace(/\s+/g, " ")).join(" / "));
const total = async () => (await c.locator("aside dl div").last().innerText()).replace(/\s+/g, " ");
const before = await total();
await c.getByRole("radio", { name: /Retirar na loja/ }).check();
const after = await total();
if (before === after) fail("total não mudou ao escolher retirada"); else ok(`total muda com o frete: ${before} → ${after}`);
await c.getByRole("radio", { name: /Entrega padrão/ }).check();
await c.getByRole("button", { name: /Ir para o pagamento/ }).click();
await c.waitForURL(/\/order\//, { timeout: 60000 }); ok("pedido criado com o frete cotado no servidor");
await c.waitForLoadState("networkidle");
if (!(await c.getByText(/31,90/).count())) fail("pedido não mostra o frete de R$ 31,90");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("FRETE OK");
