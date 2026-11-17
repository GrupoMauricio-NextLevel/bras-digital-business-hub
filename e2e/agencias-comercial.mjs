/**
 * Comercial, onboarding, Aprender e busca da agência (D317) no navegador: funil, virar cliente com onboarding, Aprender
 * com perguntas, busca Ctrl+K e o editor sem o Comercial no menu. 360 px e axe.
 * Uso: servidor com AGENCIAS_V1=true; E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-comercial.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, full = true) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: full }); };
async function entrar(nome, w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${nome} @${w}: erro na página ${e.message}`));
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
  if (!/Atividades comerciais para hoje/.test(await p.locator("main").innerText())) fail("fila do dia sem as atividades comerciais"); else ok("fila do dia avisa as atividades comerciais");
  await conferir(p, "/agencia/comercial", "admin");
  const t = await p.locator("main").innerText();
  if (!/Em negociação/.test(t) || !/Vidraçaria Brilho/.test(t) || !/Proposta enviada/.test(t)) fail("funil incompleto"); else ok("funil com etapas e números");
  await shot(p, "comercial-01-funil");
  await p.getByRole("link", { name: /Vidraçaria Brilho/ }).click();
  await p.waitForURL(/\/agencia\/comercial\/agop_/); await p.waitForLoadState("networkidle");
  const v = await axeOf(p); if (v.length) fail(`oportunidade: axe ${v.join(" | ")}`);
  await shot(p, "comercial-02-oportunidade");
  await p.getByRole("button", { name: "Virar cliente" }).click();
  await p.waitForURL(/\/agencia\/clientes\/agcl_/, { timeout: 30000 }); await p.waitForLoadState("networkidle");
  await p.getByRole("heading", { name: /Onboarding/ }).waitFor();
  await p.getByLabel("Briefing preenchido").click();
  await p.waitForFunction(() => [...document.querySelectorAll("label")].some((l) => /Briefing preenchido/.test(l.textContent ?? "") && l.querySelector("input")?.checked), null, { timeout: 20000 })
    .then(() => ok("virou cliente: ficha com onboarding e item marcado"), () => fail("onboarding não marcou"));
  await shot(p, "comercial-03-onboarding");
  await p.keyboard.press("Control+k");
  await p.getByRole("dialog").getByRole("combobox").or(p.getByRole("dialog").getByRole("textbox")).first().fill("Clínica");
  await p.getByText(/Clínica Sorriso Leve/).first().waitFor({ timeout: 15000 }).then(() => ok("busca rápida acha o cliente"), () => fail("busca rápida não achou o cliente"));
  await shot(p, "comercial-04-busca", false);
  await ctx.close();
}

{
  const { ctx, p } = await entrar("Gabriel Nunes");
  const menu = await p.locator("nav").first().innerText().catch(() => "");
  if (/Comercial/.test(menu)) fail("editor vê o Comercial no menu"); else ok("editor não vê o Comercial no menu");
  await conferir(p, "/agencia/aprender", "editor");
  await p.getByRole("link", { name: "O caminho de uma peça" }).first().click(); await p.waitForLoadState("networkidle");
  for (const g of await p.locator("fieldset").all()) await g.getByRole("radio").first().check();
  await p.getByRole("button", { name: /Conferir respostas/ }).click();
  await p.getByText(/acert/i).first().waitFor({ timeout: 15000 }).then(() => ok("Aprender corrige as respostas"), () => fail("Aprender não mostrou o resultado"));
  await shot(p, "comercial-05-aprender");
  await ctx.close();
}

{
  const { ctx, p } = await entrar("Marina Alves", 360);
  for (const path of ["/agencia/comercial", "/agencia/aprender", "/agencia/semana"]) await conferir(p, path, "admin 360");
  ok("360 px conferido");
  await ctx.close();
}

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
