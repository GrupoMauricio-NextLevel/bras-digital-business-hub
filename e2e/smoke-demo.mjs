/**
 * Verificação do ambiente de demonstração (Mega Tron / MRS Sports).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/smoke-demo.mjs [pastaDeCapturas]
 * Requer o app em modo demonstração (NEXT_PUBLIC_DEMO_MODE=true no build) com a vitrine aplicada.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const B = process.env.E2E_BASE ?? "http://localhost:3100";
const out = process.argv[2];
if (out) mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; let ok = 0;
const fail = (m) => bad.push(m);
const verify = async (p, label) => { const t = await p.locator("body").innerText(); if (/Não foi possível carregar esta página|Application error|Internal Server Error|could not be found/i.test(t)) fail(label + ": página com erro"); else ok++; };
const shot = async (p, name) => { if (out) await p.screenshot({ path: `${out}/${name}.png`, fullPage: true }); };

async function as(nameRe, fn) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail(`${nameRe} pageerror: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: nameRe }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }); await p.waitForLoadState("networkidle");
  const visit = async (u, label = u) => { const r = await p.goto(B + u, { waitUntil: "networkidle" }); if (!r || r.status() >= 400) fail(`${nameRe} ${u}: HTTP ${r?.status()}`); await verify(p, `${nameRe} ${label}`); };
  await fn(p, visit); await ctx.close();
}

// Página pública do fornecedor
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const r = await p.goto(B + "/f/megatron", { waitUntil: "networkidle" });
  if (!r || r.status() !== 200) fail("/f/megatron: HTTP " + r?.status());
  const t = await p.locator("body").innerText();
  for (const need of ["Mega Tron", "Teste grátis por 7 dias", "Camisa Tailandesa", "Planos", "SuperDrop"]) if (!t.includes(need)) fail("landing sem: " + need);
  if (/R\$\s?80,00/.test(t)) fail("a landing não pode mostrar o preço de custo (R$ 80,00)");
  await shot(p, "landing-megatron"); await p.setViewportSize({ width: 390, height: 844 }); await shot(p, "landing-megatron-390"); ok++;
  const r404 = await p.goto(B + "/f/nao-existe"); if (r404?.status() !== 404) fail("/f/nao-existe deveria ser 404");
  await p.close();
}

await as(/Equipe Mega Tron/, async (p, visit) => {
  await visit("/supplier"); await shot(p, "megatron-esteira");
  const t = await p.locator("main").innerText(); if (!/Pronto para separar/.test(t)) fail("esteira sem coluna 'Pronto para separar'");
  for (const u of ["/supplier/orders", "/supplier/wallets", "/supplier/team", "/supplier/operations", "/supplier/finance", "/supplier/products", "/supplier/stores", "/supplier/dispatch"]) await visit(u);
  await shot(p, "megatron-recargas");
});
await as(/Carlos Expedição/, async (p, visit) => {
  await visit("/supplier/dispatch"); await shot(p, "megatron-expedicao");
  const t = await p.locator("main").innerText(); if (/R\$\s?\d/.test(t)) fail("expedição mostra dinheiro");
  await visit("/supplier/dispatch/print"); await visit("/supplier/dispatch/shipped");
});
await as(/Marcelo R\. Santos/, async (p, visit) => {
  for (const u of ["/merchant", "/merchant/orders", "/merchant/after-sales", "/merchant/labels", "/merchant/products", "/merchant/wallet", "/merchant/finance", "/merchant/services", "/merchant/customers"]) await visit(u);
  await visit("/merchant/after-sales"); await shot(p, "mrs-pos-venda");
  if (!(await p.locator("main").innerText()).includes("Falar no WhatsApp")) fail("pós-venda sem botão de WhatsApp");
  await visit("/merchant/labels"); await shot(p, "mrs-etiquetas");
  // Simular venda de cliente
  await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Simular venda/ }).click(); await p.waitForSelector("text=Venda simulada", { timeout: 20000 });
  // Etiqueta de demonstração em um pedido que espera etiqueta
  await p.goto(B + "/merchant/labels", { waitUntil: "networkidle" });
  const rows = p.locator("tr").filter({ hasText: "Aguardando etiqueta" });
  if (await rows.count()) {
    await rows.first().getByRole("button", { name: /Anexar etiqueta/ }).click();
    await p.getByRole("button", { name: /Gerar etiqueta de demonstração/ }).click(); await p.waitForSelector("text=Etiqueta de demonstração anexada", { timeout: 20000 });
  } else fail("sem pedido aguardando etiqueta para demonstrar o anexo");
  // Anotação de atendimento
  await p.goto(B + "/merchant/after-sales", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Anotar/ }).first().click(); await p.getByRole("textbox", { name: "Anotação" }).fill("Cliente pediu confirmação do prazo."); await p.getByRole("button", { name: "Salvar" }).click(); await p.waitForSelector("text=Anotação registrada", { timeout: 15000 });
  // Recarga Pix simulada
  await p.goto(B + "/merchant/wallet", { waitUntil: "networkidle" });
  await p.locator("#recharge-amount").fill("300"); await p.getByRole("button", { name: /Gerar Pix/ }).click(); await p.waitForSelector("text=PIX SIMULADO", { timeout: 15000 });
  await p.getByRole("button", { name: /Simular pagamento/ }).click(); await p.waitForSelector("text=confirmada", { timeout: 15000 });
});
await b.close();
console.log("páginas ok:", ok);
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("DEMO OK");
