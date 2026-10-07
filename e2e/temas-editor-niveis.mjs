/**
 * Editor por nível (temas modulares): cartão do nível, Central de Banners (biblioteca de imagens, envio, ponto de foco
 * por aparelho, descrição) e aviso de conflito entre duas abas. Capturas do editor no computador e no celular.
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/temas-editor-niveis.mjs [--capturas]
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.argv.includes("--capturas");
const DIR = "docs/temas-modulares/evidencias/e3/editor"; mkdirSync(DIR, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${DIR}/${name}.png` }); };
async function axe(p, label) {
  // Avisos rápidos (toasts) somem sozinhos; a varredura espera para não medir a animação de entrada.
  await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 12000 }).catch(() => {});
  await p.evaluate(axeSource);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id + ": " + (v.nodes[0]?.html ?? "").slice(0, 120)));
  if (r.length) fail(`axe (${label}): ${r.join(" | ")}`); else ok(`axe sem violações graves (${label})`);
}
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
async function login(ctx, nameRe) {
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail("pageerror: " + e.message));
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: nameRe }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); return p;
}
const openEditor = async (p) => { await p.goto(B + "/theme-editor", { waitUntil: "networkidle" }); await p.frameLocator("iframe").locator("h1").first().waitFor({ timeout: 30000 }); };
const saved = (p) => p.getByRole("status").filter({ hasText: /Rascunho salvo/ }).waitFor({ timeout: 15000 });

// ---------- Loja própria (Mantos Shop) ----------
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await login(ctx, /Ana Paula Ribeiro/);
await openEditor(p);
const card = p.getByText(/^Tema .+ · N\d/).first();
if (!(await card.count())) fail("sem o cartão do nível do tema"); else ok(`cartão do nível: ${await card.innerText()}`);
await shot(p, "editor-nivel-1440");

// Acrescenta "Destaque com banners" na página e abre a Central de Banners no slide
const addButtons = p.getByRole("button", { name: /Adicionar seção/ });
await addButtons.nth(Math.min(1, (await addButtons.count()) - 1)).click();
const dialog = p.getByRole("dialog", { name: "Adicionar seção" });
await dialog.waitFor(); await shot(p, "editor-adicionar-secao");
const heroOption = dialog.getByRole("button", { name: /Destaque com banners/ }).first();
if (!(await heroOption.count()) || (await heroOption.isDisabled())) { fail("“Destaque com banners” indisponível na loja própria"); }
else {
  await heroOption.click(); await saved(p);
  await p.getByRole("button", { name: "Coleção nova", exact: true }).first().click();
  const panel = p.locator('[aria-label="Imagem do banner"]');
  await panel.waitFor(); ok("painel de imagem do banner aberto");
  // Envia uma imagem real pela biblioteca e escolhe
  const png = await sharp({ create: { width: 2000, height: 900, channels: 3, background: "#7a4b2a" } }).composite([{ input: await sharp({ create: { width: 400, height: 400, channels: 3, background: "#f2e6d8" } }).png().toBuffer(), left: 1400, top: 250 }]).png().toBuffer();
  const file = "/tmp/e2e-banner.png"; writeFileSync(file, png);
  await panel.getByRole("button", { name: /Escolher imagem/ }).click();
  const lib = p.getByRole("dialog", { name: "Biblioteca de imagens" }); await lib.waitFor();
  await lib.locator('input[type="file"]').setInputFiles(file);
  await p.getByText("Imagem enviada para a biblioteca").waitFor({ timeout: 20000 });
  await lib.getByRole("button", { name: /^Usar / }).first().waitFor();
  await shot(p, "biblioteca-imagens"); await axe(p, "biblioteca de imagens");
  await lib.getByRole("button", { name: /^Usar / }).first().click(); await saved(p);
  ok("imagem enviada e escolhida pela biblioteca");
  // Ponto de foco no computador (teclado) e no celular (clique)
  const focusBtn = panel.getByRole("button", { name: /Ponto de foco no computador/ });
  await focusBtn.focus(); for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowRight");
  await saved(p);
  if (!/70% na horizontal/.test((await focusBtn.getAttribute("aria-label")) ?? "")) fail("as setas não moveram o foco do computador para 70%"); else ok("foco do computador ajustado pelo teclado (70%)");
  await panel.getByRole("radio", { name: /Celular/ }).click();
  const fm = panel.getByRole("button", { name: /Ponto de foco no celular/ }); const box = await fm.boundingBox();
  await p.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.5); await saved(p);
  if (!/20% na horizontal/.test((await fm.getAttribute("aria-label")) ?? "")) fail("o clique não marcou o foco do celular"); else ok("foco do celular marcado pelo clique (20%)");
  await panel.getByLabel("Descrição da imagem").fill("Banner marrom com peça clara à direita"); await saved(p);
  // A prévia usa a versão leve, com foco por aparelho e a descrição
  const img = p.frameLocator("iframe").locator("[data-banner-slide] img").first();
  await img.waitFor({ timeout: 15000 });
  let alt, src, style;
  for (let i = 0; i < 30; i++) { [alt, src, style] = [await img.getAttribute("alt"), await img.getAttribute("src"), await img.evaluate((el) => el.parentElement.getAttribute("style"))]; if (alt === "Banner marrom com peça clara à direita" && /--mx:\s*20%/.test(style ?? "")) break; await p.waitForTimeout(500); }
  if (alt !== "Banner marrom com peça clara à direita" || !/\/assets\/ast_.+\?w=/.test(src ?? "") || !/--fx:\s*70%/.test(style ?? "") || !/--mx:\s*20%/.test(style ?? "")) fail(`prévia do banner sem os ajustes: alt=${alt} src=${src} style=${style}`);
  else ok("prévia mostra a imagem da biblioteca com foco por aparelho e descrição");
  await shot(p, "banner-foco-1440"); await axe(p, "editor com banner selecionado");
}

// ---------- Conflito entre duas abas ----------
const tabB = await ctx.newPage(); await openEditor(tabB);
const firstText = async (pg) => { await pg.getByRole("button", { name: "Destaque com banners", exact: true }).first().click(); const blk = pg.getByRole("button", { name: /^(Coleção nova|Banner marrom com peça clara à direita)$/ }).first(); if (await blk.count()) await blk.click(); return pg.getByLabel(/^Título/).first(); };
const a = await firstText(p); await a.fill("Texto da aba A"); await saved(p);
const bTitle = await firstText(tabB); await bTitle.fill("Texto da aba B");
await tabB.getByText("Outra aba mudou este rascunho").waitFor({ timeout: 15000 }).then(() => ok("a segunda aba avisa o conflito e não grava por cima"), () => fail("a segunda aba não avisou o conflito"));
await shot(tabB, "conflito-duas-abas");

// ---------- Celular ----------
await p.setViewportSize({ width: 390, height: 844 }); await p.reload({ waitUntil: "networkidle" });
await shot(p, "editor-390"); await axe(p, "editor celular");

// ---------- Loja SuperDrop (subdomínio) ----------
const lctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const lite = await login(lctx, /Marcelo R\. Santos/); await openEditor(lite);
const lcard = lite.getByText(/^Tema .+ · N\d/).first();
if (!(await lcard.count())) fail("Loja SuperDrop sem o cartão do nível"); else ok(`Loja SuperDrop: ${await lcard.innerText()}`);
await shot(lite, "editor-superdrop-1440");

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("EDITOR POR NÍVEL OK");
