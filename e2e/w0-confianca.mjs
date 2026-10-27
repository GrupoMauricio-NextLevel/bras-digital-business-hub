/**
 * W0 das melhorias (D183): o lojista vê a conta da taxa, a última entrada da equipe e as novidades, e sai dos outros
 * aparelhos; o Master liga a verificação em duas etapas e entra de novo com o código do aplicativo. Cada tela passa
 * pelo axe (sem violação grave) e pela checagem de rolagem horizontal em 360 px.
 * Uso: E2E_CM=http://cm.test:3300 E2E_NL=http://nl.test:3300 node e2e/w0-confianca.mjs [pasta-de-saida]
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CM = process.env.E2E_CM ?? "http://cm.test:3300";
const NL = process.env.E2E_NL ?? "http://nl.test:3300";
const OUT = process.argv[2] ?? "e2e-w0-confianca";
mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${CM},${NL}`] });
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
  const v = await p.evaluate(async () => (await window.axe.run({ exclude: [["[data-sonner-toast][data-front='false']"]] }, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => x.id));
  if (v.length) throw new Error(`${rotulo}: axe ${v.join(", ")}`);
  await p.setViewportSize({ width: 360, height: 800 });
  const sobra = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${OUT}/${rotulo}-360.png`, fullPage: true });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.screenshot({ path: `${OUT}/${rotulo}-1280.png`, fullPage: true });
  if (sobra > 1) throw new Error(`${rotulo}: rolagem horizontal de ${sobra}px em 360`);
}
async function entrar(p, base, email, senha = "demo1234") {
  await p.goto(base + "/login", { waitUntil: "networkidle" });
  await p.fill("#email", email); await p.fill("#password", senha);
  await p.locator("form button[type=submit]").click();
}
// Código do aplicativo autenticador (mesma conta do servidor, RFC 6238).
function totp(segredo, quando = Date.now()) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; let bits = 0, v = 0; const out = [];
  for (const c of segredo) { v = (v << 5) | A.indexOf(c); bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } }
  const cont = Math.floor(quando / 30000); const msg = Buffer.alloc(8); msg.writeUInt32BE(Math.floor(cont / 2 ** 32), 0); msg.writeUInt32BE(cont >>> 0, 4);
  const h = createHmac("sha1", Buffer.from(out)).update(msg).digest(); const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, "0");
}

// Lojista da E-commerce.
const ctxA = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctxA.newPage();
p.on("dialog", (d) => d.accept());
await passo(p, "1. Lojista entra", async () => { await entrar(p, CM, "lojista@commerce.demo"); await p.waitForURL(/\/merchant/, { timeout: 30000 }); });
await passo(p, "2. Financeiro mostra a conta da taxa e o que entra e não entra", async () => {
  await p.goto(CM + "/merchant/finance", { waitUntil: "networkidle" });
  const t = await texto(p);
  if (!/Sua taxa sobre vendas/.test(t)) return "loja sem taxa no plano: bloco escondido (correto)";
  for (const x of ["Entra na conta", "Não entra", "Frete", "O mês fecha em"]) if (!t.includes(x)) throw new Error(`falta "${x}"`);
  await conferirTela(p, "financeiro");
  return "conta da taxa visível";
});
await passo(p, "3. Equipe mostra a última entrada e o aviso de um acesso por pessoa", async () => {
  await p.goto(CM + "/merchant/team", { waitUntil: "networkidle" });
  const t = await texto(p);
  if (!/Última entrada:/.test(t) || !/nunca compartilhe a sua senha/.test(t)) throw new Error("faltam a última entrada ou o aviso");
  await conferirTela(p, "equipe");
});
await passo(p, "4. O que mudou", async () => {
  await p.goto(CM + "/merchant/novidades", { waitUntil: "networkidle" });
  if (!/Veja a conta da sua taxa/.test(await texto(p))) throw new Error("lista de novidades vazia");
  await conferirTela(p, "novidades");
});
await passo(p, "5. Sair dos outros aparelhos derruba a outra sessão e mantém esta", async () => {
  const ctxB = await b.newContext(); const q = await ctxB.newPage();
  await entrar(q, CM, "lojista@commerce.demo"); await q.waitForURL(/\/merchant/, { timeout: 30000 });
  await p.goto(CM + "/account/seguranca", { waitUntil: "networkidle" });
  await conferirTela(p, "seguranca-lojista");
  if (/Verificação em duas etapas/.test(await texto(p))) throw new Error("lojista não deveria ver as duas etapas na W0");
  await p.getByRole("button", { name: "Sair dos outros aparelhos" }).click();
  await p.waitForFunction(() => document.body.innerText.includes("desconectados"), null, { timeout: 15000 });
  await q.goto(CM + "/merchant", { waitUntil: "networkidle" });
  if (!/\/login/.test(q.url())) throw new Error(`a outra sessão continuou aberta: ${q.url()}`);
  await p.goto(CM + "/merchant", { waitUntil: "networkidle" });
  if (/\/login/.test(p.url())) throw new Error("esta sessão caiu junto");
  await ctxB.close();
});

// Master liga as duas etapas.
const ctxM = await b.newContext({ viewport: { width: 1280, height: 900 } });
const m = await ctxM.newPage();
m.on("dialog", (d) => d.accept());
let segredo = null;
await passo(m, "6. Master liga a verificação em duas etapas", async () => {
  await entrar(m, NL, "master@nextlevel.demo"); await m.waitForURL(/\/master/, { timeout: 30000 });
  await m.goto(NL + "/account/seguranca", { waitUntil: "networkidle" });
  await m.getByRole("button", { name: "Ligar a verificação em duas etapas" }).click();
  await m.waitForSelector("img[alt^='QR']", { timeout: 15000 });
  await conferirTela(m, "seguranca-master-qr");
  segredo = (await m.locator("span.font-mono").first().innerText()).trim();
  await m.fill("input[autocomplete=one-time-code]", totp(segredo));
  await m.getByRole("button", { name: "Ligar", exact: true }).click();
  await m.waitForFunction(() => document.body.innerText.includes("códigos de recuperação"), null, { timeout: 15000 });
  const codigos = await m.locator("ul.font-mono li").count();
  if (codigos !== 8) throw new Error(`esperava 8 códigos de recuperação, vieram ${codigos}`);
  await m.getByRole("button", { name: "Já guardei" }).click();
});
await passo(m, "7. Master entra de novo: senha e depois o código", async () => {
  await ctxM.clearCookies();
  await entrar(m, NL, "master@nextlevel.demo");
  await m.waitForSelector("#codigo", { timeout: 15000 });
  await conferirTela(m, "login-segunda-etapa");
  await m.fill("#codigo", "000000"); await m.locator("form button[type=submit]").click();
  await m.waitForSelector("#login-error", { timeout: 15000 });
  await m.fill("#codigo", totp(segredo)); await m.locator("form button[type=submit]").click();
  await m.waitForURL(/\/master/, { timeout: 30000 });
});
await passo(m, "8. Master desliga (deixa a demonstração como estava)", async () => {
  await m.goto(NL + "/account/seguranca", { waitUntil: "networkidle" });
  await m.fill("input[autocomplete=one-time-code]", totp(segredo));
  await m.getByRole("button", { name: "Desligar" }).click();
  await m.waitForFunction(() => document.body.innerText.includes("Ligar a verificação"), null, { timeout: 15000 });
});

await b.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ log, tropecos }, null, 2));
console.log(`\n${log.filter((x) => x.ok).length}/${log.length} passos ok`);
process.exit(tropecos.length ? 1 : 0);
