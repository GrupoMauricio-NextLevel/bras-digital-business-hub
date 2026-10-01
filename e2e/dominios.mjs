/**
 * Endereço público × endereço dos painéis (office). Simula os domínios com x-forwarded-host.
 * Uso: BRAND_OFFICE_SUPERDROP=https://office.superdrop.com.br bash scripts/restart-demo.sh
 *      E2E_BASE=http://localhost:3100 node e2e/dominios.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const hit = (host, path, extra = {}) => fetch(B + path, { redirect: "manual", headers: { "x-forwarded-host": host, "x-forwarded-proto": "https", ...extra } });

let r = await hit("superdrop.com.br", "/login");
if (r.status !== 307 || r.headers.get("location") !== "https://office.superdrop.com.br/login") fail("público /login deveria ir ao escritório: " + r.status + " " + r.headers.get("location")); else ok("superdrop.com.br/login → office.superdrop.com.br/login");
r = await hit("superdrop.com.br", "/merchant/orders?x=1");
if (r.headers.get("location") !== "https://office.superdrop.com.br/merchant/orders?x=1") fail("painel do público não foi ao escritório: " + r.headers.get("location")); else ok("painéis do endereço público vão ao escritório, mantendo caminho e busca");
r = await hit("office.superdrop.com.br", "/");
if (!/^https:\/\/office\.superdrop\.com\.br\/login$/.test(r.headers.get("location") ?? "")) fail("raiz do escritório deveria ir ao login: " + r.headers.get("location")); else ok("office.superdrop.com.br/ → login");
r = await hit("office.superdrop.com.br", "/f/mantos-shop");
if (!/\/login\?area=fornecedor&nome=mantos-shop$/.test(r.headers.get("location") ?? "")) fail("atalho do fornecedor: " + r.headers.get("location")); else ok("office/f/<fornecedor> → login do painel do fornecedor");
r = await hit("office.superdrop.com.br", "/planos");
if (r.headers.get("location") !== "https://superdrop.com.br/planos") fail("página pública no escritório deveria voltar ao público: " + r.headers.get("location")); else ok("página pública aberta no escritório volta ao endereço público");
r = await hit("superdrop.com.br", "/loja/mantos-shop");
const html = await r.text();
if (r.status !== 200 || !/MantosShop|Mantos/i.test(html)) fail("/loja/<nome> não mostrou a vitrine: " + r.status); else ok("superdrop.com.br/loja/<nome> mostra a vitrine do vendedor");
r = await hit("superdrop.com.br", "/planos");
if (r.status !== 200) fail("/planos público: " + r.status); else ok("institucional continua no endereço público");

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "office.superdrop.com.br" } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login?area=fornecedor&nome=mantos-shop", { waitUntil: "networkidle" });
if (!(await p.getByText(/Entrar no painel do fornecedor · mantos-shop/).count())) fail("login sem o aviso do atalho");
await p.getByLabel("E-mail").fill("master@nextlevel.demo"); await p.getByLabel("Senha").fill("demo1234"); await p.getByRole("button", { name: /Entrar/ }).click();
await p.waitForURL((u) => u.pathname === "/master", { timeout: 60000 }); await p.waitForLoadState("networkidle");
if (!(await p.getByRole("heading", { name: /Torre de controle/ }).count())) fail("Master não abriu no escritório"); else ok("login e Master funcionam no endereço do escritório");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("DOMÍNIOS OK");
