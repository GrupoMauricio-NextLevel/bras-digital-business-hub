/**
 * Novidades da base de conhecimento (BC1, D266): lê `docs/design/DECISIONS.md` e gera
 * `src/lib/conhecimento/novidades.json` (as decisões mais recentes, em linguagem curta). Roda antes do build
 * (`prebuild`), porque a imagem de produção não leva a pasta `docs/`. O teste `base-conhecimento` confere se está em dia.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const limpa = (s) => s.replace(/\*\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();

export function novidadesDe(md, quantas = 40) {
  const blocos = md.split(/^## /m).slice(1);
  const out = [];
  for (const b of blocos) {
    const [titulo, ...resto] = b.split("\n");
    const m = /^D(\d+)\s+[—-]\s+(?:\[([^\]]+)\]\s+)?(.+?)(?:\s+\((\d{4}-\d{2}-\d{2})[^)]*\))?\s*$/.exec(titulo.trim());
    if (!m) continue;
    const linhas = resto.map((l) => l.trim()).filter((l) => l && !l.startsWith("|") && !l.startsWith(">")).map((l) => limpa(l.replace(/^[-*]\s+/, "")));
    // Primeira linha; se ela termina em ":" (abre uma lista), junta as próximas até formar um resumo.
    let resumo = linhas[0] ?? "";
    for (let i = 1; resumo.endsWith(":") && i < linhas.length && resumo.length < 200; i++) resumo = `${resumo} ${linhas[i]}`.replace(/:\s/, ": ");
    out.push({ numero: Number(m[1]), frente: m[2] ?? null, titulo: limpa(m[3]), data: m[4] ?? null, resumo: resumo.length > 240 ? `${resumo.slice(0, 237).trimEnd()}…` : resumo });
  }
  return out.sort((a, b) => b.numero - a.numero).slice(0, quantas);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = new URL("..", import.meta.url);
  const md = readFileSync(new URL("docs/design/DECISIONS.md", raiz), "utf8");
  writeFileSync(new URL("src/lib/conhecimento/novidades.json", raiz), `${JSON.stringify(novidadesDe(md), null, 1)}\n`);
  console.log("novidades geradas");
}
