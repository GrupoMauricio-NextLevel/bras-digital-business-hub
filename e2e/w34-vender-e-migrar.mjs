/**
 * W3 e W4 das melhorias (D186, D187) na E-commerce:
 * - checkout com o pedido de lembrete de carrinho (desmarcado);
 * - "Compre junto" no produto do lojista;
 * - "Migrar e anunciar": endereço antigo que redireciona, lista do Google Shopping, Pixel e loja em lançamento com
 *   lista de espera para o público.
 * Cada tela do lojista passa pelo axe e pela checagem de 360 px.
 * Uso: E2E_CM=http://cm.test:3300 node e2e/w34-vender-e-migrar.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-w34";
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
  await p.waitForTimeout(1200);
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

const ctxL = await b.newContext({ viewport: { width: 1280, height: 900 } });
const l = await ctxL.newPage();
l.on("dialog", (d) => d.accept());
let slug = null;
await passo(l, "1. Lojista entra", async () => {
  await l.goto(CM + "/login", { waitUntil: "networkidle" });
  await l.fill("#email", "lojista@commerce.demo"); await l.fill("#password", "demo1234");
  await l.locator("form button[type=submit]").click(); await l.waitForURL(/\/merchant/, { timeout: 30000 });
  slug = await l.evaluate(() => [...document.querySelectorAll("a[href*='/store/']")].map((a) => a.getAttribute("href").match(/\/store\/([^/?#]+)/)?.[1]).find(Boolean));
  return slug;
});
await passo(l, "2. Compre junto e prazo de produção no produto", async () => {
  await l.goto(CM + "/merchant/catalogo", { waitUntil: "networkidle" });
  const href = await l.evaluate(() => [...document.querySelectorAll("main a[href^='/merchant/catalogo/']")].map((a) => a.getAttribute("href")).find((h) => /\/merchant\/catalogo\/(?!new|categorias|import)[^/]+$/.test(h)));
  if (!href) throw new Error("sem produto para abrir");
  await l.goto(CM + href, { waitUntil: "networkidle" });
  await l.getByRole("heading", { name: "Compre junto e prazo de produção" }).waitFor({ timeout: 15000 });
  const caixa = l.locator("#venda-junto-t").locator("xpath=..").locator("input[type=checkbox]").first();
  if (await caixa.count()) await caixa.check();
  await l.getByLabel("Dias de produção (0 = pronta entrega)").fill("2");
  await l.locator("#venda-junto-t").locator("xpath=..").getByRole("button", { name: "Salvar" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Salvo"), null, { timeout: 15000 });
  await conferirTela(l, "produto-compre-junto");
});
await passo(l, "3. Migrar e anunciar: endereço antigo, Google e Pixel", async () => {
  await l.goto(CM + "/merchant/migrar", { waitUntil: "networkidle" });
  await l.getByLabel("Endereços (antigo;novo)").fill("/produto/antigo-teste;/catalog");
  await l.getByRole("button", { name: "Salvar endereços" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("/produto/antigo-teste"), null, { timeout: 15000 });
  if (!(await texto(l)).includes(`/store/${slug}/feed.xml`) && !(await texto(l)).includes("/feed.xml")) throw new Error("endereço do feed não aparece");
  await l.getByLabel("Número do pixel").fill("123456789012345");
  await l.locator("#meta").getByRole("button", { name: "Salvar" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Pixel salvo"), null, { timeout: 15000 });
  await conferirTela(l, "migrar");
});

const ctxV = await b.newContext({ viewport: { width: 390, height: 844 } });
const v = await ctxV.newPage();
await passo(v, "4. Endereço antigo leva ao novo; feed do Google responde", async () => {
  const r = await v.goto(`${CM}/store/${slug}/produto/antigo-teste?utm_source=google`, { waitUntil: "networkidle" });
  if (!/\/catalog/.test(v.url())) throw new Error(`não redirecionou: ${v.url()} (${r?.status()})`);
  const pixel = await v.evaluate(() => typeof window.fbq === "function");
  const feed = await v.goto(`${CM}/store/${slug}/feed.xml`);
  const corpo = (await feed?.text()) ?? "";
  if (feed?.status() !== 200 || !corpo.includes("<g:price>")) throw new Error(`feed: ${feed?.status()}`);
  return `pixel carregado: ${pixel}`;
});
await passo(v, "5. Checkout mostra o pedido de lembrete desmarcado", async () => {
  await v.goto(`${CM}/store/${slug}`, { waitUntil: "networkidle" });
  const href = await v.evaluate(() => document.querySelector("main a[href*='/product/']")?.getAttribute("href"));
  await v.goto(new URL(href, v.url()).toString(), { waitUntil: "networkidle" });
  const add = v.getByRole("button", { name: /Adicionar ao carrinho|Comprar/ }).first();
  const tamanho = v.locator("button[aria-pressed], [role=radio]").first();
  if (await tamanho.count()) await tamanho.click().catch(() => {});
  await add.click();
  await v.goto(`${CM}/store/${slug}/checkout`, { waitUntil: "networkidle" });
  const lembrete = v.getByLabel(/pode me lembrar por e-mail/);
  if (!(await lembrete.count())) throw new Error("caixa de lembrete não aparece");
  if (await lembrete.isChecked()) throw new Error("caixa de lembrete veio marcada");
});
await passo(l, "6. Loja em lançamento: público vê a lista de espera, o dono vê a loja", async () => {
  await l.goto(CM + "/merchant/migrar#lancamento", { waitUntil: "networkidle" });
  await l.getByRole("button", { name: "Colocar a loja em lançamento" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Abrir a loja para o público"), null, { timeout: 15000 });
  await v.goto(`${CM}/store/${slug}`, { waitUntil: "networkidle" });
  if (!/abre em breve/.test(await texto(v))) throw new Error("público não vê a página de espera");
  const espera = v.locator("section[aria-labelledby='espera-t']");
  await espera.getByLabel("E-mail", { exact: true }).fill("espera@cliente.dev");
  await espera.getByLabel(/Aceito receber o aviso/).check();
  await espera.getByRole("button", { name: "Quero ser avisado" }).click();
  await v.waitForFunction(() => document.body.innerText.includes("Você vai receber o aviso"), null, { timeout: 15000 });
  await conferirTela(v, "lista-de-espera");
  await l.goto(`${CM}/store/${slug}`, { waitUntil: "networkidle" });
  if (!/Loja em lançamento/.test(await texto(l))) throw new Error("dono não vê o aviso de lançamento");
  // Devolve a demonstração como estava.
  await l.goto(CM + "/merchant/migrar#lancamento", { waitUntil: "networkidle" });
  await l.getByRole("button", { name: "Abrir a loja para o público" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Colocar a loja em lançamento"), null, { timeout: 15000 });
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
