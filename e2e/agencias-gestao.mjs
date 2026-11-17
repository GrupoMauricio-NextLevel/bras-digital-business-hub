/**
 * Gestão do Master no Painel da Agência (D325) no navegador: placar e metas, tráfego (nova campanha, no ar, números),
 * crescimento, Pergunte ao Maurício, atendimento e "Ver como o cliente". 360 px e axe nas telas novas.
 * Uso: AGENCIAS_V1=true bash scripts/restart-demo.sh; E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-gestao.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100"; const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true }); };
const conferir = async (p, rotulo) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo}: rolagem horizontal`); const v = await axeOf(p); if (v.length) fail(`${rotulo}: axe ${v.join(" | ")}`); };
async function entrar(nome, w = 1440) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${nome} @${w}: ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(nome) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  return { ctx, p };
}
const ir = async (p, path) => { await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 }); };

{
  const { ctx, p } = await entrar("Marina Alves");
  await ir(p, "/agencia/placar"); await conferir(p, "placar");
  await p.getByLabel("Conteúdos publicados", { exact: true }).fill("30"); await p.getByLabel("Clientes novos", { exact: true }).fill("2");
  await p.getByRole("button", { name: "Salvar metas" }).click();
  await p.getByText("Metas salvas.").waitFor({ timeout: 20000 }).then(() => ok("metas salvas"), () => fail("metas não salvaram"));
  await p.waitForLoadState("networkidle"); await shot(p, "gestao-01-placar");

  await ir(p, "/agencia/trafego"); await conferir(p, "tráfego");
  await p.getByRole("button", { name: "Nova campanha" }).click();
  await p.getByLabel("Nome da campanha").fill("Reels de novembro");
  await p.getByLabel("Objetivo").fill("Mensagens no WhatsApp");
  await p.getByRole("button", { name: "Criar" }).click();
  await p.getByText("Campanha criada.").waitFor({ timeout: 20000 }).then(() => ok("campanha criada"), () => fail("campanha não criada"));
  await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "Pôr no ar" }).first().click(); await p.getByText("Campanha no ar.").waitFor({ timeout: 20000 }); await p.getByRole("button", { name: "Pausar" }).first().waitFor({ timeout: 20000 });
  await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "Lançar números" }).first().click();
  await p.getByLabel("Resultados").fill("12"); await p.getByRole("button", { name: "Salvar", exact: true }).click();
  await p.getByText("Números atualizados.").waitFor({ timeout: 20000 }).then(() => ok("números lançados"), () => fail("números não salvaram"));
  await p.waitForLoadState("networkidle"); await shot(p, "gestao-02-trafego");

  await ir(p, "/agencia/crescimento"); await conferir(p, "crescimento"); await shot(p, "gestao-03-crescimento");
  if (/Receita recorrente/.test(await p.locator("main").innerText())) ok("crescimento com receita recorrente"); else fail("crescimento vazio");

  await ir(p, "/agencia/agente"); await conferir(p, "agente");
  await p.getByRole("button", { name: "Como está o mês?" }).click();
  await p.getByText(/conteúdos contratados no mês/).waitFor({ timeout: 30000 }).then(() => ok("Maurício respondeu com os números"), () => fail("agente não respondeu"));
  await shot(p, "gestao-04-agente");

  await ir(p, "/agencia/atendimento"); await conferir(p, "atendimento"); await shot(p, "gestao-05-atendimento");
  await ir(p, "/agencia/atendimento?aba=caixa"); await conferir(p, "caixa de entrada");
  await ir(p, "/agencia/comercial/executivos"); await conferir(p, "executivos");

  await ir(p, "/agencia/clientes");
  await p.locator("a:visible", { hasText: "Clínica Sorriso Leve" }).first().click(); await p.waitForURL(/agcl_/); await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "Ver como o cliente" }).click();
  await p.waitForURL(/\/portal\/.+previa=1/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (/Você está vendo o portal como o cliente vê/.test(await p.locator("main").innerText())) ok("ver como o cliente abre o portal só para ver"); else fail("prévia sem faixa");
  if (await p.getByRole("button", { name: "Enviar" }).count()) fail("prévia mostra ação do cliente"); else ok("prévia sem ações do cliente");
  await shot(p, "gestao-06-ver-como-cliente");
  await ctx.close();
}
{
  const { ctx, p } = await entrar("Marina Alves", 360);
  for (const path of ["/agencia/placar", "/agencia/trafego", "/agencia/crescimento", "/agencia/atendimento", "/agencia/agente"]) { await ir(p, path); await conferir(p, `360 ${path}`); }
  ok("telas novas conferidas em 360 px");
  await ctx.close();
}
{
  const { ctx, p } = await entrar("Gabriel Nunes");
  await ir(p, "/agencia/trafego");
  if (/O tráfego é do administrador/.test(await p.locator("main").innerText())) ok("editor fora do tráfego"); else fail("editor abriu o tráfego");
  await ctx.close();
}
await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
