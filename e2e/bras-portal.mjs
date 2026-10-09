/**
 * Brás Digital (D92): página pública, cadastro com CNPJ, Meu Brás e Estúdio no Master.
 * O servidor precisa de BRAND_SIGNUP_BRAS_DIGITAL=true e BRAND_DOMAINS_BRAS_DIGITAL=127.0.0.1 (127.0.0.1 faz o papel do endereço
 * da Brás; localhost segue como SuperDrop, onde o Master entra). Reinicie o servidor antes (o teste cria membro e vídeos).
 * Uso: E2E_BASE=http://localhost:3300 node e2e/bras-portal.mjs  (capturas em E2E_SHOTS, padrão /tmp/bras-shots)
 */
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3300";
const BRAS = B.replace("localhost", "127.0.0.1");
const OUT = process.env.E2E_SHOTS ?? "/tmp/bras-shots"; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => { bad.push(m); console.log("✖", m); };
const ok = (m) => console.log("✔", m);
// Miniaturas do YouTube não passam pelo proxy do ambiente de teste: um quadro neutro identificado no lugar.
const THUMB = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="#2a3550"/><text x="240" y="186" fill="#b9c2d6" font-family="sans-serif" font-size="18" text-anchor="middle">miniatura do YouTube</text></svg>`;
// Movimento reduzido: as capturas de página inteira não rolam, e os blocos que surgem com a rolagem ficariam invisíveis nelas.
const ctxFor = async (w) => { const c = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" }); await c.route("https://i.ytimg.com/**", (r) => r.fulfill({ contentType: "image/svg+xml", body: THUMB })); await c.route("https://www.youtube-nocookie.com/**", (r) => r.fulfill({ contentType: "text/html", body: "<body style='background:#000;color:#fff;font:16px sans-serif;display:grid;place-items:center;height:100vh'>player do YouTube</body>" })); return c; };
const axeOf = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, exclude: ["iframe"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.target?.join(" ") ?? ""))); };
const check = async (p, label, w) => {
  if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${label} @${w}: rolagem horizontal`);
  // Avisos flutuantes (toast) somem sozinhos: mede depois que saem, para não medir o meio da animação.
  await p.waitForFunction(() => !document.querySelector("[data-sonner-toast]"), null, { timeout: 15000 }).catch(() => {});
  if (w === 390 || w === 1440) { await p.emulateMedia({ reducedMotion: "reduce" }); const v = await axeOf(p); if (v.length) fail(`${label} @${w}: axe ${v.join(" | ")}`); }
};
// Captura de página inteira a partir do topo (com a tela rolada, a barra fixa sai deslocada na imagem).
const shot = async (pg, path) => { await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(250); await pg.screenshot({ path, fullPage: true }); };
const loginMembro = async (p) => {
  await p.goto(BRAS + "/login", { waitUntil: "networkidle" });
  await p.getByLabel("E-mail").fill("ana@utilidades.teste"); await p.getByLabel("Senha").fill("senha-forte-1");
  await p.getByRole("button", { name: /^Entrar/ }).click();
  await p.waitForURL(/\/meu-bras/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
};
const page = async (w) => { const c = await ctxFor(w); const p = await c.newPage(); p.on("pageerror", (e) => fail(`pageerror @${w}: ${e.message}`)); return { c, p }; };

// 1. Página pública sem vídeos (estado vazio) e sem nenhum preço.
for (const w of [360, 1440]) {
  const { c, p } = await page(w);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  const txt = await p.locator("main, body").first().innerText();
  if (!/As primeiras descobertas estão sendo gravadas/.test(txt)) fail("vazio: aviso dos vídeos ausente");
  if (/R\$\s?\d/.test(txt)) fail("vazio: preço aparece na página pública");
  await check(p, "pública vazia", w);
  await shot(p, `${OUT}/01-publica-vazia-${w}.png`);
  await c.close();
}
ok("página pública vazia");

// 2. Master adiciona vídeos no Estúdio (endereço do SuperDrop/Master).
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/bras/descobertas", { waitUntil: "networkidle" });
  const videos = [
    ["https://youtube.com/shorts/aaaaaaaaaa1", "Garrafa térmica inox 1 L, caixa com 24", "Tampa com trava, alça dobrável e embalagem individual."],
    ["https://youtu.be/bbbbbbbbbb2", "Kit 5 potes herméticos de vidro", "Tampas com 4 travas. Caixa com 12 kits."],
    ["https://www.youtube.com/watch?v=cccccccccc3", "Luminária LED recarregável de mesa", "3 tons de luz, USB-C. Caixa com 40."],
    ["ddddddddddd", "Organizador de gaveta modular", "Peças encaixáveis. Caixa com 60."],
  ];
  for (const [url, title, summary] of videos) {
    await p.getByLabel("Link do Shorts de descoberta").fill(url); await p.getByLabel("Título").fill(title); await p.getByLabel("Gancho (opcional)").fill(summary);
    await p.getByRole("button", { name: "Adicionar" }).click();
    await p.getByText(title, { exact: false }).first().waitFor({ timeout: 30000 });
  }
  if ((await p.locator("ol[aria-label='Descobertas na ordem da página'] > li").count()) !== 4) fail("estúdio: 4 vídeos esperados");
  await p.getByRole("button", { name: "Descer Garrafa térmica inox 1 L, caixa com 24" }).click();
  await p.waitForTimeout(1500);
  // Importadora e oferta (D93): só o membro ativo vê preço e caixas.
  await p.goto(B + "/bras/importadoras", { waitUntil: "networkidle" });
  await p.getByLabel("Nome").fill("Importadora Piloto"); await p.getByLabel(/Anotações internas/).fill("Comissão 5% acertada à parte");
  await p.getByRole("button", { name: "Cadastrar" }).click();
  await p.getByText("Importadora Piloto").first().waitFor({ timeout: 30000 });
  await check(p, "estúdio importadoras", 1440);
  await p.goto(B + "/bras/descobertas", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Definir oferta de Kit 5 potes herméticos de vidro" }).click();
  const of = p.getByRole("form", { name: "Oferta de Kit 5 potes herméticos de vidro" });
  await of.getByLabel("Preço da caixa").fill("1.890,00"); await of.getByLabel("Unidades por caixa").fill("12"); await of.getByLabel("Caixas disponíveis").fill("5");
  await of.getByRole("button", { name: "Salvar oferta" }).click();
  await p.getByText("R$ 1.890,00", { exact: false }).first().waitFor({ timeout: 30000 });
  // Análise da descoberta (D95): sinal público, veredito e trecho para o membro, análise completa para quem tem acesso.
  await p.getByRole("button", { name: "Editar análise de Kit 5 potes herméticos de vidro" }).click();
  const an = p.getByRole("form", { name: "Análise de Kit 5 potes herméticos de vidro" });
  await an.getByLabel("Sinal de tendência").fill("Buscas subindo");
  await an.getByLabel("Veredito", { exact: true }).fill("Produto certo para quem vende cozinha no Mercado Livre");
  await an.getByLabel("Nota", { exact: true }).selectOption("8");
  await an.getByLabel(/Trecho da análise/).fill("https://youtu.be/tttttttttt1");
  await an.getByLabel(/Vídeo da análise/).fill("https://www.youtube.com/watch?v=aaaaaaaaan1");
  await an.getByLabel("Preço no Mercado Livre (mínimo, por unidade)").fill("399,90");
  await an.getByLabel("Preço no Mercado Livre (máximo, por unidade)").fill("549,90");
  await an.getByLabel("Tendência", { exact: true }).fill("Organização de cozinha em alta no segundo semestre.");
  await an.getByLabel("Concorrência").fill("Poucos vendedores com estoque de vidro.");
  await an.getByLabel("Riscos e cuidados").fill("Vidro exige embalagem reforçada.");
  await an.getByLabel("Como anunciar").fill("Kit com 5, foto da tampa travada.");
  await an.getByRole("button", { name: "Salvar análise" }).click();
  await p.getByText("Análise pronta").first().waitFor({ timeout: 30000 });
  await check(p, "estúdio vídeos", 1440);
  // Identidade da Brás no Estúdio: nome no menu, cor laranja da marca (não o verde do SuperDrop nem o amarelo do Master).
  if (!(await p.locator(".ds-side").getByText("Brás Digital").first().isVisible())) fail("estúdio: nome da Brás ausente no menu");
  if (!(await p.getByRole("link", { name: "Voltar ao Master" }).isVisible())) fail("estúdio: sem Voltar ao Master");
  const primaria = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-primary").trim().toLowerCase());
  if (primaria !== "#b34d00") fail(`estúdio: cor primária ${primaria} (esperado laranja Brás #b34d00)`);
  await shot(p, `${OUT}/02-estudio-videos-1440.png`);
  // Voltar ao Master devolve a cor do Master.
  await p.getByRole("link", { name: "Voltar ao Master" }).click(); await p.waitForURL((u) => u.pathname === "/master"); await p.waitForLoadState("networkidle");
  if ((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-primary").trim().toLowerCase())) === "#b34d00") fail("master: ficou com a cor da Brás");
  await c.close();
}
ok("estúdio: vídeos adicionados e reordenados");

// 3. Página pública com vídeos, em 3 larguras e em pontos da rolagem; tocar no vídeo carrega o player.
for (const w of [360, 768, 1440]) {
  const { c, p } = await page(w);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  const txt = await p.locator("body").innerText();
  if (!/Kit 5 potes herméticos/.test(txt)) fail(`pública @${w}: vídeos não aparecem`);
  if (!/Buscas subindo/.test(txt)) fail(`pública @${w}: sinal de tendência não aparece`);
  if (/Produto certo para quem vende|tttttttttt1|aaaaaaaaan1|Organização de cozinha|Importadora Piloto/.test(await p.content())) fail(`pública @${w}: veredito, trecho, análise ou importadora vazaram`);
  if (/R\$\s?\d/.test(txt)) fail(`pública @${w}: preço aparece`);
  if (!(await p.getByRole("link", { name: /Área do cliente/ }).first().isVisible())) fail(`pública @${w}: botão Área do cliente invisível`);
  await check(p, "pública com vídeos", w);
  await p.screenshot({ path: `${OUT}/03-publica-topo-${w}.png` });
  await shot(p, `${OUT}/04-publica-inteira-${w}.png`);
  if (w === 1440) {
    await p.getByRole("button", { name: /Assistir a descoberta: Kit 5 potes/ }).click();
    await p.locator("iframe[title='Kit 5 potes herméticos de vidro']").waitFor({ timeout: 10000 });
    await p.locator("#videos").screenshot({ path: `${OUT}/05-publica-video-tocando-1440.png` });
  }
  await c.close();
}
ok("página pública com vídeos");

// 3b. Termos de uso e política de privacidade (D99): no endereço da Brás, sem preço, com aviso de versão; links no rodapé.
for (const w of [360, 1440]) {
  const { c, p } = await page(w);
  for (const [path, titulo] of [["/termos", "Termos de uso"], ["/privacidade", "Política de privacidade"]]) {
    const r = await p.goto(BRAS + path, { waitUntil: "networkidle" });
    if (r?.status() !== 200) fail(`${path} @${w}: status ${r?.status()}`);
    if (!(await p.getByRole("heading", { level: 1, name: titulo }).isVisible())) fail(`${path} @${w}: título`);
    const t = await p.locator("body").innerText();
    if (!/Versão inicial de/.test(t)) fail(`${path} @${w}: aviso de versão ausente`);
    if (/R\$\s?\d/.test(t)) fail(`${path} @${w}: preço aparece`);
    if (!(await p.locator("footer").getByRole("link", { name: titulo }).isVisible())) fail(`${path} @${w}: link no rodapé`);
    await check(p, path, w);
    if (w === 360) await shot(p, `${OUT}/03b${path.replace("/", "-")}-360.png`);
  }
  await c.close();
}
ok("termos e privacidade");

// 4. "Quero comprar" leva ao cadastro com o produto; cadastro com CNPJ inválido falha, válido entra no Meu Brás.
{
  const { c, p } = await page(390);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  await p.getByRole("link", { name: /Ver análise e preço \(Kit 5 potes/ }).click();
  await p.waitForURL(/\/cadastro\?video=/);
  await p.getByText(/Depois do cadastro você vê o preço e as caixas de/).waitFor();
  await check(p, "cadastro", 390);
  await shot(p, `${OUT}/06-cadastro-390.png`);
  await p.getByLabel("CNPJ da empresa").fill("11222333000100");
  await p.getByLabel("Nome da empresa").fill("Ana Utilidades LTDA"); await p.getByLabel("Seu nome").fill("Ana Lojista");
  await p.getByLabel("WhatsApp").fill("11988887777"); await p.getByLabel("E-mail").fill("ana@utilidades.teste"); await p.getByLabel("Senha").fill("senha-forte-1");
  // D99: aceite obrigatório dos termos e da política (sem ele o navegador nem envia).
  await p.getByRole("checkbox", { name: /Li e aceito os termos de uso/ }).check();
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.getByRole("alert").filter({ hasText: /CNPJ inválido/ }).waitFor({ timeout: 30000 });
  if ((await p.getByLabel("CNPJ da empresa").inputValue()) !== "11.222.333/0001-00") fail("cadastro: máscara do CNPJ");
  await p.getByLabel("CNPJ da empresa").fill("11222333000181");
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.waitForURL(/\/meu-bras/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByText("Seu acesso de membro já está liberado").isVisible())) fail("meu brás: boas-vindas ausente");
  const txtMb = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
  if (!/R\$ 1\.890,00/.test(txtMb) || !/5 caixas disponíveis/.test(txtMb)) fail("meu brás: preço/caixas não aparecem para o membro");
  if (/Importadora Piloto/.test(txtMb)) fail("meu brás: importadora aparece antes do pedido confirmado");
  if (!/Produto certo para quem vende/.test(txtMb)) fail("meu brás: veredito não aparece para o membro");
  await check(p, "meu brás", 390);
  if ((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-primary").trim().toLowerCase())) !== "#b34d00") fail("meu brás: sem a cor da Brás");
  await shot(p, `${OUT}/07-meu-bras-390.png`);
  // Página da descoberta: lançamento = análise aberta ao membro; importadora oculta.
  await p.getByRole("link", { name: /Ver descoberta \(Kit 5 potes/ }).first().click();
  await p.waitForURL(/\/meu-bras\/descoberta\//); await p.waitForLoadState("networkidle");
  const ds = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
  for (const [re, msg] of [[/Margem bruta estimada/, "margem"], [/Organização de cozinha/, "tendência"], [/Importadora parceira verificada/, "importadora oculta"], [/Fase de lançamento/, "aviso de lançamento"], [/8\/10/, "nota"]]) if (!re.test(ds)) fail(`descoberta (aberta): falta ${msg}`);
  if (/Importadora Piloto/.test(ds)) fail("descoberta: importadora vazou");
  await check(p, "descoberta aberta", 390);
  await shot(p, `${OUT}/07a-descoberta-aberta-390.png`);
  // Pedido de compra: 2 caixas, dados de envio, resumo e "Meus pedidos".
  await p.locator("#oferta").getByRole("link", { name: "Quero comprar" }).click();
  await p.waitForURL(/\/meu-bras\/pedir\//); await p.waitForLoadState("networkidle");
  await p.getByRole("button", { name: "Uma caixa a mais" }).click();
  await p.getByLabel("Transportadora que vai retirar").fill("Braspress"); await p.getByLabel("Destinatário").fill("Ana Lojista");
  await p.getByLabel("Endereço de entrega").fill("Rua das Flores, 100, Centro"); await p.getByLabel("Cidade").fill("Curitiba");
  await p.getByLabel("UF").selectOption("PR"); await p.getByLabel("CEP").fill("80010000");
  if (!/R\$ 3\.780,00/.test((await p.getByRole("complementary", { name: "Resumo do pedido" }).innerText()).replace(/\u00a0/g, " "))) fail("pedido: total de 2 caixas");
  await check(p, "pedido", 390);
  await shot(p, `${OUT}/07b-pedido-390.png`);
  await p.getByRole("button", { name: "Enviar pedido" }).click();
  await p.waitForURL(/\/meu-bras\/pedidos\?enviado=1/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByText("Pedido 1001").isVisible())) fail("meus pedidos: pedido 1001 não aparece");
  if (!(await p.getByText(/o nome aparece quando o pedido for confirmado/).isVisible())) fail("meus pedidos: importadora deveria estar oculta antes da confirmação");
  await check(p, "meus pedidos", 390);
  await shot(p, `${OUT}/07c-meus-pedidos-390.png`);
  for (const [path, n] of [["/meu-bras/videos", "08-meu-bras-videos"], ["/meu-bras/empresa", "09-meu-bras-empresa"]]) {
    await p.goto(BRAS + path, { waitUntil: "networkidle" }); await check(p, path, 390); await shot(p, `${OUT}/${n}-390.png`);
  }
  if (!(await p.getByText("11.222.333/0001-81").isVisible())) fail("empresa: CNPJ formatado");
  // Membro não entra no Master nem no painel do lojista.
  for (const path of ["/bras", "/master/bras", "/merchant"]) { await p.goto(BRAS + path, { waitUntil: "networkidle" }); if (!new URL(p.url()).pathname.startsWith("/meu-bras")) fail(`membro abriu ${path}`); }
  await c.close();
}
ok("cadastro e Meu Brás");

// 5. Master vê o membro e bloqueia; o membro passa a ver o aviso e perde o botão de compra.
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/bras", { waitUntil: "networkidle" });
  await p.getByText("Pedido 1001").waitFor();
  const ped = (await p.locator("ul[aria-label='Pedidos de compra']").innerText()).replace(/\u00a0/g, " ");
  if (!/Braspress/.test(ped) || !/Ana Utilidades LTDA/.test(ped) || !/R\$ 3\.780,00/.test(ped)) fail("estúdio pedidos: dados do pedido");
  await p.getByRole("button", { name: "Confirmar" }).click();
  await p.getByText("Confirmado", { exact: true }).first().waitFor({ timeout: 30000 });
  await check(p, "estúdio pedidos", 1440);
  await shot(p, `${OUT}/10b-estudio-pedidos-1440.png`);
  // Análise passa a ser paga: assinatura e volume de compra (os dois).
  await p.goto(B + "/bras/acesso", { waitUntil: "networkidle" });
  await p.getByRole("radio", { name: /^Paga/ }).check();
  await p.getByRole("checkbox", { name: "Assinatura mensal" }).check(); await p.getByLabel("Preço por mês").fill("97,00");
  await p.getByRole("checkbox", { name: "Liberar por volume de compra" }).check(); await p.getByLabel("Pedidos pagos de pelo menos").fill("5.000,00");
  await p.getByRole("button", { name: "Salvar regra" }).click();
  await p.getByText("Análise passa a ser paga").waitFor({ timeout: 30000 });
  await check(p, "estúdio acesso", 1440);
  await shot(p, `${OUT}/12-estudio-acesso-1440.png`);
  {
    const m = await page(390); await loginMembro(m.p);
    await m.p.goto(BRAS + "/meu-bras/pedidos", { waitUntil: "networkidle" });
    if (!(await m.p.getByText("Importadora Piloto").isVisible())) fail("meus pedidos: importadora deveria aparecer depois de confirmado");
    await m.p.goto(BRAS + "/meu-bras/videos", { waitUntil: "networkidle" });
    await m.p.getByRole("link", { name: /Ver descoberta \(Kit 5 potes/ }).first().click(); await m.p.waitForURL(/\/meu-bras\/descoberta\//); await m.p.waitForLoadState("networkidle");
    const tr = (await m.p.locator("main").innerText()).replace(/\u00a0/g, " ");
    if (!/Análise completa para assinantes/.test(tr) || !/R\$ 97,00/.test(tr) || !/R\$ 5\.000,00/.test(tr)) fail("descoberta (paga): como liberar não aparece");
    if (/Organização de cozinha|Margem bruta estimada/.test(tr) || /aaaaaaaaan1/.test(await m.p.content())) fail("descoberta (paga): análise vazou para quem não tem acesso");
    if (!/Produto certo para quem vende/.test(tr)) fail("descoberta (paga): veredito deveria seguir grátis");
    if (!(await m.p.getByRole("button", { name: /Trecho da análise/ }).isVisible())) fail("descoberta (paga): trecho deveria seguir grátis");
    await check(m.p, "descoberta trancada", 390);
    await shot(m.p, `${OUT}/07d-descoberta-trancada-390.png`);
    // Master libera a assinatura (Pix combinado) e a análise volta.
    await p.getByRole("button", { name: "Liberar acesso" }).click();
    await p.getByText(/Acesso liberado até/).waitFor({ timeout: 30000 });
    await m.p.reload({ waitUntil: "networkidle" });
    if (!/Margem bruta estimada/.test(await m.p.locator("main").innerText())) fail("descoberta: assinatura liberada não abriu a análise");
    if (!/Sua assinatura vale até/.test(await m.p.locator("main").innerText())) fail("descoberta: aviso da assinatura ausente");
    await m.c.close();
  }
  await p.goto(B + "/bras/membros", { waitUntil: "networkidle" });
  await p.getByText("Ana Utilidades LTDA").waitFor();
  await check(p, "estúdio membros", 1440);
  await shot(p, `${OUT}/10-estudio-membros-1440.png`);
  p.once("dialog", (d) => d.accept("Teste de bloqueio"));
  await p.getByRole("button", { name: "Bloquear" }).click();
  await p.getByText("Teste de bloqueio").waitFor({ timeout: 30000 });
  await c.close();

  const m = await page(390);
  await loginMembro(m.p);
  if (!(await m.p.getByText("Cadastro em análise pela equipe.").isVisible())) fail("bloqueado: aviso ausente");
  if (await m.p.getByRole("link", { name: /Quero comprar|Ver descoberta/ }).count()) fail("bloqueado: botão de compra ainda aparece");
  if (/1\.890,00/.test(await m.p.locator("main").innerText())) fail("bloqueado: preço ainda aparece");
  await shot(m.p, `${OUT}/11-meu-bras-bloqueado-390.png`);
  await m.c.close();
}
ok("bloqueio pelo Master");

// 6. Páginas das outras marcas não abrem no endereço da Brás; o SuperDrop segue igual.
{
  const { c, p } = await page(1280);
  await p.goto(BRAS + "/planos", { waitUntil: "networkidle" }); if (new URL(p.url()).pathname !== "/") fail("/planos abriu no endereço da Brás");
  await p.goto(B + "/", { waitUntil: "networkidle" }); if (/Brás Digital/.test(await p.title())) fail("SuperDrop mostrou a Brás");
  for (const path of ["/termos", "/privacidade"]) { const r = await p.goto(B + path, { waitUntil: "networkidle" }); if (r?.status() !== 404) fail(`${path} abriu fora da Brás (${r?.status()})`); }
  await c.close();
}
ok("fronteira entre marcas");

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log(`\nTudo certo. Capturas em ${OUT}`);
