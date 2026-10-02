/**
 * Jornada completa da conta simples (Commerce), como um cliente e um lojista de verdade:
 * compra com faixa de atacado + cupom → pedido pago (demonstração) → lojista gera etiqueta, separa e envia (sem Central)
 * → cliente acompanha e avalia → lojista aprova → avaliação aparece na página do produto.
 * Uso (demonstração ligada): E2E_BASE=http://localhost:3100 node e2e/jornada-completa.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const S = process.env.E2E_STORE ?? "/store/fio-linha";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const step = (m) => console.log("•", m);
const must = (c, m) => { if (!c) { console.log("✘", m); throw new Error(m); } };
const errors = [];
try {
  // ---------- Cliente compra ----------
  const cust = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage();
  cust.on("pageerror", (e) => errors.push(e.message));
  await cust.goto(B + "/lojas", { waitUntil: "networkidle" });
  await cust.goto(B + S + "/catalog", { waitUntil: "networkidle" });
  const href = await cust.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).find((h) => h && h.includes("/product/") && /poncho/i.test(h)));
  must(href, "produto Poncho encontrado no catálogo");
  await cust.goto(B + href, { waitUntil: "networkidle" });
  must(await cust.getByText(/A partir de 6 peças/).first().isVisible(), "faixa de atacado aparece na página do produto");
  await cust.getByRole("button", { name: "M", exact: true }).first().click();
  for (let i = 0; i < 5; i++) await cust.getByRole("button", { name: "Mais" }).click();
  await cust.getByRole("button", { name: /Adicionar ao carrinho/ }).click();
  await cust.goto(B + S + "/cart", { waitUntil: "networkidle" });
  must(await cust.getByText(/161,91 cada/).first().isVisible(), "carrinho aplica o preço da faixa (6 × R$ 161,91)");
  step("cliente: faixa de atacado no produto e no carrinho");
  await cust.goto(B + S + "/checkout", { waitUntil: "networkidle" });
  await cust.getByPlaceholder("Nome completo").fill("Marta Compradora");
  await cust.getByPlaceholder("E-mail").fill("marta.e2e@exemplo.com");
  await cust.getByPlaceholder("WhatsApp").fill("11988887777");
  await cust.getByPlaceholder("CEP").fill("01310100");
  await cust.getByPlaceholder("Endereço e número").fill("Av. Paulista, 1000");
  await cust.getByPlaceholder("Cidade").fill("São Paulo");
  await cust.waitForSelector("[data-shipping-options] input[type=radio]", { timeout: 30000 });
  await cust.getByLabel("Cupom de desconto").fill("BEMVINDO10");
  await cust.getByRole("button", { name: "Aplicar" }).click();
  await cust.getByText(/Cupom BEMVINDO10/).waitFor({ timeout: 15000 });
  step("cliente: cupom aplicado no checkout");
  await cust.getByRole("button", { name: /Ir para o pagamento/ }).click();
  await cust.waitForURL(/\/order\//, { timeout: 60000 });
  const orderUrl = cust.url();
  must(await cust.getByText(/Pedido (confirmado|recebido)/).first().isVisible(), "página de confirmação do pedido");
  step("cliente: pedido criado " + orderUrl.split("/").pop());

  // ---------- Lojista opera ----------
  const mer = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  mer.on("pageerror", (e) => errors.push(e.message));
  await mer.goto(B + "/lojas", { waitUntil: "networkidle" });
  await mer.goto(B + "/login", { waitUntil: "networkidle" });
  await mer.fill("#email", "lojista@commerce.demo"); await mer.fill("#password", "demo1234");
  await mer.getByRole("button", { name: /Entrar/ }).click();
  await mer.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
  await mer.goto(B + "/merchant/orders", { waitUntil: "networkidle" });
  await mer.getByText("Marta Compradora").first().click();
  await mer.waitForURL(/\/merchant\/orders\/[^/]+$/, { timeout: 30000 });
  await mer.getByText(/Desconto \(BEMVINDO10\)/).first().waitFor({ timeout: 20000 }).catch(() => { throw new Error("pedido mostra o desconto do cupom"); });
  must(await mer.getByText(/Custo à Central|Custo debitado do saldo/).count() === 0, "conta simples não vê textos da Central");
  step("lojista: pedido com desconto e sem textos da Central");
  await mer.getByRole("button", { name: /Anexar etiqueta/ }).click();
  await mer.getByRole("button", { name: /Gerar etiqueta de demonstração/ }).click();
  await mer.getByRole("button", { name: /Iniciar separação|Separação/ }).first().waitFor({ timeout: 30000 });
  for (const label of [/Iniciar separação/, /Concluir separação|Marcar como separado/, /Marcar como enviado|Enviar/]) {
    const btn = mer.getByRole("button", { name: label }).first();
    await btn.waitFor({ timeout: 30000 }); await btn.click(); await mer.waitForTimeout(1200);
  }
  await mer.waitForFunction(() => /enviado/i.test(document.body.innerText), null, { timeout: 30000 });
  step("lojista: separou e enviou sozinho (conta simples)");
  await mer.getByLabel("Nota interna").fill("Embalado com cuidado, cliente pediu presente.");
  await mer.getByRole("button", { name: "Salvar nota" }).click();
  await mer.getByText("Nota interna", { exact: true }).first().waitFor({ timeout: 15000 });
  const print = await mer.goto(mer.url() + "/print", { waitUntil: "networkidle" });
  must(print.status() === 200 && await mer.getByText(/Não é documento fiscal/).first().isVisible(), "folha de impressão sem valor fiscal");
  must(!(await mer.content()).includes("Embalado com cuidado"), "nota interna não aparece na impressão");
  step("lojista: nota interna e impressão");

  // ---------- Cliente acompanha e avalia ----------
  await cust.goto(B + S + "/acompanhar?pedido=" + (await mer.evaluate(() => 0).then(() => "")) , { waitUntil: "domcontentloaded" }).catch(() => {});
  await cust.goto(orderUrl, { waitUntil: "networkidle" });
  const num = (await cust.getByText(/^#\d+$/).first().innerText().catch(() => "")) || (await cust.locator("b").first().innerText());
  await cust.goto(`${B}${S}/acompanhar?pedido=${num.replace(/\D/g, "")}&email=marta.e2e@exemplo.com`, { waitUntil: "networkidle" });
  must(await cust.getByText("Avalie sua compra").isVisible(), "cliente com pedido enviado vê o formulário de avaliação");
  await cust.getByLabel("5★").first().check();
  await cust.getByPlaceholder(/Conte como foi/).fill("Poncho lindo, chegou antes do prazo!");
  await cust.getByRole("button", { name: "Enviar avaliação" }).click();
  await cust.getByText(/Obrigado pela avaliação/).waitFor({ timeout: 20000 });
  step("cliente: avaliou a compra");

  // ---------- Lojista aprova e a avaliação aparece ----------
  await mer.goto(B + "/merchant/avaliacoes", { waitUntil: "networkidle" });
  const card = mer.locator("li", { hasText: "Poncho lindo, chegou antes do prazo!" });
  await card.getByRole("button", { name: "Publicar" }).click();
  await card.getByText("Publicada").waitFor({ timeout: 20000 });
  await cust.goto(B + href, { waitUntil: "networkidle" });
  must(await cust.getByText(/Poncho lindo, chegou antes do prazo!/).isVisible(), "avaliação aprovada aparece na página do produto");
  step("lojista: aprovou; avaliação visível na loja");

  // ---------- Equipe não passa nas funções de dono ----------
  const staff = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await staff.goto(B + "/login", { waitUntil: "networkidle" });
  await staff.fill("#email", "equipe@commerce.demo"); await staff.fill("#password", "demo1234");
  await staff.getByRole("button", { name: /Entrar/ }).click();
  await staff.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
  for (const path of ["/merchant/finance", "/merchant/settings", "/merchant/descontos", "/merchant/team"]) {
    await staff.goto(B + path, { waitUntil: "networkidle" });
    must(new URL(staff.url()).pathname === "/merchant/orders", `equipe é redirecionada em ${path}`);
  }
  step("equipe: bloqueada em finanças, configurações, cupons e equipe");
} catch (e) {
  console.log("FALHOU:", e.message.split("\n")[0]); await b.close(); process.exit(1);
}
await b.close();
if (errors.length) { console.log("Erros de página:\n" + [...new Set(errors)].join("\n")); process.exit(1); }
console.log("JORNADA COMPLETA OK");
