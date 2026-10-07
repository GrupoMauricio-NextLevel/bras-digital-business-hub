/**
 * Onlog como plataforma de envio: aparece para o fornecedor e para o lojista de conta simples, com o campo
 * "Credencial de integração Onlog (API)", e conecta (em demonstração, sem credencial, conexão simulada).
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/onlog.mjs [pastaDeCapturas]
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const out = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const ok = (m) => console.log("✔", m);
async function check(p, path, label) {
  await p.goto(B + path, { waitUntil: "networkidle" });
  const sel = p.locator("#shipprov");
  if (!(await sel.count())) { bad.push(`${label}: sem o seletor de plataforma`); return; }
  const opts = await sel.locator("option").allTextContents();
  if (!opts.includes("Onlog")) bad.push(`${label}: Onlog fora das opções (${opts.join(", ")})`); else ok(`${label}: opções ${opts.join(", ")}`);
  await sel.selectOption("ONLOG");
  if (!(await p.getByText("Credencial de integração Onlog (API)").count())) bad.push(`${label}: rótulo da credencial ausente`); else ok(`${label}: campo "Credencial de integração Onlog (API)"`);
  if (out) await sel.scrollIntoViewIfNeeded().then(() => p.screenshot({ path: `${out}/onlog-${label}.png` }));
  // O botão do próprio cartão de envio (a página tem outro "Validar e conectar", do Mercado Pago).
  await p.locator("#shipprov").locator("xpath=following::button[contains(., 'onectar')][1]").click();
  await p.getByText(/Onlog · conta de demonstração/).first().waitFor({ timeout: 20000 }).then(() => ok(`${label}: conectou (demonstração)`), () => bad.push(`${label}: não mostrou a conexão Onlog`));
  if (out) await p.screenshot({ path: `${out}/onlog-${label}-conectado.png` });
}
{ const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ricardo Menezes/ }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  await check(p, "/supplier/settings", "fornecedor"); await ctx.close(); }
{ const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.fill("#email", "lojista@commerce.demo"); await p.fill("#password", "demo1234"); await p.click('button[type="submit"]'); await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  await check(p, "/merchant/settings", "lojista"); await ctx.close(); }
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("ONLOG OK");
