/**
 * QA visual do painel Commerce (vidro azul, Claro e Escuro): cria uma loja, visita telas em 4 larguras e 2 temas,
 * confere rolagem lateral, erros de console e axe (sério/crítico), e salva capturas em docs/commerce-visual/capturas.
 * Uso: BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/commerce-glass-qa.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = "docs/commerce-visual/capturas"; mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m);
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "lojas.nextlevelgroup.com.br" } });
const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) fail("console: " + m.text().slice(0, 120)); });
await p.goto(`${B}/cadastro`, { waitUntil: "networkidle" });
await p.locator("#store").fill("Loja Vidro " + RUN); await p.locator("#owner").fill("Ana Souza");
await p.locator("#email").fill(`vidro-${RUN}@teste.com`); await p.locator("#pass").fill("senha-segura-1"); await p.locator("#tax").fill(makeCpf());
await p.getByRole("button", { name: /Criar loja e pagar/ }).click();
await p.waitForURL(/\/merchant/, { timeout: 90000 }); await p.waitForLoadState("networkidle");
await p.waitForSelector("[data-blocked-screen]", { timeout: 30000 });
for (let step = 1; step <= 2; step++) {
  if (!(await p.locator("[data-blocked-screen]").count())) break;
  await p.getByRole("button", { name: /Simular pagamento/ }).waitFor({ timeout: 25000 });
  await p.getByRole("button", { name: /Simular pagamento/ }).click();
  await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
}
const axeOf = async () => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const PAGES = [["inicio", "/merchant"], ["pedidos", "/merchant/orders"], ["produtos", "/merchant/catalogo"], ["clientes", "/merchant/customers"], ["aparencia", "/merchant/templates"], ["financeiro", "/merchant/finance"], ["configuracoes", "/merchant/settings"]];
await p.emulateMedia({ reducedMotion: "reduce" });
for (const theme of ["light", "dark"]) {
  await p.evaluate((t) => localStorage.setItem("nl-theme", t), theme);
  for (const w of [1440, 1280, 768, 390]) {
    await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
    for (const [name, path] of PAGES) {
      if (w !== 1440 && w !== 390 && name !== "inicio" && name !== "pedidos") continue;
      await p.goto(B + path, { waitUntil: "networkidle" });
      const label = `${name} ${theme} @${w}`;
      if (await p.evaluate(() => document.documentElement.getAttribute("data-theme")) !== theme) fail(`${label}: tema não aplicado`);
      if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${label}: rolagem lateral`);
      const v = await axeOf(); if (v.length) fail(`${label}: axe ${v.join(" | ")}`);
      if ((w === 1440 || w === 390) && ["inicio", "pedidos", "produtos"].includes(name)) await p.screenshot({ path: `${OUT}/${name}-${theme}-${w}.png`, fullPage: false });
    }
  }
}

// ADM Commerce (console do Master): mesmo sistema visual, contexto próprio.
{
  const c2 = await b.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "lojas.nextlevelgroup.com.br" } });
  const q = await c2.newPage();
  q.on("pageerror", (e) => fail("adm pageerror: " + e.message));
  await q.goto(`${B}/login`, { waitUntil: "networkidle" }); await q.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await q.waitForURL(/\/commerce/, { timeout: 90000 }); await q.waitForLoadState("networkidle");
  await q.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["light", "dark"]) {
    await q.evaluate((t) => localStorage.setItem("nl-theme", t), theme);
    for (const w of [1440, 390]) {
      await q.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const [name, path] of [["adm-visao", "/commerce"], ["adm-lojas", "/commerce/stores"], ["adm-vendas", "/commerce/orders"], ["adm-assinaturas", "/commerce/plans"]]) {
        await q.goto(B + path, { waitUntil: "networkidle" });
        const label = `${name} ${theme} @${w}`;
        if (new URL(q.url()).pathname.startsWith("/login")) { fail(`${label}: caiu no login`); continue; }
        if (await q.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${label}: rolagem lateral`);
        await q.evaluate(axeSource); const v = await q.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90)));
        if (v.length) fail(`${label}: axe ${v.join(" | ")}`);
        if (name === "adm-visao" || name === "adm-lojas") await q.screenshot({ path: `${OUT}/${name}-${theme}-${w}.png` });
      }
    }
  }
}
await b.close();
console.log(bad.length ? "PROBLEMAS:\n" + bad.join("\n") : "QA VISUAL COMMERCE OK");
process.exit(bad.length ? 1 : 0);
