/**
 * Fotografias v3 nas páginas públicas (SuperDrop e NextLevel E-commerce), em 360, 768 e 1440 px.
 * Confere: cada imagem prevista aparece e carrega; nenhuma requisição de imagem falha (404 etc.); só UM formato de
 * cada imagem é baixado; nenhum aviso "Imagem em criação" restante; sem erro de console; sem rolagem lateral;
 * deslocamento de layout (CLS) baixo; nenhuma foto de uma marca na página da outra; texturas com alt="";
 * acessibilidade (axe, WCAG A/AA) sem violação grave.
 * Uso: bash scripts/start-demo-prod.sh && E2E_BASE=http://localhost:3100 node e2e/imagens-paginas-publicas.mjs
 * Capturas: docs/imagens-paginas-publicas/capturas/
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = "docs/imagens-paginas-publicas/capturas"; mkdirSync(OUT, { recursive: true });
let falhas = 0;
const fail = (m) => { falhas++; console.error("✖", m); };
const ok = (m) => console.log("✓", m);

const PAGINAS = [
  { id: "superdrop", host: "superdrop.com.br", prefixo: "sd-", outro: "cm-", texturas: ["sd-textura-fundo"],
    fotos: ["sd-hero-fornecedor-separando", "sd-hero-celular-venda", "sd-expedicao-esteira", "sd-etiqueta-impressora", "sd-lojista-home-office", "sd-pix-pagamento", "sd-fornecedor-parceiro", "sd-pacote-entregue"] },
  { id: "commerce", host: "lojas.nextlevelgroup.com.br", prefixo: "cm-", outro: "sd-", texturas: ["cm-textura-fundo"],
    fotos: ["cm-hero-marca-propria", "cm-hero-celular-vitrine", "cm-catalogo-fotografia", "cm-checkout-cartao", "cm-pedido-embalado", "cm-dono-gestao", "cm-temas-ambiente", "cm-equipe-atendimento"] },
];

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const pg of PAGINAS) {
  for (const w of [360, 768, 1440]) {
    const tag = `${pg.id} ${w}px`;
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": pg.host } });
    const p = await ctx.newPage(); p.setDefaultTimeout(60000);
    const erros = [], imgs = [];
    p.on("pageerror", (e) => erros.push(e.message.slice(0, 160)));
    p.on("console", (m) => { if (m.type() === "error") erros.push(m.text().slice(0, 160)); });
    p.on("response", (r) => { const u = new URL(r.url()); if (u.pathname.startsWith("/portal/")) imgs.push({ path: u.pathname, status: r.status() }); });
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    await p.goto(B + "/", { waitUntil: "load" });
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/${pg.id}-${w}-topo.png` });
    // rola a página inteira devagar para disparar o carregamento tardio
    const altura = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < altura; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.waitForTimeout(800);

    // 1. cada foto prevista aparece, carregou e não está distorcida
    const info = await p.evaluate(() => [...document.querySelectorAll("picture[data-img]")].map((pic) => {
      const img = pic.querySelector("img"); const cs = getComputedStyle(img); const r = img.getBoundingClientRect();
      return { nome: pic.dataset.img, ok: img.complete && img.naturalWidth > 0, atual: img.currentSrc, alt: img.getAttribute("alt"), fit: cs.objectFit, w: r.width, h: r.height, hidden: !!pic.closest("[aria-hidden=true]") };
    }));
    for (const nome of [...pg.fotos, ...pg.texturas]) {
      const i = info.find((x) => x.nome === nome);
      if (!i) { fail(`${tag}: ${nome} não está na página`); continue; }
      if (!i.ok) fail(`${tag}: ${nome} não carregou (${i.atual})`);
      if (i.fit !== "cover") fail(`${tag}: ${nome} sem object-fit: cover (${i.fit})`);
      if (i.w < 40 || i.h < 40) fail(`${tag}: ${nome} pequena demais (${Math.round(i.w)}x${Math.round(i.h)})`);
      const textura = pg.texturas.includes(nome);
      if (textura && (i.alt !== "" || !i.hidden)) fail(`${tag}: textura ${nome} deveria ter alt="" e ficar oculta para leitores de tela`);
      if (!textura && (!i.alt || i.alt.length < 10)) fail(`${tag}: ${nome} sem texto alternativo descritivo`);
    }
    // 2. formato baixado: um só por imagem, preferindo AVIF/WebP
    const porNome = {};
    for (const r of imgs) { const m = r.path.match(/\/v3\/([^/.]+)\.(avif|webp|png)$/); if (m) (porNome[m[1]] ??= new Set()).add(m[2]); }
    for (const [nome, fmts] of Object.entries(porNome)) if (fmts.size > 1) fail(`${tag}: ${nome} baixado em ${[...fmts].join(" e ")}`);
    const formatos = Object.entries(porNome).map(([n, f]) => `${n}.${[...f][0]}`);
    // 3. nenhuma requisição de imagem com erro
    for (const r of imgs.filter((x) => x.status >= 400)) fail(`${tag}: ${r.path} respondeu ${r.status}`);
    // 4. nenhum aviso restante; 5. nenhuma foto da outra marca
    const slots = await p.$$eval("[data-img-slot], .ds-img-slot", (els) => els.map((e) => e.getAttribute("data-img-slot") ?? "?"));
    if (slots.length) fail(`${tag}: ainda há "Imagem em criação": ${slots.join(", ")}`);
    if (info.some((x) => x.nome.startsWith(pg.outro)) || imgs.some((r) => r.path.includes(`/${pg.outro}`))) fail(`${tag}: foto da outra marca na página`);
    if (info.some((x) => !x.nome.startsWith(pg.prefixo))) fail(`${tag}: foto fora do padrão ${pg.prefixo}`);
    // 6. sem rolagem lateral, sem erro de console, CLS baixo
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ov > 1) fail(`${tag}: rolagem lateral de ${ov}px`);
    if (erros.length) fail(`${tag}: erros no console: ${erros.slice(0, 3).join(" | ")}`);
    const cls = await p.evaluate(() => window.__cls);
    if (cls > 0.1) fail(`${tag}: deslocamento de layout alto (CLS ${cls.toFixed(3)})`);
    // 7. acessibilidade: axe sem violação grave (com movimento reduzido, para todo o conteúdo estar visível)
    await p.emulateMedia({ reducedMotion: "reduce" }); await p.evaluate(axeSource);
    const axe = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id}: ${x.nodes[0]?.target?.join(" ")}`));
    if (axe.length) fail(`${tag}: acessibilidade: ${axe.join(" | ")}`);
    ok(`${tag}: ${info.length} imagens carregadas, 0 avisos, CLS ${cls.toFixed(3)}, formatos: ${[...new Set(formatos.map((f) => f.split(".").pop()))].join("/")}`);

    // capturas: página inteira e cada seção com foto
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${pg.id}-${w}-inteira.jpg`, fullPage: true, type: "jpeg", quality: 55 });
    await ctx.close();
  }
}
await b.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nTUDO OK");
process.exitCode = falhas ? 1 : 0;
