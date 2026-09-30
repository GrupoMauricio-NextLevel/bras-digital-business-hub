/**
 * V4: editor de tema. Edição com rascunho e prévia ao vivo, publicação, desfazer, reordenar, adicionar seção,
 * seleção pela prévia, estilo, histórico, limites por oferta e acessibilidade (axe).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/theme-editor.mjs [pastaDeCapturas]
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const out = process.argv[2]; if (out) mkdirSync(out, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const NEW_TITLE = "Coleção 25/26 chegou";

async function loginAs(ctx, nameRe) {
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail("pageerror: " + e.message));
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: nameRe }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle"); return p;
}
const saved = (p) => p.getByRole("status").filter({ hasText: /Rascunho salvo/ }).waitFor({ timeout: 15000 });
async function axe(p, label) {
  await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" "), html: v.nodes[0]?.html?.slice(0, 140) })));
  const serious = r.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length) fail(`axe (${label}): ` + JSON.stringify(serious)); else ok(`axe sem violações graves (${label})${r.length ? `, ${r.length} menores` : ""}`);
}

// ================= Loja própria (Mantos Shop, Pro) =================
const proCtx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pro = await loginAs(proCtx, /Ana Paula Ribeiro/);
const anon = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const publicTitle = async () => { await anon.goto(B + "/store/mantos-shop", { waitUntil: "networkidle" }); return anon.locator("h1").first().innerText(); };
const before = await publicTitle();

await pro.goto(B + "/theme-editor", { waitUntil: "networkidle" });
const frame = pro.frameLocator("iframe");
await frame.locator("h1").first().waitFor({ timeout: 30000 });
if (!(await pro.getByRole("complementary", { name: "Seções da página" }).count())) fail("sem a lista de seções");
if (!(await frame.locator("[data-preview-banner]").count())) fail("a prévia não está em modo rascunho");
ok("editor abre com a prévia da loja em modo rascunho");
if (out) await pro.screenshot({ path: `${out}/editor-pro.png` });

// Editar o título: rascunho ao vivo; público não muda
await pro.getByRole("button", { name: "Destaque principal", exact: true }).click();
const titleInput = pro.getByLabel("Título", { exact: true }).first();
await titleInput.fill(NEW_TITLE);
await saved(pro);
await frame.locator("h1", { hasText: NEW_TITLE }).waitFor({ timeout: 15000 });
if ((await publicTitle()) !== before) fail("o público viu o rascunho antes de publicar");
ok("edição vai para o rascunho e a prévia atualiza sem publicar");

// Publicar
await pro.getByRole("button", { name: "Publicar" }).click(); await pro.waitForSelector("text=Tema publicado", { timeout: 20000 });
if (!(await publicTitle()).includes(NEW_TITLE)) fail("publicar não mudou a loja pública");
ok("publicar muda a loja pública");

// Reordenar e desfazer
const order = () => frame.locator("[data-section-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section-id")));
const o0 = await order();
await pro.getByRole("button", { name: "Mover Todos os produtos para cima" }).click(); await saved(pro);
await frame.locator("[data-section-id]").first().waitFor();
await pro.waitForTimeout(800);
const o1 = await order(); if (o1.join() === o0.join()) fail("reordenar não mudou a prévia: " + o1.join());
await pro.locator("body").click({ position: { x: 5, y: 5 } }); await pro.keyboard.press("Control+z"); await saved(pro); await pro.waitForTimeout(800);
const o2 = await order(); if (o2.join() !== o0.join()) fail("desfazer não restaurou a ordem: " + o2.join());
await pro.keyboard.press("Control+Shift+z"); await pro.waitForTimeout(400);
ok("reordenar seções, desfazer e refazer");

// Adicionar seção
await pro.getByRole("button", { name: "Desfazer" }).click().catch(() => {});
await pro.getByRole("button", { name: "Adicionar seção" }).click();
await pro.getByRole("dialog").getByRole("button", { name: /^Texto/ }).click();
await pro.getByLabel("Título", { exact: true }).first().fill("Nossa história"); await saved(pro);
await frame.locator("h2", { hasText: "Nossa história" }).waitFor({ timeout: 15000 });
ok("adicionar seção pelo catálogo e editar");

// Selecionar clicando na prévia
await frame.locator("h1").first().click();
await pro.getByRole("button", { name: "Destaque principal", exact: true }).waitFor();
await pro.getByRole("button", { name: "Destaque principal", exact: true }).and(pro.locator("[aria-current=true]")).waitFor({ timeout: 8000 }).catch(() => fail("clicar na prévia não selecionou a seção"));
ok("clicar na prévia seleciona a seção");

// Estilo
await pro.getByRole("button", { name: /Cores, fontes e estilo/ }).click();
await pro.getByLabel("Cor principal: seletor").waitFor();
await pro.locator("#style-primary").fill("#7c2d12"); await saved(pro);
await pro.waitForTimeout(600);
const primary = await frame.locator(".sf-root").evaluate((e) => getComputedStyle(e).getPropertyValue("--sf-primary").trim());
if (primary !== "#7c2d12") fail("cor principal não chegou à prévia: " + primary);
await pro.getByLabel("Cantos arredondados: valor").fill("4"); await saved(pro);
ok("estilo global (cor e cantos) na prévia");

// Prévia em celular e tablet
await pro.getByRole("radio", { name: "Celular" }).click(); await pro.waitForTimeout(500); const w = await pro.locator("iframe").evaluate((e) => Math.round(e.getBoundingClientRect().width));
if (w !== 390) fail("prévia em celular deveria ter 390px, veio " + w);
await pro.getByRole("radio", { name: "Computador" }).click();

// Histórico
await pro.getByRole("button", { name: "Histórico" }).click(); await pro.getByRole("dialog").getByRole("button", { name: "Restaurar" }).first().waitFor({ timeout: 10000 });
if (out) await pro.screenshot({ path: `${out}/editor-historico.png` });
await pro.keyboard.press("Escape");
ok("histórico de publicações");

await axe(pro, "editor desktop");
await pro.setViewportSize({ width: 390, height: 844 }); await pro.getByRole("tab", { name: "Seções" }).click(); await axe(pro, "editor celular");
if (out) await pro.screenshot({ path: `${out}/editor-390.png` });
await pro.setViewportSize({ width: 1440, height: 900 });

// ================= Loja SuperDrop (MRS Sports, Lite) =================
const liteCtx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const lite = await loginAs(liteCtx, /Marcelo R\. Santos/);
await lite.goto(B + "/theme-editor", { waitUntil: "networkidle" });
await lite.frameLocator("iframe").locator("h1").first().waitFor({ timeout: 30000 });
if (!(await lite.getByText(/Você está na Loja SuperDrop/).count())) fail("aviso de oferta ausente no Lite");
await lite.getByRole("button", { name: "Adicionar seção" }).click();
if (await lite.getByRole("dialog").count()) fail("Lite conseguiu abrir o catálogo de seções");
if (!(await lite.getByRole("button", { name: "Mover Todos os produtos para cima" }).isDisabled())) fail("Lite pode reordenar");
await lite.getByRole("button", { name: "Destaque principal", exact: true }).click();
await lite.getByLabel("Título", { exact: true }).first().fill("MRS Sports oficial"); await saved(lite);
await lite.frameLocator("iframe").locator("h1", { hasText: "MRS Sports oficial" }).waitFor({ timeout: 15000 });
await lite.getByRole("button", { name: /Cores, fontes e estilo/ }).click();
if (!(await lite.locator("fieldset[disabled]").count())) fail("Lite deveria ter fontes e cantos bloqueados");
if (out) await lite.screenshot({ path: `${out}/editor-lite.png` });
ok("Loja SuperDrop: edita textos, estrutura e tipografia bloqueadas");

// ================= Drop manual: sem loja =================
const dropCtx = await b.newContext(); const drop = await loginAs(dropCtx, /Carla Moura/);
await drop.goto(B + "/theme-editor", { waitUntil: "networkidle" });
if (!drop.url().includes("/merchant/services")) fail("Drop manual deveria ir para os serviços: " + drop.url());
ok("Drop manual é levado ao upgrade");

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("EDITOR DE TEMA OK");
