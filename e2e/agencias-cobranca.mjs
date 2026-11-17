/**
 * Cobrança da agência (D318) no navegador, com o Mercado Pago simulado (e2e/fake-mp.mjs na porta 4010 e o servidor com
 * MERCADOPAGO_API_URL=http://localhost:4010): conectar a conta, gerar link, aprovar no simulado, conferir pagamentos,
 * fila do dia com cobranças em atraso e o editor sem o Financeiro. 360 px e axe.
 * Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-cobranca.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const MP = process.env.FAKE_MP ?? "http://localhost:4010";
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, full = true) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: full }); };
async function entrar(nome, w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${nome} @${w}: erro na página ${e.message}`));
  p.on("dialog", (d) => d.accept("Pix direto na conta"));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(nome) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle");
  return { ctx, p };
}
async function conferir(p, path, rotulo) {
  await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 });
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo} ${path}: rolagem horizontal`);
  const v = await axeOf(p); if (v.length) fail(`${rotulo} ${path}: axe ${v.join(" | ")}`);
}

{
  const { ctx, p } = await entrar("Marina Alves");
  await conferir(p, "/agencia", "admin");
  const hoje = await p.locator("main").innerText();
  if (/Cobranças em atraso|Lembrar clientes/.test(hoje)) ok("fila do dia mostra a cobrança"); else console.log("· sem cobrança atrasada ou para lembrar hoje (depende do dia do mês)");
  await conferir(p, "/agencia/financeiro", "admin");
  await p.getByLabel("Access token").fill("TEST-1234567890-abcdefghij-agencia");
  await p.getByRole("button", { name: "Conectar" }).click();
  await p.getByText(/Mercado Pago conectado/).waitFor({ timeout: 20000 }).then(() => ok("conta Mercado Pago conectada"), () => fail("não conectou"));
  await p.getByRole("button", { name: "Gerar cobranças do mês" }).click();
  await p.getByText(/cobrança\(s\) gerada\(s\)|Nada novo para gerar/).first().waitFor({ timeout: 20000 }).then(() => ok("gerar cobranças respondeu (sem duplicar)"), () => fail("gerar cobranças não respondeu"));
  const linha = p.locator("li").filter({ has: p.getByRole("button", { name: "Gerar link" }) }).first();
  await linha.getByRole("button", { name: "Gerar link" }).click();
  await p.getByText("Link de pagamento pronto.").first().waitFor({ timeout: 20000 });
  await p.waitForLoadState("networkidle");
  const estado = await (await fetch(`${MP}/__state`)).json();
  const ref = estado.prefs.at(-1)?.external_reference;
  if (!ref) fail("sem preferência no Mercado Pago simulado"); else ok("link de pagamento criado na conta da agência");
  await fetch(`${MP}/__approve?ref=${ref}`);
  await p.getByRole("button", { name: "Conferir pagamentos" }).click();
  await p.getByText(/conferida\(s\), 1 paga\(s\)/).first().waitFor({ timeout: 30000 }).then(() => ok("pagamento conferido no Mercado Pago: baixa automática"), () => fail("baixa automática não aconteceu"));
  await p.waitForLoadState("networkidle");
  await shot(p, "cobranca-01-financeiro");
  await ctx.close();
}

{
  const { ctx, p } = await entrar("Gabriel Nunes");
  const menu = await p.locator("nav").first().innerText().catch(() => "");
  if (/Financeiro/.test(menu)) fail("editor vê o Financeiro"); else ok("editor não vê o Financeiro");
  await p.goto(B + "/agencia/financeiro", { waitUntil: "networkidle" });
  if (!/O financeiro é do administrador/.test(await p.locator("main").innerText())) fail("editor abriu o Financeiro"); else ok("editor barrado no Financeiro");
  await ctx.close();
}

{
  const { ctx, p } = await entrar("Marina Alves", 360);
  await conferir(p, "/agencia/financeiro", "admin 360");
  await shot(p, "cobranca-02-celular");
  ok("360 px conferido");
  await ctx.close();
}

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
