/**
 * Contratos da agência (D321) no navegador: o administrador gera o contrato na ficha (prévia e envio), o cliente lê e
 * aceita no portal (código calculado com o SESSION_SECRET de scripts/dev-demo.sh), baixa o PDF e a ficha mostra
 * "Assinado". 360 px e axe. Reinicie a demonstração antes (o contrato só pode ser enviado uma vez por cliente).
 * Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-contratos.mjs
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const SLUG = "agencia-aurora-demo"; const AG = "agc_aurorademo"; const EMAIL = "contato@sorrisoleve.demo";
const segredo = process.env.SESSION_SECRET ?? "teste-local-segredo-1234567890";
const codigo = () => String(createHmac("sha256", segredo).update(`codigo|ag:${AG}|${EMAIL}|${Math.floor(Date.now() / 600_000)}`).digest().readUInt32BE(0) % 1_000_000).padStart(6, "0");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, loc) => { if (SHOTS) await (loc ?? p).screenshot({ path: `${SHOTS}/${nome}.png`, ...(loc ? {} : { fullPage: true }) }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };

async function agencia(w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`agência: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Marina Alves/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/agencia/clientes", { waitUntil: "networkidle" });
  await p.locator("a:visible", { hasText: "Clínica Sorriso Leve" }).first().click(); await p.waitForURL(/\/agencia\/clientes\/agcl_/); await p.waitForLoadState("networkidle");
  return { ctx, p };
}

{
  const { ctx, p } = await agencia();
  // D335: o contrato sai pela tela "Novo contrato" (mensalidade, projeto ou migração).
  await p.getByRole("link", { name: "Novo contrato" }).first().click(); await p.waitForURL(/\/agencia\/contratos\/novo/); await p.waitForLoadState("networkidle");
  await p.getByRole("radio", { name: /Mensalidade de marketing/ }).click();
  await p.getByRole("button", { name: "Ver prévia" }).click();
  await p.getByLabel("Texto do contrato").waitFor({ timeout: 20000 }).then(() => ok("prévia do contrato com o texto"), () => fail("prévia não apareceu"));
  await conferir(p, "novo contrato com prévia");
  await shot(p, "contrato-01-previa");
  await p.getByRole("button", { name: "Enviar ao cliente" }).click();
  await p.getByText(/enviado\. O cliente aceita pelo portal/).waitFor({ timeout: 20000 }).then(() => ok("contrato enviado"), () => fail("envio não respondeu"));
  await ctx.close();
}

{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`portal: ${e.message}`));
  await p.goto(`${B}/portal/${SLUG}`, { waitUntil: "networkidle", timeout: 90000 });
  await p.getByLabel("Seu e-mail").fill(EMAIL); await p.getByRole("button", { name: "Receber código" }).click();
  await p.getByLabel("Código", { exact: true }).fill(codigo()); await p.getByRole("button", { name: "Entrar" }).click();
  await p.getByRole("heading", { name: "Contrato para você aceitar" }).waitFor({ timeout: 30000 }).then(() => ok("cliente vê o contrato no portal"), () => fail("contrato não aparece no portal"));
  await conferir(p, "portal com contrato");
  const sec = p.locator("section", { has: p.getByRole("heading", { name: "Contrato para você aceitar" }) });
  await sec.getByLabel("Seu nome completo").fill("Ana Paula Sorriso");
  await sec.getByLabel(/Li e concordo/).check();
  await shot(p, "contrato-02-portal", sec);
  await sec.getByRole("button", { name: "Aceitar contrato" }).click();
  await p.getByText("Contrato aceito!").waitFor({ timeout: 20000 }).then(() => ok("cliente aceitou"), () => fail("aceite não respondeu"));
  await p.waitForLoadState("networkidle");
  const href = await p.getByRole("link", { name: "Baixar PDF" }).getAttribute("href");
  const r = await p.request.get(B + href);
  if (r.ok() && (r.headers()["content-type"] ?? "").includes("pdf")) ok("PDF assinado baixa no portal"); else fail(`PDF no portal: ${r.status()}`);
  await ctx.close();
}

{
  const { ctx, p } = await agencia(360);
  if (/Assinado/.test(await p.locator("main").innerText())) ok("ficha mostra o contrato assinado"); else fail("ficha não mostra assinado");
  await conferir(p, "ficha 360");
  await p.locator("a", { hasText: /^AG-/ }).first().click(); await p.waitForURL(/\/agencia\/contratos\/agct_/); await p.waitForLoadState("networkidle");
  const href = await p.getByRole("link", { name: "Baixar PDF" }).first().getAttribute("href");
  const r = await p.request.get(B + href);
  if (r.ok() && (r.headers()["content-type"] ?? "").includes("pdf")) ok("PDF baixa na agência"); else fail(`PDF na agência: ${r.status()}`);
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
