// NextLevel Cargas (D108): página pública, fronteira de páginas e cadastro de interesse.
// Servidor com BRAND_DOMAINS_NEXTLEVEL_CARGAS=127.0.0.1 (127.0.0.1 faz o papel do endereço da Cargas).
// Uso: E2E_BASE=http://127.0.0.1:3500 node e2e/cargas-portal.mjs
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const B = process.env.E2E_BASE ?? "http://127.0.0.1:3500";
const OUT = process.env.E2E_SHOTS ?? "/tmp/cargas-shots"; mkdirSync(OUT, { recursive: true });
const axe = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const fail = (m) => { console.error(`✘ ${m}`); process.exitCode = 1; };
const ok = (m) => console.log(`✔ ${m}`);

for (const w of [360, 768, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(B + "/", { waitUntil: "networkidle" });
  if (!(await p.title()).startsWith("NextLevel Cargas")) fail(`${w}: título não é da Cargas`);
  if ((await p.evaluate(() => document.documentElement.scrollWidth)) > w) fail(`${w}: rolagem lateral`);
  await p.addScriptTag({ content: axe });
  const v = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.filter((x) => x.impact === "serious" || x.impact === "critical").map((x) => x.id));
  if (v.length) fail(`${w}: acessibilidade ${v.join(", ")}`);
  if (/SuperDrop/.test(await p.locator("main").innerText())) fail(`${w}: texto do SuperDrop na Cargas`);
  await p.screenshot({ path: `${OUT}/cargas-${w}.png`, fullPage: w === 1440 });
  await p.close();
}
ok("página pública em 360/768/1440");

{
  const p = await b.newPage();
  for (const path of ["/planos", "/solucoes", "/cadastro"]) { await p.goto(B + path, { waitUntil: "networkidle" }); if (new URL(p.url()).pathname !== "/") fail(`${path} deveria voltar ao início`); }
  await p.close();
}
ok("só a página inicial é pública");

{
  const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto(B + "/#cadastro", { waitUntil: "networkidle" });
  await p.getByLabel("Seu nome").fill("Carlos Souza");
  await p.getByLabel("Nome da empresa").fill("Rota Sul Transportes");
  await p.getByLabel("CNPJ", { exact: true }).fill("11.222.333/0001-81");
  await p.getByLabel("WhatsApp", { exact: true }).fill("41988887777");
  await p.getByLabel("E-mail", { exact: true }).fill(`carlos+${Date.now()}@rotasul.teste`);
  await p.getByRole("button", { name: "Quero entrar na primeira rodada" }).click();
  await p.getByRole("alert").filter({ hasText: /estado que você atende/ }).waitFor({ timeout: 15000 });
  await p.locator("label.cg-opt", { hasText: /^PR$/ }).click();
  await p.locator("label.cg-opt", { hasText: "Truck" }).click();
  await p.getByRole("button", { name: "Quero entrar na primeira rodada" }).click();
  await p.getByText("Cadastro recebido!").waitFor({ timeout: 15000 });
  await p.screenshot({ path: `${OUT}/cargas-cadastro-ok.png` });
  await p.close();
}
ok("cadastro de interesse");
await b.close();
if (!process.exitCode) console.log("\nTudo certo. Capturas em " + OUT);
