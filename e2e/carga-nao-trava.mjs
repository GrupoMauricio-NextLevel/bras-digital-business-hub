/**
 * D330: o carregamento da troca de página (logo girando no centro) nunca pode ficar preso.
 * Cenários do problema relatado pelo dono: filtros da página pública de temas (?nivel=, ?familia=), abas do Master
 * (?tab=), botão voltar e um link cancelado por script. Em cada um, o logo precisa sumir.
 * Uso: bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/carga-nao-trava.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SAIDA = process.env.E2E_PRINTS ?? "/tmp";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
let falhas = 0;
const estado = (p) => p.locator(".nl-carga").first().getAttribute("data-estado");
async function sumiu(p, rotulo, limite = 7000) {
  const t0 = Date.now();
  while (Date.now() - t0 < limite) { if ((await estado(p)) === "parada") { console.log(`ok   ${rotulo} (${Date.now() - t0} ms)`); return; } await p.waitForTimeout(100); }
  falhas++; console.log(`FALHA ${rotulo}: carregamento preso (${await estado(p)})`);
}

// 1. Página pública: filtros de temas (o print do dono).
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, extraHTTPHeaders: { "x-forwarded-host": "nextlevelcommerce.com.br" } });
  const p = await ctx.newPage();
  await p.goto(B + "/temas", { timeout: 120000 }); await p.waitForLoadState("networkidle");
  for (const texto of ["N3 · ", "N1 · ", "Todos"]) {
    const link = p.locator('a[href^="/temas"]', { hasText: texto }).first();
    if (!(await link.count())) { falhas++; console.log("FALHA sem filtro", texto); continue; }
    await link.click(); console.log(`     clique em "${texto}": ${await estado(p)}`);
    await sumiu(p, `filtro de temas "${texto}"`);
  }
  const fam = p.locator('a[href*="familia="]').nth(1);
  if (await fam.count()) { await fam.click(); await sumiu(p, "filtro de família"); }
  await p.screenshot({ path: `${SAIDA}/carga-temas.png` });
  // Voltar do navegador.
  await p.goBack(); await sumiu(p, "botão voltar");
  // Link cancelado por script depois do clique (a página não muda).
  await p.evaluate(() => { const a = document.createElement("a"); a.href = "/planos-teste-cancelado"; a.id = "cancelado"; a.textContent = "cancelado"; a.onclick = (e) => e.preventDefault(); document.body.append(a); });
  await p.click("#cancelado"); await sumiu(p, "link cancelado (limite de tempo)");
  // Clique cancelado, e a pessoa clica em outro lugar: some na hora.
  await p.click("#cancelado"); await p.waitForTimeout(900); await p.mouse.click(5, 5); await sumiu(p, "pessoa clicou de novo", 1500);
  await ctx.close();
}

// 2. Painel interno: abas do Programa de Parceiros no Master.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, extraHTTPHeaders: { "x-forwarded-host": "master.nextlevelgroup.com.br" } });
  const p = await ctx.newPage();
  await p.goto(B + "/login");
  await p.fill("input[type=email]", "master@nextlevel.demo"); await p.fill("input[type=password]", "demo1234"); await p.keyboard.press("Enter");
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
  await p.goto(B + "/master/partners", { timeout: 120000 }); await p.waitForLoadState("networkidle");
  const abas = await p.locator('a[href*="/master/partners?tab="]').all();
  for (const aba of abas.slice(0, 3)) { const h = await aba.getAttribute("href"); await aba.click(); await sumiu(p, `aba ${h}`); }
  const menu = p.locator('a[href="/master/partners"]').first();
  await p.locator('a[href^="/master/"]:not([href*="partners"])').first().click(); await sumiu(p, "menu lateral do Master");
  if (await menu.count()) { await p.goBack(); await sumiu(p, "voltar no Master"); }
  await ctx.close();
}
await b.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nnenhum carregamento preso");
process.exit(falhas ? 1 : 0);
