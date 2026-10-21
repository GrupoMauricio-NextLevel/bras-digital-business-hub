/**
 * Lojista novo da NextLevel E-commerce, do zero até a primeira venda e o plano (D176): cadastro → primeiro produto →
 * publicar → cliente compra → pedido pago aparece → assinatura do plano. Cada passo anota o que aconteceu; o que travar
 * vira um "tropeço" com captura de tela. Não para no primeiro problema: o objetivo é listar tudo o que atrapalha.
 * Uso: E2E_BASE=http://cm.test:3300 node e2e/ecommerce-do-zero.mjs [pasta-de-saida]
 *   (no servidor de teste com nomes .test: CHROMIUM_ARGS já mapeia *.test para 127.0.0.1)
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const B = process.env.E2E_BASE ?? "http://cm.test:3300";
const OUT = process.argv[2] ?? "e2e-ecommerce-do-zero";
mkdirSync(OUT, { recursive: true });
const sufixo = Date.now().toString(36);
/** CPF válido novo a cada execução: o teste grátis vale uma vez por documento (proteção contra abuso). */
function cpf() {
  const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const n of [9, 10]) { const s = d.reduce((acc, x, i) => acc + x * (n + 1 - i), 0); const r = (s * 10) % 11; d.push(r === 10 ? 0 : r); }
  return d.join("");
}
const loja = { nome: `Ateliê Teste ${sufixo}`, dono: "Larissa Teste", email: `larissa+${sufixo}@teste.dev`, senha: "senha-forte-123", doc: cpf() };
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${B}`] });
const log = [];
const tropecos = [];
const erros = [];
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

const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => erros.push(e.message));

await passo(p, "1. Cadastro da loja", async () => {
  await p.goto(B + "/cadastro", { waitUntil: "networkidle" });
  await p.fill("#store", loja.nome); await p.fill("#owner", loja.dono); await p.fill("#email", loja.email);
  await p.fill("#pass", loja.senha); await p.fill("#tax", loja.doc);
  await p.locator("form[aria-label=Cadastro] button[type=submit]").click();
  await p.waitForURL((u) => !u.pathname.startsWith("/cadastro"), { timeout: 30000 });
  return `foi para ${new URL(p.url()).pathname}`;
});

let slug = null;
await passo(p, "2. Primeira tela do lojista mostra o que falta", async () => {
  await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  const t = await texto(p);
  if (!/produto/i.test(t)) throw new Error("a primeira tela não fala do primeiro produto");
  slug = await p.evaluate(() => [...document.querySelectorAll("a[href*='/store/']")].map((a) => a.getAttribute("href")).find(Boolean)?.split("/store/")[1]?.split(/[/?#]/)[0] ?? null);
  return `endereço da loja: ${slug ?? "não aparece na tela"}`;
});

await passo(p, "3. Cadastrar o primeiro produto", async () => {
  await p.goto(B + "/merchant/catalogo/new", { waitUntil: "networkidle" });
  await p.fill("#name", "Blusa de linho off-white"); await p.fill("#sku", `BL-${sufixo}`.toUpperCase());
  await p.fill("#cost", "59,00"); await p.fill("#sug", "149,90");
  if (await p.locator("#min").count()) await p.fill("#min", "119,90");
  if (await p.locator("#allstock").count()) { await p.locator("#allstock").check().catch(() => {}); }
  const est = p.getByPlaceholder("ex.: 10");
  if (await est.count()) await est.first().fill("10");
  await p.getByRole("button", { name: /Cadastrar produto/ }).click();
  await p.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 30000 });
  return `foi para ${new URL(p.url()).pathname}`;
});

await passo(p, "4. Produto aparece como pronto para vender", async () => {
  await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  const t = await texto(p);
  if (/Nenhum produto ativo, com estoque/i.test(t)) throw new Error("prontidão ainda diz que não há produto à venda (precisa de mais um passo?)");
  return "prontidão reconhece o produto";
});

await passo(p, "5. Publicar a loja", async () => {
  await p.goto(B + "/merchant/storefront", { waitUntil: "networkidle" });
  const btn = p.getByRole("button", { name: /Publicar/ });
  if (!(await btn.count())) throw new Error("não há botão de publicar na tela Loja virtual");
  await btn.first().click(); await p.waitForTimeout(2000);
  const t = await texto(p);
  if (!/Publicada/i.test(t)) throw new Error("depois de clicar, a loja não aparece como publicada");
  slug ??= await p.evaluate(() => document.querySelector("a[href*='/store/']")?.getAttribute("href")?.split("/store/")[1]?.split(/[/?#]/)[0] ?? null);
  return `loja ${slug}`;
});

await passo(p, "6. Pagamento da loja (Mercado Pago)", async () => {
  await p.goto(B + "/merchant/settings#payments", { waitUntil: "networkidle" });
  const t = await texto(p);
  return /demonstra/i.test(t) ? "modo demonstração (sem dinheiro real)" : /Conectad/i.test(t) ? "conectado" : "não conectado";
});

const cliente = await (await b.newContext({ viewport: { width: 390, height: 860 } })).newPage();
cliente.on("pageerror", (e) => erros.push(e.message));
await passo(cliente, "7. Cliente compra na loja", async () => {
  if (!slug) throw new Error("sem o endereço da loja");
  await cliente.goto(`${B}/store/${slug}`, { waitUntil: "networkidle" });
  const prod = await cliente.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).find((h) => h && h.includes("/product/")));
  if (!prod) throw new Error("vitrine publicada sem link para o produto");
  await cliente.goto(B + prod, { waitUntil: "networkidle" });
  const tam = cliente.locator("button[aria-pressed]").first();
  if (await tam.count()) await tam.click().catch(() => {});
  await cliente.getByRole("button", { name: /Adicionar ao carrinho|Comprar/ }).first().click();
  await cliente.goto(`${B}/store/${slug}/checkout`, { waitUntil: "networkidle" });
  const texto_ = cliente.locator("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea");
  const fill = async (re, v) => { const l = cliente.getByLabel(re).and(texto_); if (await l.count()) await l.first().fill(v); };
  await fill(/Nome/i, "Cliente Teste"); await fill(/E-mail/i, "cliente@teste.dev"); await fill(/WhatsApp|Telefone|Celular/i, "11999998888");
  await fill(/CPF/i, "52998224725"); await fill(/CEP/i, "01310-100"); await fill(/Endere|Rua/i, "Avenida Paulista"); await fill(/^Número/i, "1000");
  await fill(/Bairro/i, "Bela Vista"); await fill(/Cidade/i, "São Paulo");
  const uf = cliente.getByLabel(/Estado|UF/i); if (await uf.count()) await uf.first().selectOption("SP").catch(async () => uf.first().fill("SP"));
  await cliente.getByRole("button", { name: /Ir para o pagamento|Finalizar|Pagar|Confirmar pedido|Fazer pedido/ }).first().click();
  await cliente.waitForTimeout(3000);
  return `cliente em ${new URL(cliente.url()).pathname}`;
});

await passo(cliente, "8. Pagamento do cliente (demonstração)", async () => {
  const sim = cliente.getByRole("button", { name: /Simular pagamento|Pagar agora|Já paguei/ });
  if (!(await sim.count())) throw new Error("tela depois do pedido sem caminho de pagamento visível");
  await sim.first().click(); await cliente.waitForTimeout(2500);
  return "pagamento simulado";
});

await passo(p, "9. Lojista vê o pedido pago", async () => {
  await p.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  const t = await texto(p);
  if (!/Cliente Teste/.test(t)) throw new Error("o pedido do cliente não aparece na lista");
  return "pedido na lista";
});

await passo(p, "10. Assinar o plano (pelo aviso do teste grátis)", async () => {
  await p.goto(B + "/merchant", { waitUntil: "networkidle" });
  const link = p.getByRole("link", { name: /Assinar agora/ }).first();
  if (!(await link.count())) throw new Error("sem o atalho \"Assinar agora\" no aviso do teste");
  await link.click(); await p.waitForLoadState("networkidle"); await p.waitForTimeout(800);
  const destino = new URL(p.url()).pathname + new URL(p.url()).hash;
  const btn = p.getByRole("button", { name: /Assinar|Pagar|Gerar Pix|Escolher|Continuar/ }).first();
  if (!(await btn.count())) throw new Error(`"Assinar agora" leva a ${destino}, mas lá não há botão para assinar`);
  await btn.click(); await p.waitForTimeout(2500);
  return /Pix|QR|copia e cola/i.test(await texto(p)) ? `Pix do plano gerado (${destino})` : `depois do clique: ${new URL(p.url()).pathname}`;
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ base: B, loja, log, tropecos, erros: [...new Set(erros)] }, null, 1));
console.log(`\n${log.filter((l) => l.ok).length}/${log.length} passos sem tropeço · erros de página: ${new Set(erros).size}`);
process.exit(tropecos.length ? 2 : 0);
