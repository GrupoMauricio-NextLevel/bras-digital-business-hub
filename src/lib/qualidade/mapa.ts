import type { BrandCode } from "@/lib/brand";
import { BRAS_ADMIN_NAV, COMMERCE_ADMIN_NAV, COMMERCE_STORE_NAV, NAV, type NavItem } from "@/lib/nav";
import { areaOf, labelOf, type QaKind } from "./rotas";

/**
 * Mapa vivo (D147): a mesma página testada em cada endereço no ar, seguindo os redirecionamentos até o fim, e as regras de
 * "onde cada página deve morar" já decididas pelo dono (12/10/2026). Arquivo puro: serve o servidor, a tela e o script da Fase 1.
 * Regras de painéis e páginas do grupo: D149 (proposta aceita). O que ainda não foi decidido fica "a definir", nunca inventado.
 */
export const MAP_HOSTS = ["NEXTLEVEL", "SUPERDROP", "NEXTLEVEL_COMMERCE", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS"] as const;
export type MapHost = (typeof MAP_HOSTS)[number];
export const MAP_HOST_LABEL: Record<MapHost, string> = { NEXTLEVEL: "Master", SUPERDROP: "SuperDrop", NEXTLEVEL_COMMERCE: "Commerce", BRAS_DIGITAL: "Brás", NEXTLEVEL_CARGAS: "Cargas" };
export const cellKey = (route: string, host: string) => `${route}@${host}`;

// ---- Seguir um endereço até o fim -------------------------------------------------------------------------------------
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export type Chain = { status: number | null; finalPath: string | null; hops: string[]; ms: number; error: string | null };

/** GET sem seguir sozinho; segue até `max` redirecionamentos e devolve o caminho percorrido (só o caminho, sem domínio). */
export async function followChain(fetcher: Fetcher, url: string, max = 4, timeoutMs = 15_000): Promise<Chain> {
  const t0 = Date.now();
  const hops: string[] = [];
  let current = url;
  try {
    for (let i = 0; i <= max; i++) {
      const res = await fetcher(current, { redirect: "manual", headers: { accept: "text/html" }, signal: AbortSignal.timeout(timeoutMs) });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current);
        hops.push(next.origin === new URL(url).origin ? next.pathname : `${next.host}${next.pathname}`);
        current = next.toString();
        continue;
      }
      const fin = new URL(current);
      return { status: res.status, finalPath: fin.origin === new URL(url).origin ? fin.pathname : `${fin.host}${fin.pathname}`, hops, ms: Date.now() - t0, error: null };
    }
    return { status: null, finalPath: null, hops, ms: Date.now() - t0, error: "redirecionamentos demais" };
  } catch (e) {
    return { status: null, finalPath: null, hops, ms: Date.now() - t0, error: (e as Error).name === "TimeoutError" ? "não respondeu a tempo" : "falhou ao abrir" };
  }
}

export type CellState = "ABRE" | "LOGIN" | "INICIO" | "OUTRO" | "404" | "ERRO";
/** Resumo de uma célula (página × endereço) para a tela. */
export function cellState(c: Pick<Chain, "status" | "finalPath" | "hops" | "error">, path: string): CellState {
  if (c.error || c.status === null) return "ERRO";
  if (c.status === 404) return "404";
  if (c.status >= 400) return "ERRO";
  if (!c.hops.length) return "ABRE";
  const fin = (c.finalPath ?? "").split("?")[0]!;
  if (fin === "/login") return "LOGIN";
  if (fin === "/" || fin === "") return path === "/" ? "ABRE" : "INICIO";
  return "OUTRO";
}
export const CELL_LABEL: Record<CellState, string> = { ABRE: "abre", LOGIN: "pede login", INICIO: "volta ao início", OUTRO: "vai para outra página", "404": "não existe (404)", ERRO: "erro" };

// ---- Onde cada página deve morar (decisões do dono de 12/10/2026, D147) -------------------------------------------------
export type Expect = { kind: "DEVE_ABRIR" | "NAO_DEVE" | "A_DEFINIR"; why: string };
const GROUP_SITE = ["/solucoes", "/loja-nextlevel", "/club", "/meu-contador"];
const GROUP_LEGAL = ["/termos", "/privacidade"];
const under = (r: string, p: string) => r === p || r.startsWith(`${p}/`);

// Painéis (D149, recomendação aceita pelo dono): os da equipe só no Master; os dos clientes no endereço da marca deles (e no Master, para o suporte).
const TEAM_PANELS = ["/master", "/commerce", "/bras"];
const CLIENT_PANEL_HOME: { prefix: string; hosts: MapHost[] }[] = [
  { prefix: "/meu-bras", hosts: ["BRAS_DIGITAL"] }, { prefix: "/importadora", hosts: ["BRAS_DIGITAL"] }, { prefix: "/transportadora", hosts: ["NEXTLEVEL_CARGAS"] },
  { prefix: "/merchant", hosts: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] }, { prefix: "/supplier", hosts: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] },
  { prefix: "/partner", hosts: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] }, { prefix: "/theme-editor", hosts: ["SUPERDROP", "NEXTLEVEL_COMMERCE"] },
];

function panelExpect(route: string, host: MapHost): Expect {
  if (TEAM_PANELS.some((p) => under(route, p))) return host === "NEXTLEVEL"
    ? { kind: "DEVE_ABRIR", why: "Painel da equipe NextLevel: mora no Master (D149)." }
    : { kind: "NAO_DEVE", why: "Painel da equipe NextLevel fora do Master: deveria levar ao Master (D149)." };
  const home = CLIENT_PANEL_HOME.find((x) => under(route, x.prefix));
  if (!home) return { kind: "DEVE_ABRIR", why: "Entrada e conta: abrem em qualquer endereço." };
  if (host === "NEXTLEVEL" || home.hosts.includes(host)) return { kind: "DEVE_ABRIR", why: "Painel do cliente no endereço da marca dele (ou no Master, para o suporte) (D149)." };
  if (home.hosts.length > 1) return { kind: "A_DEFINIR", why: "Painel de lojista no endereço da Brás ou da Cargas: a conta é recusada no login; não há uma marca de destino única." };
  return { kind: "NAO_DEVE", why: "Painel do cliente no endereço de outra marca: deveria levar ao endereço da marca dele (D149)." };
}

export function expectedAt(route: string, host: MapHost, kind: QaKind = areaOf(route).kind): Expect {
  if (kind === "PAINEL") return panelExpect(route, host);
  if (GROUP_SITE.some((p) => under(route, p))) return host === "NEXTLEVEL"
    ? { kind: "DEVE_ABRIR", why: "Site do grupo (NextLevel Business): mora no endereço do grupo; até a Fase 3, no do Master (D149)." }
    : { kind: "NAO_DEVE", why: "É da NextLevel Business: deveria levar ao site do grupo (D149)." };
  if (GROUP_LEGAL.includes(route)) return { kind: "DEVE_ABRIR", why: "Termos e privacidade: um texto do grupo inteiro, presente em todas as marcas e no endereço do grupo (decisão de 12/10)." };
  if (kind === "DEMO") return { kind: "A_DEFINIR", why: "Só existe no ambiente de demonstração." };
  if (host === "NEXTLEVEL" && route !== "/login" && route !== "/esqueci-senha" && !under(route, "/redefinir-senha")) return { kind: "NAO_DEVE", why: "O Master é só painéis e entrada." };
  return { kind: "A_DEFINIR", why: "Casa definitiva na Fase 2 (reorganização)." };
}

/** Uma célula está "fora do lugar" quando contraria uma decisão já tomada. */
export function misplaced(route: string, host: MapHost, state: CellState, kind: QaKind = areaOf(route).kind): string | null {
  const e = expectedAt(route, host, kind);
  if (e.kind === "DEVE_ABRIR" && (state === "404" || state === "ERRO" || state === "INICIO" || (kind === "PAINEL" && state === "OUTRO"))) return e.why;
  if (e.kind === "NAO_DEVE" && (state === "ABRE" || (kind === "PAINEL" && state === "LOGIN"))) return e.why;
  return null;
}

// ---- Seção de cada página (o grupo do menu onde ela aparece) ----------------------------------------------------------
const MENUS: { items: NavItem[] }[] = [...Object.values(NAV), { items: COMMERCE_STORE_NAV }, { items: COMMERCE_ADMIN_NAV }, { items: BRAS_ADMIN_NAV }];
const MENU_ITEMS = MENUS.flatMap((m) => m.items).map((i) => ({ href: i.href.split("#")[0]!, group: i.group ?? "Principal", label: i.label }));
/** Nome das seções fora dos menus (primeira parte do endereço). */
const SECTION_NAME: Record<string, string> = {
  f: "Páginas de fornecedor", store: "Vitrines", d: "Descobertas compartilhadas", balcao: "Balcão", "balcao-club": "Balcão do Club", motorista: "Motorista",
  "redefinir-senha": "Recuperar senha", "loja-nextlevel": "Loja NextLevel", solucoes: "NextLevel Business", parceiros: "Programa de Parceiros", temas: "Temas",
  dev: "Ferramentas de design", demo: "Demonstrações", gravacao: "Estúdio de gravação",
};
/** Grupo do menu que leva à página (o endereço de menu mais longo que contém a página); sem menu, a primeira parte do endereço. */
export function sectionOf(route: string): { section: string; inMenu: boolean } {
  const hit = MENU_ITEMS.filter((i) => route === i.href || (i.href.split("/").length > 2 && route.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
  if (hit) return { section: hit.group, inMenu: route === hit.href };
  const seg = route.split("/").filter(Boolean)[0];
  if (!seg) return { section: "Página inicial", inMenu: false };
  // Telas de painel sem item de menu (endereços antigos, telas de detalhe): ficam juntas, fáceis de achar.
  return { section: SECTION_NAME[seg] ?? (route.split("/").length > 2 ? "Fora do menu" : labelOf(`/${seg}`)), inMenu: false };
}
export const isMenuRoute = (route: string) => MENU_ITEMS.some((i) => i.href === route);
export type { BrandCode };

// ---- Árvore do Mapa vivo -----------------------------------------------------------------------------------------------
export type TreeCell = { state: CellState; misplaced: string | null; hops: string[] };
export type TreePage = { route: string; label: string; areaKey: string; areaLabel: string; kind: QaKind; tested: boolean; approved: boolean; problem: boolean; cells: Partial<Record<MapHost, TreeCell>> };
export type TreeCounts = { total: number; tested: number; approved: number; problem: number; misplaced: number; failed: number; unchecked: number };
export type TreeNode = { key: string; label: string; depth: number; children: TreeNode[]; pages: TreePage[]; counts: TreeCounts; routes: string[] };

const GROUPS: { kind: QaKind; label: string }[] = [
  { kind: "PAINEL", label: "Painéis" }, { kind: "PUBLICA", label: "Páginas públicas e vitrines" },
  { kind: "PRIVADA", label: "Links privados" }, { kind: "DEMO", label: "Só na demonstração" },
];
export const pageMisplaced = (p: TreePage) => Object.values(p.cells).some((c) => c?.misplaced);
export const pageFailed = (p: TreePage) => Object.values(p.cells).some((c) => c?.state === "ERRO");
export const pageUnchecked = (p: TreePage) => !Object.keys(p.cells).length;

function count(pages: TreePage[]): TreeCounts {
  return {
    total: pages.length, tested: pages.filter((p) => p.tested).length, approved: pages.filter((p) => p.approved).length, problem: pages.filter((p) => p.problem).length,
    misplaced: pages.filter(pageMisplaced).length, failed: pages.filter(pageFailed).length, unchecked: pages.filter(pageUnchecked).length,
  };
}

/** Grupo (tipo de página) → área → seção do menu → páginas, com contadores em cada galho. Galhos vazios não aparecem. */
export function buildMapTree(pages: TreePage[]): TreeNode[] {
  const node = (key: string, label: string, depth: number, children: TreeNode[], own: TreePage[]): TreeNode => {
    const all = [...own, ...children.flatMap(function rec(c): TreePage[] { return [...c.pages, ...c.children.flatMap(rec)]; })];
    return { key, label, depth, children, pages: own, counts: count(all), routes: all.map((p) => p.route) };
  };
  return GROUPS.map((g) => {
    const inGroup = pages.filter((p) => p.kind === g.kind);
    const areas = [...new Map(inGroup.map((p) => [p.areaKey, p.areaLabel])).entries()].map(([ak, al]) => {
      const inArea = inGroup.filter((p) => p.areaKey === ak);
      const sections = [...new Set(inArea.map((p) => sectionOf(p.route).section))].map((sec) =>
        node(`${g.kind}/${ak}/${sec}`, sec, 2, [], inArea.filter((p) => sectionOf(p.route).section === sec).sort((a, b) => a.route.localeCompare(b.route))));
      return node(`${g.kind}/${ak}`, al, 1, sections, []);
    });
    return node(g.kind, g.label, 0, areas, []);
  }).filter((n) => n.counts.total > 0);
}

/** Mapa mental (Mermaid) da árvore, para colar num editor de diagramas. */
export function mermaidOf(nodes: TreeNode[], maxPages = 12): string {
  const esc = (s: string) => s.replace(/[()[\]{}"]/g, " ").trim();
  const out = ["mindmap", "  root((Sistema NextLevel))"];
  const walk = (n: TreeNode, ind: string) => {
    out.push(`${ind}${esc(n.label)} · ${n.counts.total}${n.counts.misplaced ? ` · ${n.counts.misplaced} fora do lugar` : ""}`);
    for (const c of n.children) walk(c, `${ind}  `);
    for (const p of n.pages.slice(0, maxPages)) out.push(`${ind}  ${esc(p.label)}${pageMisplaced(p) ? " ⚠" : ""}`);
    if (n.pages.length > maxPages) out.push(`${ind}  e mais ${n.pages.length - maxPages}`);
  };
  for (const n of nodes) walk(n, "    ");
  return out.join("\n");
}
