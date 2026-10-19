// Conferência do site no ar depois de cada publicação (D171). Só leitura, sem login e sem navegador: cada endereço responde,
// a versão é a esperada, a home tem título e não mostra erro, e a E-commerce não vaza o SuperDrop (e vice-versa).
// Uso: npm run conferir:producao   (EXPECT_VERSION=<commit curto> confere a versão; SITES=url1,url2 troca a lista;
//      atrás de proxy, NODE_USE_ENV_PROXY=1). Termina com código 1 se algo falhar.
const SITES = (process.env.SITES ?? "https://lojas.nextlevelgroup.com.br,https://superdrop.com.br,https://bras.nextlevelgroup.com.br,https://cargas.nextlevelgroup.com.br,https://nextlevelgroup.com.br/solucoes,https://master.nextlevelgroup.com.br/login").split(",").map((s) => s.trim()).filter(Boolean);
const EXPECT = process.env.EXPECT_VERSION?.trim();
// Palavras que não podem aparecer no texto de cada marca (o que é de outra marca).
const PROIBIDO = {
  "lojas.nextlevelgroup.com.br": [/SuperDrop/i, /\bCentral\b/, /recarga/i, /Loja SuperDrop/i, /Drop manual/i],
  "superdrop.com.br": [/NextLevel E-commerce/i],
};
let falhas = 0;
const ok = (c, m) => { console.log(`${c ? "OK  " : "FALHA"} ${m}`); if (!c) falhas++; };
const texto = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
const t0 = Date.now();
for (const site of SITES) {
  const u = new URL(site);
  const nome = u.host + (u.pathname === "/" ? "" : u.pathname);
  try {
    const res = await fetch(site, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
    const html = await res.text();
    ok(res.status === 200, `${nome}: responde (${res.status})`);
    ok(/<h1[\s>]/i.test(html), `${nome}: tem título principal (h1)`);
    ok(!/Application error|Internal Server Error|Não foi possível carregar esta página/i.test(html), `${nome}: sem tela de erro`);
    const regras = PROIBIDO[u.host] ?? [];
    const t = texto(html);
    for (const re of regras) ok(!re.test(t), `${nome}: sem "${re.source}" no texto`);
    if (u.pathname === "/" || u.pathname === "") {
      const h = await fetch(`${u.origin}/api/health`, { signal: AbortSignal.timeout(20_000) }).then((r) => r.json()).catch(() => null);
      ok(!!h?.ok, `${nome}: /api/health ok${h?.version ? ` (versão ${h.version})` : ""}`);
      if (EXPECT && h) ok(h.version === EXPECT, `${nome}: versão no ar = ${EXPECT}`);
    }
  } catch (e) {
    ok(false, `${nome}: não respondeu (${e.name === "TimeoutError" ? "tempo esgotado" : e.message})`);
  }
}
console.log(`\n${falhas ? `${falhas} falha(s)` : "Tudo certo"} em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(falhas ? 1 : 0);
