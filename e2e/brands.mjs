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
  const c = await ctxFor("nextlevelgroup.com.br", w); const p = await c.newPage();
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

const c = await ctxFor("www.nextlevelgroup.com.br"); const p = await c.newPage();
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
