/**
 * Página de captação da agência (D322) no navegador: uma visita vinda de anúncio (etiquetas na URL) pede contato; a
 * negociação aparece no Comercial com "Novo pelo site", a origem e a mensagem, e a fila do dia avisa. 360 px e axe.
 * Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-captacao.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const SLUG = "agencia-aurora-demo"; const EMPRESA = `Ótica Visão ${Date.now() % 10000}`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };

for (const w of [360, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`página @${w}: ${e.message}`));
  await p.goto(`${B}/orcamento/${SLUG}?utm_source=facebook&utm_medium=cpc&utm_campaign=reels-novembro&fbclid=teste&lp=lp-reels`, { waitUntil: "networkidle", timeout: 90000 });
  await conferir(p, `captação @${w}`);
  await shot(p, `captacao-01-pagina-${w}`);
  if (w === 1440) {
    await p.getByLabel("Seu nome").fill("Rita Lopes"); await p.getByLabel("Empresa", { exact: true }).fill(EMPRESA);
    await p.getByLabel("WhatsApp com DDD").fill("11 97777-1234"); await p.getByLabel("O que interessa").selectOption("Vídeos para Reels");
    await p.getByLabel(/Conte um pouco/).fill("Queremos 8 vídeos por mês");
    await p.waitForTimeout(3200);
    await p.getByRole("button", { name: "Pedir contato" }).click();
    await p.getByText("Pedido recebido!").waitFor({ timeout: 20000 }).then(() => ok("pedido enviado pela página"), () => fail("pedido não foi"));
  }
  await ctx.close();
}

{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`agência: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Marina Alves/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/agencia", { waitUntil: "networkidle" });
  if (/Novos contatos pela página de captação/.test(await p.locator("main").innerText())) ok("fila do dia avisa o contato novo"); else fail("fila do dia sem o contato");
  await p.goto(B + "/agencia/comercial", { waitUntil: "networkidle" });
  await conferir(p, "comercial");
  const cartao = p.locator("a", { hasText: EMPRESA });
  if (/Novo pelo site/.test(await cartao.innerText()) && /Anúncio Meta/.test(await cartao.innerText())) ok("cartão com 'Novo pelo site' e a origem"); else fail("cartão sem selo ou origem");
  await shot(p, "captacao-02-comercial");
  await cartao.click(); await p.waitForURL(/\/agencia\/comercial\/agop_/); await p.waitForLoadState("networkidle");
  const t = await p.locator("main").innerText();
  if (/reels-novembro/.test(t) && /lp-reels/.test(t) && /Queremos 8 vídeos/.test(t)) ok("ficha mostra campanha, página e mensagem"); else fail("ficha sem os dados do pedido");
  await conferir(p, "ficha da negociação");
  await shot(p, "captacao-03-ficha");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
