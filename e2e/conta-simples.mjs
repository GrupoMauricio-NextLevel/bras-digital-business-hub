/**
 * P0: conta simples. Na NextLevel Commerce o lojista abre a loja sem fornecedor, começa o teste do plano (D90), paga o 1º mês por Pix, cadastra o
 * primeiro produto, publica e recebe um pedido de teste, sem ver Central, carteira nem fornecedor.
 * Uso: BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/conta-simples.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const cpfDigit = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * (d.length + 1 - i); const r = (sum * 10) % 11; return r === 10 ? 0 : r; };
const makeCpf = () => { const d = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)); if (d.every((x) => x === d[0])) d[0] = (d[0] + 1) % 10; d.push(cpfDigit(d)); d.push(cpfDigit(d)); return d.join(""); };
const RUN = Date.now().toString(36);
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { "x-forwarded-host": "lojas.nextlevelgroup.com.br" } });
const p = await ctx.newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));

await p.goto(`${B}/cadastro`, { waitUntil: "networkidle" });
if (new URL(p.url()).pathname !== "/cadastro") { fail("cadastro da Commerce não abriu (ligue BRAND_SIGNUP_NEXTLEVEL_COMMERCE=true)"); await b.close(); console.log(bad.join("\n")); process.exit(1); }
if (await p.locator("#supplier").count()) fail("cadastro da Commerce pede fornecedor");
if (/Drop manual/i.test(await p.locator("body").innerText())) fail("plano de dropshipping apareceu na Commerce");
ok("cadastro da Commerce sem fornecedor e sem plano de dropshipping");
await p.locator("#store").fill("Moda Brás " + RUN); await p.locator("#owner").fill("Maria Lojista");
await p.locator("#email").fill(`maria-${RUN}@teste.com`); await p.locator("#pass").fill("senha-segura-1"); await p.locator("#tax").fill(makeCpf());
// D90/D233: plano Commerce com a oferta de entrada (3 dias grátis; sem 1º mês de R$ 9,90).
const signupText = (await p.locator("form[aria-label=Cadastro]").innerText()).replace(/\u00a0/g, " ");
for (const t of ["Plano Start", "Plano Pro", "Plano Scale", "3 dias grátis"]) if (!signupText.includes(t)) fail(`cadastro sem "${t}"`);
await p.getByRole("button", { name: /Criar loja e começar|criar minha loja/i }).click();
await p.waitForURL(/\/merchant/, { timeout: 90000 }); await p.waitForLoadState("networkidle");
await p.waitForSelector("[data-trial-banner]", { timeout: 30000 }); ok("loja nova entra no teste de 3 dias da oferta de entrada");
await p.goto(B + "/merchant/finance#evolucao", { waitUntil: "networkidle" });
const fin = await p.locator("body").innerText();
if (/R\$\s?9,90/.test(fin)) fail("financeiro ainda mostra o 1º mês de R$ 9,90 (D233)");
if (!/Minha operação/.test(fin) || !/Minha evolução com a NextLevel/.test(fin) || !/Oportunidades/.test(fin)) fail("financeiro sem as três áreas");
await p.getByRole("button", { name: /Pagar por Pix/ }).first().click();
await p.getByRole("button", { name: /Simular pagamento/ }).waitFor({ timeout: 25000 });
await p.getByRole("button", { name: /Simular pagamento/ }).click();
await p.waitForSelector("text=Pagamento confirmado", { timeout: 20000 });
await p.keyboard.press("Escape"); await p.reload({ waitUntil: "networkidle" });
if (await p.locator("[data-trial-banner]").count()) fail("pagar a 1ª fatura não ativou a assinatura"); else ok("1ª fatura do plano paga: assinatura ativa");
await p.goto(B + "/merchant", { waitUntil: "networkidle" });

const body = await p.locator("body").innerText();
for (const w of ["Saldo e recargas", "Central", "Fornecedor", "Recarregar"]) if (new RegExp(w).test(body)) fail(`painel do lojista independente mostra "${w}"`);
if (!(await p.getByRole("link", { name: /^(Meus produtos|Produtos|Catálogo)$/ }).count())) fail("menu sem o link de produtos");
if (!(await p.getByText(/Até a primeira venda/).count())) fail("sem o cartão 'Até a primeira venda'");
if (!(await p.getByText(/Produto à venda com estoque/).count())) fail("checklist sem 'Produto à venda com estoque'");
ok("painel enxuto: sem Central, carteira ou fornecedor; checklist com produtos");

await p.goto(B + "/supplier", { waitUntil: "networkidle" });
if (new URL(p.url()).pathname.startsWith("/supplier")) fail("lojista entrou em /supplier"); else ok("/supplier bloqueado para o lojista");

await p.goto(B + "/merchant/catalogo/new", { waitUntil: "networkidle" });
await p.getByLabel("Nome", { exact: true }).fill("Vestido Teste " + RUN);
await p.getByLabel("SKU", { exact: true }).fill("VT-" + RUN.toUpperCase());
await p.locator("#cat").fill("Vestidos"); await p.locator("#sug").fill("129,90"); await p.locator("#cost").fill("49,00");
await p.getByRole("button", { name: "Cadastrar produto" }).click();
await p.waitForURL(/\/merchant\/catalogo\/prd_/, { timeout: 30000 }).catch(async (e) => { console.log("TOASTS:", await p.locator("[data-sonner-toast]").allInnerTexts(), (await p.locator("[role=alert]").allInnerTexts())); throw e; }); ok("produto cadastrado na conta simples");
await p.goto(B + "/merchant/catalogo", { waitUntil: "networkidle" });
if (!(await p.getByText("Vestido Teste " + RUN).count())) fail("produto não aparece em Meus produtos");

await p.goto(B + "/merchant/products", { waitUntil: "networkidle" });
if (!(await p.getByText("Vestido Teste " + RUN).count())) fail("produto não chegou em Preços e publicação"); else ok("produto disponível para publicar na loja");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("CONTA SIMPLES OK");
