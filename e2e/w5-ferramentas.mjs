/**
 * W5 das melhorias (D188): calculadoras no painel e na página pública, calendário do varejo e central de aplicativos.
 * Cada tela passa pelo axe e pela checagem de 360 px; a calculadora reage ao que se digita.
 * Uso: E2E_CM=http://cm.test:3300 node e2e/w5-ferramentas.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-w5";
mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${CM}`] });
const log = [], tropecos = [];
let n = 0;
async function passo(p, nome, fn) {
  try { const nota = await fn(); log.push({ nome, ok: true, nota: nota ?? null }); console.log("✔", nome, nota ? `· ${nota}` : ""); }
  catch (e) {
    const shot = `${OUT}/tropeco-${String(++n).padStart(2, "0")}.png`;
    await p.screenshot({ path: shot, fullPage: true }).catch(() => {});
    const msg = String(e?.message ?? e).split("\n")[0].slice(0, 220);
    tropecos.push({ nome, msg, url: p.url(), shot }); log.push({ nome, ok: false, msg }); console.log("✘", nome, "·", msg);
  }
}
const texto = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
async function conferirTela(p, rotulo) {
  await p.waitForTimeout(800);
  await p.evaluate(axeSource);
  const v = await p.evaluate(async () => (await window.axe.run({ exclude: [["[data-sonner-toast][data-front='false']"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id} ${x.nodes[0]?.target?.join(" ") ?? ""}`));
  if (v.length) throw new Error(`${rotulo}: axe ${v.join(", ")}`);
  await p.setViewportSize({ width: 360, height: 800 });
  const sobra = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${OUT}/${rotulo}-360.png`, fullPage: true });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.screenshot({ path: `${OUT}/${rotulo}-1280.png`, fullPage: true });
  if (sobra > 1) throw new Error(`${rotulo}: rolagem horizontal de ${sobra}px em 360`);
}

const pub = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await passo(pub, "1. Página pública de calculadoras responde ao que se digita", async () => {
  await pub.goto(CM + "/ferramentas", { waitUntil: "networkidle" });
  await pub.getByLabel("Custo da peça").fill("100");
  await pub.getByLabel("Embalagem e outros por peça").fill("0");
  await pub.getByLabel("Taxas sobre a venda (pagamento, plataforma)").fill("0");
  await pub.getByLabel("Margem que você quer").fill("50");
  await pub.waitForFunction(() => /Preço sugerido:\s*R\$\s*200,00/.test(document.body.innerText), null, { timeout: 5000 });
  if (/garant|ganhe/i.test(await texto(pub))) throw new Error("promessa na página");
  await conferirTela(pub, "ferramentas-publicas");
});

const l = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await passo(l, "2. Lojista: ferramentas e calendário do varejo", async () => {
  await l.goto(CM + "/login", { waitUntil: "networkidle" });
  await l.fill("#email", "lojista@commerce.demo"); await l.fill("#password", "demo1234");
  await l.locator("form button[type=submit]").click(); await l.waitForURL(/\/merchant/, { timeout: 30000 });
  await l.goto(CM + "/merchant/ferramentas", { waitUntil: "networkidle" });
  const t = await texto(l);
  for (const x of ["Preço com margem", "Simulador de promoção", "Frete grátis a partir de", "Ponto de equilíbrio", "Calendário do varejo", "Black Friday"]) if (!t.includes(x)) throw new Error(`falta "${x}"`);
  await conferirTela(l, "ferramentas");
});
await passo(l, "3. Central de aplicativos com estados reais e em breve", async () => {
  await l.goto(CM + "/merchant/aplicativos", { waitUntil: "networkidle" });
  const t = await texto(l);
  if (!/Mercado Pago/.test(t) || !/Em breve/.test(t) || !/Balcão/.test(t)) throw new Error("central incompleta");
  await conferirTela(l, "aplicativos");
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
