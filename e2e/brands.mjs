/**
 * N0: marcas por domínio. O mesmo servidor responde como NextLevel Commerce (nextlevelgroup.com.br) ou SuperDrop (padrão).
 * Simula o domínio com o cabeçalho x-forwarded-host. Uso: E2E_BASE=http://localhost:3100 node e2e/brands.mjs
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const axe = async (p) => { await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const ctxFor = (host, w = 1280) => b.newContext({ viewport: { width: w, height: 900 }, extraHTTPHeaders: host ? { "x-forwarded-host": host } : {} });

// NextLevel Commerce (domínio da holding usado para lojas virtuais)
for (const w of [390, 1280]) {
  const c = await ctxFor("lojas.nextlevelgroup.com.br", w); const p = await c.newPage();
  p.on("pageerror", (e) => fail("pageerror commerce: " + e.message));
  await p.goto(B + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1000);
  const h1 = await p.getByRole("heading", { level: 1 }).innerText();
  if (!/loja virtual/i.test(h1)) fail(`@${w}: h1 da marca errado: ${h1}`);
  if (/SuperDrop/.test(await p.locator("body").innerText())) fail(`@${w}: SuperDrop apareceu no portal da NextLevel Commerce`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`@${w}: rolagem horizontal`);
  if (!(await p.title()).includes("NextLevel Commerce")) fail(`@${w}: título sem a marca: ${await p.title()}`);
  const v = await axe(p); if (v.length) fail(`@${w}: axe ${v.join(" | ")}`);
  await c.close();
}
ok("portal NextLevel Commerce (390 e 1280): título, texto, sem SuperDrop, sem rolagem, axe limpo");

const c = await ctxFor("lojas.nextlevelgroup.com.br"); const p = await c.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
for (const [path, expect] of [["/cadastro", "/quero-minha-loja"], ["/seja-fornecedor", "/"], ["/como-funciona", "/"], ["/parceiros", "/"]]) {
  await p.goto(B + path, { waitUntil: "networkidle" });
  const u = new URL(p.url()).pathname; if (u !== expect) fail(`${path} deveria ir para ${expect} e foi para ${u}`);
}
ok("páginas de outra marca redirecionam (cadastro fechado, fornecedor e parceiros)");
await p.goto(B + "/planos", { waitUntil: "networkidle" });
if (!(await p.getByText("Os planos da NextLevel Commerce").count())) fail("planos sem a variante da marca");
await p.goto(B + "/faq", { waitUntil: "networkidle" });
if (!(await p.getByText("O que é a NextLevel Commerce?").count())) fail("faq sem a variante da marca");

// Prévia por caminho: superdrop.com.br/lojas mostra a NextLevel Commerce; /lojas/sair volta ao SuperDrop
const pv = await ctxFor(null); const pp = await pv.newPage();
await pp.goto(B + "/lojas", { waitUntil: "networkidle" });
if (new URL(pp.url()).pathname !== "/") fail("/lojas deveria levar ao início: " + pp.url());
if (!/loja virtual/i.test(await pp.getByRole("heading", { level: 1 }).innerText())) fail("/lojas não mostrou a NextLevel Commerce");
await pp.goto(B + "/planos", { waitUntil: "networkidle" });
if (!(await pp.getByText("Os planos da NextLevel Commerce").count())) fail("prévia não vale nas outras páginas");
await pp.goto(B + "/lojas/sair", { waitUntil: "networkidle" });
if (!/sem estoque/i.test(await pp.getByRole("heading", { level: 1 }).innerText())) fail("/lojas/sair não voltou ao SuperDrop");
await pv.close();
ok("prévia por caminho: /lojas liga a NextLevel Commerce e /lojas/sair volta ao SuperDrop");

// Cada marca é uma casa: conta presa à marca, painel com a cara da marca, menu sem o que a marca não usa
const lc = await ctxFor("lojas.nextlevelgroup.com.br"); const lp = await lc.newPage();
lp.on("pageerror", (e) => fail("pageerror login commerce: " + e.message));
const tryLogin = async (pg, email) => { await pg.goto(B + "/login", { waitUntil: "networkidle" }); await pg.getByLabel("E-mail").fill(email); await pg.getByLabel("Senha").fill("demo1234"); await pg.getByRole("button", { name: /Entrar/ }).click(); };
await lp.goto(B + "/login", { waitUntil: "networkidle" });
if (!(await lp.getByRole("img", { name: /NextLevel Commerce/ }).count())) fail("login da Commerce sem a logo da marca");
if (/SuperDrop/.test(await lp.locator("body").innerText())) fail("login da Commerce mostra SuperDrop");
await tryLogin(lp, "dono@mantosshop.demo");
await lp.waitForSelector("text=Sua conta é da SuperDrop", { timeout: 30000 }); ok("lojista do SuperDrop não entra pelo endereço da Commerce e vê o endereço certo");
await tryLogin(lp, "master@nextlevel.demo");
await lp.waitForURL(/\/master\/commerce/, { timeout: 60000 }); await lp.waitForLoadState("networkidle");
const menu = await lp.locator("aside").first().innerText();
for (const t of ["Fornecedores", "Redes"]) if (menu.includes(t)) fail(`menu do Master na Commerce mostra "${t}"`);
if (!menu.includes("NextLevel Commerce")) fail("menu do Master na Commerce sem a área da marca");
ok("Master na Commerce abre na área da marca e o menu não tem fornecedores nem redes");
await lc.close();
const sc = await ctxFor("superdrop.com.br"); const sdp = await sc.newPage();
await tryLogin(sdp, "master@nextlevel.demo");
await sdp.waitForURL((u) => u.pathname === "/master", { timeout: 60000 }); await sdp.waitForLoadState("networkidle");
const menu2 = await sdp.locator("aside").first().innerText();
for (const t of ["Fornecedores", "Redes"]) if (!menu2.includes(t)) fail(`menu do Master no SuperDrop sem "${t}"`);
if (menu2.includes("NextLevel Commerce")) fail("menu do SuperDrop mostra a área da Commerce");
ok("Master no SuperDrop mantém fornecedores e redes e não mistura a Commerce");
await sc.close();

// Produtos novos (em breve) e Master central, cada um no seu endereço
for (const [host, nome, extra] of [["hubcreators.nextlevelgroup.com.br", "Hub Creators", null], ["bras.nextlevelgroup.com.br", "Brás Digital", null], ["chinahubglobal.com.br", "China Hub", "把货卖到巴西"]]) {
  const sc2 = await ctxFor(host, 390); const sp2 = await sc2.newPage();
  sp2.on("pageerror", (e) => fail(`pageerror ${host}: ` + e.message));
  await sp2.goto(B + "/", { waitUntil: "networkidle" });
  const txt = await sp2.locator("body").innerText();
  if (!txt.includes("Em breve")) fail(`${host}: sem o aviso "Em breve"`);
  if (/SuperDrop/.test(txt) && nome !== "Brás Digital") fail(`${host}: mostra SuperDrop`);
  if (extra && !txt.includes(extra)) fail(`${host}: sem o texto em mandarim`);
  if (!(await sp2.title()).includes(nome)) fail(`${host}: título sem a marca: ` + (await sp2.title()));
  if (await sp2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${host}: rolagem horizontal`);
  const ax = await axe(sp2); if (ax.length) fail(`${host}: axe ${ax.join(" | ")}`);
  await sp2.goto(B + "/planos", { waitUntil: "networkidle" });
  if (new URL(sp2.url()).pathname !== "/") fail(`${host}: /planos deveria voltar à página inicial`);
  await sc2.close();
}
ok("Brás Digital, Hub Creators e China Hub: página 'em breve' própria, sem SuperDrop, sem rolagem, axe limpo");
const mhc = await ctxFor("master.nextlevelgroup.com.br"); const mhp = await mhc.newPage();
await mhp.goto(B + "/planos", { waitUntil: "networkidle" });
if (new URL(mhp.url()).pathname !== "/login") fail("Master central: página pública deveria ir ao login: " + mhp.url());
await mhp.getByLabel("E-mail").fill("dono@mantosshop.demo"); await mhp.getByLabel("Senha").fill("demo1234"); await mhp.getByRole("button", { name: /Entrar/ }).click();
await mhp.waitForSelector("text=só da equipe NextLevel", { timeout: 30000 });
await mhp.getByLabel("E-mail").fill("master@nextlevel.demo"); await mhp.getByRole("button", { name: /Entrar/ }).click();
await mhp.waitForURL((u) => u.pathname === "/master", { timeout: 60000 }); await mhp.waitForLoadState("networkidle");
const menu3 = await mhp.locator("aside").first().innerText();
for (const t of ["Fornecedores", "NextLevel Commerce", "Lojas"]) if (!menu3.includes(t)) fail(`Master central sem "${t}" no menu`);
ok("Master central: só a equipe entra, e o menu mostra todos os produtos");
await mhc.close();

// Lista de espera
await p.goto(B + "/quero-minha-loja", { waitUntil: "networkidle" });
const RUN = Date.now().toString().slice(-6);
await p.getByLabel("Seu nome").fill("Lojista do Brás " + RUN); await p.getByLabel("E-mail").fill(`bras-${RUN}@teste.com`); await p.getByLabel(/WhatsApp/).fill("11958784061");
await p.getByLabel(/Nome da loja/).fill("Loja do Brás " + RUN); await p.getByLabel(/O que você vende/).fill("moda feminina");
await p.getByRole("button", { name: "Enviar" }).click();
await p.waitForSelector("text=Recebemos o seu contato", { timeout: 30000 });
ok("formulário 'Quero minha loja' registra o interessado");

// SuperDrop segue como antes no endereço padrão
const d = await ctxFor(null); const sp = await d.newPage();
await sp.goto(B + "/", { waitUntil: "networkidle" });
if (!/sem estoque/i.test(await sp.getByRole("heading", { level: 1 }).innerText())) fail("home do SuperDrop mudou");
if (!(await sp.title()).includes("SuperDrop")) fail("título do SuperDrop mudou");
for (const path of ["/cadastro", "/seja-fornecedor", "/parceiros"]) { await sp.goto(B + path, { waitUntil: "networkidle" }); if (new URL(sp.url()).pathname !== path) fail(`SuperDrop: ${path} foi redirecionado`); }
ok("SuperDrop continua igual no endereço padrão");

// Master: interessados e filtro de marca
const login = async (pg, name) => { await pg.goto(B + "/login", { waitUntil: "networkidle" }); await pg.getByRole("button", { name }).first().click(); await pg.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); await pg.waitForLoadState("networkidle"); };
const mc = await ctxFor(null); const m = await mc.newPage();
m.on("pageerror", (e) => fail("pageerror master: " + e.message));
await login(m, /Equipe NextLevel/);
await m.goto(B + "/master/crm?tab=interessados", { waitUntil: "networkidle" });
if (!(await m.getByText(`Lojista do Brás ${RUN}`).count())) fail("interessado não apareceu no CRM");
else { await m.getByRole("button", { name: "Em contato" }).first().click(); await m.waitForSelector('[aria-pressed="true"]:has-text("Em contato")', { timeout: 20000 }).catch(() => fail("status do interessado não mudou")); }
await m.goto(B + "/master/stores?marca=NEXTLEVEL_COMMERCE", { waitUntil: "networkidle" });
await m.goto(B + "/master/office?tab=assinaturas&marca=SUPERDROP", { waitUntil: "networkidle" });
if (!(await m.getByRole("heading", { name: "Escritório virtual" }).count())) fail("escritório com filtro de marca quebrou");
ok("Master: interessados no CRM e filtros por marca");
const v = await axe(m); if (v.length) fail("axe master: " + v.join(" | ")); else ok("axe do Master sem violações graves");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("MARCAS OK");
