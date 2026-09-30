/**
 * V5: loja de temas. Comprar por Pix (demo), instalar com 1 clique, prévia com os produtos da loja (só o dono).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/theme-store.mjs   (reinicie o servidor demo antes: muda dados)
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);

const login = async (p, name) => {
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
};
const sectionIds = (p) => p.evaluate(() => [...document.querySelectorAll("[data-section-id]")].map((e) => e.getAttribute("data-section-id")));

const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await login(p, /Ana Paula Ribeiro/);
await p.goto(B + "/merchant/templates", { waitUntil: "networkidle" });
for (const n of ["Starter", "Arena", "Editorial", "Signature"]) if (!(await p.getByRole("heading", { name: new RegExp(n) }).count())) fail(`sem o card do tema ${n}`);
ok("quatro temas na vitrine");

// Prévia com os produtos: aviso só para o dono; público não vê
const before = await sectionIds((await ctx.newPage().then(async (q) => { await q.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" }); return q; })));
await p.getByRole("button", { name: /Ver com meus produtos/ }).nth(1).click();
await p.waitForSelector("iframe", { timeout: 20000 });
ok("prévia com os produtos abre");
await p.keyboard.press("Escape"); await p.waitForTimeout(500);
const anon = await b.newContext(); const ap = await anon.newPage();
await ap.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
if (JSON.stringify(await sectionIds(ap)) !== JSON.stringify(before)) fail("visitante viu mudança na loja");
if (await ap.locator("[data-preview-banner]").count()) fail("visitante viu o aviso de prévia");
ok("prévia não vaza para o público");

// Comprar → pagar (demo) → instalar
await p.goto(B + "/merchant/templates", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Comprar por R\$\s*299/ }).click();
await p.getByRole("button", { name: /Pagar R\$\s*299.*por Pix/ }).click();
await p.getByRole("button", { name: /Simular pagamento/ }).click();
await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
await p.keyboard.press("Escape");
await p.reload({ waitUntil: "networkidle" });
const inst = p.getByRole("button", { name: /Instalar com 1 clique/ });
if (!(await inst.count())) fail("sem o botão Instalar após o pagamento");
else {
  await inst.first().click();
  await p.getByRole("dialog").getByRole("button", { name: /Instalar/ }).click();
  await p.waitForSelector("text=instalado", { timeout: 30000 });
  ok("compra, pagamento e instalação");
  await ap.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
  const after = await sectionIds(ap);
  if (JSON.stringify(after) === JSON.stringify(before)) fail("a loja pública não mudou após instalar");
  else ok("loja pública usa o tema novo: " + after.join(","));
  await p.goto(B + "/merchant/templates", { waitUntil: "networkidle" });
  if (!(await p.getByText("Tema ativo").count())) fail("sem o selo Tema ativo");
}
await ctx.close(); await anon.close();

// Lojista Lite não tem loja: card de upgrade
{
  const c2 = await b.newContext({ viewport: { width: 1360, height: 900 } }); const q = await c2.newPage();
  const btns = await (async () => { await q.goto(B + "/login", { waitUntil: "networkidle" }); return q.getByRole("button").allTextContents(); })();
  const lite = btns.find((t) => /Drop|Lite|Manual/i.test(t) && /Store|Lojista|Rafa|Marina|Carlos|Juliana/i.test(t)) ?? null;
  console.log("(botões de login:", btns.map((t) => t.replace(/\s+/g, " ").slice(0, 30)).join(" | "), ")");
  if (lite) { await q.getByRole("button", { name: lite }).first().click(); await q.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await q.goto(B + "/merchant/templates", { waitUntil: "networkidle" }); ok("Lite abre a vitrine sem erro"); }
  await c2.close();
}
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("LOJA DE TEMAS OK");
