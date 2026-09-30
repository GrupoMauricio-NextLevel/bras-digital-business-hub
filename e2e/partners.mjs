/**
 * A1: Programa de Parceiros. Captação com calculadora, cadastro, escritório virtual, link → cadastro da loja → pagamento → comissão,
 * saque e o lado do Master. Uso: E2E_BASE=http://localhost:3100 node e2e/partners.mjs   (reinicie o servidor demo antes: muda dados)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const RUN = Date.now().toString().slice(-6);
const axe = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const makeCpf = () => { const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9)); const d = (a) => { const s = a.reduce((t, x, i) => t + x * (a.length + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; const d1 = d(n); const d2 = d([...n, d1]); return [...n, d1, d2].join(""); };

// 1) Captação: calculadora + acessibilidade em celular
const vctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const v = await vctx.newPage();
v.on("pageerror", (e) => fail("pageerror: " + e.message));
await v.goto(B + "/parceiros", { waitUntil: "networkidle" });
if (await v.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail("/parceiros com rolagem horizontal no celular");
const tier = () => v.getByTestId("calc-tier").innerText();
if ((await tier()).trim() !== "20%") fail("faixa padrão de 5 ativações deveria ser 20%");
await v.getByLabel("Ativações por mês").fill("10");
if ((await tier()).trim() !== "25%") fail("10 ativações deveriam ser 25%"); else ok("calculadora: 5 → 20%, 10 → 25%");
await v.getByLabel("Ativações por mês").fill("2");
if ((await tier()).trim() !== "15%") fail("2 ativações deveriam ser 15%");
if (!(await v.getByText("Não é garantia de ganhos").count())) fail("sem o aviso de simulação");
await v.waitForTimeout(1200);
const a1 = await axe(v); if (a1.length) fail("axe /parceiros: " + a1.join(" | ")); else ok("axe /parceiros sem violações graves");

// 2) Cadastro do parceiro
const pctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await pctx.newPage();
p.on("pageerror", (e) => fail("pageerror parceiro: " + e.message));
await p.goto(B + "/parceiros/cadastro", { waitUntil: "networkidle" });
await p.getByLabel("Nome completo").fill("Bruna Parceira " + RUN);
await p.getByLabel("E-mail").fill(`bruna-${RUN}@teste.com`);
await p.getByLabel(/Senha/).fill("senha-segura-1");
await p.getByLabel("CPF ou CNPJ").fill(makeCpf());
await p.getByLabel(/WhatsApp/).fill("11988887777");
await p.getByLabel(/Chave Pix/).fill("bruna@pix.com");
await p.getByLabel(/Li e aceito/).check();
await p.getByRole("button", { name: /Criar minha conta de parceiro/ }).click();
await p.waitForURL(/\/partner$/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
const mainLink = await p.getByTestId("partner-main-link").innerText();
if (!/\/r\/[a-z0-9]+/.test(mainLink)) fail("sem link principal"); else ok("cadastro do parceiro leva ao escritório virtual: " + mainLink);
const code = mainLink.split("/r/")[1];

// links e cupons
await p.goto(B + "/partner/links", { waitUntil: "networkidle" });
if (!(await p.locator("svg").first().count())) fail("sem QR code");
await p.getByLabel("Nome do link").fill("Instagram bio"); await p.getByRole("button", { name: "Criar link" }).click();
await p.waitForSelector("text=Instagram bio", { timeout: 20000 });
await p.goto(B + "/partner/coupons", { waitUntil: "networkidle" });
await p.getByLabel("Código do cupom").fill("BRUNA" + RUN); await p.getByRole("button", { name: /Criar cupom de 7 dias/ }).click();
await p.waitForSelector(`text=BRUNA${RUN}`, { timeout: 20000 });
ok("link por campanha e cupom de 7 dias criados");

// 3) Cliente entra pelo link: clique → cadastro atribuído → paga → comissão pendente
const cctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const c = await cctx.newPage();
c.on("pageerror", (e) => fail("pageerror cliente: " + e.message));
await c.goto(`${B}/r/${code}`, { waitUntil: "networkidle" });
if (!/\/cadastro\?ref=/.test(c.url())) fail("link não levou ao cadastro com ref: " + c.url());
await c.locator("#supplier").selectOption({ index: 1 });
await c.locator("#store").fill("Loja Indicada " + RUN); await c.locator("#owner").fill("Dona da Loja");
await c.locator("#email").fill(`dona-${RUN}@teste.com`); await c.locator("#pass").fill("senha-segura-1"); await c.locator("#tax").fill(makeCpf());
await c.getByRole("button", { name: /Criar loja e pagar/ }).click();
await c.waitForSelector("[data-blocked-screen]", { timeout: 60000 });
await c.waitForSelector("text=Pagamento por Pix", { timeout: 20000 });
await c.getByRole("button", { name: /Simular pagamento/ }).click();
await c.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
ok("loja indicada paga a ativação");

await p.goto(B + "/partner/referrals", { waitUntil: "networkidle" });
if (!(await p.getByText("Pagante").count())) fail("indicado não aparece como pagante");
if (await p.getByText(`dona-${RUN}`).count() || await p.getByText("Dona da Loja").count()) fail("dado pessoal do indicado vazou para o parceiro");
await p.goto(B + "/partner/finance", { waitUntil: "networkidle" });
if (!(await p.getByText("Comissão de setup").count())) fail("sem comissão de setup no extrato");
if (!(await p.getByText("Manutenção (mensalidade)").count())) fail("sem manutenção no extrato");
if (!(await p.getByText("Em garantia").first().count())) fail("comissão não está em garantia");
ok("comissão de setup e manutenção pendentes (em garantia), sem dados pessoais do indicado");
const a2 = await axe(p); if (a2.length) fail("axe financeiro parceiro: " + a2.join(" | ")); else ok("axe financeiro do parceiro sem violações graves");

// 4) Parceiro demo: saque → Master paga
const dctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const d = await dctx.newPage();
d.on("pageerror", (e) => fail("pageerror demo: " + e.message));
const login = async (pg, name) => { await pg.goto(B + "/login", { waitUntil: "networkidle" }); await pg.getByRole("button", { name }).first().click(); await pg.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await pg.waitForLoadState("networkidle"); };
await login(d, /Camila Duarte/);
await d.goto(B + "/partner/finance", { waitUntil: "networkidle" });
await d.getByLabel(/Confirmo que a chave Pix/).check();
await d.getByRole("button", { name: /Solicitar saque de/ }).click();
await d.waitForSelector("text=Solicitado", { timeout: 20000 });
ok("parceiro demo solicita saque");
const mctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const m = await mctx.newPage();
m.on("pageerror", (e) => fail("pageerror master: " + e.message));
await login(m, /Equipe NextLevel/);
await m.goto(B + "/master/partners?tab=saques", { waitUntil: "networkidle" });
await m.getByRole("button", { name: "Aprovar" }).first().click(); await m.waitForSelector("text=Aprovado", { timeout: 20000 });
await m.getByLabel("Comprovante ou motivo").first().fill("Pix E2E" + RUN); await m.getByRole("button", { name: "Marcar pago" }).first().click();
await m.waitForSelector("text=Pago · Pix E2E" + RUN, { timeout: 20000 }).catch(async () => { if (!(await m.getByText("Pix E2E" + RUN).count())) fail("saque não ficou pago"); });
ok("Master aprova e marca o saque como pago");
for (const tab of ["parceiros", "antifraude", "regras"]) { await m.goto(`${B}/master/partners?tab=${tab}`, { waitUntil: "networkidle" }); if (!(await m.getByRole("heading", { name: "Programa de Parceiros" }).count())) fail(`master ${tab} sem título`); }
await m.goto(B + "/master/partners", { waitUntil: "networkidle" });
if (!(await m.getByText("Bruna Parceira").count())) fail("Master não lista a nova parceira");
await m.getByRole("link", { name: /Bruna Parceira/ }).first().click(); await m.waitForURL(/\/master\/partners\/prt_/); await m.waitForLoadState("networkidle");
if (!(await m.getByText("Livro-razão").count())) fail("sem livro-razão no detalhe");
await m.waitForTimeout(500);
const a3 = await axe(m); if (a3.length) fail("axe master parceiros: " + a3.join(" | ")); else ok("Master: lista, detalhe, regras e antifraude sem violações graves");
const csv = await m.evaluate(async () => (await fetch("/master/partners/export?period=" + new Date().toISOString().slice(0, 7))).text());
if (!csv.startsWith("codigo,nome")) fail("CSV inválido"); else ok("CSV exportado");
// Lojista não acessa a área
const anon = await (await b.newContext()).newPage(); await anon.goto(B + "/partner", { waitUntil: "networkidle" });
if (!anon.url().includes("/login")) fail("visitante acessou /partner");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("PARCEIROS OK");
