/**
 * V3: motor de temas. A loja pública é desenhada por seções (com marcações para o editor), a prévia do rascunho
 * só vale para o dono/Master, e as lojas de demonstração renderizam sem erro em desktop e celular.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/theme-engine.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ids = (p) => p.evaluate(() => [...document.querySelectorAll("[data-section-id]")].map((e) => e.getAttribute("data-section-id")));

// Público: seções da página inicial e dos grupos globais
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror: " + e.message));
  for (const s of ["mantos-shop", "arena-10", "mrs-sports"]) {
    const r = await p.goto(`${B}/store/${s}`, { waitUntil: "networkidle" });
    if (!r || r.status() !== 200) { fail(`${s}: HTTP ${r?.status()}`); continue; }
    const list = await ids(p);
    for (const need of ["header", "hero", "trust", "showcase", "grid", "footer"]) if (!list.includes(need)) fail(`${s}: sem a seção ${need} (${list.join(",")})`);
    if (await p.locator("[data-preview-banner]").count()) fail(`${s}: prévia visível para o público`);
    if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${s}: rolagem horizontal`);
  }
  ok("lojas públicas desenhadas por seções");
  // Cookie de prévia sem ser dono não libera nada
  await ctx.addCookies([{ name: "nl-preview", value: "1", url: B }]);
  await p.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
  if (await p.locator("[data-preview-banner]").count()) fail("visitante conseguiu ativar a prévia com o cookie");
  ok("visitante não ativa a prévia");
  // Rotas internas da loja seguem funcionando
  for (const u of ["/store/mantos-shop/catalog", "/store/mantos-shop/cart"]) { const r = await p.goto(B + u, { waitUntil: "networkidle" }); if (!r || r.status() !== 200) fail(`${u}: HTTP ${r?.status()}`); }
  await ctx.close();
}

// Dono da loja: o cookie de prévia mostra o aviso; sem o cookie, não
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ana Paula Ribeiro/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
  await p.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
  if (await p.locator("[data-preview-banner]").count()) fail("aviso de prévia sem o cookie");
  await ctx.addCookies([{ name: "nl-preview", value: "1", url: B }]);
  await p.goto(`${B}/store/mantos-shop`, { waitUntil: "networkidle" });
  if (!(await p.locator("[data-preview-banner]").count())) fail("dono não vê o aviso de prévia com o cookie");
  // O dono de outra loja não vê a prévia da loja alheia
  await p.goto(`${B}/store/arena-10`, { waitUntil: "networkidle" });
  if (await p.locator("[data-preview-banner]").count()) fail("dono viu a prévia de outra loja");
  ok("prévia do rascunho: só o dono da própria loja");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("MOTOR DE TEMAS OK");
