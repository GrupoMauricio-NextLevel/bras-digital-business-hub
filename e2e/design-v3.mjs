/**
 * V0: design system v3. Interações (barra de salvar, ordenar fotos, visões salvas, ações em lote)
 * e acessibilidade (axe) em /dev/design, nos climas de painel e no tema escuro.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/design-v3.mjs [pastaDeCapturas]
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const B = process.env.E2E_BASE ?? "http://localhost:3100";
const out = process.argv[2]; if (out) mkdirSync(out, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on("pageerror", (e) => fail("pageerror: " + e.message));

async function axe(label) {
  await p.evaluate(axeSource);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, rules: { "color-contrast": { enabled: true } } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" ") })));
  const serious = r.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length) fail(`axe (${label}): ` + JSON.stringify(serious)); else ok(`axe sem violações graves (${label})${r.length ? `, ${r.length} menores` : ""}`);
}

await p.goto(B + "/dev/design", { waitUntil: "networkidle" });
if (!(await p.getByText("Design system v3").count())) fail("página do design system v3 não abriu");

// Barra de alterações
if (await p.getByRole("region", { name: "Alterações pendentes" }).count()) fail("barra de salvar não deveria aparecer sem alterações");
await p.locator("#t").fill("Camisa nova");
await p.getByRole("region", { name: "Alterações pendentes" }).waitFor({ timeout: 5000 });
await p.keyboard.press("Control+s");
await p.waitForSelector("text=Alterações salvas", { timeout: 10000 });
await p.getByRole("region", { name: "Alterações pendentes" }).waitFor({ state: "detached", timeout: 5000 });
ok("barra de alterações: aparece, salva com Ctrl S e some");
await p.locator("#t").fill("Outra"); await p.getByRole("button", { name: "Descartar" }).click();
if ((await p.locator("#t").inputValue()) !== "Camisa nova") fail("descartar não restaurou o valor salvo");
ok("descartar restaura o valor salvo");

// Galeria: ordenar pelo teclado e definir capa
const firstAlt = async () => p.locator('ul[aria-label^="Fotos"] li img').first().getAttribute("alt");
if ((await firstAlt()) !== "Foto 1") fail("primeira foto inesperada");
await p.getByRole("button", { name: "Tornar a foto 2 a capa" }).click({ force: true });
await p.getByRole("region", { name: "Alterações pendentes" }).waitFor({ timeout: 5000 });
const status = await p.locator('[role="status"].sr-only').first().textContent();
if (!/agora é a capa/.test(status ?? "")) fail("galeria não anunciou a nova capa: " + status);
ok("galeria: definir capa e anúncio para leitor de tela");
await p.getByRole("button", { name: "Descartar" }).click();

// Lista: busca, filtro, ordenação, visão salva, lote
const list = p.getByRole("region", { name: "Lista de produtos" });
await list.getByLabel("Buscar produto").fill("sao paulo");
if ((await list.locator("tbody tr").count()) !== 1) fail("busca sem acento deveria achar 1 linha");
await list.getByLabel("Buscar produto").fill("");
await list.getByLabel("Status").selectOption("DRAFT");
if ((await list.locator("tbody tr").count()) !== 2) fail("filtro de rascunho deveria achar 2 linhas");
await list.getByRole("button", { name: "Salvar visão" }).click();
await list.getByLabel("Nome da visão").fill("Rascunhos");
await list.getByRole("button", { name: "Salvar", exact: true }).click();
await list.getByRole("button", { name: "Rascunhos", exact: true }).waitFor({ timeout: 5000 });
await p.reload({ waitUntil: "networkidle" });
if (!(await p.getByRole("region", { name: "Lista de produtos" }).getByRole("button", { name: "Rascunhos", exact: true }).count())) fail("visão salva não persistiu após recarregar");
ok("lista: busca, filtro, visão salva e persistência");
const list2 = p.getByRole("region", { name: "Lista de produtos" });
await list2.getByRole("button", { name: "Todos", exact: true }).click();
await list2.getByRole("columnheader", { name: /Estoque/ }).getByRole("button").click();
await list2.locator('tbody input[type="checkbox"]').first().click();
await list2.getByRole("region", { name: "Ações em lote" }).waitFor({ timeout: 5000 });
ok("lista: ordenar e seleção em lote");

// Acessibilidade em cada clima e no tema escuro
for (const panel of ["master", "supplier", "lite", "pro"]) {
  await p.getByRole("group", { name: "Clima do painel" }).getByRole("button", { name: new RegExp(panel, "i") }).click();
  await p.waitForTimeout(400);
  await axe("painel " + panel);
  if (out) await p.screenshot({ path: `${out}/design-v3-${panel}.png`, fullPage: true });
}
await p.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")); await axe("tema escuro");
if (out) await p.screenshot({ path: `${out}/design-v3-dark.png`, fullPage: true });
await p.setViewportSize({ width: 390, height: 844 });
if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail("rolagem horizontal em 390 px");
else ok("sem rolagem horizontal em 390 px");
if (out) await p.screenshot({ path: `${out}/design-v3-390.png`, fullPage: true });

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("DESIGN V3 OK");
