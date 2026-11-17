/**
 * Modo demonstração da agência (D326) no navegador: a administradora de uma agência vazia liga a chave, cai no painel de
 * demonstração (faixa, equipe e clientes em andamento), confere 360 px e axe, e desliga voltando à agência real.
 * Uso: AGENCIAS_V1=true bash scripts/restart-demo.sh; E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-modo-demo.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: false }); };

for (const w of [1440, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`@${w}: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Nina Souza/ }).first().click();
  await p.waitForURL((u) => u.pathname.startsWith("/agencia"), { timeout: 90000 }); await p.waitForLoadState("networkidle");
  if (w === 1440) await shot(p, "demo-01-chave-desligada");
  await p.getByRole("switch", { name: /Modo demonstração/ }).first().click();
  await p.getByText(/Modo demonstração\./).waitFor({ timeout: 90000 }).then(() => ok(`@${w} demonstração ligada`), () => fail(`@${w} não ligou`));
  await p.waitForLoadState("networkidle");
  const t = await p.locator("main").innerText();
  if (/Peças atrasadas|Pedidos de clientes|Aguardando aprovação|Novos contatos/.test(t)) ok(`@${w} fila do dia em movimento`); else fail(`@${w} painel da demonstração vazio`);
  await conferir(p, `demonstração @${w}`);
  await shot(p, `demo-02-ligada-${w}`);
  await p.getByRole("switch", { name: /Modo demonstração/ }).first().click();
  await p.waitForFunction(() => !document.body.innerText.includes("Modo demonstração."), null, { timeout: 60000 }).then(() => ok(`@${w} desligou e voltou à agência real`), () => fail(`@${w} não desligou`));
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
