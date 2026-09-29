/**
 * Capturas de tela por perfil e breakpoint (modo demo).
 * Uso: node e2e/shots.mjs <pastaSaida> [perfil ...]
 * Perfis: master, supplier, dispatch, lite, pro. Sem argumentos captura todos os que existirem.
 * Requer o app em E2E_BASE (padrão http://localhost:3000) com NEXT_PUBLIC_DEMO_MODE=true e SEED_DEMO aplicado.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const B = process.env.E2E_BASE ?? "http://localhost:3000";
const out = process.argv[2] ?? ".e2e/shots";
const only = process.argv.slice(3);
mkdirSync(out, { recursive: true });

const BREAKPOINTS = [["1440", 1440, 900], ["1024", 1024, 768], ["768", 768, 1024], ["390", 390, 844]];
const THEMES = (process.env.SHOT_THEMES ?? "light").split(",");

/** button = trecho do nome no botão de login demo; pages = [nome, rota] */
export const PROFILES = {
  master: { button: /Equipe NextLevel/, pages: [["home", "/master"], ["finance", "/master/finance"], ["services", "/master/services"]] },
  supplier: { button: /Ricardo Menezes/, pages: [["home", "/supplier"], ["wallets", "/supplier/wallets"], ["operations", "/supplier/operations"], ["team", "/supplier/team"], ["finance", "/supplier/finance"], ["orders", "/supplier/orders"]] },
  dispatch: { button: /Marcos Souza/, pages: [["queue", "/supplier/dispatch"], ["waves", "/supplier/dispatch/print"]] },
  lite: { button: /Carla Moura|Bruno Tavares/, pages: [["home", "/merchant"], ["orders", "/merchant/orders"], ["products", "/merchant/products"]] },
  pro: { button: /Ana Paula/, pages: [["home", "/merchant"], ["orders", "/merchant/orders"], ["appearance", "/merchant/appearance"]] },
};

const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
const log = [];
for (const [name, prof] of Object.entries(PROFILES)) {
  if (only.length && !only.includes(name)) continue;
  for (const theme of THEMES) {
    for (const [bp, w, h] of BREAKPOINTS) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme === "dark" ? "dark" : "light", isMobile: w < 500 });
      const p = await ctx.newPage();
      p.on("pageerror", (e) => log.push(`${name}/${bp}: PAGEERROR ${e.message}`));
      await p.goto(B + "/login", { waitUntil: "networkidle" });
      if (theme === "dark") await p.evaluate(() => { try { localStorage.setItem("nl-theme", "dark"); } catch {} });
      const btn = p.getByRole("button", { name: prof.button }).first();
      if (!(await btn.count())) { log.push(`${name}: perfil demo não encontrado`); await ctx.close(); continue; }
      await btn.click();
      await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
      await p.waitForLoadState("networkidle");
      for (const [pageName, route] of prof.pages) {
        await p.goto(B + route, { waitUntil: "networkidle" });
        await p.waitForTimeout(250);
        await p.screenshot({ path: `${out}/${name}-${pageName}-${bp}${theme === "dark" ? "-dark" : ""}.jpg`, type: "jpeg", quality: 62, fullPage: false });
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
        if (overflow) log.push(`${name}/${pageName}/${bp}: rolagem horizontal`);
      }
      await ctx.close();
    }
  }
}
await b.close();
console.log(log.length ? log.join("\n") : "capturas ok, sem erros");
