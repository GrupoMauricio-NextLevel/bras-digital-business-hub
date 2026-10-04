/**
 * QA visual do painel Commerce (vidro azul, ciano gelo e cobre): confere Claro e Escuro, 4 larguras, rolagem lateral,
 * erros de console, axe (sério/crítico), menu/gaveta por teclado, persistência do tema e movimento reduzido.
 * Fase 1: loja nova (primeiro acesso). Fase 2: loja de demonstração com dados (o banco da demonstração é descartável).
 * Fase 3: console ADM Commerce. Capturas em docs/commerce-visual/v2 (ou QA_OUT).
 * Uso: BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/commerce-glass-qa.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = process.env.QA_OUT ?? "docs/commerce-visual/v2"; mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const HEADERS = { "x-forwarded-host": "lojas.nextlevelgroup.com.br" };
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36);
const mk = async (w = 1440, h = 900) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: HEADERS });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) fail("console: " + m.text().slice(0, 140)); });
  return p;
};
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe", "nextjs-portal"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? "") + " " + (x.nodes[0]?.html ?? "").slice(0, 90))); };
/** Esconde o selo do Next em modo desenvolvimento só para as capturas de entrega. */
const hideDevBadge = (p) => p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const check = async (p, label, { shot, full = false } = {}) => {
  await hideDevBadge(p);
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${label}: rolagem lateral`);
  const v = await axeOf(p); if (v.length) fail(`${label}: axe ${v.join(" | ")}`);
  if (shot) await p.screenshot({ path: `${OUT}/${shot}.png`, fullPage: full });
};
const setTheme = (p, t) => p.evaluate((x) => localStorage.setItem("nl-theme", x), t);

// ---------- Fase 1: loja nova ----------
{
  const p = await mk();
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
  await p.emulateMedia({ reducedMotion: "reduce" });
  const PAGES = [["inicio", "/merchant"], ["pedidos", "/merchant/orders"], ["produtos", "/merchant/catalogo"], ["clientes", "/merchant/customers"], ["aparencia", "/merchant/templates"], ["financeiro", "/merchant/finance"], ["configuracoes", "/merchant/settings"], ["produto-novo", "/merchant/catalogo/new"]];
  for (const theme of ["light", "dark"]) {
    await setTheme(p, theme);
    for (const w of [1440, 1280, 768, 390]) {
      await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const [name, path] of PAGES) {
        if (w !== 1440 && w !== 390 && name !== "inicio" && name !== "pedidos") continue;
        await p.goto(B + path, { waitUntil: "networkidle" });
        if (await p.evaluate(() => document.documentElement.getAttribute("data-theme")) !== theme) fail(`novo ${name} ${theme} @${w}: tema não aplicado`);
        await check(p, `novo ${name} ${theme} @${w}`, { shot: (w === 1440 || w === 390) && ["inicio", "pedidos", "produtos"].includes(name) ? `novo-${name}-${theme}-${w}` : undefined });
      }
    }
  }
  ok("loja nova: telas em Claro/Escuro, 4 larguras");

  // Menu, gaveta e teclado (390)
  await p.setViewportSize({ width: 390, height: 844 }); await setTheme(p, "light"); await p.goto(B + "/merchant", { waitUntil: "networkidle" }); await hideDevBadge(p);
  await p.getByRole("button", { name: "Mais" }).click(); await p.waitForTimeout(300);
  if (!(await p.getByRole("dialog").count())) fail("gaveta não abriu");
  await p.screenshot({ path: `${OUT}/gaveta-light-390.png` });
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  if (await p.getByRole("dialog").count()) fail("Esc não fechou a gaveta");
  const focusBack = await p.evaluate(() => document.activeElement?.textContent?.includes("Mais"));
  if (!focusBack) fail("foco não voltou ao botão Mais");
  ok("gaveta abre, fecha com Esc e devolve o foco");
  // Grupos expansíveis por teclado (1280)
  await p.setViewportSize({ width: 1280, height: 900 }); await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  const grp = p.getByRole("button", { name: /^Catálogo$/ }).first(); await grp.focus(); await p.keyboard.press("Enter");
  if ((await grp.getAttribute("aria-expanded")) !== "true") fail("grupo não expandiu por teclado");
  ok("grupo do menu expande por teclado (aria-expanded)");
  // Persistência do tema
  await p.getByRole("radio", { name: "Escuro" }).click(); await p.reload({ waitUntil: "networkidle" });
  if (await p.evaluate(() => document.documentElement.getAttribute("data-theme")) !== "dark") fail("tema escuro não persistiu");
  ok("tema persiste após recarregar");
  // Movimento reduzido: lâmina sem animação; normal: com animação
  const anim = async () => p.evaluate(() => getComputedStyle(document.querySelector(".cm-blade-a"), "::after").animationName);
  await p.emulateMedia({ reducedMotion: "reduce" }); await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  if ((await anim()) !== "none") fail("movimento reduzido: reflexo ainda animado");
  await p.emulateMedia({ reducedMotion: "no-preference" }); await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  if ((await anim()) === "none") fail("movimento normal: reflexo sem animação");
  ok("movimento: normal anima o reflexo, reduzido não");
  await p.context().close();
}

// ---------- Fase 2: loja de demonstração com dados ----------
{
  const p = await mk();
  await p.goto(`${B}/login`, { waitUntil: "networkidle" });
  await p.fill("#email", "lojista@commerce.demo"); await p.fill("#password", "demo1234"); await p.getByRole("button", { name: /Entrar/ }).click();
  await p.waitForURL(/\/merchant/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  const sim = p.getByRole("button", { name: /Simular venda/ });
  for (let i = 0; i < 12 && (await sim.count()); i++) { await sim.click(); await p.waitForTimeout(500); }
  await p.waitForLoadState("networkidle");
  await p.emulateMedia({ reducedMotion: "reduce" });
  const PAGES = [["inicio", "/merchant"], ["pedidos", "/merchant/orders"], ["pedidos-pendentes", "/merchant/orders?status=PENDING"], ["pedidos-sem-resultado", "/merchant/orders?status=CANCELED"], ["produtos", "/merchant/catalogo"], ["clientes", "/merchant/customers"], ["aparencia", "/merchant/templates"], ["financeiro", "/merchant/finance"], ["configuracoes", "/merchant/settings"], ["produto-novo", "/merchant/catalogo/new"]];
  for (const theme of ["light", "dark"]) {
    await setTheme(p, theme);
    for (const w of [1440, 390]) {
      await p.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const [name, path] of PAGES) {
        await p.goto(B + path, { waitUntil: "networkidle" });
        if (new URL(p.url()).pathname.startsWith("/login")) { fail(`demo ${name}: caiu no login`); continue; }
        await check(p, `demo ${name} ${theme} @${w}`, { shot: `demo-${name}-${theme}-${w}` });
      }
      // detalhe do primeiro pedido
      await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
      const first = p.locator("table tbody tr a, a[href^='/merchant/orders/']").first();
      if (await first.count()) { await first.click(); await p.waitForLoadState("networkidle"); await check(p, `demo detalhe-pedido ${theme} @${w}`, { shot: `demo-pedido-detalhe-${theme}-${w}` }); }
    }
  }
  ok("loja com dados: telas preenchidas, vazias por filtro e detalhe");
  await p.context().close();
}

// ---------- Fase 3: ADM Commerce ----------
{
  const q = await mk();
  await q.goto(`${B}/login`, { waitUntil: "networkidle" }); await q.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await q.waitForURL(/\/commerce/, { timeout: 90000 }); await q.waitForLoadState("networkidle");
  await q.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["light", "dark"]) {
    await setTheme(q, theme);
    for (const w of [1440, 390]) {
      await q.setViewportSize({ width: w, height: w < 500 ? 844 : 900 });
      for (const [name, path] of [["adm-visao", "/commerce"], ["adm-lojas", "/commerce/stores"], ["adm-vendas", "/commerce/orders"], ["adm-assinaturas", "/commerce/plans"]]) {
        await q.goto(B + path, { waitUntil: "networkidle" });
        if (new URL(q.url()).pathname.startsWith("/login")) { fail(`${name}: caiu no login`); continue; }
        await check(q, `${name} ${theme} @${w}`, { shot: name === "adm-visao" || name === "adm-lojas" ? `${name}-${theme}-${w}` : undefined });
      }
    }
  }
  ok("ADM Commerce em Claro/Escuro");
  await q.context().close();
}
await b.close();
console.log(bad.length ? "PROBLEMAS:\n" + bad.join("\n") : "QA VISUAL COMMERCE OK");
process.exit(bad.length ? 1 : 0);
