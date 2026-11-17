/**
 * Soluções NextLevel da agência (D323) no navegador: o administrador conecta a agência ao NextLevel Business (caminho
 * Site), vê as soluções e abre o site no painel do negócio sem novo login. O editor não vê a janela. 360 px e axe.
 * Rode com a demonstração reiniciada e BUSINESS_V1=true: AGENCIAS_V1=true BUSINESS_V1=true bash scripts/restart-demo.sh
 * Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-solucoes.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };
async function entrar(nome, w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${nome}: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(nome) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  return { ctx, p };
}

{
  const { ctx, p } = await entrar("Gabriel Nunes");
  if (/Soluções NextLevel/.test(await p.locator("nav").first().innerText().catch(() => ""))) fail("editor vê Soluções NextLevel"); else ok("editor não vê a janela");
  await ctx.close();
}
{
  const { ctx, p } = await entrar("Marina Alves", 360);
  await p.goto(B + "/agencia/solucoes", { waitUntil: "networkidle" });
  await conferir(p, "soluções 360 (antes de conectar)");
  await shot(p, "solucoes-01-conectar-360");
  await ctx.close();
}
{
  const { ctx, p } = await entrar("Marina Alves");
  await p.goto(B + "/agencia/solucoes", { waitUntil: "networkidle" });
  await conferir(p, "soluções (antes de conectar)");
  await p.getByLabel(/Site da agência/).check();
  await p.getByLabel(/Concordo em criar a conta/).check();
  await p.getByRole("button", { name: "Conectar ao NextLevel Business" }).click();
  await p.getByText(/Conectado! A conta do negócio/).waitFor({ timeout: 60000 }).then(() => ok("agência conectada ao NextLevel Business"), () => fail("conexão não respondeu"));
  await p.waitForLoadState("networkidle");
  await p.getByRole("heading", { name: /Conectada:/ }).waitFor({ timeout: 20000 });
  await conferir(p, "soluções (conectada)");
  await shot(p, "solucoes-02-conectada");
  await p.getByRole("button", { name: "Editar o site" }).click();
  await p.waitForURL(/\/merchant\/site\/paginas/, { timeout: 90000 }).then(() => ok("abriu o site no painel do negócio sem novo login"), () => fail(`não abriu o site: ${p.url()}`));
  await p.waitForLoadState("networkidle");
  await shot(p, "solucoes-03-site-do-negocio");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
