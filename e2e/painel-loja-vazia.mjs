/**
 * Painel do lojista com a loja ZERADA (conta simples recém-paga): visita todas as telas e confere que nenhuma quebra,
 * mostra erro de página ou fica sem nenhum texto (estado vazio ausente), em 1280 e 390 px, sem rolagem lateral.
 * Uso: BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/painel-loja-vazia.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m);
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "lojas.nextlevelgroup.com.br" } });
const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));

await p.goto(`${B}/cadastro`, { waitUntil: "networkidle" });
await p.locator("#store").fill("Loja Vazia " + RUN); await p.locator("#owner").fill("Dona Vazia");
await p.locator("#email").fill(`vazia-${RUN}@teste.com`); await p.locator("#pass").fill("senha-segura-1"); await p.locator("#tax").fill(makeCpf());
await p.getByRole("button", { name: /Criar loja/ }).click();
await p.waitForURL(/\/merchant/, { timeout: 90000 }); await p.waitForLoadState("networkidle");
await p.waitForSelector("[data-blocked-screen], [data-trial-banner]", { timeout: 30000 });
for (let step = 1; step <= 2; step++) {
  if (!(await p.locator("[data-blocked-screen]").count())) break;
  await p.getByRole("button", { name: /Simular pagamento/ }).waitFor({ timeout: 25000 });
  await p.getByRole("button", { name: /Simular pagamento/ }).click();
  await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
}

const PAGES = ["/merchant", "/merchant/orders", "/merchant/orders/new", "/merchant/orders/propostas", "/merchant/products", "/merchant/catalogo", "/merchant/catalogo/new", "/merchant/customers", "/merchant/analytics", "/merchant/after-sales", "/merchant/labels", "/merchant/finance", "/merchant/settings", "/merchant/templates", "/merchant/storefront", "/merchant/campanhas", "/merchant/descontos", "/merchant/avaliacoes", "/merchant/avise-me", "/merchant/atacado", "/merchant/content", "/merchant/team", "/merchant/auditoria", "/merchant/services", "/merchant/appearance"];
for (const [w, h] of [[1280, 900], [390, 844]]) {
  await p.setViewportSize({ width: w, height: h });
  for (const u of PAGES) {
    const r = await p.goto(B + u, { waitUntil: "networkidle" }).catch(() => null);
    const label = `${u} @${w}`;
    if (!r) { fail(`${label}: não abriu`); continue; }
    if (r.status() >= 400) { fail(`${label}: HTTP ${r.status()}`); continue; }
    if (new URL(p.url()).pathname.startsWith("/login")) { fail(`${label}: caiu no login`); continue; }
    const text = (await p.locator("main, body").first().innerText()).trim();
    if (/Não foi possível carregar esta página|Ocorreu um erro inesperado|Application error/i.test(text)) fail(`${label}: mostra erro de página`);
    if (text.length < 80) fail(`${label}: tela praticamente vazia (${text.length} caracteres)`);
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${label}: rolagem lateral`);
  }
}
await b.close();
console.log(bad.length ? "PROBLEMAS:\n" + bad.join("\n") : `PAINEL COM LOJA VAZIA OK (${PAGES.length} telas x 2 larguras)`);
process.exit(bad.length ? 1 : 0);
