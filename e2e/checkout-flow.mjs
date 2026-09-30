/**
 * P1: da página do fornecedor ao acesso liberado. Escolhe o plano, cria a conta, paga o Pix (demo) e o painel abre sozinho.
 * Também confere os botões de cadastro e login nas páginas públicas.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/checkout-flow.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36);
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));

// Botões de cadastro e login
for (const u of ["/", "/planos", "/seja-fornecedor", "/f/mantosshop", "/f/alpha-outfit"]) {
  const r = await p.goto(B + u, { waitUntil: "networkidle" });
  if (r?.status() !== 200) { fail(`${u}: HTTP ${r?.status()}`); continue; }
  const hasLogin = (await p.locator('a[href="/login"]').count()) > 0;
  const hasSignup = (await p.locator('a[href^="/cadastro"]').count()) > 0;
  if (!hasLogin) fail(`${u}: sem link para login`);
  if (u !== "/seja-fornecedor" && !hasSignup) fail(`${u}: sem link de cadastro`);
}
ok("páginas públicas com cadastro e login");
// Página de quem vende não fala de fornecedor como público-alvo; a de fornecedores tem copy própria
await p.goto(B + "/", { waitUntil: "networkidle" });
const home = (await p.locator("main").textContent()) ?? "";
if (/esteira ao vivo|ondas de separação|equipe de expedição/i.test(home)) fail("home ainda fala de operação de fornecedor");
await p.goto(B + "/seja-fornecedor", { waitUntil: "networkidle" });
if (!/oportunidade de negócio/i.test((await p.locator("main").textContent()) ?? "")) fail("página de fornecedores sem a copy de oportunidade");
await p.goto(B + "/fornecedores", { waitUntil: "networkidle" });
if (!p.url().endsWith("/seja-fornecedor")) fail("/fornecedores não redireciona");
ok("copy separada: home para quem vende, /seja-fornecedor para fornecedores");

// Página do fornecedor → plano → checkout
await p.goto(B + "/f/mantosshop", { waitUntil: "networkidle" });
await p.getByRole("link", { name: "Assinar por Pix" }).nth(1).click();
await p.waitForURL(/\/cadastro\?plano=STORE_SUBDOMAIN&fornecedor=mantosshop/);
await p.locator("#store").fill("Loja Checkout " + RUN); await p.locator("#owner").fill("Carla Teste");
await p.locator("#email").fill(`carla-${RUN}@teste.com`); await p.locator("#pass").fill("senha-segura-1"); await p.locator("#tax").fill(makeCpf());
if (await p.locator("#supplier").count()) fail("pediu fornecedor de novo, já vinha da página");
await p.getByRole("button", { name: /Criar loja e pagar/ }).click();
await p.waitForSelector("[data-blocked-screen]", { timeout: 60000 });
await p.waitForSelector("text=Pagamento por Pix", { timeout: 20000 });
ok("cadastro leva direto ao checkout Pix com o plano escolhido");
await p.getByRole("button", { name: /Simular pagamento/ }).click();
await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
await p.keyboard.press("Escape"); await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
if (await p.locator("[data-blocked-screen]").count()) fail("pagamento não liberou o painel");
else ok("pagamento libera o acesso automaticamente: " + p.url());
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("CHECKOUT OK");
