import { BRAS_ADMIN_NAV, COMMERCE_ADMIN_NAV, COMMERCE_STORE_NAV, NAV } from "@/lib/nav";
import type { BrandCode } from "@/lib/brand";

/**
 * Central de qualidade (D142): o mapa de todas as telas do sistema, montado a partir dos arquivos `page.tsx`
 * (tela nova aparece sozinha). Arquivo puro: classifica cada endereço por área, diz em que domínio abrir, como entrar
 * e o que a checagem automática espera (página pública responde; painel sem login manda para a entrada).
 */
export type QaKind = "PUBLICA" | "PAINEL" | "PRIVADA" | "DEMO";
/** `host`: onde abrir. Painéis abrem no endereço do Master (onde está a sua sessão e o modo suporte); páginas públicas, no da marca. */
export type QaArea = { key: string; label: string; host: BrandCode; kind: QaKind; access: string };

export const QA_AREAS: QaArea[] = [
  { key: "master", label: "Master", host: "NEXTLEVEL", kind: "PAINEL", access: "Direto, com o seu login de dono." },
  { key: "commerce-admin", label: "Admin Commerce", host: "NEXTLEVEL", kind: "PAINEL", access: "Direto, com o seu login de dono." },
  { key: "estudio-bras", label: "Estúdio Brás", host: "NEXTLEVEL", kind: "PAINEL", access: "Direto, com o seu login de dono." },
  { key: "fornecedor", label: "Fornecedor", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: em Clientes e suporte, entre como um fornecedor." },
  { key: "expedicao", label: "Expedição", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como alguém da expedição." },
  { key: "lojista", label: "Lojista", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como um lojista (SuperDrop ou Commerce; o painel muda conforme a loja)." },
  { key: "parceiro", label: "Parceiro", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como um parceiro." },
  { key: "membro-bras", label: "Membro Brás", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como um membro da Brás." },
  { key: "importadora", label: "Importadora", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como alguém de uma importadora." },
  { key: "transportadora", label: "Transportadora", host: "NEXTLEVEL", kind: "PAINEL", access: "Modo suporte: entre como uma transportadora ou ônibus." },
  { key: "conta", label: "Conta", host: "NEXTLEVEL", kind: "PAINEL", access: "Qualquer pessoa logada." },
  { key: "vitrines", label: "Vitrines das lojas", host: "SUPERDROP", kind: "PUBLICA", access: "Sem login. Informe o endereço de uma loja no exemplo." },
  { key: "publicas", label: "Páginas públicas", host: "SUPERDROP", kind: "PUBLICA", access: "Sem login. Abra em cada marca pelo seletor de domínio." },
  { key: "privadas", label: "Links privados", host: "SUPERDROP", kind: "PRIVADA", access: "Só com o link enviado (código no endereço): cole um link real no exemplo." },
  { key: "demo", label: "Só na demonstração", host: "NEXTLEVEL", kind: "DEMO", access: "Existe só no ambiente de demonstração." },
];
const AREA = Object.fromEntries(QA_AREAS.map((a) => [a.key, a])) as Record<string, QaArea>;

const PRIVATE = [/^\/balcao(-club)?\//, /^\/motorista\//, /^\/redefinir-senha\//, /^\/d\//, /^\/loja-nextlevel\/pedido\//, /^\/store\/\[slug\]\/(proposta|order)\//];
const under = (r: string, p: string) => r === p || r.startsWith(`${p}/`);

/** Área de um endereço (o mais específico vence). */
export function areaOf(route: string): QaArea {
  if (under(route, "/dev") || under(route, "/demo")) return AREA.demo!;
  if (PRIVATE.some((re) => re.test(route))) return AREA.privadas!;
  if (under(route, "/master")) return AREA.master!;
  if (under(route, "/commerce")) return AREA["commerce-admin"]!;
  if (under(route, "/bras")) return AREA["estudio-bras"]!;
  if (under(route, "/supplier/dispatch")) return AREA.expedicao!;
  if (under(route, "/supplier")) return AREA.fornecedor!;
  if (under(route, "/merchant") || under(route, "/theme-editor")) return AREA.lojista!;
  if (under(route, "/partner")) return AREA.parceiro!;
  if (under(route, "/meu-bras")) return AREA["membro-bras"]!;
  if (under(route, "/importadora")) return AREA.importadora!;
  if (under(route, "/transportadora")) return AREA.transportadora!;
  if (under(route, "/account")) return AREA.conta!;
  if (under(route, "/store") || under(route, "/f")) return AREA.vitrines!;
  return AREA.publicas!;
}

/** Arquivo `page.tsx` (relativo a `src/app`) → endereço. Grupos `(x)` somem; partes `[x]` ficam. */
export function routeFromFile(rel: string): string | null {
  const parts = rel.replace(/\\/g, "/").split("/");
  if (parts.pop() !== "page.tsx") return null;
  const segs = parts.filter((s) => s && !(s.startsWith("(") && s.endsWith(")")) && !s.startsWith("@") && !s.startsWith("_"));
  if (segs.some((s) => s === "api")) return null;
  return `/${segs.join("/")}`;
}

/** Partes variáveis do endereço (`[slug]`, `[id]`…). */
export const paramsOf = (route: string) => [...route.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]!);

/**
 * Endereço com o exemplo preenchido. O exemplo pode ser o endereço inteiro (cola um link real) ou só os valores, na
 * ordem das partes variáveis, separados por "/" (ex.: `mantos-shop/camisa-azul`). Sem exemplo: `null`.
 */
export function fillRoute(route: string, sample: string | null | undefined): string | null {
  const ps = paramsOf(route);
  if (!ps.length) return route;
  const s = (sample ?? "").trim();
  if (!s) return null;
  if (s.startsWith("/")) return s;
  if (/^https?:\/\//.test(s)) { try { const u = new URL(s); return u.pathname + u.search; } catch { return null; } }
  const vals = s.split("/").map((v) => v.trim()).filter(Boolean);
  if (vals.length < ps.length) return null;
  let i = 0;
  return route.replace(/\[[^\]]+\]/g, () => encodeURIComponent(vals[i++]!));
}

const NAV_LABELS: Map<string, string> = (() => {
  const m = new Map<string, string>();
  const add = (href: string, label: string) => { const h = href.split(/[?#]/)[0]!; if (!m.has(h)) m.set(h, label); };
  for (const r of Object.values(NAV)) { for (const i of r.items) add(i.href, i.label); for (const q of r.quick) add(q.href, q.label); }
  for (const i of [...COMMERCE_STORE_NAV, ...COMMERCE_ADMIN_NAV, ...BRAS_ADMIN_NAV]) add(i.href, i.label);
  return m;
})();
const EXTRA: Record<string, string> = {
  "/": "Página inicial", "/login": "Entrada (login)", "/cadastro": "Criar conta", "/ativar": "Ativação de outra marca", "/account/marcas": "Suas marcas", "/account/password": "Trocar a senha",
  "/master/financeiro/precos": "Preços do grupo", "/master/financeiro/descoberta": "Descoberta", "/master/financeiro/proposta": "Proposta de preço", "/master/financeiro/experimentos": "Experimentos",
  "/master/financeiro/ofertas": "Ofertas e comissões", "/master/qualidade": "Central de qualidade", "/store/[slug]": "Vitrine da loja", "/f/[slug]": "Página do fornecedor",
};
const nice = (seg: string) => (seg.startsWith("[") ? `(${seg.slice(1, -1)})` : seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));

/** Nome da tela: o do menu quando existe; senão, a última parte do endereço em português legível. */
export function labelOf(route: string): string {
  const known = EXTRA[route] ?? NAV_LABELS.get(route);
  if (known) return known;
  const segs = route.split("/").filter(Boolean);
  if (!segs.length) return "Página inicial";
  const last = segs[segs.length - 1]!;
  return last.startsWith("[") && segs.length > 1 ? `${nice(segs[segs.length - 2]!)} ${nice(last)}` : nice(last);
}

/** Telas que só existem numa marca: abrem e são checadas no endereço dela (nas outras respondem 404 de propósito). */
const ROUTE_HOST: Record<string, BrandCode> = { "/termos": "BRAS_DIGITAL", "/privacidade": "BRAS_DIGITAL" };
export const hostOf = (route: string): BrandCode => ROUTE_HOST[route] ?? areaOf(route).host;

export type QaRoute = { route: string; label: string; area: QaArea; params: string[]; host: BrandCode };
export function describeRoutes(routes: string[]): QaRoute[] {
  const order = new Map(QA_AREAS.map((a, i) => [a.key, i]));
  return [...new Set(routes)].map((route) => ({ route, label: labelOf(route), area: areaOf(route), params: paramsOf(route), host: hostOf(route) }))
    .sort((a, b) => order.get(a.area.key)! - order.get(b.area.key)! || a.route.localeCompare(b.route));
}

/** O que a checagem automática espera de uma resposta sem login. */
export function judge(kind: QaKind, status: number | null, location: string | null): { ok: boolean; expected: string } {
  if (kind === "PAINEL") return { ok: status !== null && status >= 300 && status < 400 && !!location && /\/login/.test(location), expected: "mandar para a entrada (sem login)" };
  return { ok: status !== null && status >= 200 && status < 400, expected: "abrir (200)" };
}
