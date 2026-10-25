/**
 * O cliente final em cada tema grátis (D178): início → catálogo → produto → carrinho → finalizar, no celular (390) e no
 * computador (1440), na loja de demonstração de cada tema. Anota por tela: resposta, foto quebrada, rolagem lateral,
 * falhas graves de acessibilidade (axe) e se o produto entrou no carrinho. Não para no primeiro problema.
 * Uso: E2E_BASE=http://cm.test:3300 node e2e/vitrine-cliente.mjs [pasta-de-saida] [temas separados por vírgula]
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const B = process.env.E2E_BASE ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-vitrine-cliente";
const TEMAS = (process.argv[3] ?? "starter,trama,lar,lance,petala,sinal,fardo").split(",");
mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1"] });
const achados = [];
const nota = (tema, w, tela, msg) => { achados.push({ tema, w, tela, msg }); console.log(`✘ ${tema} @${w} ${tela}: ${msg}`); };

async function conferir(p, tema, w, tela) {
  const r = await p.evaluate(() => ({
    lado: document.documentElement.scrollWidth - innerWidth,
    quebradas: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => i.getAttribute("src")).slice(0, 3),
  }));
  if (r.lado > 1) nota(tema, w, tela, `rolagem lateral de ${r.lado}px`);
  if (r.quebradas.length) nota(tema, w, tela, `foto quebrada: ${r.quebradas.join(", ")}`);
  await p.evaluate(axeSource);
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations
    .filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id} (${x.nodes.length}): ${(x.nodes[0]?.target ?? []).join(" ").slice(0, 70)}`));
  for (const x of v) nota(tema, w, tela, `acessibilidade ${x}`);
}

for (const tema of TEMAS) {
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    const base = `${B}/store/demo-${tema}`;
    try {
      for (const [tela, url] of [["início", base], ["catálogo", `${base}/catalog`]]) {
        const r = await p.goto(url, { waitUntil: "networkidle" });
        if (!r || r.status() >= 400) { nota(tema, w, tela, `respondeu ${r?.status()}`); continue; }
        await conferir(p, tema, w, tela);
      }
      const prod = await p.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).find((h) => h && h.includes("/product/")));
      if (!prod) { nota(tema, w, "catálogo", "nenhum link de produto"); continue; }
      await p.goto(new URL(prod, B).href, { waitUntil: "networkidle" });
      await conferir(p, tema, w, "produto");
      if (w === 390) await p.screenshot({ path: `${OUT}/produto-${tema}-390.png` });
      const tam = p.locator("button[aria-pressed='false']").first();
      if (await tam.count()) await tam.click().catch(() => {});
      const add = p.getByRole("button", { name: /Adicionar ao carrinho|Comprar/ }).first();
      if (!(await add.count())) { nota(tema, w, "produto", "sem botão de adicionar ao carrinho"); continue; }
      await add.click(); await p.waitForTimeout(800);
      await p.goto(`${base}/cart`, { waitUntil: "networkidle" });
      if (/carrinho est[áa] vazio|nenhum item/i.test(await p.evaluate(() => document.body.innerText))) nota(tema, w, "carrinho", "produto não entrou no carrinho");
      await conferir(p, tema, w, "carrinho");
      await p.goto(`${base}/checkout`, { waitUntil: "networkidle" });
      await conferir(p, tema, w, "finalizar compra");
      if (w === 390) await p.screenshot({ path: `${OUT}/checkout-${tema}-390.png`, fullPage: true });
    } catch (e) { nota(tema, w, "geral", String(e.message).split("\n")[0].slice(0, 160)); }
    for (const e of new Set(erros)) nota(tema, w, "erro de página", e.slice(0, 160));
    await ctx.close();
  }
  console.log(`· ${tema} conferido`);
}
await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify(achados, null, 1));
console.log(`\n${TEMAS.length} temas · ${achados.length} achado(s)`);
process.exit(achados.length ? 2 : 0);
