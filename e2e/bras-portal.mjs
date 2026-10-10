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
  // D101: agenda (Organizador fica para daqui a 2 dias), semana das descobertas, link para o Shorts e resultado por descoberta.
  if (!(await p.getByRole("heading", { name: "Semana das descobertas" }).isVisible())) fail("estúdio: semana das descobertas ausente");
  const org = p.locator("ol[aria-label='Descobertas na ordem da página'] > li").filter({ hasText: "Organizador de gaveta modular" });
  const daqui2 = new Date(Date.now() + 2 * 86400_000 - 3 * 3600_000).toISOString().slice(0, 16);
  await org.getByLabel("Publicar em (horário de Brasília)").fill(daqui2);
  await org.getByRole("button", { name: "Agendar" }).click();
  await org.getByText(/Agendada para/).waitFor({ timeout: 30000 });
  if (!(await org.getByRole("button", { name: /Copiar link de Organizador/ }).isVisible())) fail("estúdio: copiar link ausente");
  if (!/0 cadastro\(s\) · 0 pedido\(s\)/.test(await org.innerText())) fail("estúdio: resultado por descoberta ausente");
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
  if (/Organizador de gaveta modular/.test(txt)) fail(`pública @${w}: descoberta agendada apareceu antes da hora`);
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

// 3c. Página de cada descoberta (D101): o link da descrição do Shorts. Sem preço, veredito ou importadora; leva ao cadastro.
{
  const { c, p } = await page(390);
  await p.goto(BRAS + "/", { waitUntil: "networkidle" });
  const href = await p.getByRole("link", { name: /Ver análise e preço \(Kit 5 potes/ }).getAttribute("href");
  const vid = /video=([a-z0-9_]+)/.exec(href ?? "")?.[1];
  if (!vid) fail("descoberta: id não encontrado");
  const r = await p.goto(BRAS + `/d/${vid}`, { waitUntil: "networkidle" });
  if (r?.status() !== 200) fail(`descoberta: status ${r?.status()}`);
  if (!(await p.getByRole("heading", { level: 1, name: "Kit 5 potes herméticos de vidro" }).isVisible())) fail("descoberta: título");
  const t = await p.locator("body").innerText();
  if (/R\$\s?\d/.test(t) || /Produto certo para quem vende|Importadora Piloto/.test(await p.content())) fail("descoberta: dado comercial vazou");
  const og = await p.locator("meta[property='og:image']").getAttribute("content");
  if (!og?.includes("i.ytimg.com")) fail("descoberta: imagem de compartilhamento ausente");
  await check(p, "descoberta", 390);
  await shot(p, `${OUT}/03c-descoberta-390.png`);
  for (const bad of ["/d/bdv_naoexiste123"]) { const x = await p.goto(BRAS + bad, { waitUntil: "networkidle" }); if (x?.status() !== 404) fail(`descoberta inexistente: status ${x?.status()}`); }
  await p.goto(BRAS + `/d/${vid}`, { waitUntil: "networkidle" });
  await p.getByRole("link", { name: "Ver análise e preço" }).last().click();
  await p.waitForURL(new RegExp(`/cadastro\\?video=${vid}`));
  await c.close();
}
ok("página da descoberta");

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
  if ((await p.getByLabel("CNPJ da empresa").inputValue()) !== "11.222.333/0001-00") fail("cadastro: máscara do CNPJ");
  // D108: passo 2 com as 7 perguntas da classificação (iniciante) e o aceite dos termos (D99).
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.getByText("Conte sobre o seu negócio").waitFor();
  await p.getByRole("checkbox", { name: /Li e aceito os termos de uso/ }).check();
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.getByRole("alert").filter({ hasText: /Responda as 7 perguntas/ }).first().waitFor({ timeout: 10000 });
  for (const opt of ["Estou começando e quero testar um produto", "Ainda não vendo", "Até R$ 5 mil", "Até R$ 20 mil", "Nunca comprei de importadora", "Só eu", "Aprender a comprar e vender melhor"]) await p.getByText(opt, { exact: true }).click();
  await check(p, "cadastro passo 2", 390);
  await shot(p, `${OUT}/06b-cadastro-perguntas-390.png`);
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.getByRole("alert").filter({ hasText: /CNPJ inválido/ }).waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: "Voltar" }).click();
  await p.getByLabel("CNPJ da empresa").fill("11222333000181");
  await p.getByRole("button", { name: "Continuar" }).click();
  await p.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await p.waitForURL(/\/meu-bras/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByText("Seu acesso de membro já está liberado").isVisible())) fail("meu brás: boas-vindas ausente");
  // D108: painel do iniciante novo começa por uma caixa; plano Grátis.
  if (!(await p.getByText("Primeiro passo seguro: uma caixa, com análise.").isVisible())) fail("meu brás: painel do iniciante ausente");
  if (!(await p.getByRole("heading", { name: "Comece com uma caixa" }).isVisible().catch(() => false)) && !(await p.getByText("Comece com uma caixa").first().isVisible())) fail("meu brás: cartão da primeira caixa ausente");
  if (!(await p.getByText(/Seu plano: Grátis/).isVisible())) fail("meu brás: cartão do plano ausente");
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
  await p.getByLabel("Nome da sua transportadora").fill("Braspress"); await p.getByLabel("Destinatário").fill("Ana Lojista");
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
    await p.getByRole("button", { name: "Liberar plano" }).click();
    await p.getByText(/Acesso liberado até/).waitFor({ timeout: 30000 });
    await m.p.reload({ waitUntil: "networkidle" });
    if (!/Margem bruta estimada/.test(await m.p.locator("main").innerText())) fail("descoberta: assinatura liberada não abriu a análise");
    if (!/Sua assinatura vale até/.test(await m.p.locator("main").innerText())) fail("descoberta: aviso da assinatura ausente");
    await m.c.close();
  }
  // D102/D103: endereço e comissão da importadora, pedido pago, comprovante de retirada, romaneio, comissões e visão geral.
  await p.goto(B + "/bras/importadoras", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Editar retirada e comissão de Importadora Piloto" }).click();
  const fi = p.getByRole("form", { name: "Retirada e comissão de Importadora Piloto" });
  await fi.getByLabel("Endereço de retirada no Brás").fill("Rua Barão de Ladário, 100, loja 3");
  await fi.getByLabel("Comissão (%)").fill("5");
  await fi.getByRole("button", { name: "Salvar" }).click();
  await p.getByText("Rua Barão de Ladário, 100, loja 3").waitFor({ timeout: 30000 });
  await check(p, "estúdio importadoras", 1440);
  const romaneio = await p.getByRole("link", { name: "Romaneio" }).first().getAttribute("href");
  await p.goto(B + "/bras", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Marcar pago" }).first().click();
  await p.getByText("Pago", { exact: true }).first().waitFor({ timeout: 30000 });
  await p.waitForTimeout(800);
  await p.goto(B + romaneio, { waitUntil: "networkidle" });
  const rom = await p.locator("main").innerText();
  if (!/BD-[A-Z2-9]{4}/.test(rom) || !/Braspress/.test(rom)) fail("romaneio: código ou envio ausente");
  if (/Ana Utilidades|11\.222\.333|ana@utilidades|R\$/.test(rom)) fail("romaneio: dado do membro ou valor vazou");
  await check(p, "romaneio", 1440);
  await shot(p, `${OUT}/13-romaneio-1440.png`);
  await p.goto(B + "/bras/comissoes", { waitUntil: "networkidle" });
  if (!/Importadora Piloto/.test(await p.locator("main").innerText())) fail("comissões: importadora ausente");
  await p.getByRole("button", { name: "Marcar como recebida" }).first().click();
  await p.getByLabel("Observação (opcional)").fill("Pix de teste");
  await p.getByRole("button", { name: "Confirmar" }).click();
  await p.getByText(/Recebida em/).first().waitFor({ timeout: 30000 });
  await check(p, "comissões", 1440);
  await shot(p, `${OUT}/14-comissoes-1440.png`);
  const csv = await p.request.get(B + "/bras/comissoes/csv");
  if (csv.status() !== 200 || !/Importadora Piloto/.test(await csv.text())) fail("comissões: CSV");
  await p.goto(B + "/bras/visao", { waitUntil: "networkidle" });
  if (!(await p.getByRole("heading", { name: /Pagos em/ }).isVisible())) fail("visão geral: mês ausente");
  await check(p, "visão geral", 1440);
  await shot(p, `${OUT}/15-visao-geral-1440.png`);
  {
    const m = await page(390); await loginMembro(m.p);
    await m.p.goto(BRAS + "/meu-bras/pedidos", { waitUntil: "networkidle" });
    await m.p.getByRole("link", { name: /Comprovante de retirada/ }).first().click();
    await m.p.waitForURL(/\/retirada$/); await m.p.waitForLoadState("networkidle");
    const cp = await m.p.locator("main").innerText();
    if (!/BD-[A-Z2-9]{4}/.test(cp) || !/Rua Barão de Ladário, 100, loja 3/.test(cp)) fail("comprovante: código ou endereço ausente");
    await check(m.p, "comprovante de retirada", 390);
    await shot(m.p, `${OUT}/07e-comprovante-390.png`);
    await m.p.goto(BRAS + "/meu-bras", { waitUntil: "networkidle" });
    if (!(await m.p.getByRole("heading", { name: "Seus pedidos em andamento" }).isVisible())) fail("início do Meu Brás: pedidos em andamento ausentes");
    await check(m.p, "início do meu brás", 390);
    await shot(m.p, `${OUT}/07f-inicio-meu-bras-390.png`);
    const other = await m.p.goto(BRAS + "/meu-bras/pedidos/bdr_naoexiste123/retirada", { waitUntil: "networkidle" });
    if (other?.status() !== 404) fail(`comprovante de outro pedido: status ${other?.status()}`);
    await m.c.close();
  }
  // D106: Balcão por link privado (só quando o servidor tem BRAS_PANELS=true; rode com E2E_BALCAO=1).
  if (process.env.E2E_BALCAO === "1") {
    await p.goto(B + "/bras/importadoras", { waitUntil: "networkidle" });
    await p.getByRole("button", { name: "Gerar link do Balcão de Importadora Piloto" }).click();
    const link = (await p.locator("code").filter({ hasText: "/balcao/" }).first().innerText({ timeout: 30000 })).trim();
    const path = new URL(link).pathname;
    const bal = await page(390);
    const rb = await bal.p.goto(BRAS + path, { waitUntil: "networkidle" });
    if (rb?.status() !== 200) fail(`balcão: status ${rb?.status()}`);
    const tb = await bal.p.locator("main").innerText();
    if (!/Pedido 1001/.test(tb) || /Ana Utilidades|11\.222\.333|ana@utilidades|R\$/.test(tb)) fail("balcão: fila errada ou dado do membro/valor vazou");
    await check(bal.p, "balcão", 390);
    await shot(bal.p, `${OUT}/16-balcao-390.png`);
    const codigo = /código (BD-[A-Z2-9]{4})/.exec(tb)?.[1];
    await bal.p.getByLabel("Código do motorista").first().fill("BD-0000");
    await bal.p.getByRole("button", { name: "Confirmar retirada" }).first().click();
    await bal.p.getByText(/Código de retirada não confere/).first().waitFor({ timeout: 30000 });
    await bal.p.getByLabel("Código do motorista").first().fill(codigo ?? "");
    await bal.p.getByRole("button", { name: "Confirmar retirada" }).first().click();
    await bal.p.getByText(/Retirada do pedido 1001 confirmada/).waitFor({ timeout: 30000 });
    if ((await bal.p.goto(BRAS + "/balcao/" + "x".repeat(40), { waitUntil: "networkidle" }))?.status() !== 404) fail("balcão: link inválido deveria dar 404");
    await bal.c.close();
    ok("balcão por link");
  }
  // Importadora sem login e visitante não abrem o Estúdio nem o CSV.
  { const v = await (await ctxFor(1280)).request.get(B + "/bras/comissoes/csv"); if (v.status() !== 403) fail(`CSV sem login: status ${v.status()}`); }
  await p.goto(B + "/bras/membros", { waitUntil: "networkidle" });
  await p.getByText("Ana Utilidades LTDA").waitFor();
  await p.getByRole("button", { name: "Sem pedido" }).click();
  if (await p.getByText("Ana Utilidades LTDA").count()) fail("membros: filtro sem pedido mostrou quem tem pedido");
  await p.getByRole("button", { name: "Com pedido" }).click();
  await p.getByText("Ana Utilidades LTDA").waitFor();
  await p.getByRole("button", { name: "Todos" }).click();
  const mcsv = await p.request.get(B + "/bras/membros/csv");
  if (mcsv.status() !== 200 || !/11\.222\.333\/0001-81/.test(await mcsv.text())) fail("membros: CSV");
  await check(p, "estúdio membros", 1440);
  await shot(p, `${OUT}/10-estudio-membros-1440.png`);
  // D108: nível do cliente na lista (iniciante, pelas respostas) e o filtro por nível.
  await p.getByRole("button", { name: "Iniciante" }).click();
  await p.getByText("Ana Utilidades LTDA").waitFor();
  if (!(await p.getByText("pelas respostas").first().isVisible())) fail("membros: origem do nível ausente");
  await p.getByRole("button", { name: "Grande conta" }).click();
  if (await p.getByText("Ana Utilidades LTDA").count()) fail("membros: filtro por nível");
  await p.getByRole("button", { name: "Todos" }).click();
  // D108: Planos e regras (todas as abas), Atendimento e Pauta abrem sem violação de acessibilidade.
  for (const aba of ["planos", "regras", "classificacao", "suporte", "juridico", "cubagem"]) {
    await p.goto(B + `/bras/regras?aba=${aba}`, { waitUntil: "networkidle" });
    await check(p, `planos e regras: ${aba}`, 1440);
    await shot(p, `${OUT}/13-regras-${aba}-1440.png`);
  }
  await p.goto(B + "/bras/regras?aba=planos", { waitUntil: "networkidle" });
  for (const n of ["Brás Prata", "Brás Ouro", "Brás Platinum", "Cargas Pro", "Cotação de contêiner fora do catálogo"]) if (!(await p.getByText(n, { exact: true }).first().isVisible())) fail(`planos e regras: ${n} ausente`);
  await p.goto(B + "/bras/regras?aba=regras", { waitUntil: "networkidle" });
  await p.getByLabel("Sinal", { exact: true }).fill("35");
  await p.locator("form", { has: p.getByRole("heading", { name: "Pré-pedido (alto mar)" }) }).getByRole("button", { name: "Gravar" }).click();
  await p.getByText("Pré-pedido: regra gravada").waitFor({ timeout: 30000 });
  await p.goto(B + "/bras/regras?aba=juridico", { waitUntil: "networkidle" });
  if (!/35% do valor do pedido/.test(await p.locator("main").innerText())) fail("jurídico: texto não acompanhou a regra do sinal");
  for (const path of ["/bras/atendimento", "/bras/atendimento?aba=agenda", "/bras/pauta"]) { await p.goto(B + path, { waitUntil: "networkidle" }); await check(p, path, 1440); }
  await p.goto(B + "/bras/membros", { waitUntil: "networkidle" });
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

// 7. Importadora 360 e painel da importadora com login (D110): Master cria o acesso; a importadora troca a senha,
//    cadastra galpão e produto, lança estoque e vê o pedido só pelo envio (nada do comprador).
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/bras/importadoras", { waitUntil: "networkidle" });
  await p.getByRole("link", { name: "Importadora 360" }).first().click();
  await p.waitForURL(/\/bras\/importadoras\/bdi_/); await p.waitForLoadState("networkidle");
  if (!(await p.getByRole("heading", { name: "Saúde", exact: true }).isVisible())) fail("360: saúde ausente");
  if (!(await p.getByText("Criar o acesso da importadora").first().isVisible())) fail("360: oportunidade de acesso ausente");
  await check(p, "importadora 360", 1440);
  await shot(p, `${OUT}/16-importadora-360-1440.png`);
  const ac = p.getByRole("form", { name: "Criar acesso" });
  await ac.getByLabel("Nome").fill("Seu Jorge"); await ac.getByLabel("E-mail").fill("jorge@piloto.teste"); await ac.getByLabel("Senha provisória").fill("provisoria-123");
  await ac.getByRole("button", { name: "Criar acesso" }).click();
  await p.getByText("jorge@piloto.teste").waitFor({ timeout: 30000 });
  await c.close();
}
{
  const { c, p } = await page(390);
  await p.goto(BRAS + "/login", { waitUntil: "networkidle" });
  await p.getByLabel("E-mail").fill("jorge@piloto.teste"); await p.getByLabel("Senha").fill("provisoria-123");
  await p.getByRole("button", { name: /^Entrar/ }).click();
  await p.waitForURL(/\/account\/password/, { timeout: 60000 });
  await p.getByLabel("Nova senha", { exact: true }).fill("senha-da-xdx-1"); await p.getByLabel("Confirmar nova senha").fill("senha-da-xdx-1");
  await p.getByRole("button", { name: "Salvar senha" }).click();
  await p.waitForURL(/\/importadora/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByRole("heading", { name: /Hoje na Importadora Piloto/ }).isVisible())) fail("importadora: Hoje ausente");
  await check(p, "importadora hoje", 390);
  await shot(p, `${OUT}/17-importadora-hoje-390.png`);
  await p.goto(BRAS + "/importadora/galpoes", { waitUntil: "networkidle" });
  const g = p.getByRole("form", { name: "Novo galpão" });
  await g.getByLabel("Nome").fill("Galpão Oriente"); await g.getByLabel("Endereço de retirada").fill("Rua Oriente, 500, Brás, São Paulo/SP"); await g.getByLabel("Horário de retirada").fill("Seg a sex, 8h às 17h");
  await g.getByRole("button", { name: "Cadastrar galpão" }).click();
  await p.getByText("Rua Oriente, 500, Brás, São Paulo/SP").first().waitFor({ timeout: 30000 });
  await check(p, "importadora galpões", 390);
  await p.goto(BRAS + "/importadora/produtos", { waitUntil: "networkidle" });
  const pf = p.getByRole("form", { name: "Novo produto" });
  await pf.getByLabel("Código (SKU)").fill("PT-5"); await pf.getByLabel("Produto").fill("Kit 5 potes herméticos de vidro"); await pf.getByLabel("Unidades por caixa").fill("12");
  await pf.getByLabel("Comprimento (cm)").fill("40"); await pf.getByLabel("Largura (cm)").fill("30"); await pf.getByLabel("Altura (cm)").fill("25");
  if (!/30 L/.test(await pf.innerText())) fail("produto: cubagem não calculada");
  await pf.getByLabel("Preço da caixa").fill("1.890,00");
  await pf.getByRole("button", { name: "Cadastrar produto" }).click();
  await p.getByText("PT-5 · 12 un. por caixa").first().waitFor({ timeout: 30000 });
  await check(p, "importadora produtos", 390);
  await shot(p, `${OUT}/18-importadora-produtos-390.png`);
  await p.goto(BRAS + "/importadora/estoque", { waitUntil: "networkidle" });
  const mv = p.getByRole("form", { name: "Lançar estoque de Kit 5 potes herméticos de vidro" });
  await mv.getByLabel("Caixas").fill("10"); await mv.getByRole("button", { name: "Lançar" }).click();
  await p.getByText("Saldo: 10 caixa(s)").waitFor({ timeout: 30000 });
  await check(p, "importadora estoque", 390);
  await shot(p, `${OUT}/19-importadora-estoque-390.png`);
  await p.goto(BRAS + "/importadora/pedidos?ver=todos", { waitUntil: "networkidle" });
  const ped = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
  if (!/Pedido 1001/.test(ped)) fail("importadora: pedido 1001 não aparece");
  if (/Ana Utilidades|ana@utilidades|11\.222\.333|R\$ 3\.780/.test(ped)) fail("importadora: dado do comprador ou valor vazou");
  await check(p, "importadora pedidos", 390);
  // Isolamento: a importadora não abre o Estúdio nem o Meu Brás.
  await p.goto(BRAS + "/bras", { waitUntil: "networkidle" }); if (/\/bras(\/|$)/.test(new URL(p.url()).pathname) && !/\/importadora/.test(p.url())) fail("importadora abriu o Estúdio");
  await c.close();
}
ok("importadora 360 e painel da importadora");

// 8. NextLevel Cargas v1 (D111): a importadora cadastra a transportadora; o Master cria o acesso; a transportadora entra,
//    vê o painel e gera o link do motorista, que abre sem login. O fluxo de coleta inteiro está nos testes de domínio.
{
  const { c, p } = await page(390);
  await p.goto(BRAS + "/login", { waitUntil: "networkidle" });
  await p.getByLabel("E-mail").fill("jorge@piloto.teste"); await p.getByLabel("Senha").fill("senha-da-xdx-1");
  await p.getByRole("button", { name: /^Entrar/ }).click();
  await p.waitForURL(/\/importadora/, { timeout: 60000 });
  await p.goto(BRAS + "/importadora/transportadoras", { waitUntil: "networkidle" });
  const cf = p.getByRole("form", { name: "Cadastrar transportadora" });
  await cf.getByLabel("Nome da transportadora ou do motorista").fill("Rápido Brás Transportes"); await cf.getByLabel("Número").fill("11.444.777/0001-61");
  await cf.getByLabel("Contato").fill("Antônio"); await cf.getByLabel("WhatsApp com DDD").fill("11977776666");
  await cf.getByText("Truck", { exact: true }).click(); await cf.getByText("PR", { exact: true }).click();
  await cf.getByRole("button", { name: "Cadastrar transportadora" }).click();
  await p.getByText("Atende: SP, PR").waitFor({ timeout: 30000 });
  const semToast = async () => { await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {}); };
  await semToast();
  // Chamar a transportadora para o pedido pago que ainda está no galpão.
  const call = p.getByRole("form", { name: "Chamar transportadora" });
  if (await call.isVisible()) {
    await call.getByRole("checkbox").first().check();
    await call.getByLabel("2. Transportadora").selectOption({ label: "Rápido Brás Transportes" });
    await call.getByRole("button", { name: /Chamar transportadora/ }).click();
    await p.getByText(/Coleta 5001 criada/).waitFor({ timeout: 30000 });
    if (!/wa\.me\/5511977776666/.test(await p.getByRole("link", { name: "Mandar no WhatsApp" }).getAttribute("href") ?? "")) fail("chamar: link do WhatsApp");
    await p.reload({ waitUntil: "networkidle" });
    if (!(await p.getByText("Aguardando a transportadora").first().isVisible())) fail("importadora: coleta chamada não aparece");
  } else fail("importadora: sem pedido para chamar a transportadora");
  await semToast();
  await check(p, "importadora transportadoras", 390);
  await shot(p, `${OUT}/20-importadora-transportadoras-390.png`);
  await c.close();
}
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/bras/transportadoras", { waitUntil: "networkidle" });
  if (!(await p.getByText(/CNPJ 11444777000161/).isVisible())) fail("master transportadoras: cadastro da importadora não aparece");
  if (!/cadastrada por uma importadora/.test(await p.locator("main").innerText())) fail("master transportadoras: origem do cadastro");
  await p.getByText("Gerenciar").first().click();
  const ac = p.getByRole("form", { name: "Criar acesso da transportadora" });
  await ac.getByLabel("Nome").fill("Antônio"); await ac.getByLabel("E-mail").fill("antonio@rapido.teste"); await ac.getByLabel("Senha provisória").fill("provisoria-123");
  await ac.getByRole("button", { name: "Criar acesso" }).click();
  await p.getByText(/antonio@rapido\.teste/).first().waitFor({ timeout: 30000 });
  await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await check(p, "master transportadoras", 1440);
  await shot(p, `${OUT}/21-master-transportadoras-1440.png`);
  await c.close();
}
{
  const { c, p } = await page(390);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByLabel("E-mail").fill("antonio@rapido.teste"); await p.getByLabel("Senha").fill("provisoria-123");
  await p.getByRole("button", { name: /^Entrar/ }).click();
  await p.waitForURL(/\/account\/password/, { timeout: 60000 });
  await p.getByLabel("Nova senha", { exact: true }).fill("senha-do-rapido-1"); await p.getByLabel("Confirmar nova senha").fill("senha-do-rapido-1");
  await p.getByRole("button", { name: "Salvar senha" }).click();
  await p.waitForURL(/\/transportadora/, { timeout: 60000 }); await p.waitForLoadState("networkidle");
  if (!(await p.getByRole("heading", { name: "Olá, Antônio" }).isVisible())) fail("transportadora: Hoje ausente");
  if (!/0 de 20/.test(await p.locator("main").innerText())) fail("transportadora: limite do plano grátis ausente");
  // Aceitar a coleta com o frete: só então aparecem os códigos de retirada.
  if (/BD-[A-Z0-9]/.test(await p.locator("main").innerText())) fail("transportadora: código antes do aceite");
  const aceite = p.getByRole("form", { name: "Aceitar coleta" }).first();
  await aceite.getByLabel("Valor do frete").fill("350,00");
  await aceite.getByRole("button", { name: "Aceitar coleta" }).click();
  await p.getByText("Aceita: coletar").first().waitFor({ timeout: 30000 });
  await p.getByText(/pedido\(s\) e códigos de retirada/).first().click();
  if (!/BD-[A-Z0-9]/.test(await p.locator("main").innerText())) fail("transportadora: código não aparece depois do aceite");
  if (/Ana Utilidades|ana@utilidades|11\.222\.333|R\$ 3\.780/.test(await p.locator("main").innerText())) fail("transportadora: dado do comprador ou valor vazou");
  await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await check(p, "transportadora hoje", 390);
  await shot(p, `${OUT}/22-transportadora-hoje-390.png`);
  for (const path of ["/transportadora/cargas", "/transportadora/extrato"]) { await p.goto(B + path, { waitUntil: "networkidle" }); await check(p, path, 390); }
  await p.goto(B + "/transportadora/perfil", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Gerar link do motorista" }).click();
  const link = (await p.locator("p.font-mono").first().innerText({ timeout: 30000 })).trim();
  await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await check(p, "transportadora perfil", 390);
  const path = new URL(link).pathname;
  // Isolamento: a transportadora não abre o Estúdio nem o painel da importadora.
  for (const x of ["/bras", "/importadora"]) { await p.goto(B + x, { waitUntil: "networkidle" }); if (new URL(p.url()).pathname.startsWith(x)) fail(`transportadora abriu ${x}`); }
  await c.close();
  const d = await page(390);
  await d.p.goto(B + path, { waitUntil: "networkidle" });
  if (!(await d.p.getByRole("heading", { name: "Rápido Brás Transportes" }).isVisible())) fail("motorista: tela não abriu");
  if (!(await d.p.getByRole("heading", { name: "Coletar (1)" }).isVisible()) || !/BD-[A-Z0-9]/.test(await d.p.locator("main").innerText())) fail("motorista: coleta aceita com código não aparece");
  if (/R\$/.test(await d.p.locator("main").innerText())) fail("motorista: frete vazou");
  await check(d.p, "motorista", 390);
  await shot(d.p, `${OUT}/23-motorista-390.png`);
  const r = await d.c.request.get(B + "/motorista/" + "x".repeat(32)); if (r.status() !== 404) fail(`motorista com link falso: status ${r.status()}`);
  await d.c.close();
}
ok("NextLevel Cargas: transportadora, acesso e link do motorista");

// 9. Club E0/E1 (D112, D113): empresas do grupo e Starline pré-preenchida, regras da Excursão; o membro vê o frete no
//    painel único, o catálogo por estado e indica o ônibus que já usa.
{
  const { c, p } = await page(1440);
  await p.goto(B + "/login", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
  await p.goto(B + "/bras/grupo", { waitUntil: "networkidle" });
  if (!/47\.173\.173\/0001-75/.test(await p.locator("main").innerText())) fail("grupo: CNPJ da Starline ausente");
  const sf = p.getByRole("form", { name: "Cadastrar Mauricio Turismo" });
  await sf.getByLabel("Contato").fill("Mauricio"); await sf.getByLabel("WhatsApp com DDD").fill("11999990000");
  await sf.getByText("MG", { exact: true }).click(); await sf.getByText("PR", { exact: true }).click();
  await sf.getByRole("button", { name: "Cadastrar transportadora" }).click();
  await p.getByText("Transportadora cadastrada", { exact: true }).first().waitFor({ timeout: 30000 });
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await check(p, "master grupo", 1440);
  await shot(p, `${OUT}/24-master-grupo-1440.png`);
  await p.goto(B + "/bras/excursao", { waitUntil: "networkidle" });
  const ex = p.getByRole("form", { name: "Regras da Excursão" });
  await ex.getByLabel("Capacidade padrão do bagageiro").fill("140");
  await ex.getByRole("button", { name: "Gravar regras" }).click();
  await p.getByText(/versão 1,/).waitFor({ timeout: 30000 });
  await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  await check(p, "master excursão", 1440);
  await p.goto(B + "/bras/transportadoras", { waitUntil: "networkidle" });
  if (!(await p.getByText("Empresa do grupo").first().isVisible())) fail("transportadoras: selo empresa do grupo ausente");
  await c.close();
}
{
  const { c, p } = await page(390);
  await loginMembro(p);
  await p.goto(BRAS + "/meu-bras/fretes", { waitUntil: "networkidle" });
  const fr = (await p.locator("main").innerText()).replace(/\u00a0/g, " ");
  if (!/Pedido BD-1001/.test(fr)) fail("fretes: pedido 1001 não aparece");
  if (!/Rápido Brás Transportes/.test(fr)) fail("fretes: transportadora da coleta não aparece");
  if (/R\$ 350|comissão/i.test(fr)) fail("fretes: frete ou comissão vazou para o cliente");
  await check(p, "meu brás fretes", 390);
  await shot(p, `${OUT}/25-meu-bras-fretes-390.png`);
  await p.goto(BRAS + "/meu-bras/fretes?ver=catalogo&uf=MG", { waitUntil: "networkidle" });
  if (!(await p.getByText("Mauricio Turismo").first().isVisible())) fail("catálogo: Starline não aparece para MG");
  await check(p, "meu brás catálogo", 390);
  await shot(p, `${OUT}/26-meu-bras-catalogo-390.png`);
  await p.goto(BRAS + "/meu-bras/fretes?ver=indicar", { waitUntil: "networkidle" });
  const rf = p.getByRole("form", { name: "Indicar transportadora ou ônibus" });
  await rf.getByText("Ônibus de excursão", { exact: true }).click();
  await rf.getByLabel("Nome da excursão").fill("Excursão da Cida"); await rf.getByLabel("WhatsApp com DDD").fill("31988887777");
  await rf.getByLabel("Cidade").fill("Belo Horizonte"); await rf.getByLabel("UF").selectOption("MG");
  await rf.getByRole("button", { name: "Indicar" }).click();
  await p.getByRole("link", { name: "Mandar convite no WhatsApp" }).waitFor({ timeout: 30000 });
  await p.reload({ waitUntil: "networkidle" });
  if (!(await p.getByText("Excursão da Cida").isVisible())) fail("indicar: indicação não aparece na lista");
  await check(p, "meu brás indicar", 390);
  await c.close();
}
ok("Club E0/E1: grupo, regras, painel de frete, catálogo e indicação");

// 10. Club E2 (D114): o ônibus (Starline) cadastra a rota e abre a viagem; o membro reserva fardos e informa a nota;
//     o ônibus aceita, coleta pela etiqueta, sai, chega e entrega com o código do cliente.
{
  const NFE = "35261047173173000175550010000000111000000018";
  const local = (h) => new Date(Date.now() + h * 3_600_000 - 3 * 3_600_000).toISOString().slice(0, 16);
  {
    const { c, p } = await page(1440);
    await p.goto(B + "/login", { waitUntil: "networkidle" });
    await p.getByRole("button", { name: /Equipe NextLevel/ }).first().click();
    await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 });
    await p.goto(B + "/bras/transportadoras", { waitUntil: "networkidle" });
    const item = p.locator("li").filter({ hasText: "Mauricio Turismo" }).filter({ has: p.getByText("Gerenciar", { exact: true }) }).first();
    await item.getByText("Gerenciar").click();
    const ac = item.getByRole("form", { name: "Criar acesso da transportadora" });
    await ac.getByLabel("Nome").fill("Mauricio"); await ac.getByLabel("E-mail").fill("mauricio@starline.teste"); await ac.getByLabel("Senha provisória").fill("provisoria-123");
    await ac.getByRole("button", { name: "Criar acesso" }).click();
    await p.getByText(/mauricio@starline\.teste/).first().waitFor({ timeout: 30000 });
    // A membro de exemplo foi bloqueada no passo 5: libera para reservar.
    await p.goto(B + "/bras/membros", { waitUntil: "networkidle" });
    if (await p.getByRole("button", { name: "Liberar", exact: true }).count()) { await p.getByRole("button", { name: "Liberar", exact: true }).first().click(); await p.getByRole("button", { name: "Bloquear", exact: true }).first().waitFor({ timeout: 30000 }); }
    await c.close();
  }
  const bus = await page(390);
  {
    const p = bus.p;
    await p.goto(B + "/login", { waitUntil: "networkidle" });
    await p.getByLabel("E-mail").fill("mauricio@starline.teste"); await p.getByLabel("Senha").fill("provisoria-123");
    await p.getByRole("button", { name: /^Entrar/ }).click();
    await p.waitForURL(/\/account\/password/, { timeout: 60000 });
    await p.getByLabel("Nova senha", { exact: true }).fill("senha-starline-1"); await p.getByLabel("Confirmar nova senha").fill("senha-starline-1");
    await p.getByRole("button", { name: "Salvar senha" }).click();
    await p.waitForURL(/\/transportadora/, { timeout: 60000 });
    await p.goto(B + "/transportadora/rotas", { waitUntil: "networkidle" });
    const rf = p.getByRole("form", { name: "Nova rota" });
    await rf.getByLabel("Nome da rota").fill("Brás ↔ Belo Horizonte"); await rf.getByLabel("Cidade de origem").fill("Belo Horizonte"); await rf.getByLabel("UF").selectOption("MG");
    await rf.getByLabel("Horas de viagem").fill("9");
    await rf.getByLabel("Ponto de embarque no Brás").fill("Rua Rodrigues dos Santos, 600"); await rf.getByLabel("Onde o cliente retira na cidade").fill("Rodoviária de BH, plataforma 3");
    await rf.getByText("Qua", { exact: true }).click();
    await rf.getByRole("button", { name: "Cadastrar rota" }).click();
    await p.getByText("Rota cadastrada").first().waitFor({ timeout: 30000 });
    await p.reload({ waitUntil: "networkidle" });
    const tf = p.getByRole("form", { name: "Abrir viagem" });
    await tf.getByLabel("Chegada ao Brás").fill(local(24)); await tf.getByLabel("Saída de São Paulo").fill(local(32));
    await tf.getByRole("button", { name: "Abrir viagem" }).click();
    await p.getByText(/Viagem 8001 aberta/).waitFor({ timeout: 30000 });
    await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
    await check(p, "ônibus rotas", 390);
    await shot(p, `${OUT}/27-onibus-rotas-390.png`);
  }
  {
    const { c, p } = await page(390);
    await loginMembro(p);
    await p.goto(BRAS + "/meu-bras/fretes?ver=onibus&uf=MG&cidade=Belo+Horizonte", { waitUntil: "networkidle" });
    if (!(await p.getByText("Mauricio Turismo").first().isVisible())) fail("membro: ônibus não aparece para BH");
    await check(p, "membro mandar pelo ônibus", 390);
    await shot(p, `${OUT}/28-membro-onibus-390.png`);
    await p.getByText("Reservar espaço neste ônibus").click();
    const form = p.getByRole("form", { name: "Reservar na viagem 8001" });
    await form.getByRole("button", { name: "Um Fardo M a mais" }).click();
    await form.getByLabel("Loja onde o ônibus coleta").fill("Mega Tron, box 12"); await form.getByLabel("Quem retira na cidade").fill("Ana Recebimento");
    await form.getByLabel(/Chave da nota/).fill(NFE);
    await form.getByRole("button", { name: "Reservar espaço" }).click();
    await p.getByText(/Reserva enviada/).waitFor({ timeout: 30000 });
    await p.goto(BRAS + "/meu-bras/fretes", { waitUntil: "networkidle" });
    if (!(await p.getByText("8001-01").first().isVisible())) fail("membro: fardo 8001-01 não aparece em Meus fretes");
    await p.goto(BRAS + "/meu-bras/fretes/etiquetas", { waitUntil: "networkidle" });
    if ((await p.locator("img[alt^='QR do fardo']").count()) !== 2) fail("etiquetas: esperado 2 QR");
    await check(p, "etiquetas", 390);
    await shot(p, `${OUT}/29-etiquetas-390.png`);
    await c.close();
  }
  {
    const p = bus.p;
    await p.goto(B + "/transportadora", { waitUntil: "networkidle" });
    if (!(await p.getByRole("heading", { name: "Viagem 8001" }).isVisible())) fail("ônibus: viagem não aparece no Hoje");
    await check(p, "ônibus hoje", 390);
    await shot(p, `${OUT}/30-onibus-chamadas-390.png`);
    for (let i = 0; i < 2; i++) { await p.getByRole("button", { name: "Aceitar" }).first().click(); await p.getByText("Fardo aceito").first().waitFor({ timeout: 30000 }); await p.waitForTimeout(600); }
    for (const label of ["8001-01", "8001-02"]) {
      const cf = p.getByRole("form", { name: "Coletar fardo" }).first();
      await cf.getByLabel("Código da etiqueta").fill(label); await cf.getByRole("button", { name: "Coletei" }).click();
      await p.getByText(`Fardo ${label} coletado`).first().waitFor({ timeout: 30000 });
    }
    p.once("dialog", (d) => d.accept());
    await p.getByRole("button", { name: "Saí de São Paulo" }).click();
    await p.getByRole("button", { name: "Cheguei na cidade" }).waitFor({ timeout: 30000 });
    await p.getByRole("button", { name: "Cheguei na cidade" }).click();
    await p.getByRole("heading", { name: /Entregar na cidade/ }).waitFor({ timeout: 30000 });
    await p.waitForTimeout(300); await p.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
    await check(p, "ônibus entregar", 390);
  }
  {
    // O código do cliente fecha a entrega (cada etiqueta com o código dela).
    const { c, p } = await page(390);
    await loginMembro(p);
    await p.goto(BRAS + "/meu-bras/fretes", { waitUntil: "networkidle" });
    const codes = {};
    for (const label of ["8001-01", "8001-02"]) codes[label] = /EX-[0-9A-F]{6}/.exec(await p.locator("li").filter({ hasText: `Etiqueta ${label}` }).first().innerText())?.[0];
    await c.close();
    const bp = bus.p;
    for (const label of ["8001-01", "8001-02"]) {
      const df = bp.locator("li").filter({ hasText: label }).getByRole("form", { name: "Entregar fardo" });
      await df.getByLabel("Código do cliente").fill(codes[label] ?? ""); await df.getByRole("button", { name: "Entregar" }).click();
      await bp.getByText("Fardo entregue").first().waitFor({ timeout: 30000 }); await bp.waitForTimeout(800);
    }
    if (await bp.getByRole("form", { name: "Entregar fardo" }).count()) fail("ônibus: ainda há fardo para entregar");
    await bp.goto(B + "/transportadora/extrato", { waitUntil: "networkidle" });
    if (!/8001/.test(await bp.locator("main").innerText())) fail("extrato: viagem 8001 ausente");
    await check(bp, "ônibus extrato", 390);
  }
  await bus.c.close();
}
ok("Club E2: rota, viagem, reserva com nota, aceite, coleta, viagem e entrega");

await b.close();
if (bad.length) { console.log(`\n${bad.length} problema(s)`); process.exit(1); }
console.log(`\nTudo certo. Capturas em ${OUT}`);
