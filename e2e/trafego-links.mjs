/**
 * TR0 + TR1 (D290), TR2 (D291), cidade/aparelho com notificações (D292) origem no Comercial (TR3, D294) e Pixel/Google com consentimento (TR4, D295): aviso de cookies na home, origem do anúncio guardada (fbclid e primeiro toque), link rastreado criado
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
  await p.goto(B + "/master/trafego/links", { waitUntil: "networkidle" });
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

// 3) TR2: visitas de canais diferentes aparecem em "Agora no site" sem recarregar; WhatsApp e lead viram marcos.
{
  const m = await b.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: "reduce" });
  const p = await m.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/trafego", { waitUntil: "networkidle" });
  const antes = Number((await p.getByLabel("Pessoas no site agora").locator("p.text-5xl").textContent())?.match(/\d+/)?.[0] ?? 0);
  const visitantes = [];
  // IPs públicos de exemplo (Fortaleza, São Paulo, Brasília) para a cidade aparecer na demonstração.
  for (const [url, ref, vp, ip, ua] of [
    [`${B}/?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-cadastro-teste3dias&utm_content=video-dor-direct-v1&fbclid=IwAR9`, undefined, { width: 390, height: 844 }, "200.147.67.142", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.0"],
    [`${B}/planos`, "https://www.google.com/", { width: 1280, height: 800 }, "177.71.207.1", UA.replace("Linux; Android 14", "Windows NT 10.0; Win64; x64").replace(" Mobile", "")],
    [`${B}/temas?utm_source=instagram&utm_medium=reels&utm_campaign=2026-12-organico&utm_content=reel-1`, undefined, { width: 390, height: 844 }, "189.6.0.1", UA],
  ]) {
    const c = await b.newContext({ viewport: vp, userAgent: ua, extraHTTPHeaders: { "x-forwarded-for": ip } });
    const v = await c.newPage();
    await v.goto(`${B}/lojas`, { waitUntil: "networkidle" });
    await v.goto(url, { waitUntil: "networkidle", referer: ref });
    await v.waitForTimeout(800);
    visitantes.push([c, v]);
  }
  // O primeiro visitante (anúncio da Meta) clica no WhatsApp.
  const [, v1] = visitantes[0];
  const zap = v1.getByRole("link", { name: "Falar no WhatsApp" });
  if (await zap.count()) { await v1.evaluate(() => { const a = document.querySelector('a[aria-label="Falar no WhatsApp"]'); a?.addEventListener("click", (e) => e.preventDefault(), { once: true }); a?.click(); }); await v1.waitForTimeout(800); }
  await p.waitForFunction((n) => Number(document.querySelector('[aria-label="Pessoas no site agora"] p.text-5xl')?.textContent?.match(/\d+/)?.[0] ?? 0) >= n + 3, antes, { timeout: 25000 }).then(() => ok("3 visitas novas apareceram em Agora sem recarregar"), () => fail("Agora no site não atualizou sozinho"));
  const espera = (re, msg) => p.waitForFunction((src) => new RegExp(src).test(document.querySelector("main")?.textContent ?? ""), re.source, { timeout: 25000 }).then(() => ok(msg), () => fail(`não apareceu: ${msg}`));
  await espera(/Anúncio Meta/, "canal Anúncio Meta");
  await espera(/Busca do Google/, "canal Busca do Google (chegou do Google no meio da visita)");
  await espera(/Instagram \(orgânico\)/, "canal Instagram (orgânico)");
  await espera(/2026-12-cadastro-teste3dias/, "campanha do anúncio na entrada");
  if (await zap.count()) await espera(/Clicou no WhatsApp/, "clique no WhatsApp virou momento importante");
  await espera(/Nova visita · Fortaleza\/CE/, "notificação em tempo real com a cidade (Fortaleza/CE)");
  await espera(/Brasília\/DF/, "cidade Brasília/DF na lista");
  await espera(/iOS 17\.4 · iPhone · App do Instagram/, "aparelho em detalhe (iOS, iPhone, app do Instagram)");
  await espera(/Windows · Chrome/, "aparelho em detalhe (Windows, Chrome)");
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, "05-master-agora-no-site");
  await p.getByRole("heading", { name: "Entradas na última hora" }).scrollIntoViewIfNeeded();
  await shot(p, "05b-master-entradas");
  const v = await axe(p); if (v.length) fail(`axe agora: ${v.join(" | ")}`); else ok("axe sem violações graves em Agora no site");
  await p.goto(B + "/master/trafego/origens?dias=7", { waitUntil: "networkidle" });
  if (/2026-12-cadastro-teste3dias/.test(await p.locator("main").textContent())) ok("Origens mostra a campanha"); else fail("Origens sem a campanha");
  await shot(p, "06-master-origens");
  const v2 = await axe(p); if (v2.length) fail(`axe origens: ${v2.join(" | ")}`); else ok("axe sem violações graves em Origens");
  await p.setViewportSize({ width: 360, height: 780 });
  await p.goto(B + "/master/trafego", { waitUntil: "networkidle" });
  await noScroll(p, "agora 360");
  await p.goto(B + "/master/trafego/origens", { waitUntil: "networkidle" });
  await noScroll(p, "origens 360");
  for (const [c] of visitantes) await c.close();
  await m.close();
}

// 4) TR3: visita de anúncio → código da visita no WhatsApp → lista de espera → Comercial mostra a origem; Fechou com valor.
{
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.0", extraHTTPHeaders: { "x-forwarded-for": "200.147.67.142" } });
  const v = await c.newPage();
  await v.goto(`${B}/lojas`, { waitUntil: "networkidle" });
  await v.goto(`${B}/quero-minha-loja?utm_source=meta&utm_medium=pago&utm_campaign=2026-12-tr3&utm_content=video-tr3&fbclid=IwTR3`, { waitUntil: "networkidle" });
  await v.waitForTimeout(1200);
  const zap = v.locator('a[aria-label="Falar no WhatsApp"]');
  if (await zap.count()) {
    await v.evaluate(() => { const a = document.querySelector('a[aria-label="Falar no WhatsApp"]'); a?.addEventListener("click", (e) => e.preventDefault(), { once: true }); a?.click(); });
    const href = decodeURIComponent(((await zap.getAttribute("href")) ?? "").replaceAll("+", " "));
    if (/\(código [A-HJ-NP-Z2-9]{5}\)/.test(href)) ok("mensagem do WhatsApp leva o código da visita"); else fail(`WhatsApp sem código: ${href.slice(0, 160)}`);
  } else ok("(sem botão de WhatsApp nesta demonstração: código não conferido)");
  const email = `tr3-${Date.now()}@loja.teste`;
  await v.getByLabel("Seu nome").fill("Cliente TR3");
  await v.getByLabel("E-mail").fill(email);
  await v.getByLabel("WhatsApp com DDD").fill("85999990000");
  await v.getByRole("button", { name: "Enviar" }).click();
  await v.waitForTimeout(2500);
  await c.close();

  const m = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-host": "master.nextlevelgroup.com.br" } });
  const p = await m.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/comercial?canal=meta-pago", { waitUntil: "networkidle" });
  const cartao = p.locator("li", { hasText: "Cliente TR3" }).first();
  if (await cartao.count() && /2026-12-tr3/.test(await cartao.textContent()) && /Fortaleza\/CE/.test(await cartao.textContent())) ok("Comercial (filtro Anúncio Meta) mostra o lead com campanha e cidade"); else fail("lead não apareceu com a origem no Comercial");
  await shot(p, "08-comercial-filtro-canal");
  const v1 = await axe(p); if (v1.length) fail(`axe comercial: ${v1.join(" | ")}`); else ok("axe sem violações graves no Comercial");
  await cartao.getByRole("link", { name: "Cliente TR3" }).click();
  await p.getByRole("heading", { name: "De onde veio" }).waitFor({ timeout: 20000 });
  const ficha = await p.locator("main").textContent();
  if (/De onde veio/.test(ficha) && /video-tr3/.test(ficha) && /Clique de anúncio Meta/.test(ficha) && /iPhone · App do Instagram/.test(ficha)) ok("ficha: De onde veio com peça, clique do anúncio e aparelho"); else fail("ficha sem a origem completa");
  await p.getByRole("button", { name: "Fechou negócio" }).click();
  await p.getByLabel("Valor fechado").fill("1997,00");
  await p.getByLabel("O que foi vendido").fill("Loja Pronta");
  await p.getByRole("button", { name: "Confirmar fechamento" }).click();
  await p.getByText(/Negócio fechado:/).first().waitFor({ timeout: 15000 }).then(() => ok("Fechou negócio com valor"), () => fail("Fechou negócio não gravou"));
  await shot(p, "09-ficha-de-onde-veio");
  const v2 = await axe(p); if (v2.length) fail(`axe ficha: ${v2.join(" | ")}`); else ok("axe sem violações graves na ficha");
  await p.setViewportSize({ width: 360, height: 780 });
  await p.reload({ waitUntil: "networkidle" });
  await noScroll(p, "ficha 360");
  await m.close();
}

// 5) TR4: números no Master; tags só carregam com "Aceitar todos"; Lead sai com o identificador do contato.
{
  const m = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-host": "master.nextlevelgroup.com.br" } });
  const p = await m.newPage();
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/master/trafego/conexoes", { waitUntil: "networkidle" });
  await p.getByLabel("Google Ads: código da conta de conversão").fill("1234");
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.getByText(/começa com AW-/).first().waitFor({ timeout: 10000 }).then(() => ok("número errado recusado com explicação"), () => fail("número errado não foi recusado"));
  await p.getByLabel("Pixel da Meta (número do conjunto de dados)").fill("123456789012345");
  await p.getByLabel("Google Ads: código da conta de conversão").fill("AW-1234567890");
  await p.getByLabel('Google Ads: rótulo da conversão "Contato"').fill("AbC-dEfGhIj");
  await p.getByRole("button", { name: "Salvar" }).click();
  await p.getByText("Ligado").first().waitFor({ timeout: 10000 }).then(() => ok("Pixel e Google ligados no Master"), () => fail("tags não ficaram ligadas"));
  await shot(p, "10-master-pixel-google");
  const va = await axe(p); if (va.length) fail(`axe conexões: ${va.join(" | ")}`); else ok("axe sem violações graves em Pixel e Google");
  await m.close();

  for (const escolha of ["Só os necessários", "Aceitar todos"]) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA });
    await c.route(/connect\.facebook\.net|googletagmanager\.com/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
    const v = await c.newPage();
    await v.goto(`${B}/lojas`, { waitUntil: "networkidle" });
    await v.goto(`${B}/quero-minha-loja`, { waitUntil: "networkidle" });
    await v.getByRole("region", { name: "Cookies e privacidade" }).getByRole("button", { name: escolha }).click();
    await v.waitForTimeout(800);
    const tem = await v.evaluate(() => ({ fb: !!document.getElementById("nl-fbq"), g: !!document.getElementById("nl-gtag") }));
    if (escolha === "Só os necessários") { if (!tem.fb && !tem.g) ok("sem aceite: Pixel e Google não carregam"); else fail("tags carregaram sem aceite"); await c.close(); continue; }
    if (tem.fb && tem.g) ok("com aceite: Pixel e Google carregam"); else fail(`tags não carregaram com aceite: ${JSON.stringify(tem)}`);
    await v.getByLabel("Seu nome").fill("Cliente TR4");
    await v.getByLabel("E-mail").fill(`tr4-${Date.now()}@loja.teste`);
    await v.getByLabel("WhatsApp com DDD").fill("11999990000");
    await v.getByRole("button", { name: "Enviar" }).click();
    await v.waitForTimeout(2500);
    const filas = await v.evaluate(() => ({ fb: JSON.stringify((window).fbq?.queue ?? []), g: JSON.stringify((window).dataLayer ?? []) }));
    if (/"track","Lead",\{\},\{"eventID":"interessado:bld_/.test(filas.fb)) ok("Pixel recebeu o Lead com o identificador do contato"); else fail(`Lead não chegou ao Pixel: ${filas.fb.slice(0, 300)}`);
    if (/"conversion".*"send_to":"AW-1234567890\/AbC-dEfGhIj".*"transaction_id":"interessado:bld_/.test(filas.g)) ok("Google Ads recebeu a conversão de contato"); else fail(`conversão não chegou ao Google: ${filas.g.slice(0, 300)}`);
    await c.close();
  }
}
await b.close();
if (bad.length) { console.error("FALHAS:\n- " + bad.join("\n- ")); process.exit(1); }
console.log("tudo certo");
