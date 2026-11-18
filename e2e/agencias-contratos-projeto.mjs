/**
 * Contratos de projeto da agência (D341) no navegador: o Master marca a agência interna; a agência completa a ficha do
 * cliente, faz o contrato "Migração Nuvemshop → NextLevel" com sinal pago e saldo a vencer (prévia e envio); o cliente
 * aceita no portal; a agência registra o saldo com "Recebi por fora" e a tela Contratos mostra 100% pago. 1440 e 360 px,
 * axe e prints. Reinicie a demonstração antes. Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-contratos-projeto.mjs
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const SLUG = "agencia-aurora-demo"; const AG = "agc_aurorademo"; const EMAIL = "contato@atelieflor.demo"; const CLIENTE = "Loja Ateliê Flor";
const segredo = process.env.SESSION_SECRET ?? "teste-local-segredo-1234567890";
const codigo = () => String(createHmac("sha256", segredo).update(`codigo|ag:${AG}|${EMAIL}|${Math.floor(Date.now() / 600_000)}`).digest().readUInt32BE(0) % 1_000_000).padStart(6, "0");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, loc) => { if (SHOTS) await (loc ?? p).screenshot({ path: `${SHOTS}/${nome}.png`, ...(loc ? {} : { fullPage: true }) }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); else ok(`${rotulo}: axe e 360/1440 sem rolagem lateral`); };
const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const diasAtras = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

async function entrar(botao, w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${botao}: ${e.message}`)); p.on("dialog", (d) => d.accept());
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(botao) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  return { ctx, p };
}

// 1) Master marca a Aurora como agência interna
{
  const { ctx, p } = await entrar("Equipe NextLevel");
  await p.goto(B + "/master/agencias", { waitUntil: "networkidle" });
  const linha = p.locator("li", { hasText: "Agência Aurora" }).first();
  await linha.getByRole("button", { name: "Marcar como agência interna" }).click();
  await linha.getByText("Agência interna", { exact: true }).waitFor({ timeout: 20000 }).then(() => ok("Master marcou a agência interna"), () => fail("agência interna não marcou"));
  await shot(p, "ctp-01-master-agencia-interna", linha);
  await ctx.close();
}

// 2) Agência: completa a ficha e faz o contrato de migração com sinal pago
let contratoUrl = "";
{
  const { ctx, p } = await entrar("Marina Alves");
  await p.goto(B + "/agencia/clientes", { waitUntil: "networkidle" });
  await p.locator("a:visible", { hasText: CLIENTE }).first().click(); await p.waitForURL(/\/agencia\/clientes\/agcl_/); await p.waitForLoadState("networkidle");
  const form = p.getByRole("form", { name: "Editar cliente" });
  await form.getByLabel("E-mail").fill(EMAIL);
  await form.getByLabel("CPF ou CNPJ").fill("11.444.777/0001-61");
  await form.getByLabel("Pessoa de contato").fill("Flora Martins");
  await form.getByRole("button", { name: "Salvar" }).click();
  await p.getByText("Cliente atualizado.").waitFor({ timeout: 20000 }).then(() => ok("ficha editada (e-mail, CNPJ, contato)"), () => fail("ficha não salvou"));
  await p.getByRole("link", { name: "Novo contrato" }).first().click(); await p.waitForURL(/\/agencia\/contratos\/novo/); await p.waitForLoadState("networkidle");
  await p.getByRole("radio", { name: /Migração para a NextLevel/ }).click();
  await p.getByRole("radio", { name: "Sinal + restante" }).click();
  const sinal = p.getByRole("group", { name: "Sinal", exact: true });
  await sinal.getByLabel("Valor (R$)").fill("250,00");
  await sinal.getByLabel("Pago em").fill(diasAtras(5));
  const resto = p.getByRole("group", { name: "Restante", exact: true });
  await resto.getByLabel("Vence em").fill(hoje);
  await p.getByRole("button", { name: "Ver prévia" }).click();
  await p.getByText("Tudo certo para enviar.").waitFor({ timeout: 20000 }).then(() => ok("prévia sem pendências"), () => fail("prévia com pendências"));
  const texto = await p.getByLabel("Texto do contrato").innerText();
  for (const t of ["Nuvemshop", "até 40 produtos e cria até 8 banners", "Tema avançado Aura", "pago em", "51.392.006/0001-92"]) if (!texto.includes(t)) fail(`prévia sem "${t}"`);
  await conferir(p, "novo contrato 1440");
  await shot(p, "ctp-02-novo-contrato-migracao");
  await p.getByRole("button", { name: "Enviar ao cliente" }).click();
  await p.waitForURL(/\/agencia\/contratos\/agct_/, { timeout: 30000 }).then(() => ok("contrato enviado, abriu o detalhe"), () => fail("envio não abriu o detalhe"));
  await p.waitForLoadState("networkidle");
  contratoUrl = p.url();
  if (/Aguardando aceite/.test(await p.locator("main").innerText())) ok("detalhe mostra aguardando aceite"); else fail("detalhe sem situação");
  await conferir(p, "detalhe do contrato");
  await shot(p, "ctp-03-detalhe-aguardando");
  await ctx.close();
}

// 3) Cliente aceita no portal
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`portal: ${e.message}`));
  await p.goto(`${B}/portal/${SLUG}`, { waitUntil: "networkidle", timeout: 90000 });
  await p.getByLabel("Seu e-mail").fill(EMAIL); await p.getByRole("button", { name: "Receber código" }).click();
  await p.getByLabel("Código", { exact: true }).fill(codigo()); await p.getByRole("button", { name: "Entrar" }).click();
  const sec = p.locator("section", { has: p.getByRole("heading", { name: "Contrato para você aceitar" }) });
  await sec.waitFor({ timeout: 30000 }).then(() => ok("cliente vê o contrato de migração"), () => fail("contrato não aparece no portal"));
  await sec.getByLabel("Seu nome completo").fill("Flora Martins");
  await sec.getByLabel(/Li e concordo/).check();
  await shot(p, "ctp-04-portal-aceite", sec);
  await sec.getByRole("button", { name: "Aceitar contrato" }).click();
  await p.getByText("Contrato aceito!").waitFor({ timeout: 20000 }).then(() => ok("cliente aceitou"), () => fail("aceite não respondeu"));
  await ctx.close();
}

// 4) Agência registra o saldo e confere a lista (1440 e 360)
{
  const { ctx, p } = await entrar("Marina Alves");
  await p.goto(contratoUrl, { waitUntil: "networkidle" });
  const linha = p.locator("li", { hasText: "Restante" }).first();
  await linha.getByRole("button", { name: "Recebi por fora" }).click();
  await linha.getByRole("button", { name: "Registrar pagamento" }).click();
  await p.getByText("Pagamento registrado.").waitFor({ timeout: 20000 }).then(() => ok("saldo registrado"), () => fail("baixa não respondeu"));
  await p.getByText("Tudo pago.").waitFor({ timeout: 20000 }).then(() => ok("contrato 100% pago"), () => fail("não mostrou tudo pago"));
  const pdf = await p.request.get(contratoUrl + "/pdf");
  if (pdf.ok() && (pdf.headers()["content-type"] ?? "").includes("pdf")) ok("PDF assinado baixa"); else fail(`PDF: ${pdf.status()}`);
  await shot(p, "ctp-05-detalhe-pago");
  await p.goto(B + "/agencia/contratos", { waitUntil: "networkidle" });
  if ((await p.locator("main").innerText()).includes(CLIENTE)) ok("lista de contratos com o cliente"); else fail("lista sem o contrato");
  await conferir(p, "lista de contratos 1440");
  await shot(p, "ctp-06-lista");
  await ctx.close();
}
{
  const { ctx, p } = await entrar("Marina Alves", 360);
  await p.goto(B + "/agencia/contratos", { waitUntil: "networkidle" });
  await conferir(p, "lista de contratos 360");
  await shot(p, "ctp-07-lista-360");
  await p.goto(contratoUrl, { waitUntil: "networkidle" });
  await conferir(p, "detalhe 360");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
