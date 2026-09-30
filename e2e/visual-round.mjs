/**
 * Rodada visual (F6 a F8): home Lite, análise Pro, prévia em 3 larguras e Loja NextLevel de ponta a ponta.
 * Uso: E2E_BASE=http://localhost:3100 node e2e/visual-round.mjs [pastaDeCapturas]
 * Requer o app em modo demonstração (perfis de demonstração no login).
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const B = process.env.E2E_BASE ?? "http://localhost:3100";
const out = process.argv[2];
if (out) mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = [];
const fail = (m) => bad.push(m);
const step = (m) => console.log("✔", m);

async function as(nameRe, fn, viewport = { width: 1280, height: 900 }) {
  const ctx = await b.newContext({ viewport }); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail(`${nameRe} pageerror: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: nameRe }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
  const shot = async (name) => { if (out) await p.screenshot({ path: `${out}/${name}.png`, fullPage: true }); };
  await fn(p, shot); await ctx.close();
}
const noError = async (p, label) => { const t = await p.locator("body").innerText(); if (/Não foi possível carregar esta página|Application error|Internal Server Error/i.test(t)) fail(label + ": página com erro"); };

// Portal público
{
  const p = await b.newPage();
  for (const u of ["/", "/como-funciona", "/fornecedores", "/planos", "/faq"]) { const r = await p.goto(B + u, { waitUntil: "networkidle" }); if (!r || r.status() !== 200) fail(`portal ${u}: HTTP ${r?.status()}`); if (!(await p.locator("main").innerText()).length) fail(`portal ${u}: vazio`); }
  await p.goto(B + "/planos", { waitUntil: "networkidle" });
  const t = await p.locator("main").innerText();
  for (const need of ["R$ 1.500", "R$ 15.000", "1,5%", "7 dias"]) if (!t.includes(need)) fail("/planos sem " + need);
  await p.close(); step("portal público");
}

// Lite: saldo em destaque
await as(/Marcelo R\. Santos/, async (p, shot) => {
  const t = await p.locator("main").innerText();
  if (!/Saldo para pedidos/.test(t)) fail("home Lite sem saldo em destaque");
  if (!(await p.getByRole("link", { name: /Recarregar/ }).count())) fail("home Lite sem botão de recarga");
  if (!/Recomendado para você/.test(t)) fail("home Lite sem recomendações da Loja NextLevel");
  await shot("lite-home");
  if (await p.getByRole("link", { name: /Análise/ }).locator("svg[aria-label*='bloqueado']").count() === 0) fail("Análise deveria aparecer com cadeado no Lite");
  await p.goto(B + "/merchant/analytics", { waitUntil: "networkidle" });
  if (!/Análise de vendas/.test(await p.locator("main").innerText()) || !/Ver como liberar/.test(await p.locator("main").innerText())) fail("Lite deveria ver o cartão de upgrade em Análise");
  await shot("lite-analise-bloqueada"); step("Lite: saldo, recomendações e gate");
});

// Pro: análise, prévia em 3 larguras e compra de serviço
let orderUrl = "";
await as(/Ana Paula Ribeiro/, async (p, shot) => {
  await p.goto(B + "/merchant/analytics", { waitUntil: "networkidle" }); await noError(p, "análise");
  const t = await p.locator("main").innerText();
  if (!/Produtos campeões/.test(t) || !/Canais de venda/.test(t)) fail("análise Pro incompleta");
  await shot("pro-analise");
  await p.goto(B + "/merchant/appearance", { waitUntil: "networkidle" });
  if (!p.url().includes("/theme-editor")) fail("Aparência deveria levar ao editor de tema: " + p.url());
  for (const w of [/Tablet/, /Celular/, /Computador/]) await p.getByRole("radio", { name: w }).click();
  await p.getByRole("radio", { name: /Celular/ }).click(); await p.waitForTimeout(500);
  const width = await p.locator("iframe").evaluate((el) => Math.round(el.getBoundingClientRect().width));
  if (width !== 390) fail("prévia em celular deveria ter 390px, veio " + width);
  await shot("pro-editor-390");
  // Loja NextLevel
  await p.goto(B + "/merchant/services", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Solicitar/ }).first().click();
  await p.getByLabel("O que você precisa?").fill("Preciso de banners para a campanha do fim de semana.");
  await p.getByRole("button", { name: "Enviar pedido" }).click();
  await p.waitForURL(/\/merchant\/services\/.+/, { timeout: 30000 }); await p.waitForLoadState("networkidle");
  orderUrl = new URL(p.url()).pathname; await shot("pro-pedido-servico");
  if (!/Enviado/.test(await p.locator("main").innerText())) fail("pedido de serviço sem etapa 'Enviado'");
  step("Pro: análise, prévia 390px e pedido de serviço");
});

// Fornecedor contrata serviço
await as(/Equipe Mega Tron/, async (p, shot) => {
  const t = await p.locator("main").innerText();
  if (!/Recomendado para você/.test(t)) fail("esteira sem recomendações");
  await p.goto(B + "/supplier/services", { waitUntil: "networkidle" }); await noError(p, "supplier services");
  await p.getByRole("button", { name: /Solicitar/ }).first().click();
  await p.getByLabel("O que você precisa?").fill("Quero fotos novas de todo o catálogo de camisas.");
  await p.getByRole("button", { name: "Enviar pedido" }).click();
  await p.waitForURL(/\/supplier\/services\/.+/, { timeout: 30000 });
  await shot("supplier-pedido-servico"); step("Fornecedor: pedido de serviço");
});

// Master orça; lojista vê o orçamento
await as(/Equipe NextLevel/, async (p, shot) => {
  const t = await p.locator("main").innerText();
  if (!/Loja NextLevel/.test(t)) fail("Master sem cartão da Loja NextLevel");
  await p.goto(B + "/master/services", { waitUntil: "networkidle" });
  const card = p.locator("li").filter({ hasText: "banners para a campanha do fim de semana" }).first();
  await card.getByRole("button", { name: "Enviar orçamento" }).click();
  await p.waitForSelector("text=Orçamento enviado", { timeout: 20000 });
  await shot("master-servicos"); step("Master: orçamento enviado");
});
await as(/Ana Paula Ribeiro/, async (p) => {
  await p.goto(B + orderUrl, { waitUntil: "networkidle" });
  const t = await p.locator("main").innerText();
  if (!/Orçamento:/.test(t)) fail("lojista não vê o orçamento");
  if (!/Status: QUOTED/.test(t)) fail("conversa sem a mudança de status");
  step("Lojista Pro vê o orçamento");
});

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("RODADA VISUAL OK");
