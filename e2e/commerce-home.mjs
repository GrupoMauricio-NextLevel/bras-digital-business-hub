// Confere a home imersiva da NextLevel Commerce (D165): título, rolagem lateral, imagens, jornada em cinco passos (rolagem e
// régua por teclado), portas, personalização, dúvidas, links e console. Também com "menos movimento" (tudo parado e legível).
// Uso: E2E_BASE=http://localhost:3100 node e2e/commerce-home.mjs  (SHOTS=/pasta para capturas; E2E_HOME=endereço da home; PW_ARGS=opções do Chromium separadas por |).
import { chromium } from "playwright-core";
const base = new URL(process.env.E2E_BASE ?? "http://localhost:3100");
const home = process.env.E2E_HOME ?? `${base.origin}/lojas`;
const shots = process.env.SHOTS;
let fails = 0;
const ok = (c, m) => { console.log(`${c ? "OK  " : "FALHA"} ${m}`); if (!c) fails++; };
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: (process.env.PW_ARGS ?? "").split("|").filter(Boolean) });
for (const [name, vp, reduced] of [["computador", { width: 1440, height: 900 }, false], ["tablet", { width: 768, height: 1024 }, false], ["celular", { width: 360, height: 780 }, false], ["celular-menos-movimento", { width: 360, height: 780 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, reducedMotion: reduced ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  const errors = []; p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text()); });
  await p.goto(home, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  ok((await p.locator("h1").count()) === 1, `${name}: um único h1`);
  ok(/loja da sua marca/i.test(await p.locator("h1").innerText()), `${name}: título da primeira dobra`);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(sw <= 0, `${name}: sem rolagem lateral (${sw}px)`);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 120)); } scrollTo({ top: 0, behavior: "instant" }); });
  await p.waitForTimeout(600);
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
  ok(broken.length === 0, `${name}: imagens carregam${broken.length ? " → " + broken[0] : ""}`);
  // jornada
  const modo = await p.locator("[data-immersive]").getAttribute("data-immersive");
  ok(modo === (reduced ? "off" : "on"), `${name}: jornada ${reduced ? "parada" : "imersiva"} (${modo})`);
  ok((await p.locator(".im-jor-passo").count()) === 5, `${name}: cinco passos`);
  if (!reduced) {
    const j = await p.evaluate(() => { const el = document.querySelector("[data-immersive]"); return { t: el.getBoundingClientRect().top + scrollY, run: el.offsetHeight - innerHeight }; });
    const vistos = [];
    for (let k = 0; k < 5; k++) { await p.evaluate(([y]) => scrollTo({ top: y, behavior: "instant" }), [j.t + (j.run * (k + 0.5)) / 5]); await p.waitForTimeout(500); vistos.push(await p.locator("[data-immersive]").getAttribute("data-step")); }
    ok(vistos.join("") === "01234", `${name}: a rolagem passa pelos cinco passos (${vistos.join("")})`);
    if (vp.width >= 768) { await p.focus(".im-jor-regua li:nth-child(2) button"); await p.keyboard.press("Enter"); await p.waitForTimeout(1500); ok((await p.locator("[data-immersive]").getAttribute("data-step")) === "1", `${name}: a régua leva ao passo 2 pelo teclado`); }
  }
  // portas
  const portas = await p.$$eval("#portas a", (as) => as.map((a) => a.getAttribute("href")));
  ok(portas.length === 4 && portas.every((h) => h === "/cadastro" || h === "/quero-minha-loja"), `${name}: quatro portas levam ao cadastro`);
  // personalização
  await p.locator("#personalizar").scrollIntoViewIfNeeded();
  ok((await p.locator("#personalizar [aria-pressed]").count()) === 3, `${name}: três passos de personalização`);
  // dúvidas
  await p.locator("#duvidas summary").first().click(); ok((await p.locator("#duvidas details[open]").count()) >= 1, `${name}: pergunta abre`);
  // ações com destino
  const hrefs = await p.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  ok(hrefs.every((h) => h && h !== "#"), `${name}: nenhum link vazio`);
  ok(errors.length === 0, `${name}: sem erros no console${errors.length ? " → " + errors[0] : ""}`);
  if (shots) await p.screenshot({ path: `${shots}/home-${name}.png` });
  await ctx.close();
}
await b.close();
console.log(fails ? `\n${fails} falha(s)` : "\nTudo certo");
process.exit(fails ? 1 : 0);
