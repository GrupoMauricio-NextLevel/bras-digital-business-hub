// NextLevel Business, academia (A1, D307): página pública com aula experimental e painel de captação.
// Uso: E2E_BASE=http://localhost:3100 [SHOTS=/pasta] node e2e/business-academia.mjs  (reinicie a demonstração antes)
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS ?? "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const falhas = [];
const fail = (m) => { falhas.push(m); console.error("FALHA:", m); };
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes[0]?.target?.join(" ")}`)); };
const semRolagemLateral = async (p, rotulo) => { const d = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (d > 0) fail(`${rotulo}: rolagem horizontal de ${d}px`); };
const foto = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium" });
try {
  for (const w of [360, 1440]) {
    const p = await browser.newPage({ viewport: { width: w, height: w === 360 ? 780 : 900 } });
    const erros = []; p.on("pageerror", (e) => erros.push(e.message));
    await p.goto(`${BASE}/academia/academia-renner?utm_source=instagram`, { waitUntil: "networkidle" });
    if (!(await p.getByRole("heading", { level: 1 }).textContent())?.includes("Guacuri")) fail("página: chamada sem o bairro");
    await semRolagemLateral(p, `página @${w}`);
    const v = await axeOf(p); if (v.length) fail(`página @${w}: axe ${v.join(" | ")}`);
    await foto(p, `academia-pagina-${w}`);
    if (w === 360) {
      await p.getByLabel("Seu nome").fill("Teste Automático");
      await p.getByLabel("WhatsApp com DDD").fill("(11) 97777-1234");
      await p.getByRole("button", { name: "Quero minha aula experimental" }).click();
      await p.locator("[data-experimental-ok]").waitFor({ timeout: 15000 }).catch(() => fail("página: pedido não confirmou"));
      await foto(p, "academia-pedido-ok-360");
    }
    if (erros.length) fail(`página @${w}: erros ${erros.join(" | ")}`);
    await p.close();
  }

  for (const w of [360, 1440]) {
    const p = await browser.newPage({ viewport: { width: w, height: w === 360 ? 780 : 900 } });
    await p.goto(`${BASE}/login`);
    await p.locator("input[type=email]").fill("academia@renner.demo");
    await p.locator("input[type=password]").fill("demo1234");
    await p.locator("input[type=password]").press("Enter");
    await p.waitForURL(/\/merchant\/academia/, { timeout: 30000 }).catch(() => fail(`painel @${w}: não abriu na captação (${p.url()})`));
    await p.waitForLoadState("networkidle");
    const item = p.locator("[data-academia-lista] li", { hasText: "Teste Automático" });
    if (w === 360) {
      if (!(await item.count())) fail("painel: pedido feito na página não apareceu");
      else if (!(await item.textContent()).includes("Instagram")) fail("painel: origem Instagram não gravada");
    }
    await semRolagemLateral(p, `painel @${w}`);
    const v = await axeOf(p); if (v.length) fail(`painel @${w}: axe ${v.join(" | ")}`);
    await foto(p, `academia-painel-${w}`);
    if (w === 1440 && (await item.count())) {
      await item.getByRole("button", { name: "Veio", exact: true }).click();
      await p.waitForTimeout(1500);
      await p.goto(`${BASE}/merchant/academia?etapa=veio`, { waitUntil: "networkidle" });
      if (!(await p.locator("[data-academia-lista] li", { hasText: "Teste Automático" }).count())) fail("painel: \"Veio\" não mudou a etapa");
      await p.goto(`${BASE}/merchant/academia/pagina`, { waitUntil: "networkidle" });
      const v2 = await axeOf(p); if (v2.length) fail(`página da academia (edição): axe ${v2.join(" | ")}`);
      await foto(p, "academia-editar-1440");
    }
    await p.close();
  }
} finally {
  await browser.close();
}
if (falhas.length) { console.error(`${falhas.length} falha(s)`); process.exit(1); }
console.log("ok: página da academia, pedido de aula experimental, painel de captação e acessibilidade");
