/**
 * Prompt de público e preço (D123 a D136): telas novas do Master, chaves ligadas pelo Master, benefícios e barra do
 * ecossistema no painel do lojista, fio do grupo na captação, página de ativação e rodapé da família nas páginas públicas.
 * Uso (servidor recém-reiniciado, banco de demonstração): E2E_BASE=http://localhost:3300 node e2e/precos-ecossistema.mjs
 * Capturas em E2E_SHOTS (padrão /tmp/precos-shots).
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3300";
const ARENA = "dono@arena10.demo"; const PASS = "demo1234";
const OUT = process.env.E2E_SHOTS ?? "/tmp/precos-shots"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✖", m); };
const ok = (m) => console.log("✔", m);
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}:${x.nodes.length}`)); };
const check = async (p, label, w) => {
  await p.waitForFunction(() => !document.querySelector("[data-sonner-toast]"), null, { timeout: 15000 }).catch(() => {});
  await p.waitForFunction(() => document.title.trim() !== "", null, { timeout: 15000 }).catch(() => {});
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${label} @${w}: rolagem horizontal`);
  const v = await axeOf(p); if (v.length) fail(`${label} @${w}: axe ${v.join(" | ")}`);
};
const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); };
const page = async (w) => { const c = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" }); const p = await c.newPage(); p.on("pageerror", (e) => fail(`pageerror @${w}: ${e.message}`)); return { c, p }; };
const login = async (p, email) => {
  await p.goto(`${B}/login`, { waitUntil: "networkidle" });
  await p.getByLabel("E-mail").fill(email); await p.getByLabel("Senha").fill("demo1234");
  await p.getByRole("button", { name: /^Entrar/ }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); await p.waitForLoadState("networkidle");
};

// 1. Master: telas novas, todas desligadas por padrão.
const m = await page(1440);
await login(m.p, "master@nextlevel.demo");
for (const [path, title, name] of [["/master/financeiro/precos", "Preços do grupo", "01-precos"], ["/master/financeiro/descoberta", "Descoberta: funil por marca", "02-descoberta"], ["/master/financeiro/proposta", "Proposta de preço", "03-proposta"], ["/master/financeiro/experimentos", "Experimentos", "04-experimentos"], ["/master/financeiro/ofertas", "Ofertas e comissões", "05-ofertas"], ["/master/ecossistema", "Torre do Ecossistema", "06-torre"]]) {
  await m.p.setViewportSize({ width: 1440, height: 900 });
  await m.p.goto(B + path, { waitUntil: "networkidle" });
  if (!(await m.p.getByRole("heading", { name: title, exact: true }).first().isVisible())) fail(`${path}: título "${title}" não aparece`);
  await check(m.p, path, 1440); await shot(m.p, `${name}-1440`);
  await m.p.setViewportSize({ width: 360, height: 900 });
  if (await m.p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${path} @360: rolagem horizontal`);
}
ok("Master: preços do grupo, descoberta, proposta, experimentos, ofertas e torre");

// 2. O Master liga benefícios, barra do ecossistema e o fio fora dos painéis.
await m.p.setViewportSize({ width: 1440, height: 900 });
await m.p.goto(`${B}/master/financeiro/descoberta`, { waitUntil: "networkidle" });
for (const formName of ["Benefícios nos painéis", "Barra do ecossistema"]) {
  const f = m.p.getByRole("form", { name: formName });
  for (const label of ["SuperDrop", "NextLevel E-commerce"]) { const cb = f.getByLabel(label, { exact: true }); if (!(await cb.isChecked())) await cb.check(); }
  await f.getByRole("button", { name: "Gravar" }).click();
  await m.p.getByText(/atualizad/).first().waitFor({ timeout: 30000 });
  await m.p.waitForTimeout(500);
}
const extras = m.p.getByRole("form", { name: "Fio do grupo fora dos painéis" });
for (const sw of [/Páginas de cadastro/, /Rodapé do grupo nos e-mails/, /Páginas públicas das marcas/]) await extras.getByRole("switch", { name: sw }).click();
await extras.getByRole("button", { name: "Gravar" }).click();
await m.p.getByText("Fio do grupo atualizado").first().waitFor({ timeout: 30000 });
await m.c.close();
ok("Master ligou benefícios, barra e fio do grupo");

// 3. Lojista do SuperDrop: benefícios e barra do ecossistema; o lançador abre e fecha.
for (const w of [390, 1440]) {
  const l = await page(w);
  await login(l.p, "dono@mantosshop.demo");
  await l.p.goto(`${B}/merchant`, { waitUntil: "networkidle" });
  if (!(await l.p.locator("[data-beneficios]").count())) fail(`lojista @${w}: benefícios não aparecem`);
  if (!(await l.p.locator("[data-ecossistema]").count())) fail(`lojista @${w}: barra do ecossistema não aparece`);
  await check(l.p, "lojista com benefícios", w); await shot(l.p, `07-lojista-${w}`);
  await l.p.getByRole("button", { name: "Marcas do grupo" }).click();
  const d = l.p.getByRole("dialog", { name: "Marcas do Grupo NextLevel" });
  await d.waitFor({ timeout: 15000 });
  await check(l.p, "lançador aberto", w); await l.p.screenshot({ path: `${OUT}/08-lancador-${w}.png` });
  await l.p.keyboard.press("Escape");
  await d.waitFor({ state: "hidden", timeout: 15000 }).catch(() => fail(`lançador @${w}: Esc não fecha`));
  await l.c.close();
}
ok("lojista: benefícios, barra e lançador");

// 3b. Conta do grupo (D141): o lojista liga outro perfil (com a senha dele e o aceite) e troca sem novo login.
{
  const g = await page(1440);
  await login(g.p, "dono@mantosshop.demo");
  await g.p.goto(`${B}/account/marcas`, { waitUntil: "networkidle" });
  await check(g.p, "suas marcas", 1440);
  await g.p.getByLabel("E-mail do outro perfil").fill(ARENA);
  await g.p.getByLabel("Senha do outro perfil").fill(PASS);
  await g.p.getByRole("checkbox").check();
  await g.p.getByRole("button", { name: "Ligar perfil" }).click();
  await g.p.getByText("Perfis ligados (2)").waitFor({ timeout: 20000 }).catch(() => fail("conta do grupo: o perfil não foi ligado"));
  await shot(g.p, "07b-suas-marcas-1440");
  await g.p.getByRole("button", { name: /^Entrar no perfil/ }).click();
  await g.p.waitForURL((u) => u.pathname.startsWith("/merchant"), { timeout: 30000 }).catch(() => fail("conta do grupo: a troca de perfil não abriu o painel"));
  await g.c.close();
  const n = await page(390);
  await login(n.p, "dono@mantosshop.demo");
  await n.p.goto(`${B}/account/marcas`, { waitUntil: "networkidle" });
  await check(n.p, "suas marcas", 390);
  await n.c.close();
}
ok("conta do grupo: ligar perfil e trocar sem novo login");

// 4. Captação e páginas públicas (sem login): fio do grupo, ativação e rodapé da família.
for (const w of [390, 1440]) {
  const v = await page(w);
  await v.p.goto(`${B}/cadastro`, { waitUntil: "networkidle" });
  if (!(await v.p.locator("[data-fio-captacao]").count())) fail(`cadastro @${w}: fio do grupo não aparece`);
  await check(v.p, "cadastro com fio", w); await shot(v.p, `09-cadastro-${w}`);
  await v.p.goto(`${B}/ativar?de=BRAS_DIGITAL`, { waitUntil: "networkidle" });
  if (!(await v.p.getByRole("heading", { level: 1 }).isVisible())) fail(`ativar @${w}: sem título`);
  await check(v.p, "ativar", w); await shot(v.p, `10-ativar-${w}`);
  await v.p.goto(`${B}/`, { waitUntil: "networkidle" });
  if (!(await v.p.locator("[data-familia-grupo]").count())) fail(`home @${w}: rodapé da família não aparece`);
  await check(v.p, "home com rodapé da família", w); await shot(v.p, `11-home-${w}`);
  await v.c.close();
}
ok("captação, ativação e páginas públicas");

await b.close();
console.log(bad.length ? `\n${bad.length} problema(s)` : `\nTudo certo. Capturas em ${OUT}`);
process.exit(bad.length ? 1 : 0);
