/**
 * Rodada A das integrações (D189) na E-commerce: o lojista cola os códigos em "Migrar e anunciar" (o formato errado é
 * recusado na hora), a loja publicada carrega os scripts oficiais, o manifesto do celular e a janela de 18 anos, e a
 * central de aplicativos acende os cartões. No fim tudo é desligado de novo. Telas com axe e checagem de 360 px.
 * Os endereços dos parceiros (Google, TikTok, chat) são bloqueados: o teste confere só que a loja pediu o script certo.
 * Uso: E2E_CM=http://cm.test:3300 node e2e/rodada-a-integracoes.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-rodada-a";
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

const PARCEIROS = /googletagmanager\.com|analytics\.tiktok\.com|s\.pinimg\.com|embed\.tawk\.to|code\.jivosite\.com/;
const ctxL = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctxL.route(PARCEIROS, (r) => r.abort());
const l = await ctxL.newPage();
let slug = null;
await passo(l, "1. Lojista entra", async () => {
  await l.goto(CM + "/login", { waitUntil: "networkidle" });
  await l.fill("#email", "lojista@commerce.demo"); await l.fill("#password", "demo1234");
  await l.locator("form button[type=submit]").click(); await l.waitForURL(/\/merchant/, { timeout: 30000 });
  slug = await l.evaluate(() => [...document.querySelectorAll("a[href*='/store/']")].map((a) => a.getAttribute("href").match(/\/store\/([^/?#]+)/)?.[1]).find(Boolean));
  return slug;
});
await passo(l, "2. Código em formato errado é recusado na tela", async () => {
  await l.goto(CM + "/merchant/migrar#integracoes", { waitUntil: "networkidle" });
  await l.fill("input[name=ga4]", "<script>alert(1)</script>");
  await l.getByRole("button", { name: "Salvar integrações" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("formato inválido"), null, { timeout: 10000 });
  if (await l.locator("input[name=ga4][aria-invalid=true]").count() !== 1) throw new Error("campo não ficou marcado");
});
await passo(l, "3. Salva Google, TikTok, chat, celular e 18 anos", async () => {
  await l.fill("input[name=ga4]", "g-abc123xyz");
  await l.fill("input[name=googleVerificacao]", '<meta name="google-site-verification" content="AbCdEf_123-456ghIJKlmnOP" />');
  await l.fill("input[name=tiktokPixel]", "C1ABCDEFGHIJ2KLMNOPQ");
  await l.selectOption("select[name=chatProvedor]", "TAWK");
  await l.fill("input[name=chatId]", "https://embed.tawk.to/64f0c0ffee0123456789abcd/1h2j3k4l5");
  await l.check("input[name=pwa]"); await l.check("input[name=maioridade]");
  await l.getByRole("button", { name: "Salvar integrações" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Integrações salvas"), null, { timeout: 15000 });
  await l.reload({ waitUntil: "networkidle" });
  if (await l.inputValue("input[name=ga4]") !== "G-ABC123XYZ") throw new Error("o código não voltou limpo");
  if (await l.inputValue("input[name=googleVerificacao]") !== "AbCdEf_123-456ghIJKlmnOP") throw new Error("a meta tag não virou só o código");
  await conferirTela(l, "migrar-integracoes");
});
await passo(l, "4. Central de aplicativos acende os cartões", async () => {
  await l.goto(CM + "/merchant/aplicativos", { waitUntil: "networkidle" });
  const t = await texto(l);
  for (const x of ["Google Analytics 4", "Pixel do TikTok", "Chat ao vivo", "Loja instalável no celular", "Confirmação de 18 anos"]) if (!t.includes(x)) throw new Error(`falta "${x}"`);
  await conferirTela(l, "aplicativos");
});

// Visitante da loja publicada.
const ctxV = await b.newContext({ viewport: { width: 1280, height: 900 } });
const pedidos = [];
await ctxV.route(PARCEIROS, (r) => { pedidos.push(r.request().url()); return r.abort(); });
const v = await ctxV.newPage();
await passo(v, "5. Loja pede 18 anos na primeira visita e carrega os scripts oficiais", async () => {
  await v.goto(`${CM}/store/${slug}`, { waitUntil: "networkidle" });
  await v.waitForSelector("[data-maioridade] [role=dialog]", { timeout: 10000 });
  await conferirTela(v, "loja-maioridade");
  const meta = await v.locator("meta[name='google-site-verification']").getAttribute("content");
  if (meta !== "AbCdEf_123-456ghIJKlmnOP") throw new Error(`meta do Search Console: ${meta}`);
  const ids = await v.evaluate(() => ["nl-gtag", "nl-tiktok", "nl-chat"].filter((id) => document.getElementById(id)));
  if (ids.length !== 3) throw new Error(`scripts carregados: ${ids.join(", ")}`);
  if (!pedidos.some((u) => u.includes("gtag/js?id=G-ABC123XYZ")) || !pedidos.some((u) => u.includes("embed.tawk.to/64f0c0ffee0123456789abcd/1h2j3k4l5"))) throw new Error(`pedidos: ${pedidos.join(" ")}`);
  await v.getByRole("button", { name: "Sim, tenho" }).click();
  await v.waitForSelector("[data-maioridade]", { state: "detached", timeout: 5000 });
  await v.reload({ waitUntil: "networkidle" });
  if (await v.locator("[data-maioridade]").count()) throw new Error("perguntou de novo depois de confirmar");
  await conferirTela(v, "loja-depois");
});
await passo(v, "6. Manifesto e ícone da loja instalável", async () => {
  const href = await v.locator("link[rel=manifest]").getAttribute("href");
  if (href !== `/store/${slug}/manifest.webmanifest`) throw new Error(`manifest: ${href}`);
  await v.goto(CM + href);
  const m = JSON.parse(await v.evaluate(() => document.body.innerText));
  if (m.display !== "standalone" || !m.icons?.length) throw new Error("manifesto incompleto");
  const r = await v.goto(`${CM}/store/${slug}/icone.svg`);
  if (r.status() !== 200 || !/svg/.test(r.headers()["content-type"])) throw new Error("ícone não abriu");
  return m.name;
});
await passo(l, "7. Desliga tudo (deixa a demonstração como estava)", async () => {
  await l.goto(CM + "/merchant/migrar#integracoes", { waitUntil: "networkidle" });
  for (const n of ["ga4", "googleVerificacao", "tiktokPixel"]) await l.fill(`input[name=${n}]`, "");
  await l.selectOption("select[name=chatProvedor]", "");
  await l.uncheck("input[name=pwa]"); await l.uncheck("input[name=maioridade]");
  await l.getByRole("button", { name: "Salvar integrações" }).click();
  await l.waitForFunction(() => document.body.innerText.includes("Integrações salvas"), null, { timeout: 15000 });
  const r = await v.goto(`${CM}/store/${slug}/manifest.webmanifest`);
  if (r.status() !== 404) throw new Error(`manifesto deveria sumir: ${r.status()}`);
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
