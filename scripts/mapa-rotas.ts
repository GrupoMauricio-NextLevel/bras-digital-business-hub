/**
 * Fase 1 do mapa (D147): inventário de todos os endereços do sistema, quem leva a cada um, teste página × endereço e varredura dos
 * links das páginas públicas. Só LÊ (GET); nada é mudado.
 *
 *   npx tsx scripts/mapa-rotas.ts [saida.json]
 *
 * Endereços testados: MAPA_BASES='{"NEXTLEVEL":"http://127.0.0.3:3300",...}' (padrão: servidor local nas portas do guia
 * docs/mapa/AVALIACAO-LINKS-2026-10.md). Gera docs/mapa/rotas.csv e, se pedido, o JSON completo para o relatório.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { listAppRoutes } from "../src/lib/domain/qualidade";
import { describeRoutes, routeFromFile } from "../src/lib/qualidade/rotas";
import { MAP_HOSTS, MAP_HOST_LABEL, cellState, followChain, expectedAt, isMenuRoute, misplaced, sectionOf, type CellState, type MapHost } from "../src/lib/qualidade/mapa";

const BASES: Record<MapHost, string> = process.env.MAPA_BASES ? JSON.parse(process.env.MAPA_BASES) : {
  NEXTLEVEL: "http://127.0.0.3:3300", SUPERDROP: "http://localhost:3300", NEXTLEVEL_COMMERCE: "http://127.0.0.2:3300", BRAS_DIGITAL: "http://127.0.0.1:3300", NEXTLEVEL_CARGAS: "http://127.0.0.4:3300",
};
const PROD: Record<MapHost, string> = { NEXTLEVEL: "master.nextlevelgroup.com.br", SUPERDROP: "superdrop.com.br", NEXTLEVEL_COMMERCE: "lojas.nextlevelgroup.com.br", BRAS_DIGITAL: "bras.nextlevelgroup.com.br", NEXTLEVEL_CARGAS: "cargas.nextlevelgroup.com.br" };
const SAMPLE: Record<string, string> = {
  "/store/[slug]": "/store/mrs-sports", "/store/[slug]/catalog": "/store/mrs-sports/catalog", "/store/[slug]/cart": "/store/mrs-sports/cart", "/store/[slug]/checkout": "/store/mrs-sports/checkout",
  "/store/[slug]/acompanhar": "/store/mrs-sports/acompanhar", "/f/[slug]": "/f/mantosshop", "/solucoes/[slug]": "/solucoes/commerce-pro", "/temas/[key]": "/temas/lume",
};
const AUDIENCE: Record<string, string> = {
  master: "dono e equipe NextLevel", "commerce-admin": "equipe NextLevel", "estudio-bras": "equipe NextLevel", fornecedor: "fornecedor", expedicao: "expedição do fornecedor",
  lojista: "lojista", parceiro: "parceiro", "membro-bras": "membro Brás", importadora: "importadora", transportadora: "transportadora / ônibus", conta: "qualquer pessoa logada",
  vitrines: "cliente final das lojas", publicas: "visitante", privadas: "quem recebe o link", demo: "demonstração",
};

const ROOT = process.cwd();
const walk = (d: string, out: string[] = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== "node_modules") walk(p, out); } else out.push(p); } return out; };

// 1. Inventário ------------------------------------------------------------------------------------------------------------
const routes = describeRoutes(listAppRoutes());
const handlers = walk(join(ROOT, "src/app")).filter((f) => /\/route\.tsx?$/.test(f)).map((f) => "/" + relative(join(ROOT, "src/app"), dirname(f)).split("/").filter((s) => !(s.startsWith("(") && s.endsWith(")"))).join("/"));
const shortcuts = [
  { path: "/lojas", what: "Liga a prévia da Commerce em qualquer endereço (cookie nl-brand) e volta ao início", where: "src/proxy.ts" },
  { path: "/lojas/sair", what: "Desliga a prévia da Commerce", where: "src/proxy.ts" },
  { path: "/loja/<nome>", what: "Apelido da vitrine /store/<nome>", where: "src/lib/host-routing.ts" },
  { path: "<loja>.superdrop.com.br", what: "Subdomínio da loja (só com SUPERDROP_ROOT_DOMAIN)", where: "src/proxy.ts" },
  { path: "/f/<nome>, /loja/<nome>, /afiliado no escritório", what: "Atalhos de convite que levam ao login (só com endereço de escritório ligado)", where: "src/lib/host-routing.ts" },
];

// 2. Quem leva a cada página: menus, código (links, redirecionamentos, e-mails) ------------------------------------------------
const pattern = (r: string) => new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+") + "$");
const pats = routes.map((r) => ({ route: r.route, re: pattern(r.route) }));
const codeRefs = new Map<string, Set<string>>();
for (const f of walk(join(ROOT, "src")).filter((x) => /\.(ts|tsx)$/.test(x))) {
  const rel = relative(ROOT, f);
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(/["'`](\/[A-Za-z0-9\-_/${}.\[\]]*)/g)) {
    const raw = m[1]!.replace(/\$\{[^}]*\}/g, "x").replace(/\/+$/, "") || "/";
    if (raw.length < 2 && raw !== "/") continue;
    for (const p of pats) if (p.re.test(raw)) {
      const own = rel.startsWith("src/app/") && routeFromFile(relative("src/app", rel)) === p.route;
      if (!own) { if (!codeRefs.has(p.route)) codeRefs.set(p.route, new Set()); codeRefs.get(p.route)!.add(rel); }
    }
  }
}

async function main() {
// 3. Página × endereço ------------------------------------------------------------------------------------------------------
type Cell = { state: CellState; status: number | null; hops: string[]; final: string | null; misplaced: string | null };
const pool = async <T, R>(xs: T[], n: number, fn: (x: T) => Promise<R>) => { const out: R[] = new Array(xs.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < xs.length) { const k = i++; out[k] = await fn(xs[k]!); } })); return out; };
const pathOf = (route: string) => (route.includes("[") ? SAMPLE[route] ?? null : route);
const matrix = new Map<string, Record<MapHost, Cell> | null>();
const jobs = routes.flatMap((r) => { const p = pathOf(r.route); return p ? MAP_HOSTS.map((h) => ({ r, h, p })) : []; });
const cells = await pool(jobs, 8, async ({ r, h, p }) => { const c = await followChain(fetch, BASES[h] + p, 4, 60_000); const state = cellState(c, p); return { r, h, cell: { state, status: c.status, hops: c.hops, final: c.finalPath, misplaced: misplaced(r.route, h, state, r.area.kind) } as Cell }; });
for (const r of routes) matrix.set(r.route, pathOf(r.route) ? ({} as Record<MapHost, Cell>) : null);
for (const { r, h, cell } of cells) matrix.get(r.route)![h] = cell;

// 4. Varredura dos links das páginas públicas -------------------------------------------------------------------------------
type Link = { from: string; host: MapHost; to: string; toHost: MapHost | null; external: boolean };
const links: Link[] = [];
const hostByProd = Object.fromEntries(Object.entries(PROD).map(([k, v]) => [v, k as MapHost])) as Record<string, MapHost>;
const publicCells = cells.filter((c) => c.cell.state === "ABRE" && (c.r.area.kind === "PUBLICA" || c.r.area.kind === "PRIVADA"));
await pool(publicCells, 6, async ({ r, h }) => {
  const html = await (await fetch(BASES[h] + pathOf(r.route)!, { signal: AbortSignal.timeout(60_000) })).text().catch(() => "");
  for (const m of html.matchAll(/href="([^"#]+)/g)) {
    const href = m[1]!.replace(/&amp;/g, "&");
    if (/^\/(_next|api|assets|og|portal|brand|temas\/.*\.(png|webp|avif)|ilustracoes|favicon)/.test(href) || /\.(png|jpg|webp|avif|svg|ico|css|js|xml|txt|pdf)(\?|$)/.test(href)) continue;
    if (href.startsWith("/")) links.push({ from: r.route, host: h, to: href.split("?")[0]!, toHost: h, external: false });
    else if (/^https?:\/\//.test(href)) { const u = new URL(href); const th = hostByProd[u.host.replace(/^www\./, "")] ?? null; if (th) links.push({ from: r.route, host: h, to: u.pathname, toHost: th, external: th !== h }); }
  }
});
const uniq = new Map<string, Link[]>();
for (const l of links) { const k = `${l.toHost}${l.to}`; uniq.set(k, [...(uniq.get(k) ?? []), l]); }
const linkResults = await pool([...uniq.entries()], 8, async ([k, ls]) => {
  const l = ls[0]!;
  const c = await followChain(fetch, BASES[l.toHost!] + l.to, 4, 60_000);
  return { target: `${MAP_HOST_LABEL[l.toHost!]} ${l.to}`, to: l.to, toHost: l.toHost, state: cellState(c, l.to), hops: c.hops, status: c.status, sources: [...new Set(ls.map((x) => `${MAP_HOST_LABEL[x.host]} ${x.from}`))], crossBrand: ls.some((x) => x.external), key: k };
});
const inboundFromPages = new Map<string, number>();
for (const l of links) for (const p of pats) if (p.re.test(l.to)) inboundFromPages.set(p.route, (inboundFromPages.get(p.route) ?? 0) + 1);

// 5. Saídas -----------------------------------------------------------------------------------------------------------------
const csvEsc = (v: unknown) => { const s = String(v ?? ""); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const rows = routes.map((r) => {
  const m = matrix.get(r.route);
  const sec = sectionOf(r.route);
  const states = MAP_HOSTS.map((h) => (m ? `${m[h].state}${m[h].hops.length > 1 ? `(${m[h].hops.length} saltos)` : ""}` : "precisa de exemplo"));
  const bad = m ? MAP_HOSTS.map((h) => m[h].misplaced && `${MAP_HOST_LABEL[h]}: ${m[h].misplaced}`).filter(Boolean) : [];
  const refs = codeRefs.get(r.route)?.size ?? 0;
  const inbound = inboundFromPages.get(r.route) ?? 0;
  const orphan = !isMenuRoute(r.route) && refs === 0 && inbound === 0 && r.area.kind !== "PRIVADA";
  return { route: r.route, label: r.label, area: r.area.label, kind: r.area.kind, audience: AUDIENCE[r.area.key] ?? "", section: sec.section, inMenu: isMenuRoute(r.route), refs, inbound, orphan, states, bad, expected: MAP_HOSTS.map((h) => expectedAt(r.route, h, r.area.kind).kind) };
});
mkdirSync(join(ROOT, "docs/mapa"), { recursive: true });
writeFileSync(join(ROOT, "docs/mapa/rotas.csv"), [
  ["rota", "nome", "area", "tipo", "publico", "secao", "no_menu", "refs_no_codigo", "links_de_paginas", "orfa", ...MAP_HOSTS.map((h) => `em_${MAP_HOST_LABEL[h].toLowerCase()}`), "fora_do_lugar"].join(","),
  ...rows.map((r) => [r.route, r.label, r.area, r.kind, r.audience, r.section, r.inMenu ? "sim" : "não", r.refs, r.inbound, r.orphan ? "sim" : "não", ...r.states, r.bad.join(" | ")].map(csvEsc).join(",")),
].join("\n") + "\n");
const out = process.argv[2];
if (out) writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), routes: rows, handlers, shortcuts, links: linkResults, totals: { pages: routes.length, handlers: handlers.length, links: links.length, uniqueLinks: uniq.size } }, null, 1));
console.log(`${routes.length} telas · ${handlers.length} rotas de arquivo · ${links.length} links lidos (${uniq.size} destinos) · CSV em docs/mapa/rotas.csv`);
}
main().catch((e) => { console.error(e); process.exit(1); });
