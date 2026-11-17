/**
 * Painel da Agência (D313, AG1 e AG2): administradora vê o cockpit, a carteira, importa clientes pela planilha, abre a
 * ficha e a equipe; o editor vê só os clientes dele, sem valores, e não abre cliente de outra pessoa; o Master vê as
 * agências. Sem rolagem lateral em 360 px e axe sem violações graves.
 * Uso: AGENCIAS_V1=true no servidor; E2E_BASE=http://localhost:3100 SHOTS=/pasta node e2e/agencias.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✘", m); };
const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const shot = async (p, nome, full = false) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: full }); };

async function entrar(nome, w = 1440, scale = 2) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: scale, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => fail(`${nome} @${w}: erro na página ${e.message}`));
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(nome) }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.waitForLoadState("networkidle");
  return { ctx, p };
}
async function conferir(p, path, rotulo) {
  await p.goto(B + path, { waitUntil: "networkidle", timeout: 90000 });
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${rotulo} ${path}: rolagem horizontal`);
  const v = await axeOf(p); if (v.length) fail(`${rotulo} ${path}: axe ${v.join(" | ")}`);
}

// 1. Administradora (1440 px)
{
  const { ctx, p } = await entrar("Marina Alves");
  await conferir(p, "/agencia", "admin");
  const txt = await p.locator("main").innerText();
  if (!/Visão geral da agência/i.test(txt) || !/Receita contratada/.test(txt) || !/Carga da equipe/.test(txt) || !/Fila do dia/.test(txt) || !/Agência Fundadora/.test(txt)) fail("cockpit incompleto"); else ok("cockpit da administradora: receita, vencimentos, pendências e carga");
  await shot(p, "agencia-01-hoje", true);
  await conferir(p, "/agencia/clientes", "admin");
  await p.getByRole("button", { name: "Importar planilha" }).click();
  await p.getByLabel(/Cole a planilha/).fill("Cliente\tPacote\tValor\tVencimento\tVídeos\tResponsável\nClínica Bem Viver\tMensal 6\t2.100,00\t17\t6\tBeatriz\nAcademia Movimento\tMensal 12\t3200\t5\t12\tBeatriz\nX\t1\t1\t1\t1\t");
  await p.getByRole("button", { name: "Conferir" }).click();
  await p.getByRole("status").waitFor();
  const previa = await p.getByRole("status").innerText();
  if (!/1 cliente\(s\) novo\(s\)/.test(previa) || !/já na carteira/.test(previa) || !/Linha 4/.test(previa)) fail(`prévia da importação: ${previa}`); else ok("prévia da importação: 1 novo, 1 repetido, 1 linha com problema");
  await shot(p, "agencia-02-importar");
  await p.getByRole("button", { name: /Importar 1 cliente/ }).click();
  await p.getByText("Clínica Bem Viver").first().waitFor();
  ok("importação gravou o cliente novo");
  await shot(p, "agencia-03-clientes", true);
  await p.getByRole("link", { name: /Clínica Sorriso Leve/ }).click();
  await p.waitForURL(/\/agencia\/clientes\/agcl_/); await p.waitForLoadState("networkidle");
  const ficha = await p.locator("main").innerText();
  if (!/R\$\s?2\.500,00 por mês, vence todo dia 10/.test(ficha) || !/Equipe do cliente/.test(ficha)) fail("ficha sem contrato ou equipe"); else ok("ficha com contrato, equipe e situação");
  // Navegação pelo link: o título da aba chega um instante depois (metadados em fluxo); sem ele em 10 s, é falha.
  await p.waitForFunction(() => document.title.length > 0, null, { timeout: 10000 }).catch(() => fail("ficha sem título da aba"));
  const v = await axeOf(p); if (v.length) fail(`ficha: axe ${v.join(" | ")}`);
  await shot(p, "agencia-04-ficha", true);
  await conferir(p, "/agencia/equipe", "admin");
  await shot(p, "agencia-05-equipe", true);
  await ctx.close();
}

// 2. Administradora no celular (360 px)
{
  const { ctx, p } = await entrar("Marina Alves", 360, 2);
  for (const path of ["/agencia", "/agencia/clientes", "/agencia/equipe"]) await conferir(p, path, "admin 360");
  await p.goto(B + "/agencia", { waitUntil: "networkidle" });
  await shot(p, "agencia-06-hoje-celular", true);
  ok("360 px sem rolagem lateral");
  await ctx.close();
}

// 3. Editor: só os clientes dele, sem valores; cliente de outra pessoa não abre
{
  const { ctx, p } = await entrar("Gabriel Nunes");
  await conferir(p, "/agencia", "editor");
  const txt = await p.locator("main").innerText();
  if (/Receita contratada|R\$/.test(txt)) fail("editor vê valores"); else ok("editor não vê valores");
  if (!/Clínica Sorriso Leve/.test(txt) || /Padaria Trigo de Ouro/.test(txt)) fail("editor vê clientes errados"); else ok("editor vê só os clientes em que trabalha");
  await shot(p, "agencia-07-editor", true);
  // Padaria Trigo de Ouro é do outro editor: o link não existe e o endereço direto dá "não encontrado".
  const { ctx: c2, p: adm } = await entrar("Marina Alves", 1280, 1);
  await adm.goto(B + "/agencia/clientes", { waitUntil: "networkidle" });
  const href = await adm.getByRole("link", { name: /Padaria Trigo de Ouro/ }).getAttribute("href");
  await c2.close();
  const r = await p.goto(B + href, { waitUntil: "networkidle" });
  if (r?.status() !== 404) fail(`editor abriu cliente de outra pessoa (HTTP ${r?.status()})`); else ok("cliente de outra pessoa: 404");
  await ctx.close();
}

// 4. Master
{
  const { ctx, p } = await entrar("Equipe NextLevel");
  await p.goto(B + "/master/agencias", { waitUntil: "networkidle", timeout: 90000 });
  const txt = await p.locator("main").innerText();
  if (!/Agência Aurora \(demonstração\)/.test(txt) || !/Fundadora/.test(txt)) fail("Master não lista a agência"); else ok("Master vê a agência com carteira e equipe");
  await shot(p, "agencia-08-master");
  await ctx.close();
}

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log("\nTudo certo.");
