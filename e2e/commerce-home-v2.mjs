/**
 * Home da NextLevel Commerce v2 (D97): cadastro aberto, planos com mensal/anual e simulador por faturamento, vitrine de
 * temas com capturas. Servidor com BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true e BRAND_DOMAINS_NEXTLEVEL_COMMERCE=127.0.0.1.
 * Uso: E2E_BASE=http://127.0.0.1:3400 node e2e/commerce-home-v2.mjs  (capturas em E2E_SHOTS, padrão /tmp/cm-shots)
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://127.0.0.1:3400";
const OUT = process.env.E2E_SHOTS ?? "/tmp/cm-shots"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✖", m); };
const shot = async (p, path, full = true) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250); await p.screenshot({ path, fullPage: full }); };
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };

for (const w of [360, 768, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" }); const p = await c.newPage();
  p.on("pageerror", (e) => fail(`pageerror @${w}: ${e.message}`));
  await p.goto(B + "/", { waitUntil: "networkidle" });
  const txt = await p.locator("main, body").first().innerText();
  if (/Quero minha loja|por convite|Deixe seu contato|combinado na conversa/.test(txt)) fail(`home @${w}: texto de cadastro fechado ainda aparece`);
  if (!/Criar minha loja grátis/.test(txt)) fail(`home @${w}: botão de cadastro no topo ausente`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`home @${w}: rolagem horizontal`);
  if (w !== 768) { const v = await axeOf(p); if (v.length) fail(`home @${w}: axe ${v.join(" | ")}`); }
  await shot(p, `${OUT}/01-home-${w}.png`);
  if (w === 1440) {
    // Planos: anual muda o preço e o link; régua no máximo destaca o Enterprise.
    const planos = p.locator("#planos");
    await planos.scrollIntoViewIfNeeded();
    await p.screenshot({ path: `${OUT}/02-planos-mensal-1440.png`, clip: await planos.boundingBox().then((bb) => ({ x: 0, y: bb.y - p.viewportSize().height * 0 , width: 1440, height: Math.min(bb.height, 1400) })) }).catch(() => {});
    await planos.getByRole("button", { name: /^Anual/ }).click();
    const href = await planos.getByRole("link", { name: /Começar grátis/ }).first().getAttribute("href");
    if (!href?.includes("ciclo=ANNUAL")) fail(`planos: link sem ciclo anual (${href})`);
    if (!/por ano, pagamento único/.test(await planos.innerText())) fail("planos: anual não mostra o valor do ano");
    const slider = planos.getByRole("slider", { name: /Quanto você vende por mês/ });
    await slider.focus(); for (let i = 0; i < 8; i++) await p.keyboard.press("ArrowRight");
    if (!/Para o seu tamanho/.test(await planos.innerText())) fail("planos: Enterprise não fica em destaque no maior faturamento");
    await slider.focus(); for (let i = 0; i < 8; i++) await p.keyboard.press("ArrowLeft");
    if (!/Melhor para o seu faturamento/.test(await planos.innerText())) fail("planos: sem plano em destaque");
    await planos.screenshot({ path: `${OUT}/03-planos-anual-1440.png` });
    // Temas: filtro por segmento e capturas reais.
    const temas = p.locator("#temas");
    await temas.getByRole("button", { name: "Esporte" }).click();
    const nomes = await temas.locator("li p.font-\\[family-name\\:var\\(--nl-font-display\\)\\]").allInnerTexts();
    if (!nomes.length) fail("temas: filtro Esporte vazio");
    const quebradas = await temas.locator("img").evaluateAll((imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0).length);
    if (quebradas) fail(`temas: ${quebradas} imagem(ns) quebrada(s)`);
    await temas.screenshot({ path: `${OUT}/04-temas-1440.png` });
    // Cadastro com plano e ciclo vindos do link.
    await p.goto(B + "/cadastro?plano=COMMERCE_PRO&ciclo=ANNUAL", { waitUntil: "networkidle" });
    if ((await p.getByRole("button", { name: /^Anual/ }).getAttribute("aria-pressed")) !== "true") fail("cadastro: ciclo anual do link não veio marcado");
    await shot(p, `${OUT}/05-cadastro-1440.png`);
  }
  await c.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log(`Tudo certo. Capturas em ${OUT}`);
