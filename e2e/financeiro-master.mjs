/**
 * D90: Financeiro Master. Master (catálogo, ofertas, pagamentos, gateways, SuperDrop, jornada, auditoria), lojista Commerce
 * (jornada da Loja NextLevel, card bloqueado/educativo, landing, checkout rápido com Pix simulado, três áreas do financeiro),
 * parceiro (CRM e catálogo comercial) e páginas públicas (/solucoes, landing, diagnóstico, planos da Commerce).
 * Uso: bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/financeiro-master.mjs   (muda dados)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const axe = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const noScroll = async (p, where) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`rolagem horizontal em ${where}`); };
const ctxFor = (host, w = 1360, h = 950) => b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: host ? { "x-forwarded-host": host } : {} });
const login = async (p, name) => { await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle"); };

// 1) Master: todas as telas do financeiro corporativo abrem, sem rolagem e sem violações graves
{
  const ctx = await ctxFor(null); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror master: " + e.message));
  await login(p, /Equipe NextLevel/);
  for (const path of ["", "/catalogo", "/catalogo/LOJA_PRONTA_ESSENCIAL", "/ofertas", "/assinaturas", "/pagamentos", "/propostas", "/parceiros", "/gateways", "/superdrop", "/jornada", "/auditoria"]) {
    const r = await p.goto(`${B}/master/financeiro${path}`, { waitUntil: "networkidle" });
    if (!r || r.status() >= 400) { fail(`/master/financeiro${path} → ${r?.status()}`); continue; }
    if (await p.getByText(/Ocorreu um erro|Algo deu errado/).count()) fail(`erro na tela /master/financeiro${path}`);
    await noScroll(p, `/master/financeiro${path}`);
  }
  ok("12 telas do Financeiro NextLevel abrem");
  await p.goto(`${B}/master/financeiro/catalogo`, { waitUntil: "networkidle" });
  const cat = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
  for (const t of ["Commerce Start", "R$ 149,00/mês", "Loja Pronta Essencial", "R$ 1.997,00", "Migração Pro", "White Label NextLevel", "Sob consulta"]) if (!cat.includes(t)) fail(`catálogo sem "${t}"`);
  ok("catálogo com os planos e preços aprovados");
  await p.goto(`${B}/master/financeiro/superdrop`, { waitUntil: "networkidle" });
  if (!(await p.getByText(/Fluxo validado/).count())) fail("racional do SuperDrop sem o fluxo validado");
  const a = await axe(p); if (a.length) fail("axe superdrop: " + a.join(" | ")); else ok("axe sem violações graves (Master)");
  await p.goto(`${B}/master/financeiro/catalogo/LOJA_PRONTA_ESSENCIAL`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Nova versão de preço" }).click();
  await p.getByLabel("Motivo da mudança").fill("Teste de senha");
  await p.getByLabel("Sua senha (confirmação)").fill("senha-errada");
  await p.getByRole("button", { name: "Criar versão" }).click();
  await p.waitForSelector("text=Confirme a sua senha", { timeout: 15000 }).then(() => ok("preço novo exige a senha do Master"), () => fail("preço novo sem reautenticação"));
  await ctx.close();
}

// 2) Lojista Commerce: jornada, landing educativa, checkout rápido e financeiro em três áreas
{
  const ctx = await ctxFor("lojas.nextlevelgroup.com.br"); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror lojista: " + e.message));
  await login(p, /completo@commerce\.demo/);
  await p.goto(B + "/merchant/services", { waitUntil: "networkidle" });
  const body = await p.locator("main").innerText();
  for (const t of ["Fundação", "Lançamento", "Aquisição", "Otimização", "Escala", "Loja Pronta Essencial", "Migração Lite"]) if (!body.includes(t)) fail(`jornada sem "${t}"`);
  if (/a partir de/i.test(body.replace(/Outros serviços sob orçamento[\s\S]*/, ""))) fail("jornada usa 'a partir de' em preço conhecido");
  if (!(await p.getByRole("link", { name: "Entender esta solução" }).count()) && !(await p.getByText("Sob consulta").count())) fail("nenhum card educativo/sob consulta visível");
  ok("jornada com fases, cards completos e preço claro");
  await noScroll(p, "/merchant/services");
  const a = await axe(p); if (a.length) fail("axe jornada: " + a.join(" | ")); else ok("axe sem violações graves (jornada)");
  await p.goto(B + "/merchant/services/solucao/migracao-lite", { waitUntil: "networkidle" });
  for (const t of ["O problema", "Para quem é", "Escopo", "Preço e condições", "Perguntas frequentes"]) if (!(await p.getByRole("heading", { name: t }).count())) fail(`landing sem "${t}"`);
  const pay = p.getByRole("button", { name: "Pagar agora" }).first();
  if (await pay.count()) {
    await pay.click();
    const dlg = await p.getByRole("dialog").innerText();
    if (!/R\$\s?1\.347,30/.test(dlg)) fail("checkout sem o Pix com 10% (R$ 1.347,30)");
    await p.getByText("Cartão", { exact: true }).click();
    if (!/R\$\s?1\.736,52/.test(await p.getByRole("dialog").innerText())) fail("checkout sem o cartão × 1,16 (R$ 1.736,52)");
    await p.getByText("Pix", { exact: true }).click();
    await p.getByRole("button", { name: "Gerar Pix" }).click();
    await p.getByRole("button", { name: /Simular pagamento/ }).click();
    await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 }).then(() => ok("checkout rápido: Pix gerado e pagamento confirmado"), async () => { fail("checkout não confirmou: " + (await p.getByRole("dialog").innerText().catch(() => "")).slice(0, 300) + " | toasts: " + (await p.locator("[data-sonner-toast]").allInnerTexts()).join(";")); await p.screenshot({ path: "/tmp/checkout-fail.png" }); });
    await p.keyboard.press("Escape");
    await p.goto(B + "/merchant/services", { waitUntil: "networkidle" });
    if (!(await p.getByText(/Meus pedidos à NextLevel/).count())) fail("pedido não aparece em Meus pedidos");
  } else fail("landing da Migração Lite sem 'Pagar agora' (estado não comprável?)");
  await p.goto(B + "/merchant/finance", { waitUntil: "networkidle" });
  const fin = await p.locator("main").innerText();
  for (const t of ["Minha operação", "Minha evolução com a NextLevel", "Oportunidades"]) if (!fin.includes(t)) fail(`financeiro sem "${t}"`);
  ok("financeiro do cliente em três áreas");
  for (const path of ["/master/financeiro", "/partner/crm"]) { await p.goto(B + path, { waitUntil: "networkidle" }); if (new URL(p.url()).pathname.startsWith(path)) fail(`lojista abriu ${path}`); }
  ok("lojista não acessa o financeiro corporativo nem o CRM de parceiro");
  await ctx.close();
}

// 3) Parceiro: CRM e catálogo comercial (só o que é dele)
{
  const ctx = await ctxFor(null); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror parceiro: " + e.message));
  await login(p, /Parceiro/);
  if (!new URL(p.url()).pathname.startsWith("/partner")) fail("login de parceiro não abriu o painel");
  await p.goto(B + "/partner/catalogo", { waitUntil: "networkidle" });
  if (!(await p.getByText(/Sua comissão/).count())) fail("catálogo comercial sem comissão");
  await p.goto(B + "/partner/crm", { waitUntil: "networkidle" });
  const RUN = Date.now().toString(36);
  await p.locator("#ld-n").fill("Lead Teste"); await p.locator("#ld-e").fill(`lead-${RUN}@empresa.com`);
  await p.getByRole("button", { name: "Registrar lead" }).click();
  await p.waitForSelector(`text=lead-${RUN}@empresa.com`, { timeout: 15000 }).then(() => ok("parceiro registra lead no CRM"), () => fail("lead não apareceu no CRM"));
  await p.goto(B + "/master/financeiro", { waitUntil: "networkidle" });
  if (new URL(p.url()).pathname.startsWith("/master")) fail("parceiro abriu o Master");
  await ctx.close();
}

// 4) Público: super landing, landing do produto, diagnóstico e planos da Commerce (celular)
{
  const ctx = await ctxFor("superdrop.com.br", 390, 844); const p = await ctx.newPage();
  p.on("pageerror", (e) => fail("pageerror público: " + e.message));
  await p.goto(B + "/solucoes?ref=ZZTESTE&utm_source=instagram", { waitUntil: "networkidle" });
  if (!(await p.getByRole("heading", { level: 1 }).count())) fail("/solucoes sem título");
  const canon = await p.locator("link[rel=canonical]").getAttribute("href");
  if (!canon?.endsWith("/solucoes")) fail("canonical da super landing errado: " + canon);
  const commerceLink = await p.getByRole("link", { name: /Conhecer a NextLevel Commerce/ }).getAttribute("href");
  if (!commerceLink?.includes("utm_source=instagram")) fail("link para a Commerce perdeu a origem: " + commerceLink); else ok("origem (utm) preservada no link para a Commerce");
  await noScroll(p, "/solucoes (360)");
  const a = await axe(p); if (a.length) fail("axe /solucoes: " + a.join(" | ")); else ok("axe sem violações graves (/solucoes)");
  await p.locator("#dg-n").fill("Visitante Teste"); await p.locator("#dg-e").fill(`visitante-${Date.now()}@empresa.com`); await p.locator("#dg-p").fill("11999998888");
  await p.getByLabel("Trazer minha loja de outra plataforma").check();
  await p.getByLabel(/Concordo em receber o contato/).check();
  await p.getByRole("button", { name: "Pedir diagnóstico gratuito" }).click();
  await p.waitForSelector("text=Recebemos seu pedido de diagnóstico", { timeout: 15000 }).then(() => ok("diagnóstico gratuito enviado e roteado"), () => fail("diagnóstico não foi enviado"));
  await p.goto(B + "/solucoes/loja-pronta-profissional", { waitUntil: "networkidle" });
  const lp = await p.locator("main").innerText();
  if (!/R\$\s?4\.497,30/.test(lp) || !/R\$\s?5\.796,52/.test(lp)) fail("landing pública sem Pix e cartão corretos");
  if (!(await p.locator('script[type="application/ld+json"]').count())) fail("landing sem dados estruturados");
  await noScroll(p, "/solucoes/loja-pronta-profissional");
  ok("landing pública do produto com preço completo e SEO");
  await ctx.close();
  const c2 = await ctxFor("lojas.nextlevelgroup.com.br", 390, 844); const q = await c2.newPage();
  await q.goto(B + "/planos", { waitUntil: "networkidle" });
  const pl = (await q.locator("main").innerText()).replace(/\u00a0/g, " ");
  for (const t of ["Commerce Start", "Commerce Pro", "Commerce Scale", "Commerce Enterprise", "R$ 1.341,00", "3 dias grátis"]) if (!pl.includes(t)) fail(`planos da Commerce sem "${t}"`);
  await noScroll(q, "/planos Commerce");
  ok("planos da Commerce com oferta de entrada e anual");
  await c2.close();
}

await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("FINANCEIRO MASTER OK");
