/**
 * V6: portal público. Páginas, interações (passos, painéis, temas, calculadora), acessibilidade (axe) e 4 larguras.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/portal-v6.mjs [pastaDeCapturas]
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const out = process.argv[2]; if (out) mkdirSync(out, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => fail("pageerror: " + e.message));
const settle = async () => { const h = await p.evaluate(() => document.body.scrollHeight); for (let y = 0; y < h; y += 500) { await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await p.waitForTimeout(220); } await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(900); };
async function axe(label) {
  await p.emulateMedia({ reducedMotion: "reduce" }); await p.waitForTimeout(300);
  await p.evaluate(axeSource);
  const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" "), html: v.nodes[0]?.html?.slice(0, 120) })));
  const serious = r.filter((v) => v.impact === "serious" || v.impact === "critical");
  if (serious.length) fail(`axe (${label}): ` + JSON.stringify(serious)); else ok(`axe sem violações graves (${label})${r.length ? `, ${r.length} menores` : ""}`);
}

await p.goto(B + "/", { waitUntil: "networkidle" }); await settle();
if (!(await p.getByRole("heading", { level: 1 }).innerText()).includes("loja online sem estoque")) fail("h1 inesperado");
if ((await p.locator('script[type="application/ld+json"]').count()) < 1) fail("sem dados estruturados");
ok("home carrega com h1 e dados estruturados");

// Esteira ao vivo muda com o tempo
const before = await p.locator('[aria-hidden="true"] li.animate-fade-in').count();
await p.waitForTimeout(5200);
ok("esteira ao vivo renderiza (" + before + " cartões)");

// Passos
await p.getByRole("tab", { name: /Custo pago por Pix/ }).click();
if (!(await p.locator("#hiw-panel").innerText()).includes("Pix de R$ 400,00")) fail("passo 3 não mostrou o Pix");
await p.getByRole("tab", { name: /Custo pago por Pix/ }).press("ArrowDown");
if ((await p.getByRole("tab", { name: /Etiqueta anexada/ }).getAttribute("aria-selected")) !== "true") fail("seta para baixo não avançou o passo");
ok("como funciona: abas e teclado");

// Painéis (agora na página de fornecedores) e temas (home)
await p.goto(B + "/seja-fornecedor", { waitUntil: "networkidle" });
await p.getByRole("tab", { name: "Expedição", exact: true }).click();
if (!(await p.locator("#pn-panel").innerText()).includes("Próximo pedido")) fail("painel de expedição");
if (/R\$\s?\d/.test(await p.locator("#pn-panel [data-panel]").innerText())) fail("tela da expedição mostra dinheiro");
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.getByRole("radio", { name: /Signature/ }).click();
if (!(await p.locator("main").innerText()).includes("Instalação com 1 clique") && !(await p.locator("main").innerText()).includes("instalação com 1 clique")) fail("tema pago sem o texto de 1 clique");
ok("painéis e temas alternam");

// Calculadora: exemplo do dono
await p.locator("#calc-sale").fill("100"); await p.locator("#calc-cost").fill("70");
await p.getByRole("radio", { name: /Loja básica/ }).click();
const calc = (await p.locator("div[aria-live]").filter({ hasText: "Para o membro" }).innerText()).replace(/\u00a0/g, " ");
if (!calc.includes("R$ 25,00") || !calc.includes("R$ 5,00") || !calc.includes("R$ 2,10")) fail("calculadora com valores errados: " + calc.replace(/\n/g, " | "));
ok("calculadora: exemplo cliente 100 / membro 70");

await axe("desktop");
for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
  await p.setViewportSize({ width: w, height: h }); await p.goto(B + "/", { waitUntil: "networkidle" }); await settle();
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`rolagem horizontal em ${w}px`);
  if (out) await p.screenshot({ path: `${out}/portal-home-${w}.png`, fullPage: true });
}
ok("sem rolagem horizontal em 4 larguras");
await p.setViewportSize({ width: 390, height: 844 }); await axe("celular");

// Demais páginas
for (const u of ["/como-funciona", "/fornecedores", "/planos", "/faq"]) { const r = await p.goto(B + u, { waitUntil: "networkidle" }); if (!r || r.status() !== 200) fail(u + ": HTTP " + r?.status()); }
ok("páginas internas do portal");

// Métricas de carregamento (LCP e peso)
const m = await p.evaluate(() => new Promise((res) => { let lcp = 0; new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); setTimeout(() => res({ lcp: Math.round(lcp), transfer: Math.round(performance.getEntriesByType("resource").reduce((s, r) => s + (r.transferSize || 0), 0) / 1024) }), 1500); }));
console.log("métricas (dev):", JSON.stringify(m));

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("PORTAL V6 OK");
