/**
 * Auditoria de navegação e conteúdo por marca e por papel (fase 1 da rodada do dono).
 * Para cada conta: percorre o menu e os links internos (até 70 telas), em 1440 e 390 px, e registra
 * HTTP, erro de console, tempo, título, item ativo do menu, rolagem lateral e textos suspeitos
 * (NaN, undefined, null, data inválida, R$ sem valor, marca errada, inglês solto, tela de erro).
 * Confere também se o menu do celular leva aos mesmos destinos do menu do computador.
 * Uso: bash scripts/start-demo-prod.sh && E2E_BASE=http://localhost:3100 node e2e/auditoria-navegacao.mjs [--conta=id]
 * Saída: docs/auditoria-dono/qa/navegacao[-conta].json e resumo no terminal.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const ONLY = process.argv.find((a) => a.startsWith("--conta="))?.split("=")[1];
const OUT = "docs/auditoria-dono/qa"; mkdirSync(OUT, { recursive: true });

const ACCOUNTS = [
  { id: "master", host: "master.nextlevelgroup.com.br", email: "master@nextlevel.demo", marca: "NextLevel", cap: 34 },
  { id: "superdrop-fornecedor", host: "superdrop.com.br", email: "megatron@superdrop.demo", marca: "SuperDrop" },
  { id: "superdrop-expedicao", host: "superdrop.com.br", email: "expedicao@megatron.demo", marca: "SuperDrop" },
  { id: "superdrop-lojista", host: "superdrop.com.br", email: "loja@mrssports.demo", marca: "SuperDrop" },
  { id: "superdrop-lojista-pro", host: "superdrop.com.br", email: "dono@mantosshop.demo", marca: "SuperDrop" },
  { id: "superdrop-parceiro", host: "superdrop.com.br", email: "parceira@demo.superdrop.com.br", marca: "SuperDrop" },
  { id: "commerce-dono", host: "lojas.nextlevelgroup.com.br", email: "completo@commerce.demo", marca: "Commerce" },
  { id: "commerce-equipe", host: "lojas.nextlevelgroup.com.br", email: "paulo@casaaurora.demo", marca: "Commerce" },
];

// Textos que indicam defeito de conteúdo. Cada regra: [nome, regex, só para marca?]
const SUSPEITOS = [
  ["NaN", /\bNaN\b/],
  ["undefined", /\bundefined\b/],
  ["null solto", /(?<![\w-])null(?![\w-])/],
  ["data inválida", /Invalid Date|Data inválida/],
  ["objeto cru", /\[object Object\]/],
  ["valor vazio em R$", /R\$\s*(?:—|-|$)/m],
  ["tela de erro", /Algo deu errado|Application error|Internal Server Error|This page could not be found/],
  ["inglês solto", /\b(Loading|Submit|Cancel|Save|Delete|Settings|Dashboard|Orders|Products|Customers|Search\.\.\.)\b/],
];
const MARCA_ERRADA = { Commerce: /SuperDrop/, SuperDrop: /NextLevel E-commerce/ };

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const all = [];
for (const acc of ACCOUNTS.filter((a) => !ONLY || a.id === ONLY)) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": acc.host } });
  const p = await ctx.newPage(); p.setDefaultTimeout(40000);
  let errs = [];
  p.on("pageerror", (e) => errs.push("js: " + e.message.slice(0, 140)));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource|Hydration|ERR_ABORTED/.test(m.text())) errs.push("console: " + m.text().slice(0, 140)); });
  await p.goto(B + "/login");
  await p.fill("input[type=email]", acc.email); await p.fill("input[type=password]", "demo1234"); await p.keyboard.press("Enter");
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 40000 });
  const home = new URL(p.url()).pathname;

  // menu do computador
  const desktopMenu = await p.$$eval(".ds-side a[href^='/']", (as) => [...new Set(as.map((a) => a.getAttribute("href").split("#")[0]))]);
  // menu do celular: barra inferior + gaveta "Mais"
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(B + home); await p.waitForLoadState("networkidle").catch(() => {});
  const bottom = await p.$$eval(".ds-bottom a[href^='/']", (as) => as.map((a) => a.getAttribute("href").split("#")[0]));
  let drawer = [];
  const opener = p.getByRole("button", { name: /Mais|Abrir menu|Menu/ }).first();
  if (await opener.isVisible().catch(() => false)) {
    await opener.click().catch(() => {});
    await p.waitForTimeout(400);
    drawer = await p.$$eval("[role=dialog] a[href^='/']", (as) => as.map((a) => a.getAttribute("href").split("#")[0]));
    await p.keyboard.press("Escape").catch(() => {});
  }
  const mobileMenu = [...new Set([...bottom, ...drawer])];
  const faltamNoCelular = desktopMenu.filter((h) => !mobileMenu.includes(h) && !h.startsWith("/account"));
  await p.setViewportSize({ width: 1440, height: 900 });

  // rastreio: menu + links internos encontrados
  const queue = [home, ...desktopMenu]; const seen = new Set(); const routes = [];
  while (queue.length && routes.length < (acc.cap ?? 70)) {
    const r = queue.shift().split("?")[0];
    if (seen.has(r) || /logout|sair|\/print|\.pdf|\/api\/|^\/store\/|^\/f\/|^\/demo\//.test(r)) continue;
    seen.add(r); routes.push(r);
    try {
      await p.goto(B + r, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      const more = await p.$$eval("main a[href^='/']", (as) => as.map((a) => a.getAttribute("href").split("#")[0].split("?")[0]));
      for (const m of more) if (!seen.has(m) && m.startsWith(home.split("/").slice(0, 2).join("/"))) queue.push(m);
    } catch { /* registra abaixo */ }
  }

  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await p.setViewportSize({ width: w, height: h });
    for (const r of (w === 390 ? routes.filter((x) => desktopMenu.includes(x) || x === home) : routes)) {
      errs = []; const problems = []; const t0 = Date.now(); let status = 0;
      try {
        const resp = await p.goto(B + r, { waitUntil: "domcontentloaded" }); await p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        status = resp?.status() ?? 0;
        const final = new URL(p.url()).pathname;
        if (status >= 400) problems.push(`HTTP ${status}`);
        if (final.startsWith("/login")) problems.push("mandou para o login");
        const info = await p.evaluate(() => {
          const main = document.querySelector("main") ?? document.body;
          const active = document.querySelector(".ds-side [aria-current='page']");
          return { text: main.innerText, h1: document.querySelector("h1")?.textContent?.trim() ?? "", active: active?.getAttribute("href") ?? null, overflow: document.documentElement.scrollWidth > innerWidth + 1, title: document.title };
        });
        if (!info.h1) problems.push("sem título (h1)");
        if (info.overflow) problems.push("rolagem lateral");
        if (w === 1440 && desktopMenu.includes(r) && info.active && info.active !== r && !r.startsWith(info.active)) problems.push(`menu ativo errado (${info.active})`);
        for (const [nome, re] of SUSPEITOS) { const m = info.text.match(re); if (m) problems.push(`texto: ${nome} → “${info.text.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, " ")}”`); }
        const mre = MARCA_ERRADA[acc.marca]; if (mre && mre.test(info.text)) problems.push(`marca errada no texto (${info.text.match(mre)[0]})`);
        const ms = Date.now() - t0; if (ms > 6000) problems.push(`lenta (${(ms / 1000).toFixed(1)} s)`);
        all.push({ conta: acc.id, rota: r, largura: w, status, ms, h1: info.h1, problemas: [...problems, ...errs.slice(0, 2)] });
      } catch (e) { all.push({ conta: acc.id, rota: r, largura: w, status, problemas: ["falha: " + String(e.message).slice(0, 100)] }); }
    }
  }
  all.push({ conta: acc.id, rota: "(menu do celular)", largura: 390, problemas: faltamNoCelular.length ? [`destinos do menu do computador que não aparecem no celular: ${faltamNoCelular.join(", ")}`] : [] });
  console.log(`conta ${acc.id}: ${routes.length} telas, menu ${desktopMenu.length} itens, celular ${mobileMenu.length}`);
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}/navegacao${ONLY ? "-" + ONLY : ""}.json`, JSON.stringify(all, null, 2));
const bad = all.filter((r) => r.problemas.length);
console.log(`\ntelas verificadas: ${all.length} · com problema: ${bad.length}`);
for (const r of bad) console.log(`✖ ${r.conta} ${r.rota} [${r.largura}] ${r.problemas.join(" ; ").slice(0, 260)}`);
