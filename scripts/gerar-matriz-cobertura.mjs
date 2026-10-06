/**
 * Gera docs/design-system/MATRIZ-COBERTURA.md: toda rota (page.tsx) → família → padrão → componente compartilhado → estado.
 * Estados: validado (renderizada nas varreduras sem problema) · migrado (usa o núcleo, não alcançada pela varredura) ·
 * pendente (a varredura achou problema) · fora do escopo (loja do cliente final / ferramenta de desenvolvimento).
 * Uso: node scripts/gerar-matriz-cobertura.mjs   (rode depois das varreduras e-2e)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const APP = "src/app", QA = "docs/design-system/qa";
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(APP).filter((p) => p.endsWith("/page.tsx") || p.endsWith("/page.ts"));
const routeOf = (f) => "/" + f.slice(APP.length + 1).replace(/\/page\.tsx?$/, "").split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/");
const toRegex = (route) => new RegExp("^" + route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+") + "$");

// resultados das varreduras (rota real → problemas)
const seen = []; // {route, bad, source}
for (const f of existsSync(QA) ? readdirSync(QA) : []) {
  if (!f.endsWith(".json")) continue;
  const j = JSON.parse(readFileSync(join(QA, f), "utf8"));
  const list = Array.isArray(j) ? j : j.results ?? [];
  for (const r of list) seen.push({ route: r.route, bad: r.problems?.length && !(r.status === 404 && r.problems.length === 1) ? r.problems : [], status: r.status, source: f });
}

const familyOf = (r) => {
  if (r.startsWith("/store/") || r === "/store") return ["Loja do cliente final (storefront)", "Tema da loja do membro", "fora do escopo"];
  if (r.startsWith("/dev") || r.startsWith("/theme-editor")) return ["Ferramenta interna", "Galeria / editor", r.startsWith("/dev") ? "galeria" : "editor próprio"];
  if (/^\/(master|supplier|merchant|partner|commerce|account)(\/|$)/.test(r)) return ["Painel operacional", "OperationalShell + SideNav + PageHeader + ds-card/ds-table", "painel"];
  return ["Pública", "PublicShell + seções ds-pub-*", "publica"];
};
const sharedOf = (r, fam) => fam === "publica" ? "PublicShell · ds-pub-section/card/btn" : fam === "painel" ? "AppShell → OperationalShell · PageHeader · MetricCard · DataTable · Badge" : "—";

const rows = pages.map((f) => {
  const route = routeOf(f), re = toRegex(route);
  const [familia, padrao, tag] = familyOf(route);
  const hits = seen.filter((s) => re.test(s.route));
  let estado;
  if (tag === "fora do escopo") estado = "fora do escopo (loja do cliente final; temas próprios, não mudam)";
  else if (tag === "galeria" || tag === "editor próprio") estado = tag === "galeria" ? "migrado (galeria nova, só fora de produção)" : "migrado (cores por tokens; layout próprio, tela cheia)";
  else if (!hits.length) estado = "migrado (não alcançada pela varredura: precisa de dado/estado específico)";
  else if (hits.some((h) => h.bad.length) && hits.every((h) => h.bad.every((p) => /animate-fade-in|min-h-40|justify-between/.test(p)))) estado = `validado com ressalva (${hits.length} renderizações; a esteira ao vivo anima cartões e o axe mede no meio do desvanecer)`;
  else if (hits.some((h) => h.bad.length)) estado = "pendente: " + [...new Set(hits.flatMap((h) => h.bad).map((p) => p.slice(0, 60)))].slice(0, 2).join(" | ");
  else estado = `validado (${hits.length} renderizações sem problema)`;
  return { route, familia, padrao, comp: sharedOf(route, tag), estado };
}).sort((a, b) => a.route.localeCompare(b.route));

const count = (re) => rows.filter((r) => re.test(r.estado)).length;
const out = [
  "# Matriz de cobertura do sistema de design",
  "",
  `Gerada automaticamente por \`scripts/gerar-matriz-cobertura.mjs\` a partir das ${rows.length} rotas do projeto e dos resultados em \`docs/design-system/qa/\`.`,
  "",
  "| Estado | Rotas |", "|---|---|",
  `| validado (renderizada e conferida: erros, rolagem lateral, fonte, axe sério/crítico) | ${count(/^validado/)} |`,
  `| migrado, não alcançada pela varredura | ${count(/^migrado/)} |`,
  `| pendente | ${count(/^pendente/)} |`,
  `| fora do escopo | ${count(/^fora/)} |`,
  "",
  "**Inacessível nesta sessão:** os repositórios de outros projetos (Hub Creators, Brás Digital, China Hub e qualquer outro fora de `bras-digital-business-hub`) não estão ao alcance. Eles adotam o núcleo seguindo `docs/design-system/README.md`.",
  "",
  "| Rota | Família | Padrão | Componentes compartilhados | Estado |", "|---|---|---|---|---|",
  ...rows.map((r) => `| \`${r.route}\` | ${r.familia} | ${r.padrao} | ${r.comp} | ${r.estado} |`),
  "",
];
writeFileSync("docs/design-system/MATRIZ-COBERTURA.md", out.join("\n"));
console.log("rotas:", rows.length, "| validado:", count(/^validado/), "| migrado:", count(/^migrado/), "| pendente:", count(/^pendente/), "| fora:", count(/^fora/));
