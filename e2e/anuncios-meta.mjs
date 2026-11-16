/**
 * D299: anúncios na Meta com a equipe. Lojista faz o diagnóstico (uma pergunta por vez, prévia do anúncio), envia;
 * a equipe pega na mesa do Master, responde, muda a etapa e lança números; o lojista acompanha na sala da campanha.
 * Uso: bash scripts/restart-demo.sh && E2E_BASE=http://localhost:3100 node e2e/anuncios-meta.mjs   (SHOTS=/pasta; muda dados)
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const axe = async (p) => { await p.evaluate(axeSource); return p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id + ":" + (x.nodes[0]?.html ?? "").slice(0, 90))); };
const noScroll = async (p, where) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`rolagem horizontal em ${where}`); };
const shot = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png` }); };
const entrar = async (p, nome) => { await p.goto(B + "/login", { waitUntil: "networkidle" }); await p.getByRole("button", { name: nome }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 90000 }); };

// 1) Lojista: diagnóstico e envio.
const lc = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const l = await lc.newPage();
await entrar(l, /completo@commerce\.demo/);
await l.goto(B + "/merchant/anuncios", { waitUntil: "networkidle" });
await shot(l, "a1-anuncios-entrada");
let v = await axe(l); if (v.length) fail(`axe entrada: ${v.join(" | ")}`); else ok("axe ok na entrada de Anúncios");
await l.getByRole("button", { name: /Nova campanha|Começar o diagnóstico|Continuar o diagnóstico/ }).first().click();
await l.waitForURL(/\/merchant\/anuncios\/anc_/, { timeout: 30000 });
const url = l.url();
ok("diagnóstico aberto");
const continuar = () => l.getByRole("button", { name: "Continuar" }).click();
await l.getByRole("radio", { name: /Vender mais na loja/ }).click(); await continuar();
const produtos = l.getByRole("list", { name: "Produtos da loja" }).getByRole("checkbox");
if (await produtos.count()) { await produtos.nth(0).click(); if (await produtos.count() > 1) await produtos.nth(1).click(); ok(`escolheu produtos (${await produtos.count()} na loja)`); } else await l.getByRole("checkbox", { name: /A loja toda/ }).click();
await continuar();
await l.getByRole("radio", { name: /Principalmente mulheres/ }).click();
await l.getByLabel("Idade a partir de").selectOption("22"); await l.getByLabel("Até").selectOption("45");
await continuar();
await l.getByRole("radio", { name: /Alguns estados/ }).click();
await l.getByRole("checkbox", { name: "SP" }).click(); await l.getByRole("checkbox", { name: "MG" }).click();
await continuar();
await l.getByRole("radio", { name: /R\$\s?30,00\/dia/ }).click();
await shot(l, "a2-diagnostico-verba-previa");
await continuar();
await l.getByLabel("Instagram da loja (opcional)").fill("@lojateste");
await l.getByRole("radio", { name: "Ainda não" }).click();
await l.getByRole("checkbox", { name: "Tenho boas fotos" }).click();
await continuar();
await l.getByLabel("Oferta para o anúncio (opcional)").fill("Frete grátis acima de R$ 199");
await continuar();
const previa = await l.getByRole("figure", { name: "Prévia do anúncio" }).last().textContent();
if (/lojateste/.test(previa) && /Comprar agora/.test(previa) && /Frete grátis acima de R\$ 199/.test(previa) && /SP, MG/.test(previa)) ok("prévia do anúncio montada com as respostas"); else fail(`prévia incompleta: ${previa.slice(0, 200)}`);
v = await axe(l); if (v.length) fail(`axe diagnóstico: ${v.join(" | ")}`); else ok("axe ok no diagnóstico");
await shot(l, "a3-diagnostico-revisao");
// Volta e confere que ficou salvo.
await l.waitForTimeout(1200); await l.reload({ waitUntil: "networkidle" });
if (await l.getByRole("radio", { name: /Vender mais na loja/ }).getAttribute("aria-checked") === "true") ok("rascunho salvo sozinho (recarregou e manteve)"); else fail("rascunho não ficou salvo");
for (let i = 0; i < 7; i++) await continuar();
await l.getByRole("button", { name: "Enviar para a equipe" }).click();
await l.getByRole("heading", { name: "Recebemos o seu diagnóstico" }).waitFor({ timeout: 20000 }).then(() => ok("enviado: sala mostra 'Recebemos o seu diagnóstico'"), () => fail("sala não abriu após enviar"));
await l.getByLabel("Mensagem para a equipe").fill("Posso focar nos vestidos?");
await l.getByRole("button", { name: "Enviar" }).click();
await l.getByText("Posso focar nos vestidos?").waitFor({ timeout: 10000 });
ok("lojista mandou mensagem para a equipe");

// 2) Equipe: mesa, resposta, etapa, números.
const mc = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", extraHTTPHeaders: { "x-forwarded-host": "master.nextlevelgroup.com.br" } });
const m = await mc.newPage();
await entrar(m, /Equipe NextLevel/);
await m.goto(B + "/master/anuncios", { waitUntil: "networkidle" });
const cartao = m.getByRole("region", { name: "Na mesa da equipe" }).getByRole("link").first();
if (/Lojista escreveu/.test(await cartao.textContent())) ok("mesa: pedido com 'Lojista escreveu'"); else fail("mesa não sinalizou a mensagem do lojista");
await shot(m, "a4-master-mesa");
v = await axe(m); if (v.length) fail(`axe mesa: ${v.join(" | ")}`); else ok("axe ok na mesa");
await cartao.click();
await m.getByRole("heading", { name: "Etapa" }).waitFor();
await m.getByLabel("Mensagem para o lojista").fill("Pode sim! Vamos focar nos vestidos mais vendidos.");
await m.getByRole("button", { name: "Enviar" }).first().click();
await m.waitForTimeout(1500);
await m.getByLabel("Mover para").selectOption("ANALISE");
await m.getByLabel("Recado para o lojista (opcional)").fill("Estou estudando seus concorrentes hoje.");
await m.getByRole("button", { name: "Atualizar etapa" }).click();
await m.waitForTimeout(1500);
await m.getByLabel("Mover para").selectOption("NO_AR");
await m.getByRole("button", { name: "Atualizar etapa" }).click();
await m.waitForTimeout(1500);
await m.getByLabel("Valor gasto na Meta").fill("210,00");
await m.getByLabel("Alcance").fill("18400"); await m.getByLabel("Cliques").fill("520"); await m.getByLabel("Conversas").fill("12");
await m.getByLabel("Comentário para o lojista (opcional)").fill("O vestido azul é o que mais chama atenção.");
await m.getByRole("button", { name: "Lançar" }).click();
await m.getByText(/18\.400 pessoas alcançadas/).first().waitFor({ timeout: 15000 }).then(() => ok("equipe lançou os números"), () => fail("números não apareceram"));
await shot(m, "a5-master-detalhe");
v = await axe(m); if (v.length) fail(`axe detalhe: ${v.join(" | ")}`); else ok("axe ok no detalhe da mesa");

// 3) Lojista vê tudo na sala.
await l.goto(url, { waitUntil: "networkidle" });
const sala = await l.locator("main").textContent();
for (const [re, msg] of [[/Campanha no ar/, "etapa 'Campanha no ar'"], [/Pode sim! Vamos focar nos vestidos/, "resposta da equipe na conversa"], [/Estou estudando seus concorrentes/, "recado da etapa"], [/R\$\s?210,00/, "investido na Meta"], [/18\.400/, "alcance"], [/vestido azul/, "comentário dos números"]]) { if (re.test(sala)) ok(`sala: ${msg}`); else fail(`sala sem ${msg}`); }
await l.getByRole("checkbox", { name: /Marcar como feito: Dar acesso de parceiro/ }).check();
await l.waitForTimeout(1500);
if (await l.getByRole("checkbox", { name: /Desmarcar: Dar acesso de parceiro/ }).count()) ok("lojista marcou um passo como feito"); else fail("passo não ficou marcado");
await l.evaluate(() => window.scrollTo(0, 0));
await shot(l, "a6-sala-lojista");
v = await axe(l); if (v.length) fail(`axe sala: ${v.join(" | ")}`); else ok("axe ok na sala");
for (const [w, h] of [[360, 780]]) { await l.setViewportSize({ width: w, height: h }); await l.reload({ waitUntil: "networkidle" }); await noScroll(l, `sala ${w}`); await shot(l, "a7-sala-celular"); }
await b.close();
if (bad.length) { console.error("FALHAS:\n- " + bad.join("\n- ")); process.exit(1); }
console.log("tudo certo");
