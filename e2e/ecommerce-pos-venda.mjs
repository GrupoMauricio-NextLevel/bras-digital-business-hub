/**
 * Depois da venda na NextLevel Commerce (D179): lojista novo com um pedido pago leva o pedido até a entrega
 * (rastreio, separação, envio, entregue) e cancela um segundo pedido pago; o cliente acompanha pela página do pedido e
 * por "Acompanhar pedido". Cada passo anota o que aconteceu; o que travar vira um "tropeço" com captura de tela.
 * Uso: E2E_BASE=http://cm.test:3300 node e2e/ecommerce-pos-venda.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const B = process.env.E2E_BASE ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-ecommerce-pos-venda";
mkdirSync(OUT, { recursive: true });
const sufixo = Date.now().toString(36);
function cpf() {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const n of [9, 10]) { const s = d.reduce((acc, x, i) => acc + x * (n + 1 - i), 0); const r = (s * 10) % 11; d.push(r === 10 ? 0 : r); }
  return d.join("");
}
const loja = { nome: `Ateliê Pós ${sufixo}`, dono: "Larissa Teste", email: `pos+${sufixo}@teste.dev`, senha: "senha-forte-123", doc: cpf() };
const RASTREIO = `QB${String(Date.now()).slice(-9)}BR`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${B}`] });
const log = [], tropecos = [], erros = [];
let n = 0;
async function passo(p, nome, fn) {
  const t0 = Date.now();
  try { const nota = await fn(); log.push({ nome, ok: true, ms: Date.now() - t0, nota: nota ?? null, url: p.url() }); console.log("✔", nome, nota ? `· ${nota}` : ""); return true; }
  catch (e) {
    const shot = `${OUT}/tropeco-${String(++n).padStart(2, "0")}.png`;
    await p.screenshot({ path: shot, fullPage: true }).catch(() => {});
    const msg = String(e?.message ?? e).split("\n")[0].slice(0, 220);
    tropecos.push({ nome, msg, url: p.url(), shot }); log.push({ nome, ok: false, msg });
    console.log("✘", nome, "·", msg); return false;
  }
}
const texto = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
const botoes = (p) => p.evaluate(() => [...document.querySelectorAll("main button, main a[href]")].map((x) => x.textContent.trim()).filter(Boolean).slice(0, 30).join(" | "));

const ctx = await b.newContext({ viewport: { width: Number(process.env.LARGURA ?? 1280), height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => erros.push(e.message));

// Preparação (já coberta por e2e/ecommerce-do-zero.mjs): loja nova, um produto, publicada.
let slug = null;
await passo(p, "0. Loja nova com produto, publicada", async () => {
  await p.goto(B + "/cadastro", { waitUntil: "networkidle" });
  await p.fill("#store", loja.nome); await p.fill("#owner", loja.dono); await p.fill("#email", loja.email);
  await p.fill("#pass", loja.senha); await p.fill("#tax", loja.doc);
  await p.locator("form[aria-label=Cadastro] button[type=submit]").click();
  await p.waitForURL((u) => !u.pathname.startsWith("/cadastro"), { timeout: 30000 });
  await p.goto(B + "/merchant/catalogo/new", { waitUntil: "networkidle" });
  await p.fill("#name", "Blusa de linho off-white"); await p.fill("#sku", `BL-${sufixo}`.toUpperCase());
  await p.fill("#cost", "59,00"); await p.fill("#sug", "149,90");
  if (await p.locator("#min").count()) await p.fill("#min", "119,90");
  const est = p.getByPlaceholder("ex.: 10"); if (await est.count()) await est.first().fill("10");
  await p.getByRole("button", { name: /Cadastrar produto/ }).click();
  await p.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 30000 });
  await p.goto(B + "/merchant/storefront", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Publicar/ }).first().click(); await p.waitForTimeout(2000);
  slug = await p.evaluate(() => document.querySelector("a[href*='/store/']")?.getAttribute("href")?.split("/store/")[1]?.split(/[/?#]/)[0] ?? null);
  if (!slug) throw new Error("sem endereço da loja");
  return slug;
});

/** Cliente compra um item; devolve { url, numero } da página do pedido. */
async function compra(nome, email) {
  const c = await (await b.newContext({ viewport: { width: 390, height: 860 } })).newPage();
  c.on("pageerror", (e) => erros.push(e.message));
  await c.goto(`${B}/store/${slug}`, { waitUntil: "networkidle" });
  const prod = await c.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).find((h) => h && h.includes("/product/")));
  await c.goto(B + prod, { waitUntil: "networkidle" });
  const tam = c.locator("button[aria-pressed]").first(); if (await tam.count()) await tam.click().catch(() => {});
  await c.getByRole("button", { name: /Adicionar ao carrinho|Comprar/ }).first().click();
  await c.goto(`${B}/store/${slug}/checkout`, { waitUntil: "networkidle" });
  const campo = c.locator("input:not([type=checkbox]):not([type=radio]):not([type=hidden])");
  const fill = async (re, v) => { const l = c.getByLabel(re).and(campo); if (await l.count()) await l.first().fill(v); };
  await fill(/Nome/i, nome); await fill(/E-mail/i, email); await fill(/WhatsApp/i, "11999998888");
  await fill(/CEP/i, "01310-100"); await fill(/Endere/i, "Avenida Paulista, 1000"); await fill(/Cidade/i, "São Paulo");
  await c.waitForTimeout(1500);
  await c.getByRole("button", { name: /Ir para o pagamento/ }).first().click();
  await c.waitForURL((u) => u.pathname.includes("/order/"), { timeout: 30000 });
  // A página do pedido termina de carregar depois da navegação: espera o número aparecer.
  await c.waitForFunction(() => /#\s?\d{3,}/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
  const numero = (await texto(c)).match(/#\s?(\d{3,})/)?.[1] ?? null;
  return { c, url: c.url(), numero };
}

let pedido1 = null, pedido2 = null;
await passo(p, "1. Dois clientes compram (pagamento aprovado na demonstração)", async () => {
  pedido1 = await compra("Cliente Entrega", `entrega+${sufixo}@teste.dev`);
  pedido2 = await compra("Cliente Cancela", `cancela+${sufixo}@teste.dev`);
  return `pedidos #${pedido1.numero} e #${pedido2.numero}`;
});


await passo(p, "2. Lojista abre o pedido pago e vê o que fazer", async () => {
  await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  const link = p.locator(`a[href*='/merchant/orders/ord_']`).filter({ hasText: pedido1.numero ?? "Cliente Entrega" }).first();
  if (await link.count()) await link.click(); else await p.getByText("Cliente Entrega").first().click();
  await p.waitForURL((u) => /\/merchant\/orders\/ord_/.test(u.pathname), { timeout: 15000 });

  const t = await texto(p);
  const situacao = t.match(/Situação atual (.{0,140})/)?.[1] ?? "?";
  if (/Central|recarga|saldo/i.test(situacao)) throw new Error(`fala de Central/recarga na situação: ${situacao}`);
  return `situação: ${situacao} · botões: ${await botoes(p)}`;
});

for (const [i, re] of [[3, /Iniciar separação/], [4, /Concluir separação/]]) {
  await passo(p, `${i}. Lojista: ${re.source}`, async () => {
    const btn = p.getByRole("button", { name: re });
    if (!(await btn.count())) throw new Error(`botão não aparece (botões: ${await botoes(p)})`);
    await btn.first().click(); await p.waitForTimeout(1500);
    return (await texto(p)).match(/Situação atual (.{0,90})/)?.[1] ?? "";
  });
}

await passo(p, "5. Lojista marca como enviado informando o rastreio", async () => {
  const btn = p.getByRole("button", { name: /Marcar como enviado/ });
  if (!(await btn.count())) throw new Error(`botão não aparece (botões: ${await botoes(p)})`);
  await btn.first().click();
  await p.getByLabel(/Como o pedido vai/i).selectOption("CORREIOS");
  await p.getByLabel(/Código de rastreio/i).fill(RASTREIO);
  await p.screenshot({ path: `${OUT}/lojista-envio.png` });
  await p.getByRole("button", { name: /Confirmar envio/ }).click(); await p.waitForTimeout(2000);
  const t = await texto(p);
  if (!t.includes(RASTREIO)) throw new Error("o código não aparece no pedido depois de enviar");
  return t.match(/Situação atual (.{0,90})/)?.[1] ?? RASTREIO;
});

await passo(pedido1.c, "5b. Cliente vê enviado e o rastreio na página do pedido", async () => {
  await pedido1.c.goto(pedido1.url, { waitUntil: "networkidle" });
  const t = await texto(pedido1.c);
  if (!/enviado/i.test(t)) throw new Error("a página do pedido não mostra que foi enviado");
  if (!t.includes(RASTREIO)) throw new Error("a página do pedido não mostra o código de rastreio");
  await pedido1.c.screenshot({ path: `${OUT}/cliente-enviado-390.png`, fullPage: true });
  return "enviado com rastreio";
});

await passo(p, "6. Lojista: Marcar como entregue", async () => {
  const btn = p.getByRole("button", { name: /Marcar como entregue/ });
  if (!(await btn.count())) throw new Error(`botão não aparece (botões: ${await botoes(p)})`);
  await btn.first().click(); await p.waitForTimeout(1500);
  return (await texto(p)).match(/Situação atual (.{0,90})/)?.[1] ?? "";
});

await passo(pedido1.c, "7. Cliente acha o pedido em Acompanhar pedido (número + e-mail)", async () => {
  await pedido1.c.goto(`${B}/store/${slug}/acompanhar`, { waitUntil: "networkidle" });
  const c = pedido1.c;
  await c.getByLabel(/Número/i).fill(String(pedido1.numero)); await c.getByLabel(/E-mail/i).fill(`entrega+${sufixo}@teste.dev`);
  await c.getByRole("button", { name: /Acompanhar|Buscar|Consultar/ }).first().click(); await c.waitForTimeout(1500);
  const t = await texto(c);
  if (!/entregue/i.test(t)) throw new Error("não mostra o pedido como entregue");
  return "entregue";
});

await passo(p, "8. Lojista cancela o segundo pedido (pago)", async () => {
  await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  await p.getByText("Cliente Cancela").first().click();
  await p.waitForURL((u) => /\/merchant\/orders\/ord_/.test(u.pathname), { timeout: 15000 });
  await p.getByRole("button", { name: /^Cancelar$/ }).first().click();
  const dialogo = await p.locator("[role=alertdialog], [role=dialog]").last().innerText();
  await p.getByRole("button", { name: /Cancelar pedido/ }).last().click(); await p.waitForTimeout(1500);
  const t = await texto(p);
  if (!/devolv|estorn|reembols/i.test(dialogo + t)) throw new Error(`cancelou sem dizer o que acontece com o dinheiro do cliente (diálogo: "${dialogo.replace(/\s+/g, " ").slice(0, 160)}")`);
  return "cancelado com devolução";
});

await passo(pedido2.c, "9. Cliente do pedido cancelado vê cancelamento e devolução", async () => {
  await pedido2.c.goto(pedido2.url, { waitUntil: "networkidle" });
  const t = await texto(pedido2.c);
  if (!/cancelad/i.test(t)) throw new Error("a página do pedido não mostra o cancelamento");
  if (!/devolv|estorn|reembols/i.test(t)) throw new Error("não diz ao cliente que o dinheiro foi devolvido");
  return "cancelado e devolvido";
});

await passo(p, "10. Pós-venda do lojista sem conceito do SuperDrop", async () => {
  await p.goto(B + "/merchant/after-sales", { waitUntil: "networkidle" });
  const t = await texto(p);
  const vaza = t.match(/Central[^.]{0,60}|recarga[^.]{0,40}|saldo da carteira/i);
  if (vaza) throw new Error(`texto do SuperDrop: "${vaza[0]}"`);
  return "ok";
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ base: B, loja, slug, log, tropecos, erros: [...new Set(erros)] }, null, 1));
console.log(`\n${log.filter((l) => l.ok).length}/${log.length} passos sem tropeço · erros de página: ${new Set(erros).size}`);
process.exit(tropecos.length ? 2 : 0);
