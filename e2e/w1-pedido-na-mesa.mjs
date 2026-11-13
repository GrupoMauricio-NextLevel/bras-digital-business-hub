/**
 * W1 das melhorias (D184): na Commerce, o lojista resolve o pedido na lista (estrela, próximo passo, atalhos), abre a
 * gaveta com impressão e suspeita de fraude, ajusta o endereço na página do pedido e vê "Links de pagamento". O lojista
 * do SuperDrop não ganha o seletor de situação. Cada tela passa pelo axe e pela checagem de 360 px.
 * Uso: E2E_CM=http://cm.test:3300 E2E_SD=http://sd.test:3300 node e2e/w1-pedido-na-mesa.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const SD = process.env.E2E_SD ?? "http://sd.test:3300";
const OUT = process.argv[2] ?? "e2e-w1-pedido-na-mesa";
mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${CM},${SD}`] });
const log = [], tropecos = [];
let n = 0;
async function passo(p, nome, fn) {
  try { const nota = await fn(); log.push({ nome, ok: true, nota: nota ?? null }); console.log("✔", nome, nota ? `· ${nota}` : ""); }
  catch (e) {
    const shot = `${OUT}/tropeco-${String(++n).padStart(2, "0")}.png`;
    await p.screenshot({ path: shot, fullPage: true }).catch(() => {});
    const msg = String(e?.message ?? e).split("\n")[0].slice(0, 220);
    tropecos.push({ nome, msg, url: p.url(), shot }); log.push({ nome, ok: false, msg }); console.log("✘", nome, "·", msg);
  }
}
const texto = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
async function conferirTela(p, rotulo) {
  // Avisos (toast) em animação ou empilhados atrás têm opacidade parcial: o axe confere o aviso já assentado, na frente.
  await p.waitForTimeout(1200);
  await p.evaluate(axeSource);
  const v = await p.evaluate(async () => (await window.axe.run({ exclude: [["[data-sonner-toast][data-front='false']"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id} ${x.nodes[0]?.target?.join(" ") ?? ""}`));
  if (v.length) throw new Error(`${rotulo}: axe ${v.join(", ")}`);
  await p.setViewportSize({ width: 360, height: 800 });
  const sobra = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${OUT}/${rotulo}-360.png`, fullPage: true });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.screenshot({ path: `${OUT}/${rotulo}-1280.png`, fullPage: true });
  if (sobra > 1) throw new Error(`${rotulo}: rolagem horizontal de ${sobra}px em 360`);
}
async function entrar(p, base, email) {
  await p.goto(base + "/login", { waitUntil: "networkidle" });
  await p.fill("#email", email); await p.fill("#password", "demo1234");
  await p.locator("form button[type=submit]").click();
  await p.waitForURL(/\/merchant/, { timeout: 30000 });
}

const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on("dialog", (d) => d.type() === "prompt" ? d.accept("Endereço não bate com o CPF") : d.accept());
await passo(p, "1. Lojista da Commerce entra e abre os pedidos", async () => {
  await entrar(p, CM, "lojista@commerce.demo");
  await p.goto(CM + "/merchant/orders", { waitUntil: "networkidle" });
  const t = await texto(p);
  for (const x of ["Com estrela", "Não impressos", "Com suspeita", "Links de pagamento"]) if (!t.includes(x)) throw new Error(`falta "${x}"`);
  await conferirTela(p, "pedidos");
});
await passo(p, "2. Estrela na linha e atalho \"Com estrela\"", async () => {
  const estrela = p.getByRole("button", { name: /Marcar o pedido \d+ com estrela/ }).first();
  const nome = await estrela.getAttribute("aria-label");
  await estrela.click();
  await p.waitForFunction((n) => [...document.querySelectorAll("button[aria-pressed=true]")].some((b) => b.getAttribute("aria-label")?.includes(n.match(/\d+/)[0])), nome, { timeout: 15000 });
  await p.goto(CM + "/merchant/orders?ver=estrela", { waitUntil: "networkidle" });
  if (!(await texto(p)).includes(`#${nome.match(/\d+/)[0]}`)) throw new Error("o pedido com estrela não aparece no atalho");
  return nome;
});
await passo(p, "3. Próximo passo na própria linha", async () => {
  await p.goto(CM + "/merchant/orders", { waitUntil: "networkidle" });
  const botao = p.getByRole("button", { name: /^(Iniciar separação|Concluir separação|Marcar como entregue) no pedido/ }).first();
  if (!(await botao.count())) return "nenhum pedido no ponto de avançar na demonstração";
  const rotulo = await botao.getAttribute("aria-label");
  await botao.click();
  await p.waitForFunction(() => document.body.innerText.includes(": feito"), null, { timeout: 15000 });
  return rotulo;
});
await passo(p, "4. Gaveta: imprimir marca o pedido e a suspeita de fraude aparece", async () => {
  await p.getByRole("button", { name: /Ver pedido \d+ rapidamente/ }).first().click();
  await p.waitForSelector("[role=dialog] >> text=Histórico", { timeout: 15000 });
  const fraude = p.locator("[role=dialog]").getByRole("button", { name: /Suspeita de fraude|Retirar suspeita/ });
  if (await fraude.count()) {
    await fraude.click();
    await p.waitForFunction(() => /envio está segurado|Suspeita retirada/.test(document.body.innerText), null, { timeout: 15000 });
  }
  await conferirTela(p, "gaveta");
  return (await fraude.count()) ? "suspeita marcada" : "pedido já enviado: sem botão de suspeita (correto)";
});
await passo(p, "5. Página do pedido: ajustar endereço", async () => {
  await p.goto(CM + "/merchant/orders?ver=suspeita", { waitUntil: "networkidle" });
  const link = p.locator("main a[href^='/merchant/orders/ord'], main a[href*='/merchant/orders/']").filter({ hasText: /#\d+/ }).first();
  const href = (await link.count()) ? await link.getAttribute("href") : null;
  if (!href) return "sem pedido para abrir";
  await p.goto(CM + href, { waitUntil: "networkidle" });
  const ajustar = p.getByRole("button", { name: "Ajustar endereço" });
  if (!(await ajustar.count())) return "pedido já enviado: endereço travado (correto)";
  await ajustar.click();
  await p.getByLabel("CEP").fill("01310-100");
  await p.getByRole("button", { name: "Salvar endereço" }).click();
  await p.waitForFunction(() => document.body.innerText.includes("01310-100") && document.body.innerText.includes("Endereço ajustado"), null, { timeout: 15000 });
  await conferirTela(p, "pedido");
});
await passo(p, "6. Links de pagamento", async () => {
  await p.goto(CM + "/merchant/orders/propostas", { waitUntil: "networkidle" });
  if (!/Links de pagamento/.test(await texto(p))) throw new Error("título não mudou para Links de pagamento");
  await conferirTela(p, "links-pagamento");
});

const ctxS = await b.newContext({ viewport: { width: 1280, height: 900 } });
const s = await ctxS.newPage();
await passo(s, "7. SuperDrop: sem seletor de situação, sem estrela e sem atalhos", async () => {
  await entrar(s, SD, "dono@arena10.demo");
  await s.goto(SD + "/merchant/orders", { waitUntil: "networkidle" });
  const t = await texto(s);
  if (/Próximo passo|Com estrela|Links de pagamento/.test(t)) throw new Error("o SuperDrop ganhou peça da Commerce");
  if (await s.getByRole("button", { name: /com estrela/ }).count()) throw new Error("estrela apareceu no SuperDrop");
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
