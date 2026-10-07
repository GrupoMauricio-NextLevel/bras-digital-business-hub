/**
 * Modo suporte de ponta a ponta: Master acha o cliente na central, entra com motivo, vê a faixa,
 * fica em somente leitura, libera ação, sai e volta para onde estava. Também confere celular (390 px).
 * Uso: E2E_BASE=http://localhost:3100 node e2e/modo-suporte.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const OUT = "docs/auditoria-dono/capturas"; mkdirSync(OUT, { recursive: true });
const fail = (m) => { console.error("✖", m); process.exitCode = 1; };
const ok = (m) => console.log("✓", m);

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: { "x-forwarded-host": "master.nextlevelgroup.com.br" } });
  const p = await ctx.newPage(); p.setDefaultTimeout(45000);
  await p.goto(B + "/login");
  await p.fill("input[type=email]", "master@nextlevel.demo"); await p.fill("input[type=password]", "demo1234"); await p.keyboard.press("Enter");
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));

  for (const [email, home, papel] of [["loja@mrssports.demo", "/merchant", "lojista"], ["expedicao@megatron.demo", "/supplier/dispatch", "expedição"], ["parceira@demo.superdrop.com.br", "/partner", "parceiro"], ["completo@commerce.demo", "/merchant", "lojista Commerce"]]) {
    await p.goto(B + "/master/clientes?marca=todas&q=" + encodeURIComponent(email));
    const row = p.locator("tr, li, [role=row], .ds-card div").filter({ hasText: email }).first();
    if (!(await p.locator(`text=${email} >> visible=true`).first().waitFor({ timeout: 20000 }).then(() => true).catch(() => false))) { fail(`${w}px: cliente ${email} não aparece na central`); continue; }
    await p.getByRole("button", { name: /Ver como cliente/ }).first().click();
    await p.getByRole("button", { name: "Conferir pedido" }).click();
    if (w === 390 && papel === "lojista") await p.screenshot({ path: `${OUT}/suporte-motivo-390.png` });
    await p.getByRole("button", { name: "Entrar em modo suporte" }).click();
    await p.waitForURL((u) => u.pathname.startsWith(home), { timeout: 30000 }).catch(() => fail(`${w}px ${papel}: não abriu ${home} (está em ${p.url()})`));
    const bar = p.locator(".ds-support-bar");
    if (!(await bar.waitFor({ timeout: 20000 }).then(() => true).catch(() => false))) { fail(`${w}px ${papel}: faixa do modo suporte não aparece`); continue; }
    const txt = await bar.innerText();
    if (!/somente leitura/.test(txt) || !/Conferir pedido/.test(txt)) fail(`${w}px ${papel}: faixa sem modo/motivo (${txt.slice(0, 80)})`); else ok(`${w}px ${papel}: entrou em modo suporte com faixa e motivo`);
    if (papel === "lojista") await p.screenshot({ path: `${OUT}/suporte-faixa-${papel}-${w}.png` });
    if (papel === "lojista") {
      // 2º passo explícito: liberar ação em nome do cliente (aceita a confirmação)
      p.once("dialog", (d) => d.accept());
      await p.getByRole("button", { name: "Agir em nome do cliente" }).click();
      await p.waitForLoadState("networkidle");
      if (!/Agindo em nome de/.test(await p.locator(".ds-support-bar").innerText())) fail(`${w}px: não liberou ação em nome do cliente`); else ok(`${w}px: ação em nome do cliente liberada e sinalizada`);
    }
    await p.getByRole("button", { name: "Sair do modo suporte" }).click();
    await p.waitForURL((u) => u.pathname.startsWith("/master/clientes"), { timeout: 30000 }).then(() => ok(`${w}px ${papel}: saiu e voltou para a central`)).catch(() => fail(`${w}px ${papel}: não voltou para a central (${p.url()})`));
    void row;
  }
  await p.goto(B + "/master/clientes?marca=todas");
  await p.screenshot({ path: `${OUT}/central-clientes-${w}.png`, fullPage: w === 1440 ? false : true });
  // histórico registra os acessos
  if (!(await p.locator("text=Entrou em modo suporte >> visible=true").first().waitFor({ timeout: 20000 }).then(() => true).catch(() => false))) fail(`${w}px: histórico de suporte vazio`); else ok(`${w}px: histórico de acessos de suporte visível`);
  await ctx.close();
}

// Segurança: cookie de suporte forjado não dá acesso; cookie antigo de "volta ao Master" não existe mais
{
  const ctx = await b.newContext({ extraHTTPHeaders: { "x-forwarded-host": "superdrop.com.br" } });
  const p = await ctx.newPage();
  await p.goto(B + "/login");
  await p.fill("input[type=email]", "loja@mrssports.demo"); await p.fill("input[type=password]", "demo1234"); await p.keyboard.press("Enter");
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
  const cookies = await ctx.cookies();
  const sess = cookies.find((c) => c.name === "nl_session");
  // tenta transformar a sessão do lojista em sessão de suporte de um Master, sem assinatura válida
  const [body] = sess.value.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  await ctx.addCookies([{ ...sess, value: Buffer.from(JSON.stringify({ ...payload, sup: "qualquer" })).toString("base64url") + ".assinatura-falsa" }, { name: "nl_master_return", value: "usr_master", url: B }]);
  const r = await p.goto(B + "/master");
  if (!new URL(p.url()).pathname.startsWith("/login")) fail(`cookie forjado abriu ${p.url()} (status ${r?.status()})`); else ok("cookie forjado é recusado (volta ao login)");
  await ctx.close();
}
await b.close();
