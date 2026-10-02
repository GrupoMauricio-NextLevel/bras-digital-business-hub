// Jornada pública e do lojista: galeria, demonstração por link, prévia com os produtos da loja, compra simulada e instalação automática.
import { chromium } from "playwright-core";
const base = process.env.E2E_BASE ?? "http://localhost:3100";
const pass = process.env.DEMO_PASSWORD ?? "demo1234";
let fails = 0; const ok = (c, m) => { console.log(`${c ? "✔" : "✘"} ${m}`); if (!c) fails++; };
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

// Público: galeria, detalhe e demonstração (sem login)
await p.goto(`${base}/temas`, { waitUntil: "load" });
ok(await p.locator("h1", { hasText: "Temas para a sua loja" }).count() === 1, "galeria pública abre");
ok(await p.getByText("Ninho").count() === 0, "tema em aprovação não aparece na galeria");
ok(await p.getByRole("heading", { name: "Lume" }).count() >= 1, "Lume (tema de entrada) aparece na galeria pública");
await p.goto(`${base}/demo/arena`, { waitUntil: "load" });
await p.waitForTimeout(1500);
const frame = p.frameLocator("iframe");
ok(await frame.locator("[data-showcase-banner]").count() === 1, "demonstração mostra o aviso de loja de exemplo");
await frame.locator('a[href*="/cart"]').first().click().catch(() => {});
await p.goto(`${base}/store/demo-arena/checkout`, { waitUntil: "load" });
ok(await p.getByText("Esta é uma loja de demonstração").count() === 1, "checkout da demonstração não vende");
await p.goto(`${base}/demo/ninho`, { waitUntil: "load" });
ok(await p.getByText("Em aprovação").count() >= 1, "link do tema em aprovação funciona e é identificado");

// Lojista da Commerce: entra pelo link da página pública e volta para o tema escolhido
await p.goto(`${base}/login?voltar=${encodeURIComponent("/merchant/templates?ver=arena")}`, { waitUntil: "load" });
await p.fill("#email", "lojista@commerce.demo"); await p.fill("#password", pass); await p.click('button[type="submit"]');
await p.waitForURL(/merchant\/templates/, { timeout: 30000 });
ok(p.url().includes("ver=arena"), "login volta para a vitrine de temas do lojista");
await p.getByRole("dialog").waitFor({ timeout: 30000 });
ok(await p.getByText("Tema Arena com os seus produtos").count() === 1, "abre a prévia do tema com os produtos da própria loja");
const prev = p.frameLocator("iframe[title^='Prévia']");
ok(await prev.locator("body").innerText().then((t) => /Fio & Linha|Poncho|Jaqueta/.test(t)), "prévia mostra produtos da loja do cliente");
await p.keyboard.press("Escape");
ok(await p.getByText("Ninho").count() === 0, "lojista não vê tema em aprovação");

// Compra simulada (cartão de demonstração) e instalação automática, sem passo extra
const arena = p.locator("li", { has: p.locator("h3", { hasText: "Arena" }) });
await arena.getByRole("button", { name: /Comprar em até/ }).click();
await p.getByRole("button", { name: /no cartão/ }).first().click();
await p.getByRole("button", { name: /Simular pagamento no cartão/ }).click();
await p.getByText("Tema Arena instalado").waitFor({ timeout: 40000 }).catch(() => {});
ok(await p.getByText("Tema ativo").count() >= 1, "pagou e o tema ficou instalado e ativo sem passo extra");
await b.close();
if (fails) { console.log(`${fails} falha(s)`); process.exit(1); } console.log("tudo certo");
