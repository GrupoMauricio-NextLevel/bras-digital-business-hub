/**
 * Banners de navegação (D88) nas lojas de demonstração: destaque em camadas (N3), imersivo (N4) com troca de passo na
 * rolagem, cartões de navegação, banner da categoria e janela do cupom de boas-vindas. Sem rolagem horizontal em 360 px.
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/banners-navegacao.mjs [pastaDeCapturas]
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const axe = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const out = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const ok = (m) => console.log("✔", m);
const shot = async (p, name) => { if (out) await p.screenshot({ path: `${out}/${name}.png` }); };
// Aquece as lojas de demonstração (criadas/atualizadas sob demanda pela galeria).
await (await b.newPage()).goto(B + "/temas", { waitUntil: "networkidle", timeout: 240_000 });

for (const w of [1440, 768, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 360 ? 760 : 900 } });
  const p = await ctx.newPage();
  // N3: destaque em camadas, cartões e banner da categoria
  for (const key of ["editorial", "varanda", "galpao"]) {
    await p.goto(`${B}/store/demo-${key}`, { waitUntil: "networkidle" });
    if (!(await p.locator('[data-banner-position="hero-layers"]').count())) bad.push(`${key}@${w}: sem destaque em camadas`);
    const cards = await p.locator("[data-nav-card]").count(); if (cards !== 4) bad.push(`${key}@${w}: ${cards} cartões de navegação (esperado 4)`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (over > 1) bad.push(`${key}@${w}: rolagem horizontal de ${over}px`);
    await shot(p, `${key}-home-${w}`);
    await p.locator("[data-nav-card]").first().scrollIntoViewIfNeeded(); await shot(p, `${key}-cartoes-${w}`);
    ok(`${key}@${w}: camadas + ${cards} cartões`);
  }
  await p.goto(`${B}/store/demo-editorial/catalog?category=basicos`, { waitUntil: "networkidle" });
  if (!(await p.locator('[data-banner-position="category-banner"]').count())) bad.push(`editorial@${w}: sem banner da categoria`); else ok(`editorial@${w}: banner da categoria Básicos`);
  await shot(p, `editorial-categoria-${w}`);
  // N4: destaque imersivo, o passo muda com a rolagem
  for (const key of ["atelier", "musa", "porto"]) {
    await p.goto(`${B}/store/demo-${key}`, { waitUntil: "networkidle" });
    const imm = p.locator('[data-banner-position="hero-immersive"]');
    if (!(await imm.count())) { bad.push(`${key}@${w}: sem destaque imersivo`); continue; }
    const s0 = await imm.getAttribute("data-step"); await shot(p, `${key}-imersivo-1-${w}`);
    // Percurso da rolagem = altura da seção menos a tela; cada passo ocupa um terço dele.
    const run = await imm.evaluate((el) => el.getBoundingClientRect().height - window.innerHeight);
    const top = await imm.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await p.evaluate((y) => window.scrollTo(0, y), top + run * 0.5); await p.waitForTimeout(900); const s1 = await imm.getAttribute("data-step"); await shot(p, `${key}-imersivo-2-${w}`);
    await p.evaluate((y) => window.scrollTo(0, y), top + run * 0.9); await p.waitForTimeout(900); const s2 = await imm.getAttribute("data-step"); await shot(p, `${key}-imersivo-3-${w}`);
    if (!(s0 === "0" && s1 === "1" && s2 === "2")) bad.push(`${key}@${w}: passos não avançam na rolagem (${s0} → ${s1} → ${s2})`); else ok(`${key}@${w}: passos ${s0} → ${s1} → ${s2}`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (over > 1) bad.push(`${key}@${w}: rolagem horizontal de ${over}px`);
  }
  await ctx.close();
}

// Cupom de boas-vindas (N2 Lume): abre sozinho, pede consentimento, mostra o código e não volta a abrir.
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await ctx.newPage();
  await p.goto(`${B}/store/demo-lume`, { waitUntil: "networkidle" });
  const dlg = p.locator("[data-welcome-dialog]");
  await dlg.waitFor({ timeout: 15_000 }).catch(() => bad.push("lume: a janela de boas-vindas não abriu"));
  if (await dlg.count()) {
    await shot(p, "lume-cupom-janela");
    await dlg.getByRole("textbox", { name: "E-mail" }).fill("visitante@exemplo.com");
    await dlg.getByRole("button", { name: /Receber|Quero/ }).click();
    if (!(await dlg.getByRole("alert").count())) await p.waitForTimeout(800);
    if (!(await dlg.getByText(/aceite receber ofertas/i).count())) bad.push("lume: enviou sem consentimento"); else ok("lume: pede consentimento antes do cupom");
    await dlg.getByRole("checkbox").check(); await dlg.getByRole("button", { name: /Receber|Quero/ }).click();
    const code = await dlg.locator("[data-welcome-code]").textContent({ timeout: 10_000 }).catch(() => null);
    if (code?.trim() !== "BEMVINDO10") bad.push(`lume: código mostrado ${code}`); else ok("lume: cupom BEMVINDO10 revelado");
    await shot(p, "lume-cupom-codigo");
    await p.keyboard.press("Escape");
    await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(12_000);
    if (await p.locator("[data-welcome-dialog]").count()) bad.push("lume: a janela abriu de novo para o mesmo visitante"); else ok("lume: não abre de novo");
  }
  await ctx.close();
}
// Acessibilidade (axe, violações graves) nas páginas com as seções novas, com menos movimento e com movimento.
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await ctx.newPage();
  for (const path of ["/store/demo-editorial", "/store/demo-atelier", "/store/demo-porto", "/store/demo-galpao/catalog?category=texteis", "/store/demo-lume"]) {
    await p.goto(B + path, { waitUntil: "networkidle" });
    const v = await axe(p); if (v.length) bad.push(`axe ${path}: ${v.join(" | ")}`); else ok(`axe ${path}: sem violações graves`);
  }
  await ctx.close();
}
await b.close();
if (bad.length) { console.log("\n✘ Problemas:\n- " + bad.join("\n- ")); process.exit(1); }
console.log("\nTudo certo.");
