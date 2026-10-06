/**
 * Capturas ANTES x DEPOIS das mesmas telas. Uso:
 *   ANTES=http://localhost:3200 DEPOIS=http://localhost:3100 node e2e/design-system-antes-depois.mjs
 * Saída: docs/design-system/antes-depois/<projeto>-<tela>-<largura>-{antes,depois}.png
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const OUT = "docs/design-system/antes-depois"; mkdirSync(OUT, { recursive: true });
const LADOS = [["antes", process.env.ANTES ?? "http://localhost:3200"], ["depois", process.env.DEPOIS ?? "http://localhost:3100"]];
const TELAS = [
  { projeto: "commerce", nome: "painel-lojista", host: "lojas.nextlevelgroup.com.br", login: "completo@commerce.demo", rotas: ["/merchant", "/merchant/orders"] },
  { projeto: "superdrop", nome: "painel-lojista", host: "superdrop.com.br", login: "loja@mrssports.demo", rotas: ["/merchant", "/merchant/orders"] },
  { projeto: "superdrop", nome: "painel-fornecedor", host: "superdrop.com.br", login: "megatron@superdrop.demo", rotas: ["/supplier"] },
  { projeto: "nextlevel", nome: "master", host: "master.nextlevelgroup.com.br", login: "master@nextlevel.demo", rotas: ["/master"] },
  { projeto: "superdrop", nome: "publica", host: "superdrop.com.br", rotas: ["/", "/planos"] },
  { projeto: "commerce", nome: "publica", host: "lojas.nextlevelgroup.com.br", rotas: ["/", "/planos"] },
];
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" });
for (const [lado, base] of LADOS) {
  for (const t of TELAS) {
    for (const w of [1440, 390]) {
      const ctx = await b.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, extraHTTPHeaders: { "x-forwarded-host": t.host }, reducedMotion: "reduce" });
      const p = await ctx.newPage(); p.setDefaultTimeout(45000);
      try {
        if (t.login) {
          await p.goto(base + "/login", { waitUntil: "networkidle" });
          await p.fill("input[name=email],input[type=email]", t.login); await p.fill("input[type=password]", "demo1234"); await p.keyboard.press("Enter");
          await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
        }
        for (const r of t.rotas) {
          await p.goto(base + r, { waitUntil: "networkidle" });
          await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
          await p.waitForTimeout(500);
          const nome = `${t.projeto}-${t.nome}-${r.replace(/\W+/g, "_").replace(/^_/, "") || "inicio"}-${w}-${lado}.png`;
          await p.screenshot({ path: `${OUT}/${nome}` });
        }
      } catch (e) { console.log("falha", lado, t.projeto, t.nome, w, String(e.message).slice(0, 100)); }
      await ctx.close();
    }
  }
  console.log("lado", lado, "ok");
}
await b.close();
