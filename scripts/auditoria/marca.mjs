// Varredura de vazamentos entre marcas (D164): entra com uma conta, percorre as páginas públicas e todo o menu do painel,
// e anota por tela os termos proibidos para a marca, as cores fora do lugar e a rolagem horizontal.
// Uso: node scripts/auditoria/marca.mjs <host> <conta> <senha> [saida] [largura]
//   ex.: node scripts/auditoria/marca.mjs http://cm.test:3300 lojista@commerce.demo demo1234 /tmp/aud-ec
// Guia e tabela de termos: docs/prompts/padrao-nextlevel-todas-marcas.md (seção 4).
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const [HOST, CONTA, SENHA, OUT = "auditoria-marca", LARGURA = "1440"] = process.argv.slice(2);
if (!HOST || !CONTA || !SENHA) { console.error("Uso: node scripts/auditoria/marca.mjs <host> <conta> <senha> [saida] [largura]"); process.exit(1); }
mkdirSync(OUT, { recursive: true });

/** Termos e cores (rgb) que não podem aparecer em cada marca, reconhecida pelo host. */
const VERDE_SD = [45, 158, 59], AZUL_EC = [63, 101, 255], INDIGO_CG = [75, 79, 216], AMARELO_ANTIGO = [245, 188, 0];
const REGRAS = [
  { host: /cm\.|lojas\./, marca: "NextLevel E-commerce", termos: /SuperDrop|\bCentral\b|recarga|Drop manual|Commerce (Start|Pro|Scale)|Brás Digital|Cargas/g, cores: [VERDE_SD, INDIGO_CG, AMARELO_ANTIGO] },
  { host: /sd\.|superdrop/, marca: "SuperDrop", termos: /E-commerce|NextLevel Commerce|Brás Digital|Cargas/g, cores: [AZUL_EC, INDIGO_CG] },
  { host: /bd\.|bras/, marca: "Brás Digital Club", termos: /SuperDrop|E-commerce|NextLevel Commerce|Drop manual/g, cores: [VERDE_SD, INDIGO_CG, AMARELO_ANTIGO] },
  { host: /cg\.|cargas/, marca: "NextLevel Cargas", termos: /SuperDrop|E-commerce|NextLevel Commerce/g, cores: [VERDE_SD, AZUL_EC, AMARELO_ANTIGO] },
  { host: /.*/, marca: "NextLevel", termos: /NextLevel Commerce\b|Brás Digital\b(?! Club)/g, cores: [AMARELO_ANTIGO] },
];
const regra = REGRAS.find((r) => r.host.test(HOST));
const PUBLICAS = ["/", "/planos", "/temas", "/faq", "/cadastro", "/login", "/esqueci-senha", "/parceiros"];

const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-proxy-server", "--host-resolver-rules=MAP *.test 127.0.0.1", `--unsafely-treat-insecure-origin-as-secure=${HOST}`] });
const rel = [];
async function ver(p, nome, url) {
  try {
    const r = await p.goto(url, { waitUntil: "load", timeout: 60000 });
    await p.waitForTimeout(600);
    const texto = await p.evaluate(() => document.body.innerText);
    const termos = [...new Set(texto.match(regra.termos) ?? [])];
    const trechos = [...new Set([...texto.matchAll(new RegExp(`.{0,60}(?:${regra.termos.source}).{0,40}`, "g"))].map((m) => m[0].replace(/\s+/g, " ")))].slice(0, 6);
    const lado = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const cores = await p.evaluate((proibidas) => {
      const achadas = new Set();
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        for (const c of [cs.color, cs.backgroundColor, cs.borderTopColor]) {
          const m = c.match(/rgba?\((\d+), (\d+), (\d+)/);
          if (m && proibidas.some(([r, g, bb]) => Math.abs(r - +m[1]) + Math.abs(g - +m[2]) + Math.abs(bb - +m[3]) < 12)) achadas.add(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0].slice(0, 30)} ${c}`);
        }
      }
      return [...achadas].slice(0, 8);
    }, regra.cores);
    rel.push({ nome, url: p.url(), status: r?.status(), termos, trechos, cores, lado });
    await p.screenshot({ path: `${OUT}/${nome}.png` });
  } catch (e) { rel.push({ nome, url, erro: String(e).slice(0, 160) }); }
}

const ctx = await b.newContext({ viewport: { width: Number(LARGURA), height: 900 } });
const p = await ctx.newPage();
for (const u of PUBLICAS) await ver(p, `pub${u.replace(/\W+/g, "-")}`, HOST + u);
await p.goto(`${HOST}/login`);
await p.fill("input[type=email]", CONTA);
await p.fill("input[type=password]", SENHA);
await p.locator("form button[type=submit]").first().click();
await p.waitForLoadState("networkidle").catch(() => {});
await p.waitForTimeout(1200);
const menu = await p.evaluate(() => [...new Set([...document.querySelectorAll("nav a[href^='/'], aside a[href^='/']")].map((a) => a.getAttribute("href")))].filter((h) => h && !h.startsWith("/store") && !h.includes("logout")));
let i = 0;
for (const h of menu.slice(0, 60)) await ver(p, `painel-${String(++i).padStart(2, "0")}${h.replace(/\W+/g, "-").slice(0, 40)}`, HOST + h);
await b.close();

writeFileSync(`${OUT}/relatorio.json`, JSON.stringify({ marca: regra.marca, host: HOST, conta: CONTA, telas: rel }, null, 1));
let problemas = 0;
for (const r of rel) {
  const ruim = r.erro || r.termos?.length || r.cores?.length || r.lado > 0;
  if (ruim) problemas++;
  console.log(`${ruim ? "✘" : "✔"} ${r.nome} ${r.erro ?? ""}${r.termos?.length ? ` termos: ${r.termos.join(", ")}` : ""}${r.cores?.length ? ` cores: ${r.cores.length}` : ""}${r.lado > 0 ? ` rolagem lateral: ${r.lado}px` : ""}`);
}
console.log(`\n${regra.marca}: ${rel.length} telas, ${problemas} com problema. Detalhes em ${OUT}/relatorio.json`);
process.exit(problemas ? 2 : 0);
