/**
 * TR0 + TR1 (D290): aviso de cookies na home, origem do anúncio guardada (fbclid e primeiro toque), link rastreado criado
 * no Master, clique contado e chegada com as etiquetas. Acessibilidade (axe) e 360 px sem rolagem lateral.
 * Uso: bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/trafego-links.mjs   (SHOTS=/pasta; muda dados)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS;
const UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const axe = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const noScroll = async (p, where) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`rolagem horizontal em ${where}`); };
const cookie = async (ctx, name) => (await ctx.cookies()).find((c) => c.name === name);
/** O proxy grava JSON codificado e o Next codifica de novo: decodifica até virar JSON. */
const json = (v) => { let x = v; for (let i = 0; i < 3 && x.startsWith("%"); i++) x = decodeURIComponent(x); return JSON.parse(x); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png` }); };

// 1) Visita vinda de anúncio da Meta, no celular: aviso aparece, origem e primeiro toque gravados.
{
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: "reduce", userAgent: UA });
  const p = await ctx.newPage();
  await p.goto(`${B}/lojas`, { waitUntil: "networkidle" });
  const antes = await cookie(ctx, "nl-first");
  if (antes && json(antes.value).canal === "direto") ok("primeira visita sem origem: primeiro toque = direto"); else fail("primeira visita não gravou o primeiro toque");
  await ctx.clearCookies();
  await p.goto(`${B}/lojas`, { waitUntil: "networkidle" });
  await ctx.clearCookies({ name: "nl-first" });
  await p.goto(`${B}/?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-teste&fbclid=IwAR123abc`, { waitUntil: "networkidle" });
  const attr = await cookie(ctx, "nl-attr");
  const a = attr ? json(attr.value) : {};
  if (a.fbclid === "IwAR123abc" && a.canal === "meta-pago" && a.ts) ok("origem do anúncio guardada com fbclid, canal e momento"); else fail(`nl-attr sem o clique: ${JSON.stringify(a)}`);
  const first = await cookie(ctx, "nl-first");
  if (first && json(first.value).canal === "meta-pago") ok("primeiro toque gravado (meta-pago)"); else fail("primeiro toque não gravado");
  const aviso = p.getByRole("region", { name: "Cookies e privacidade" });
  await aviso.waitFor({ timeout: 15000 });
  ok("aviso de cookies aparece na primeira visita");
  await shot(p, "01-aviso-cookies-celular");
  await noScroll(p, "home 360 com aviso");
  const v = (await axe(p)).filter((x) => x.includes("Cookies") || x.includes("ds-pub-btn") || x.includes("checkbox")); if (v.length) fail(`axe aviso: ${v.join(" | ")}`); else ok("axe sem violações graves no aviso de cookies");
  await aviso.getByRole("button", { name: "Escolher" }).click();
  await shot(p, "02-aviso-cookies-escolher");
  await aviso.getByRole("button", { name: "Só os necessários" }).click();
  if (await aviso.isVisible()) fail("aviso não fechou");
  const c = await cookie(ctx, "nl-consent");
  const cv = c ? json(c.value) : {};
  if (cv.medicao === false && cv.anuncios === false) ok("escolha 'só os necessários' gravada"); else fail("consentimento não gravado");
  await p.reload({ waitUntil: "networkidle" });
  if (await cookie(ctx, "nl-first")) fail("primeiro toque continuou depois de recusar a medição"); else ok("recusou a medição: primeiro toque apagado");
  if (await p.getByRole("region", { name: "Cookies e privacidade" }).isVisible()) fail("aviso voltou depois da escolha"); else ok("aviso não volta depois da escolha");
  await p.getByRole("button", { name: "Preferências de cookies" }).click();
  if (await p.getByRole("region", { name: "Cookies e privacidade" }).isVisible()) ok("rodapé reabre as preferências"); else fail("rodapé não reabriu o aviso");
  await ctx.close();
}

// 2) Master cria o link, clica, chega com as etiquetas e o clique aparece.
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/trafego", { waitUntil: "networkidle" });
  const cod = `bio-${Date.now().toString(36).slice(-4)}`;
  await p.getByLabel("Página de destino").fill("/planos");
  await p.getByLabel("Origem (utm_source)").fill("instagram");
  await p.getByLabel("Meio (utm_medium)").fill("bio");
  await p.getByLabel("Campanha (utm_campaign)").fill("2026-12-organico");
  await p.getByLabel("Código do link (opcional)").fill(cod);
  await p.getByLabel("Onde vai ser usado (opcional)").fill("Bio do Instagram da NextLevel");
  await p.getByRole("button", { name: "Criar link" }).click();
  await p.getByText(`/l/${cod}`, { exact: true }).waitFor({ timeout: 15000 });
  ok(`link /l/${cod} criado no Master`);
  const vctx = await b.newContext({ userAgent: UA });
  const visita = await vctx.newPage();
  await visita.goto(`${B}/l/${cod}`, { waitUntil: "domcontentloaded" });
  const u = new URL(visita.url());
  if (u.pathname === "/planos" && u.searchParams.get("utm_source") === "instagram" && u.searchParams.get("utm_medium") === "bio") ok("clique leva a /planos com as etiquetas"); else fail(`destino errado: ${visita.url()}`);
  await vctx.close();
  await p.reload({ waitUntil: "networkidle" });
  const linha = p.locator("li", { hasText: `/l/${cod}` });
  if ((await linha.textContent())?.match(/7 dias:\s*1/)) ok("clique contado na lista"); else fail("clique não apareceu na lista");
  await shot(p, "03-master-trafego-links");
  const v = await axe(p); if (v.length) fail(`axe master: ${v.join(" | ")}`); else ok("axe sem violações graves no Master → Tráfego");
  await p.setViewportSize({ width: 360, height: 780 });
  await p.reload({ waitUntil: "networkidle" });
  await noScroll(p, "master trafego 360");
  await shot(p, "04-master-trafego-celular");
  await ctx.close();
}
await b.close();
if (bad.length) { console.error("FALHAS:\n- " + bad.join("\n- ")); process.exit(1); }
console.log("tudo certo");
