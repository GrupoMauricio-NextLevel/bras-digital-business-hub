/**
 * P1b: recuperar senha por e-mail (na demonstração o link aparece na tela). Uso: E2E_BASE=http://localhost:3100 node e2e/password-reset.mjs
 */
import { chromium } from "playwright-core";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const bad = []; const fail = (m) => bad.push(m); const ok = (m) => console.log("✔", m);
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
p.on("pageerror", (e) => fail("pageerror: " + e.message));
await p.goto(B + "/login", { waitUntil: "networkidle" });
await p.getByRole("link", { name: /Esqueci a minha senha/ }).click(); await p.waitForURL(/\/esqueci-senha/);
// e-mail inexistente responde igual, sem link
await p.getByLabel("E-mail").fill("ninguem@nada.com"); await p.getByRole("button", { name: /Enviar link/ }).click();
await p.waitForSelector("text=Se existir uma conta", { timeout: 20000 });
if (await p.getByText("Abrir o link de redefinição").count()) fail("revelou que o e-mail não existe");
await p.goto(B + "/esqueci-senha", { waitUntil: "networkidle" });
await p.getByLabel("E-mail").fill("parceira@demo.superdrop.com.br"); await p.getByRole("button", { name: /Enviar link/ }).click();
await p.getByRole("link", { name: "Abrir o link de redefinição" }).click();
await p.waitForURL(/\/redefinir-senha\//);
const url = p.url();
await p.getByLabel(/Nova senha/).fill("nova-senha-123"); await p.getByLabel("Repita a nova senha").fill("outra-coisa-123");
await p.getByRole("button", { name: "Salvar nova senha" }).click(); await p.waitForSelector("text=As senhas não conferem");
await p.getByLabel("Repita a nova senha").fill("nova-senha-123"); await p.getByRole("button", { name: "Salvar nova senha" }).click();
await p.waitForURL(/\/login/, { timeout: 30000 });
ok("senha redefinida pelo link");
await p.goto(url, { waitUntil: "networkidle" });
if (!(await p.getByText("Este link expirou ou já foi usado").count())) fail("o link pôde ser reutilizado"); else ok("link de uso único");
await p.goto(B + "/login", { waitUntil: "networkidle" });
await p.getByLabel("E-mail").fill("parceira@demo.superdrop.com.br"); await p.getByLabel("Senha").fill("nova-senha-123"); await p.getByRole("button", { name: /Entrar/ }).click();
await p.waitForURL(/\/partner/, { timeout: 30000 });
ok("login com a nova senha");
await b.close();
if (bad.length) { console.log("PROBLEMAS:\n" + bad.join("\n")); process.exit(1); }
console.log("RECUPERAR SENHA OK");
