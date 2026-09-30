/**
 * S2: faturas do fornecedor. Fatura vencida mostra aviso; com 26 dias o painel pausa e mostra o Pix; pagar libera sozinho.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/supplier-billing.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: /Ricardo Menezes/ }).first().click();
await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
await p.goto(B + "/supplier/invoices", { waitUntil: "networkidle" });
if (!(await p.getByRole("heading", { name: "Faturas" }).count())) fail("sem a página de faturas");
await p.getByRole("button", { name: /vencida há 5 dias/ }).click();
await p.waitForSelector("text=Fatura vencida", { timeout: 20000 }).catch(() => {});
await p.goto(B + "/supplier", { waitUntil: "networkidle" });
if (!(await p.locator("[data-billing-banner]").count())) fail("sem o aviso de fatura vencida"); else ok("aviso de fatura vencida no painel");
await p.goto(B + "/supplier/invoices", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Há 26 dias/ }).click();
await p.waitForSelector("[data-blocked-screen]", { timeout: 30000 }); ok("acesso pausado mostra a tela de pagamento");
await p.waitForSelector("text=Pagamento por Pix", { timeout: 20000 }); ok("QR code Pix aberto sozinho");
for (let i = 0; i < 4 && (await p.locator("[data-blocked-screen]").count()); i++) {
  await p.getByRole("button", { name: /Simular pagamento/ }).waitFor({ timeout: 25000 });
  await p.getByRole("button", { name: /Simular pagamento/ }).click();
  await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
}
if (await p.locator("[data-blocked-screen]").count()) fail("pagamento não liberou o painel"); else ok("pagamento libera o painel sozinho");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("FATURAS DO FORNECEDOR OK");
