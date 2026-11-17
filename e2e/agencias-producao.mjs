/**
 * Produção da agência (D314, Fase 1A) no navegador: cockpit com a produção do mês, quadro e lista, planejar o mês,
 * editor conclui a edição (a peça vai sozinha para a revisão), gestor pede ajuste (volta para a edição), 360 px e axe.
 * Uso: servidor com AGENCIAS_V1=true; E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias-producao.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); }; const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, full = false) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: full }); };
async function entrar(nome, w = 1440, scale = 2) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: scale, reducedMotion: "reduce" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => fail(`${nome} @${w}: erro na página ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(nome) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await p.waitForLoadState("networkidle");
  return { ctx, p };
}
async function conferir(p, path, rotulo) {
  await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 });
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo} ${path}: rolagem horizontal`);
  const v = await axeOf(p); if (v.length) fail(`${rotulo} ${path}: axe ${v.join(" | ")}`);
}

// 1. Administradora: cockpit, quadro, lista e planejar o mês
{
  const { ctx, p } = await entrar("Marina Alves");
  await conferir(p, "/agencia", "admin");
  const txt = await p.locator("main").innerText();
  if (!/Produção de/.test(txt) || !/Contratados no mês/.test(txt) || !/Peças atrasadas/.test(txt)) fail("cockpit sem a produção do mês"); else ok("cockpit com a produção do mês e atrasadas na fila do dia");
  await shot(p, "producao-01-cockpit", true);
  await conferir(p, "/agencia/producao", "admin");
  if ((await p.getByRole("heading", { level: 3 }).count()) < 9) fail("quadro sem as 9 etapas"); else ok("quadro com as etapas");
  await shot(p, "producao-02-quadro", true);
  await p.getByRole("button", { name: "Planejar o mês" }).click();
  await p.getByRole("button", { name: "Planejar", exact: true }).click();
  await p.getByText(/peça\(s\) criada\(s\)|já estava planejado/).first().waitFor({ timeout: 30000 });
  ok("planejar o mês respondeu");
  await conferir(p, "/agencia/producao?ver=lista&atrasadas=1", "admin");
  const lista = await p.locator("main").innerText();
  if (!/Vídeo do mês passado/.test(lista)) fail("atrasadas sem a herdada do mês anterior"); else ok("filtro de atrasadas mostra a peça herdada");
  await shot(p, "producao-03-lista-atrasadas", true);
  await ctx.close();
}

// 2. Editor: minha fila, conclui a edição e a peça vai para a revisão
let pecaUrl = "";
{
  const { ctx, p } = await entrar("Gabriel Nunes");
  await conferir(p, "/agencia/fila", "editor");
  await shot(p, "producao-04-minha-fila", true);
  await p.locator("a[href^='/agencia/producao/agpc_']").filter({ hasText: "Editando" }).first().click();
  await p.waitForURL(/\/agencia\/producao\/agpc_/); await p.waitForLoadState("networkidle");
  pecaUrl = new URL(p.url()).pathname;
  const v = await axeOf(p); if (v.length) fail(`peça: axe ${v.join(" | ")}`);
  await p.getByLabel("Link da versão editada").fill("https://drive.google.com/versao-e2e");
  await p.getByRole("button", { name: "Salvar conteúdo" }).click();
  await p.getByText("Salvo.").first().waitFor();
  await p.getByRole("button", { name: /Concluir e mandar para Revisão interna/ }).click();
  await p.getByText(/seguiu para Revisão interna/).first().waitFor();
  await p.waitForLoadState("networkidle");
  if (!/Revisão interna/.test(await p.locator("main").innerText())) fail("peça não foi para a revisão"); else ok("editor concluiu: a peça foi sozinha para a revisão interna");
  await shot(p, "producao-05-peca-revisao", true);
  await ctx.close();
}

// 3. Gestor pede ajuste: volta para a edição
{
  const { ctx, p } = await entrar("Rafael Prado");
  await p.goto(B + pecaUrl, { waitUntil: "networkidle" });
  await p.getByPlaceholder("O que precisa mudar").fill("Trocar a música de fundo");
  await p.getByRole("button", { name: "Pedir ajuste" }).click();
  await p.getByText(/voltou para a edição/).first().waitFor();
  await p.getByText(/Ajuste pedido na revisão interna: Trocar a música/).first().waitFor({ timeout: 20000 }).catch(() => {});
  const t = await p.locator("main").innerText();
  if (!/Ajustes/.test(t) || !/Trocar a música/.test(t)) fail("ajuste não registrado"); else ok("gestor pediu ajuste: voltou para a edição com o motivo no histórico");
  await ctx.close();
}

// 4. Celular
{
  const { ctx, p } = await entrar("Gabriel Nunes", 360, 2);
  for (const path of ["/agencia", "/agencia/fila", "/agencia/producao", pecaUrl]) await conferir(p, path, "editor 360");
  await p.goto(B + pecaUrl, { waitUntil: "networkidle" });
  await shot(p, "producao-06-peca-celular", true);
  ok("360 px conferido");
  await ctx.close();
}

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
