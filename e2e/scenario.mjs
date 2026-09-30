import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
const B = process.env.E2E_BASE ?? "http://localhost:3300", MP = process.env.E2E_MP ?? "http://localhost:4010", S = process.env.E2E_OUT ?? ".e2e";
mkdirSync(S, { recursive: true });
// Imagem de teste gerada em memória (PNG vermelho 1200x1500), sem arquivo binário no repositório.
{
  const w = 1200, h = 1500, row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3)]);
  for (let x = 0; x < w; x++) { row[1 + x * 3] = 180; row[2 + x * 3] = 30; row[3 + x * 3] = 40; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td) >>> 0); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(S + "/foto.png", Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const step = (n) => console.log("✔", n);
const fail = (m) => { console.error("✘", m); process.exit(1); };
const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
const makePdf = async () => { const { PDFDocument } = await import("pdf-lib"); const d = await PDFDocument.create(); d.addPage([283, 425]).drawText("ETIQUETA E2E", { x: 40, y: 200 }); return d.save(); };
const login = async (email, pass) => { await ctx.clearCookies(); await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByLabel("E-mail").fill(email); await p.getByLabel("Senha", { exact: true }).fill(pass); await p.getByRole("button", { name: "Entrar" }).click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }); await p.waitForLoadState("networkidle"); };
const setPassword = async (pass) => { await p.waitForURL(/account\/password/, { timeout: 30000 }); await p.getByLabel("Nova senha", { exact: true }).fill(pass); await p.getByLabel("Confirmar nova senha").fill(pass); await p.getByRole("button", { name: "Salvar senha" }).click(); await p.waitForURL((u) => !u.pathname.startsWith("/account"), { timeout: 30000 }); await p.waitForLoadState("networkidle"); };
const creds = async () => ({ email: (await p.locator("dd.select-all").nth(0).textContent()).trim(), pass: (await p.locator("dd.select-all").nth(1).textContent()).trim() });

// 0. demo desligado: sem seletor de perfis
await p.goto(B + "/login", { waitUntil: "networkidle" });
if (await p.getByText("Perfis de demonstração").count()) fail("demo mode deveria estar desligado");
step("login exige credenciais (demo desligado)");

// 1. master cria fornecedor
await login("master@teste.com", "Master-Teste-2026");
if (!p.url().endsWith("/master")) fail("master deveria cair em /master: " + p.url());
await p.goto(B + "/master/suppliers/new", { waitUntil: "networkidle" });
await p.getByLabel("Nome / marca").fill("Arena Fornecedora");
await p.getByLabel("Cidade").fill("São Paulo");
await p.getByLabel("Nome", { exact: true }).fill("Carlos Fornecedor");
await p.getByLabel("E-mail de acesso").fill("carlos@fornecedor.com");
await p.getByRole("switch").click();
await p.getByRole("button", { name: "Criar fornecedor" }).click();
await p.waitForSelector("dd.select-all");
const sup = await creds(); step("master criou fornecedor " + sup.email);

// 2. fornecedor: troca senha, cadastra produto com foto e importa CSV
await login(sup.email, sup.pass); await setPassword("Fornecedor-Novo-1");
if (!p.url().includes("/supplier")) fail("fornecedor deveria cair em /supplier: " + p.url());
step("fornecedor trocou a senha temporária");
await p.goto(B + "/supplier/products/new", { waitUntil: "networkidle" });
await p.getByLabel("Nome", { exact: true }).fill("Manto Teste Vermelho");
await p.getByLabel("SKU").fill("MV-01");
await p.getByLabel("Categoria").fill("Times Brasileiros");
await p.getByLabel("Custo (R$)").fill("59,00");
await p.getByLabel("Preço sugerido (R$)").fill("149,90");
await p.getByLabel("Preço mínimo (R$)").fill("119,90");
for (const [i, v] of ["10", "20", "20", "10"].entries()) await p.getByLabel("Estoque").nth(i).fill(v);
await p.locator('input[type=file]').setInputFiles(S + "/foto.png");
await p.waitForSelector('img[alt="Foto 1"]', { timeout: 20000 });
await p.getByRole("button", { name: "Cadastrar produto" }).click();
await p.waitForURL(/\/supplier\/products\/prd_/, { timeout: 30000 });
if (!(await p.content()).includes("MV-01-P")) fail("variantes não criadas");
step("produto cadastrado com foto e estoque por tamanho");
await p.goto(B + "/supplier/products/import", { waitUntil: "networkidle" });
const csv = "nome;sku;categoria;custo;preco_sugerido;preco_minimo;tamanhos;estoque;grade\nManto Azul;MA-02;Seleções;59,00;149,90;119,90;P|M|G|GG;10|20|20|10;2|4|4|2\nCamisa Treino;CT-03;Treino;39,00;99,90;79,90;P|M|G|GG;15|25|25|15;\n;;;;;";
await p.getByLabel("Conteúdo do CSV").fill(csv);
await p.getByRole("button", { name: /Importar/ }).click();
await p.waitForSelector("text=produto(s) criado(s)", { timeout: 30000 });
const rep = await p.locator("main").innerText();
if (!rep.includes("2 produto(s) criado(s)") || !rep.includes("nome vazio")) fail("relatório de importação inesperado: " + rep.slice(0, 300));
step("CSV importou 2 produtos e apontou a linha inválida");

// 3. fornecedor cria loja
await p.goto(B + "/supplier/stores/new", { waitUntil: "networkidle" });
await p.getByLabel("Nome da loja").fill("Loja do Zé");
await p.getByLabel("Nome", { exact: true }).fill("José Lojista");
await p.getByLabel("E-mail de acesso").fill("ze@loja.com");
await p.getByRole("button", { name: /Criar loja .* e convidar/ }).click();
await p.waitForSelector("dd.select-all");
const storeMsg = await p.locator("main").innerText();
if (!storeMsg.includes("Aguardando pagamento à NextLevel") || !storeMsg.includes("2.197,00") || !storeMsg.includes("500,00")) fail("mensagem de setup/comissão inesperada: " + storeMsg.slice(0, 400));
const owner = await creds(); step("fornecedor criou a loja própria: setup R\$ 2.197,00 e comissão R\$ 500,00 exibidos");

// 3b. lojista entra, vê aviso, não consegue publicar; master confirma o pagamento
await login(owner.email, owner.pass); await setPassword("Lojista-Novo-123");
await p.goto(B + "/merchant", { waitUntil: "networkidle" });
if (!(await p.content()).includes("será liberada após o pagamento")) fail("aviso de pagamento pendente não apareceu");
await p.goto(B + "/merchant/storefront", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Publicar loja" }).click();
await p.waitForSelector("text=depois da confirmação do pagamento", { timeout: 15000 });
step("loja pendente: aviso exibido e publicação bloqueada");
const pubc = await b.newContext(); const pubp = await pubc.newPage();
await pubp.goto(B + "/store/loja-do-ze", { waitUntil: "networkidle" });
if (!(await pubp.content()).includes("indisponível")) fail("vitrine pública deveria estar indisponível");
await pubc.close();
step("vitrine pública indisponível antes do pagamento");
await login("master@teste.com", "Master-Teste-2026");
await p.goto(B + "/master/finance?tab=invoices", { waitUntil: "networkidle" });
await p.locator("tr").filter({ hasText: "Ativação da loja Loja do Zé" }).getByRole("button", { name: "Confirmar recebimento" }).click();
await p.getByRole("alertdialog").getByRole("button", { name: "Confirmar", exact: true }).click();
await p.waitForSelector("text=Recebimento confirmado", { timeout: 15000 });
step("master confirmou o recebimento do setup: loja liberada");

// 4. lojista: Mercado Pago, ativa produtos, publica
await login(owner.email, "Lojista-Novo-123");
if (!p.url().includes("/merchant")) fail("lojista deveria cair em /merchant: " + p.url());
await p.goto(B + "/merchant/settings", { waitUntil: "networkidle" });
await p.getByLabel("Access Token").fill("INVALIDO-1234567890abcdef");
await p.getByRole("button", { name: "Validar e conectar" }).click();
await p.waitForSelector("text=deve começar com", { timeout: 15000 });
await p.getByLabel("Access Token").fill("TEST-1234567890abcdefghij-token");
await p.getByRole("button", { name: "Validar e conectar" }).click();
await p.waitForSelector("text=Conta conectada", { timeout: 20000 });
step("Mercado Pago validado (token inválido recusado, token de teste aceito)");
await p.goto(B + "/merchant/products", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Ativar todos/ }).click();
await p.waitForSelector("text=produto(s) ativados", { timeout: 20000 });
step("lojista ativou todos os produtos de uma vez");
await p.goto(B + "/merchant/storefront", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Publicar loja" }).click();
await p.waitForSelector("text=Despublicar loja", { timeout: 15000 });
step("loja publicada");

// 5. cliente compra e paga
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const cp = await c.newPage();
await cp.goto(B + "/store/loja-do-ze/catalog", { waitUntil: "networkidle" });
await cp.getByRole("link", { name: /Manto Teste Vermelho/ }).first().click();
await cp.waitForLoadState("networkidle");
if (!(await cp.locator("img").count())) fail("foto do produto não aparece");
await cp.getByRole("button", { name: "M", exact: true }).click();
await cp.getByRole("button", { name: /Adicionar ao carrinho/ }).click();
await cp.waitForTimeout(500);
await cp.goto(B + "/store/loja-do-ze/checkout", { waitUntil: "networkidle" });
await cp.getByPlaceholder("Nome completo").fill("Cliente Final");
await cp.getByPlaceholder("E-mail").fill("cliente@final.com");
await cp.getByPlaceholder("CEP").fill("01310-100");
await cp.getByPlaceholder("Endereço e número").fill("Av. Paulista, 1000");
await cp.getByPlaceholder("Cidade").fill("São Paulo");
await cp.getByRole("button", { name: /Ir para o pagamento/ }).click();
await cp.waitForURL(/localhost:4010\/pay\//, { timeout: 30000 });
step("checkout redirecionou ao Mercado Pago: " + cp.url());
const state = await (await fetch(MP + "/__state")).json();
const pref = state.prefs.at(-1);
if (pref.items[0].unit_price !== 149.9 || !pref.external_reference?.startsWith("ord_")) fail("preferência incorreta " + JSON.stringify(pref));
if (!pref.items.some((i) => i.id === "frete")) fail("frete ausente da preferência");
step("preferência correta: R$ 149,90 + frete, referência " + pref.external_reference);
const orderId = pref.external_reference;

// antes do pagamento: pedido PENDING, não aparece pago
await p.goto(B + "/merchant/orders/" + orderId, { waitUntil: "networkidle" });
if (!(await p.content()).includes("Pendente")) fail("pedido deveria estar Pendente antes do pagamento");
step("pedido PENDING com estoque reservado antes do pagamento");

// cliente paga → webhook
const ap = await (await fetch(MP + "/__approve?ref=" + orderId)).json();
const wh = await fetch(B + "/api/webhooks/mercadopago?store=loja-do-ze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "payment", data: { id: String(ap.id) } }) });
const whBody = await wh.json(); if (whBody.outcome !== "PAID") fail("webhook não confirmou: " + JSON.stringify(whBody));
step("webhook confirmou o pagamento");
// webhook repetido e de outra loja não alteram nada
const wh2 = await (await fetch(B + "/api/webhooks/mercadopago?store=loja-do-ze", { method: "POST", body: JSON.stringify({ type: "payment", data: { id: String(ap.id) } }) })).json();
if (wh2.outcome !== "PAID") fail("webhook idempotente falhou");
const whOther = await (await fetch(B + "/api/webhooks/mercadopago?store=nao-existe", { method: "POST", body: JSON.stringify({ type: "payment", data: { id: String(ap.id) } }) })).json();
if (whOther.outcome !== "IGNORED") fail("loja inexistente deveria ser ignorada");
step("webhook idempotente e loja desconhecida ignorada");

await cp.goto(B + "/store/loja-do-ze/order/" + orderId + "?payment_id=" + ap.id, { waitUntil: "networkidle" });
if (!(await cp.content()).includes("Pagamento aprovado")) fail("página do cliente não mostra pagamento aprovado");
await cp.screenshot({ path: S + "/e2e-confirm-mobile.png" });
step("cliente vê 'Pagamento aprovado'");

// 6. sem saldo: pedido aguarda recarga; fornecedor conectou o Mercado Pago e o lojista recarrega por Pix
await p.goto(B + "/merchant/orders/" + orderId, { waitUntil: "networkidle" });
if (!(await p.content()).includes("Aguardando recarga")) fail("status esperado: aguardando recarga");
if (await p.getByRole("button", { name: /Confirmar pagamento à Central/ }).count()) fail("botão manual de pagamento à Central deveria ter sido removido");
step("sem saldo o pedido fica 'Aguardando recarga' (sem botão manual)");
await login("carlos@fornecedor.com", "Fornecedor-Novo-1");
await p.goto(B + "/supplier/settings", { waitUntil: "networkidle" });
await p.getByLabel("Access Token da sua conta Mercado Pago").fill("TEST-1234567890abcdefghij-supplier");
await p.getByRole("button", { name: "Validar e conectar" }).click();
await p.waitForSelector("text=Conta conectada", { timeout: 20000 });
step("fornecedor conectou a própria conta Mercado Pago para recargas");
await login(owner.email, "Lojista-Novo-123");
await p.goto(B + "/merchant/wallet", { waitUntil: "networkidle" });
await p.locator("#recharge-amount").fill("500");
await p.getByRole("button", { name: /Gerar Pix/ }).click();
await p.waitForSelector("[data-testid=pix-code]", { timeout: 20000 });
const pixCode = await p.locator("[data-testid=pix-code]").innerText();
if (!pixCode.startsWith("00020126PIXSIMULADO")) fail("código Pix inesperado: " + pixCode);
const st = await (await fetch(MP + "/__state")).json();
const rch = st.payments.find((x) => x.pix); if (!rch) fail("recarga não chegou ao Mercado Pago");
await fetch(MP + "/__approve_pix?ref=" + rch.external_reference);
const wr = await (await fetch(B + "/api/webhooks/mercadopago-wallet?recharge=" + rch.external_reference, { method: "POST" })).json();
if (!wr.paid) fail("webhook da recarga não confirmou: " + JSON.stringify(wr));
await fetch(B + "/api/webhooks/mercadopago-wallet?recharge=" + rch.external_reference, { method: "POST" }); // repetido: idempotente
step("recarga Pix de R$ 500,00 confirmada pelo webhook (repetição ignorada)");
await p.goto(B + "/merchant/orders/" + orderId, { waitUntil: "networkidle" });
if (!(await p.content()).includes("Aguardando etiqueta")) fail("após a recarga o pedido deveria aguardar etiqueta: " + (await p.locator("main").innerText()).slice(0, 300));
step("recarga debitou o custo automaticamente: pedido saiu de 'Aguardando recarga'");
// etiqueta como arquivo: PDF inválido é recusado, PDF real é aceito
await p.getByRole("button", { name: /Anexar etiqueta/ }).click();
await p.setInputFiles("#labelfile", { name: "falso.pdf", mimeType: "application/pdf", buffer: Buffer.from("isto não é um pdf") });
await p.getByRole("button", { name: "Enviar etiqueta" }).click();
await p.waitForSelector("text=Envie a etiqueta em PDF", { timeout: 15000 });
await p.setInputFiles("#labelfile", { name: "etiqueta-superfrete.pdf", mimeType: "application/pdf", buffer: Buffer.from(await makePdf()) });
await p.getByRole("button", { name: "Enviar etiqueta" }).click();
await p.waitForTimeout(1500); await p.reload({ waitUntil: "networkidle" });
if (!(await p.content()).includes("Pronto para separação")) fail("pedido deveria estar pronto para separação");
await p.screenshot({ path: S + "/e2e-merchant-order.png" });
step("etiqueta PDF anexada (arquivo falso recusado) → Pronto para separação");
await login("carlos@fornecedor.com", "Fornecedor-Novo-1");
await p.goto(B + "/supplier/orders/" + orderId, { waitUntil: "networkidle" });
if (!(await p.content()).includes("Pronto para separação")) fail("fornecedor não vê o pedido pronto");
step("fornecedor enxerga o pedido para separar");
// 6b. NextLevel recebe no próprio Mercado Pago: master conecta, lojista compra add-on e paga por Pix
await login("master@teste.com", "Master-Teste-2026");
await p.goto(B + "/master/settings", { waitUntil: "networkidle" });
await p.getByLabel("Access Token da conta NextLevel").fill("TEST-1234567890abcdefghij-nextlevel");
await p.getByRole("button", { name: "Validar e conectar" }).click();
await p.waitForSelector("text=Conta conectada", { timeout: 20000 });
step("master conectou a conta Mercado Pago da NextLevel");
await login(owner.email, "Lojista-Novo-123");
await p.goto(B + "/merchant/finance", { waitUntil: "networkidle" });
await p.locator("div", { has: p.getByRole("heading", { name: "Academy do lojista" }) }).getByRole("button", { name: /Contratar/ }).first().click();
await p.waitForSelector("text=Pagar fatura", { timeout: 20000 });
await p.getByRole("button", { name: "Pagar fatura" }).first().click();
await p.waitForSelector("[data-testid=invoice-pix-code]", { timeout: 20000 });
const st2 = await (await fetch(MP + "/__state")).json();
const nlp = st2.payments.filter((x) => x.pix && String(x.external_reference).startsWith("nlp_")).pop();
if (!nlp) fail("cobrança da fatura não chegou ao Mercado Pago da NextLevel");
await fetch(MP + "/__approve_pix?ref=" + nlp.external_reference);
const wn = await (await fetch(B + "/api/webhooks/mercadopago-nextlevel?payment=" + nlp.external_reference, { method: "POST" })).json();
if (!wn.paid) fail("webhook da NextLevel não quitou a fatura: " + JSON.stringify(wn));
await fetch(B + "/api/webhooks/mercadopago-nextlevel?payment=" + nlp.external_reference, { method: "POST" });
await p.goto(B + "/merchant/finance", { waitUntil: "networkidle" });
if (!(await p.locator("main").innerText()).includes("Ativo até")) fail("add-on deveria constar como ativo após o pagamento");
step("add-on Academy pago por Pix: fatura quitada e direito liberado (webhook idempotente)");

// 6c. Operação do fornecedor: corte, equipe, esteira ao vivo, onda e expedição (sem dinheiro)
await login("carlos@fornecedor.com", "Fornecedor-Novo-1");
await p.goto(B + "/supplier/operations", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Salvar horários" }).click();
await p.waitForSelector("text=Horários salvos", { timeout: 15000 });
step("gestor definiu o horário de corte");
await p.goto(B + "/supplier/team", { waitUntil: "networkidle" });
await p.getByLabel("Nome", { exact: true }).fill("Marcos Expedição");
await p.getByLabel("E-mail", { exact: true }).fill("marcos.exp@fornecedor.com");
await p.getByRole("button", { name: /Criar acesso/ }).click();
await p.waitForSelector("text=Acesso criado", { timeout: 15000 });
const disp = await creds();
step("gestor criou o acesso da expedição");
await login(disp.email, disp.pass); await setPassword("Expedicao-Nova-1");
if (!p.url().includes("/supplier/dispatch")) fail("expedição deveria cair em /supplier/dispatch: " + p.url());
await p.waitForSelector("text=Pronto para separar", { timeout: 15000 });
const main = await p.locator("main").innerText();
if (/R\$\s?\d/.test(main) || /custo|margem|saldo/i.test(main)) fail("a tela da expedição não pode mostrar dinheiro: " + main.slice(0, 400));
if (!main.includes("Corte")) fail("cronômetro do corte não apareceu");
const v1 = (await (await p.request.get(B + "/api/live/orders?poll=1")).json()).version;
step("expedição vê a fila e o corte, sem nenhum valor monetário");
await p.goto(B + "/supplier/finance", { waitUntil: "networkidle" });
if (p.url().includes("/supplier/finance")) fail("expedição não deveria abrir o financeiro");
await p.goto(B + "/supplier/dispatch", { waitUntil: "networkidle" });
await p.getByRole("checkbox", { name: /Selecionar pedido/ }).first().check();
await p.getByRole("button", { name: /Criar onda e imprimir/ }).click();
await p.waitForURL(/dispatch\/wave\//, { timeout: 20000 });
const waveId = p.url().split("/").pop();
const pdf = await p.request.get(B + "/api/labels/batch?wave=" + waveId);
if (pdf.status() !== 200 || !(pdf.headers()["content-type"] ?? "").includes("application/pdf") || !(await pdf.body()).subarray(0, 5).toString().startsWith("%PDF")) fail("PDF em lote da onda inválido");
if (!(await p.content()).includes("Lista de separação")) fail("lista de separação ausente");
step("onda criada: PDF único de etiquetas e lista de separação gerados");
await p.goto(B + "/supplier/dispatch", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /Iniciar separação/ }).first().click();
await p.waitForSelector("text=Em separação >> nth=0", { timeout: 15000 });
await p.getByRole("button", { name: /Conferido/ }).first().click();
await p.getByRole("button", { name: /Marcar enviado/ }).first().click();
await p.waitForTimeout(1500);
const v2 = (await (await p.request.get(B + "/api/live/orders?poll=1")).json()).version;
if (v1 === v2) fail("a versão ao vivo deveria mudar após a movimentação");
step("expedição separou, conferiu e enviou; versão ao vivo mudou");
await login("carlos@fornecedor.com", "Fornecedor-Novo-1");
await p.goto(B + "/supplier", { waitUntil: "networkidle" });
if (!(await p.content()).includes("Esteira de pedidos")) fail("home do fornecedor deveria ser a esteira");
await p.screenshot({ path: S + "/e2e-supplier-esteira.png", fullPage: true });
step("home do gestor é a esteira ao vivo");

// 7. fechamento do mês
await login("master@teste.com", "Master-Teste-2026");
await p.goto(B + "/master/finance?tab=invoices", { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Fechar competência" }).click();
await p.getByRole("alertdialog").getByRole("button", { name: "Fechar competência" }).click();
await p.waitForSelector("text=fechamento(s) gerado(s)", { timeout: 20000 });
await p.reload({ waitUntil: "networkidle" });
if (!(await p.locator("main").innerText()).includes("Fechamento 2")) fail("fatura de fechamento não apareceu");
step("fechamento mensal gerado para o fornecedor");
await login("carlos@fornecedor.com", "Fornecedor-Novo-1");
await p.goto(B + "/supplier/finance", { waitUntil: "networkidle" });
const fin = await p.locator("main").innerText();
if (!fin.includes("Estimativa do fechamento") || !fin.includes("Fechamento mensal") || !fin.includes("Isenta")) fail("financeiro do fornecedor incompleto: " + fin.slice(0, 500));
await p.screenshot({ path: S + "/e2e-supplier-finance.png", fullPage: true });
step("financeiro do fornecedor mostra isenção, estimativa e fatura de fechamento");
// isolamento: outro tenant não acessa
await login("master@teste.com", "Master-Teste-2026");
await p.goto(B + "/supplier", { waitUntil: "networkidle" });
if (p.url().includes("/supplier")) fail("master não deveria abrir /supplier");
step("rotas de outro papel redirecionam");
await b.close(); console.log("\nE2E OK");
