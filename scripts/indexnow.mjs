/**
 * Avisa os buscadores do IndexNow (Bing, Yandex e outros) das páginas do sitemap (D293). Rodar depois de cada publicação
 * que mude páginas públicas:  node scripts/indexnow.mjs [https://nextlevelcommerce.com.br]
 * Só lê o sitemap público e envia a lista de endereços; nenhum dado de cliente.
 */
const CHAVE = "8b91d0d4db147bd569f54cb8cace1b1c"; // igual a src/lib/seo/indexnow.ts (o teste seo-paginas confere)
const base = (process.argv[2] ?? "https://nextlevelcommerce.com.br").replace(/\/$/, "");
const host = new URL(base).hostname;

const chave = await fetch(`${base}/${CHAVE}.txt`).then((r) => (r.ok ? r.text() : ""));
if (chave.trim() !== CHAVE) { console.error(`A chave não está publicada em ${base}/${CHAVE}.txt. Publique antes de avisar.`); process.exit(1); }
const xml = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => new URL(u).hostname === host))];
if (!urls.length) { console.error("Sitemap vazio: nada a avisar."); process.exit(1); }
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST", headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: CHAVE, keyLocation: `${base}/${CHAVE}.txt`, urlList: urls.slice(0, 10_000) }),
});
console.log(`IndexNow: ${urls.length} endereços de ${host} → resposta ${r.status} ${r.status === 200 || r.status === 202 ? "(aceito)" : await r.text()}`);
process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
