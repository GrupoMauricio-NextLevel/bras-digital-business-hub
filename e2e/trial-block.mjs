/**
 * P1: cadastro com cupom → teste de 7 dias → fim do teste bloqueia e mostra o Pix → pagar libera sozinho.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/trial-block.mjs   (reinicie o servidor demo antes)
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36); const CPF = makeCpf();
const signup = async (page, email, cpf, code = "MANTOSSHOP7") => {
  await page.goto(`${B}/cadastro?cupom=${code}`, { waitUntil: "networkidle" });
  await page.locator("#store").fill("Loja Teste " + email.split("@")[0]); await page.locator("#owner").fill("Maria Teste");
  await page.locator("#email").fill(email); await page.locator("#pass").fill("senha-segura-1"); await page.locator("#tax").fill(cpf);
  await page.getByRole("button", { name: /Começar meu teste/ }).click();
};
await signup(p, `maria1-${RUN}@teste.com`, CPF);
await p.waitForURL(/\/merchant/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
if (!(await p.locator("[data-trial-banner]").count())) fail("sem o aviso do teste"); else ok("cadastro com cupom leva ao painel em teste: " + (await p.locator("[data-trial-banner]").innerText()).split("\n")[0]);

// Mesmo CPF não testa de novo
const p2 = await (await b.newContext()).newPage();
await signup(p2, `maria2-${RUN}@teste.com`, CPF);
await p2.waitForSelector("text=já usou o teste", { timeout: 20000 }); ok("um teste por CPF/CNPJ");
// Cupom inválido
await signup(p2, `joao-${RUN}@teste.com`, makeCpf(), "CUPOMFALSO");
await p2.waitForSelector("text=Cupom inválido", { timeout: 20000 }); ok("cupom inválido recusado");

// Fim do teste bloqueia
await p.getByRole("button", { name: /Simular fim do teste/ }).click();
await p.waitForSelector("[data-blocked-screen]", { timeout: 30000 });
if ((await p.locator("[data-support-corner]").count()) < 4) fail("suporte não aparece nos 4 cantos"); else ok("tela de bloqueio com suporte nos 4 cantos");
await p.waitForSelector("text=Pagamento por Pix", { timeout: 20000 }); ok("QR code Pix aparece sozinho");
await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
if (!(await p.locator("[data-blocked-screen]").count())) fail("outra página do painel abriu bloqueada"); else ok("todas as páginas do painel ficam bloqueadas");
// Pagar libera (setup primeiro, depois o plano)
for (let step = 1; step <= 2; step++) {
  if (!(await p.locator("[data-blocked-screen]").count())) break;
  await p.getByRole("button", { name: /Simular pagamento/ }).waitFor({ timeout: 25000 }).catch(async (e) => { await p.screenshot({ path: process.env.SHOT ?? "/tmp/blk.png" }); throw e; });
  await p.getByRole("button", { name: /Simular pagamento/ }).click();
  await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
  ok(`fatura ${step} paga`);
}
if (await p.locator("[data-blocked-screen]").count()) fail("pagamento não liberou o painel"); else ok("pagamento libera o painel automaticamente");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("TESTE E BLOQUEIO OK");
