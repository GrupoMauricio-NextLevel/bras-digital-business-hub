// Confere a home da NextLevel Commerce (v1): estrutura, rolagem horizontal, menu, abas, simulação e perguntas.
// Uso: E2E_BASE=http://localhost:3100 node e2e/commerce-home.mjs  (SHOTS=/pasta para salvar capturas). Na demonstração local a marca Commerce vem de /lojas.
import { chromium } from "playwright-core";
const base = new URL(process.env.E2E_BASE ?? "http://localhost:3100");
const shots = process.env.SHOTS;
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "OK  " : "FALHA"} ${m}`); if (!c) fails++; };
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["tablet", { width: 768, height: 1024 }], ["celular", { width: 360, height: 780 }]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: "no-preference" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text()); });
  await p.goto(`${base.origin}/lojas`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500); // /lojas escolhe a marca Commerce na demonstração local
  ok((await p.locator("h1").count()) === 1, `${name}: um único h1`);
  ok(/loja virtual/i.test(await p.locator("h1").innerText()), `${name}: o título diz "loja virtual"`);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(sw <= 0, `${name}: sem rolagem horizontal (${sw}px)`);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);
  ok(broken === 0, `${name}: imagens carregam`);
  // menu
  if (vp.width < 768) {
    await p.getByRole("button", { name: "Abrir menu" }).click();
    ok(await p.locator("#menu-celular").isVisible(), `${name}: menu abre`);
    await p.keyboard.press("Escape"); ok(!(await p.locator("#menu-celular").count()), `${name}: Esc fecha o menu`);
  }
  // abas
  await p.locator("#exemplos").scrollIntoViewIfNeeded();
  const tabs = p.getByRole("tab"); ok((await tabs.count()) === 3, `${name}: três lojas de exemplo`);
  await tabs.nth(1).click(); ok(/Ateliê Sala/.test(await p.locator("#painel-loja").innerText()), `${name}: aba Casa troca a loja`);
  await tabs.nth(2).click(); ok(/Rota 7/.test(await p.locator("#painel-loja").innerText()), `${name}: aba Acessórios troca a loja`);
  // personalização: o passo 2 acende a faixa de confiança no dispositivo
  await p.locator("#personalizar").scrollIntoViewIfNeeded();
  await p.getByRole("button", { name: /Adicione seções prontas/ }).click();
  ok(await p.locator("#personalizar").getByText("Faixa de confiança").first().isVisible(), `${name}: passo 2 mostra a faixa de confiança`);
  await p.getByRole("radio", { name: /Vinho/ }).first().click();
  ok((await p.locator("#personalizar [aria-pressed]").count()) === 3, `${name}: três passos de personalização`);
  // palavra que alterna (ou fixa, com movimento reduzido) e botão comercial
  ok((await p.locator("h1").innerText()).length > 20, `${name}: título presente`);
  // perguntas
  await p.locator("#duvidas summary").first().click(); ok(await p.locator("#duvidas details[open]").count() === 1, `${name}: pergunta abre`);
  // ações com destino
  const hrefs = await p.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  ok(hrefs.every((h) => h && h !== "#"), `${name}: nenhum link vazio`);
  ok(errors.length === 0, `${name}: sem erros no console${errors.length ? " → " + errors[0] : ""}`);
  if (shots) await p.screenshot({ path: `${shots}/home-${name}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
console.log(fails ? `\n${fails} falha(s)` : "\nTudo certo");
process.exit(fails ? 1 : 0);
