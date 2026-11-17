/**
 * Portal do cliente da agência (D320) no navegador: o cliente entra com o código do e-mail (calculado aqui com o
 * SESSION_SECRET de scripts/dev-demo.sh, como o servidor faz), vê o mês, aprova um conteúdo e manda um pedido; a agência vê o
 * pedido na fila do dia e responde na ficha; o cliente vê a resposta. 360 px e axe.
 * Uso: E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-portal.mjs
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const SLUG = "agencia-aurora-demo"; const AG = "agc_aurorademo"; const EMAIL = "contato@sorrisoleve.demo";
const segredo = process.env.SESSION_SECRET ?? "teste-local-segredo-1234567890"; // o mesmo de scripts/dev-demo.sh
const codigo = () => String(createHmac("sha256", segredo).update(`codigo|ag:${AG}|${EMAIL}|${Math.floor(Date.now() / 600_000)}`).digest().readUInt32BE(0) % 1_000_000).padStart(6, "0");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };
const PEDIDO = `Vídeo do Dia das Mães ${Date.now() % 10000}`;

async function cliente(w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`portal @${w}: ${e.message}`));
  await p.goto(`${B}/portal/${SLUG}`, { waitUntil: "networkidle", timeout: 90000 });
  await conferir(p, `portal entrada @${w}`);
  await p.getByLabel("Seu e-mail").fill(EMAIL); await p.getByRole("button", { name: "Receber código" }).click();
  await p.getByLabel("Código", { exact: true }).fill(codigo()); await p.getByRole("button", { name: "Entrar" }).click();
  await p.getByRole("heading", { name: /Clínica Sorriso Leve/ }).waitFor({ timeout: 30000 }).then(() => ok(`cliente entrou com o código @${w}`), () => fail(`não entrou @${w}`));
  await p.waitForLoadState("networkidle");
  return { ctx, p };
}

{
  const { ctx, p } = await cliente(1440);
  await conferir(p, "portal");
  const txt = await p.locator("main").innerText();
  if (/Felipe|Gabriel|Beatriz|prazo/i.test(txt)) fail("portal mostra dado interno (nome da equipe ou prazo)"); else ok("nada interno no portal");
  await shot(p, "portal-01-cliente");
  if (await p.getByRole("button", { name: "Aprovar" }).count()) {
    await p.getByRole("button", { name: "Aprovar" }).first().click();
    await p.getByText("Aprovado! A agência já recebeu.").waitFor({ timeout: 20000 }).then(() => ok("cliente aprovou um conteúdo"), () => fail("aprovação não respondeu"));
  } else console.log("· nada para aprovar neste cliente agora");
  await p.getByLabel("Mensagem").fill(PEDIDO); await p.getByRole("button", { name: "Enviar", exact: true }).click();
  await p.getByText("Enviado para a agência.").waitFor({ timeout: 20000 }).then(() => ok("pedido enviado"), () => fail("pedido não foi"));
  await ctx.close();
}

{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`agência: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Marina Alves/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle");
  await p.goto(B + "/agencia", { waitUntil: "networkidle" });
  if (/Pedidos de clientes pelo portal/.test(await p.locator("main").innerText())) ok("pedido aparece na fila do dia"); else fail("pedido não está na fila do dia");
  await p.getByRole("link", { name: /Responder/ }).first().click(); await p.waitForLoadState("networkidle");
  await conferir(p, "ficha com portal");
  const item = p.locator("li").filter({ hasText: PEDIDO });
  await item.getByLabel("Resposta para o cliente").fill("Combinado, entra na pauta de maio.");
  await item.getByRole("button", { name: "Responder" }).click();
  await p.getByText("Resposta enviada ao portal.").waitFor({ timeout: 20000 }).then(() => ok("agência respondeu"), () => fail("resposta não foi"));
  await p.waitForLoadState("networkidle");
  await p.locator("#portal").scrollIntoViewIfNeeded(); await shot(p, "portal-02-ficha-agencia");
  await ctx.close();
}

{
  const { ctx, p } = await cliente(360);
  if (/Combinado, entra na pauta de maio/.test(await p.locator("main").innerText())) ok("cliente vê a resposta"); else fail("cliente não vê a resposta");
  await conferir(p, "portal 360");
  await shot(p, "portal-03-celular");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
