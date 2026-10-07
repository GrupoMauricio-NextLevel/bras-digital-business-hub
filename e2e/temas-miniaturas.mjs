/**
 * Miniaturas dos temas (páginas públicas /temas): captura a loja de demonstração de cada tema no computador
 * (1440×1000, salva em 900×625) e no celular (390×844). Ao mudar a versão (VER), troque também `themeShot` em
 * src/lib/themes/shots.ts (o nome com versão evita que o navegador mostre a miniatura antiga).
 * Uso: bash scripts/start-demo-prod.sh  e depois  E2E_BASE=http://localhost:3100 node e2e/temas-miniaturas.mjs
 */
import { chromium } from "playwright-core";
import sharp from "sharp";
const B = process.env.E2E_BASE ?? "http://localhost:3100";
const VER = 3;
const KEYS = (process.env.TEMAS ?? "starter,trama,lume,lar,ninho,lance,torcida,arena,editorial,varanda,atelier,morada,podio,signature").split(",");
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const key of KEYS) {
  for (const [device, vp, out] of [["desktop", { width: 1440, height: 1000 }, [900, 625]], ["mobile", { width: 390, height: 844 }, [390, 844]]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(`${B}/store/demo-${key}`, { waitUntil: "networkidle" });
    // Esconde a faixa "loja de demonstração" para a miniatura mostrar só o tema.
    await p.addStyleTag({ content: "[data-showcase-banner]{display:none!important}" });
    await p.waitForTimeout(400);
    const png = await p.screenshot();
    await sharp(png).resize(out[0], out[1]).webp({ quality: 78 }).toFile(`public/temas/${key}-${device}-${VER}.webp`);
    await ctx.close();
  }
  console.log("miniatura", key);
}
await b.close();
