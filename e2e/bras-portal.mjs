/**
 * Brás Digital (D91): página pública, cadastro com CNPJ, Meu Brás e Estúdio no Master.
 * O servidor precisa de BRAND_SIGNUP_BRAS_DIGITAL=true e BRAND_DOMAINS_BRAS_DIGITAL=127.0.0.1 (127.0.0.1 faz o papel do endereço
 * da Brás; localhost segue como SuperDrop, onde o Master entra). Reinicie o servidor antes (o teste cria membro e vídeos).
 * Uso: E2E_BASE=http://localhost:3300 node e2e/bras-portal.mjs  (capturas em E2E_SHOTS, padrão /tmp/bras-shots)
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3300";
const BRAS = B.replace("localhost", "127.0.0.1");
const OUT = process.env.E2E_SHOTS ?? "/tmp/bras-shots"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✖", m); };
const ok = (m) => console.log("✔", m);
// Miniaturas do YouTube não passam pelo proxy do ambiente de teste: um quadro neutro identificado no lugar.
const THUMB = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="#2a3550"/><text x="240" y="186" fill="#b9c2d6" font-family="sans-serif" font-size="18" text-anchor="middle">miniatura do YouTube</text></svg>`;
// Movimento reduzido: as capturas de página inteira não rolam, e os blocos que surgem com a rolagem ficariam invisíveis nelas.
const ctxFor = async (w) => { const c = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" }); await c.route("https://i.ytimg.com/**", (r) => r.fulfill({ contentType: "image/svg+xml", body: THUMB })); await c.route("https://www.youtube-nocookie.com/**", (r) => r.fulfill({ contentType: "text/html", body: "<body style='background:#000;color:#fff;font:16px sans-serif;display:grid;place-items:center;height:100vh'>player do YouTube</body>" })); return c; };
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const check = async (p, label, w) => {
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${label} @${w}: rolagem horizontal`);
  // Avisos flutuantes (toast) somem sozinhos: mede depois que saem, para não medir o meio da animação.
  await p.waitForFunction(() => !document.querySelector("[data-sonner-toast]"), null, { timeout: 15000 }).catch(() => {});
  if (w === 390 || w === 1440) { await p.emulateMedia({ reducedMotion: "reduce" }); const v = await axeOf(p); if (v.length) fail(`${label} @${w}: axe ${v.join(" | ")}`); }
};
const page = async (w) => { const c = await ctxFor(w); const p = await c.newPage(); p.on("pageerror", (e) => fail(`pageerror @${w}: ${e.message}`)); return { c, p }; };

// 1. Página pública sem vídeos (estado vazio) e sem nenhum preço.
for (const w of [360, 1440]) {
  const { c, p } = await page(w);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  const txt = await p.locator("main, body").first().innerText();
  if (!/Os primeiros vídeos estão sendo gravados/.test(txt)) fail("vazio: aviso dos vídeos ausente");
  if (/R\$\s?\d/.test(txt)) fail("vazio: preço aparece na página pública");
  await check(p, "pública vazia", w);
  await p.screenshot({ path: `${OUT}/01-publica-vazia-${w}.png`, fullPage: true });
  await c.close();
}
ok("página pública vazia");

// 2. Master adiciona vídeos no Estúdio (endereço do SuperDrop/Master).
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/bras", { waitUntil: "networkidle" });
  const videos = [
    ["https://youtube.com/shorts/aaaaaaaaaa1", "Garrafa térmica inox 1 L, caixa com 24", "Tampa com trava, alça dobrável e embalagem individual."],
    ["https://youtu.be/bbbbbbbbbb2", "Kit 5 potes herméticos de vidro", "Tampas com 4 travas. Caixa com 12 kits."],
    ["https://www.youtube.com/watch?v=cccccccccc3", "Luminária LED recarregável de mesa", "3 tons de luz, USB-C. Caixa com 40."],
    ["ddddddddddd", "Organizador de gaveta modular", "Peças encaixáveis. Caixa com 60."],
  ];
  for (const [url, title, summary] of videos) {
    await p.getByLabel("Link do YouTube").fill(url); await p.getByLabel("Título").fill(title); await p.getByLabel("Resumo (opcional)").fill(summary);
    await p.getByRole("button", { name: "Adicionar" }).click();
    await p.getByText(title, { exact: false }).first().waitFor({ timeout: 30000 });
  }
  if ((await p.locator("ol[aria-label='Vídeos na ordem da página'] > li").count()) !== 4) fail("estúdio: 4 vídeos esperados");
  await p.getByRole("button", { name: "Descer Garrafa térmica inox 1 L, caixa com 24" }).click();
  await p.waitForTimeout(1500);
  await check(p, "estúdio vídeos", 1440);
  await p.screenshot({ path: `${OUT}/02-estudio-videos-1440.png`, fullPage: true });
  await c.close();
}
ok("estúdio: vídeos adicionados e reordenados");

// 3. Página pública com vídeos, em 3 larguras e em pontos da rolagem; tocar no vídeo carrega o player.
for (const w of [360, 768, 1440]) {
  const { c, p } = await page(w);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  const txt = await p.locator("body").innerText();
  if (!/Kit 5 potes herméticos/.test(txt)) fail(`pública @${w}: vídeos não aparecem`);
  if (/R\$\s?\d/.test(txt)) fail(`pública @${w}: preço aparece`);
  if (!(await p.getByRole("link", { name: /Área do cliente/ }).first().isVisible())) fail(`pública @${w}: botão Área do cliente invisível`);
  await check(p, "pública com vídeos", w);
  await p.screenshot({ path: `${OUT}/03-publica-topo-${w}.png` });
  await p.screenshot({ path: `${OUT}/04-publica-inteira-${w}.png`, fullPage: true });
  if (w === 1440) {
    await p.getByRole("button", { name: /Assistir: Kit 5 potes/ }).click();
    await p.locator("iframe[title='Kit 5 potes herméticos de vidro']").waitFor({ timeout: 10000 });
    await p.locator("#videos").screenshot({ path: `${OUT}/05-publica-video-tocando-1440.png` });
  }
  await c.close();
}
ok("página pública com vídeos");

// 4. "Quero comprar" leva ao cadastro com o produto; cadastro com CNPJ inválido falha, válido entra no Meu Brás.
{
  const { c, p } = await page(390);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  await p.getByRole("link", { name: /Quero comprar \(Kit 5 potes/ }).click();
  await p.waitForURL(/\/cadastro\?video=/);
  await p.getByText(/Depois do cadastro você vê o preço e as caixas de/).waitFor();
  await check(p, "cadastro", 390);
  await p.screenshot({ path: `${OUT}/06-cadastro-390.png`, fullPage: true });
  await p.getByLabel("CNPJ da empresa").fill("11222333000100");
  await p.getByLabel("Nome da empresa").fill("Ana Utilidades LTDA"); await p.getByLabel("Seu nome").fill("Ana Lojista");
  await p.getByLabel("WhatsApp").fill("11988887777"); await p.getByLabel("E-mail").fill("ana@utilidades.teste"); await p.getByLabel("Senha").fill("senha-forte-1");
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.getByRole("alert").filter({ hasText: /CNPJ inválido/ }).waitFor({ timeout: 30000 });
  if ((await p.getByLabel("CNPJ da empresa").inputValue()) !== "11.222.333/0001-00") fail("cadastro: máscara do CNPJ");
  await p.getByLabel("CNPJ da empresa").fill("11222333000181");
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.waitForURL(/\/meu-bras/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByText("Seu acesso de membro já está liberado").isVisible())) fail("meu brás: boas-vindas ausente");
  const buy = await p.getByRole("link", { name: /Quero comprar/ }).first().getAttribute("href");
  if (!buy?.startsWith("https://wa.me/5511900000000?text=") || !decodeURIComponent(buy).includes("Ana Utilidades LTDA")) fail(`meu brás: link de compra ${buy}`);
  await check(p, "meu brás", 390);
  await p.screenshot({ path: `${OUT}/07-meu-bras-390.png`, fullPage: true });
  for (const [path, n] of [["/meu-bras/videos", "08-meu-bras-videos"], ["/meu-bras/empresa", "09-meu-bras-empresa"]]) {
    await p.goto(BRAS + path, { waitUntil: "networkidle" }); await check(p, path, 390); await p.screenshot({ path: `${OUT}/${n}-390.png`, fullPage: true });
  }
  if (!(await p.getByText("11.222.333/0001-81").isVisible())) fail("empresa: CNPJ formatado");
  // Membro não entra no Master nem no painel do lojista.
  for (const path of ["/master/bras", "/merchant"]) { await p.goto(BRAS + path, { waitUntil: "networkidle" }); if (!new URL(p.url()).pathname.startsWith("/meu-bras")) fail(`membro abriu ${path}`); }
  await c.close();
}
ok("cadastro e Meu Brás");

// 5. Master vê o membro e bloqueia; o membro passa a ver o aviso e perde o botão de compra.
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/bras?tab=membros", { waitUntil: "networkidle" });
  await p.getByText("Ana Utilidades LTDA").waitFor();
  await check(p, "estúdio membros", 1440);
  await p.screenshot({ path: `${OUT}/10-estudio-membros-1440.png`, fullPage: true });
  p.once("dialog", (d) => d.accept("Teste de bloqueio"));
  await p.getByRole("button", { name: "Bloquear" }).click();
  await p.getByText("Teste de bloqueio").waitFor({ timeout: 30000 });
  await c.close();

  const m = await page(390);
  await m.p.goto(BRAS + "/login", { waitUntil: "networkidle" });
  await m.p.getByLabel("E-mail").fill("ana@utilidades.teste"); await m.p.getByLabel("Senha").fill("senha-forte-1");
  await m.p.getByRole("button", { name: /^Entrar/ }).click();
  await m.p.waitForURL(/\/meu-bras/, { timeout: 60000 }); await m.p.waitForLoadState("networkidle");
  if (!(await m.p.getByText("Cadastro em análise pela equipe.").isVisible())) fail("bloqueado: aviso ausente");
  if (await m.p.getByRole("link", { name: /Quero comprar/ }).count()) fail("bloqueado: botão de compra ainda aparece");
  await m.p.screenshot({ path: `${OUT}/11-meu-bras-bloqueado-390.png`, fullPage: true });
  await m.c.close();
}
ok("bloqueio pelo Master");

// 6. Páginas das outras marcas não abrem no endereço da Brás; o SuperDrop segue igual.
{
  const { c, p } = await page(1280);
  await p.goto(BRAS + "/planos", { waitUntil: "networkidle" }); if (new URL(p.url()).pathname !== "/") fail("/planos abriu no endereço da Brás");
  await p.goto(B + "/", { waitUntil: "networkidle" }); if (/Brás Digital/.test(await p.title())) fail("SuperDrop mostrou a Brás");
  await c.close();
}
ok("fronteira entre marcas");

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log(`\nTudo certo. Capturas em ${OUT}`);
