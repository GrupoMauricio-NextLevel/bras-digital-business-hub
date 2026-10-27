/**
 * W2 das melhorias (D185): um visitante abre a loja publicada da E-commerce vindo de uma campanha (utm_source) e vê um
 * produto; a análise do lojista mostra as visitas, a origem e o produto mais visitado. Um navegador-robô não conta.
 * Uso: E2E_CM=http://cm.test:3300 node e2e/w2-medir-a-loja.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-w2-medir-a-loja";
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
const numeroDe = async (p, rotulo) => Number(((await texto(p)).match(new RegExp(`${rotulo} ([\\d.]+)`))?.[1] ?? "0").replace(/\./g, ""));

const ctxL = await b.newContext({ viewport: { width: 1280, height: 900 } });
const l = await ctxL.newPage();
let slug = null, antes = 0;
await passo(l, "1. Lojista entra e anota as visitas de antes", async () => {
  await l.goto(CM + "/login", { waitUntil: "networkidle" });
  await l.fill("#email", "lojista@commerce.demo"); await l.fill("#password", "demo1234");
  await l.locator("form button[type=submit]").click(); await l.waitForURL(/\/merchant/, { timeout: 30000 });
  slug = await l.evaluate(() => [...document.querySelectorAll("a[href*='/store/']")].map((a) => a.getAttribute("href").match(/\/store\/([^/?#]+)/)?.[1]).find(Boolean));
  if (!slug) throw new Error("não achei o link da loja");
  await l.goto(CM + "/merchant/analytics", { waitUntil: "networkidle" });
  antes = await numeroDe(l, "Visitas · 30 dias");
  return `loja ${slug}, ${antes} visitas`;
});

const ctxV = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" });
const v = await ctxV.newPage();
await passo(v, "2. Visitante chega pela campanha do Instagram e abre um produto", async () => {
  await v.goto(`${CM}/store/${slug}?utm_source=instagram`, { waitUntil: "networkidle" });
  const href = await v.evaluate(() => document.querySelector("main a[href*='/product/']")?.getAttribute("href"));
  if (!href) throw new Error("a loja não mostra nenhum produto");
  await v.goto(new URL(href, v.url()).toString(), { waitUntil: "networkidle" });
  await v.waitForTimeout(800);
});
const ctxR = await b.newContext({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" });
const r = await ctxR.newPage();
await passo(r, "3. Robô abre a loja e não conta", async () => {
  await r.goto(`${CM}/store/${slug}`, { waitUntil: "networkidle" });
  await r.waitForTimeout(500);
});
await passo(l, "4. Análise mostra as visitas novas, a origem e o produto", async () => {
  await l.goto(CM + "/merchant/analytics", { waitUntil: "networkidle" });
  const depois = await numeroDe(l, "Visitas · 30 dias");
  if (depois !== antes + 2) throw new Error(`visitas: antes ${antes}, depois ${depois} (esperava exatamente +2: o robô não conta)`);
  const t = await texto(l);
  if (!/instagram/.test(t)) throw new Error("origem instagram não aparece");
  if (!/Produtos mais visitados/.test(t) || /Ainda sem visitas em páginas de produto/.test(t)) throw new Error("produto mais visitado não aparece");
  await l.evaluate(axeSource);
  const ax = await l.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id));
  if (ax.length) throw new Error(`axe: ${ax.join(", ")}`);
  await l.setViewportSize({ width: 360, height: 800 });
  const sobra = await l.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await l.screenshot({ path: `${OUT}/analise-360.png`, fullPage: true });
  await l.setViewportSize({ width: 1280, height: 900 });
  await l.screenshot({ path: `${OUT}/analise-1280.png`, fullPage: true });
  if (sobra > 1) throw new Error(`rolagem horizontal de ${sobra}px em 360`);
  return `${antes} → ${depois} visitas`;
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
