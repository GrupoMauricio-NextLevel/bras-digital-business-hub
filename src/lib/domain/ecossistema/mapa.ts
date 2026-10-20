import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdMembers, errorEvents, orders, organizations, qaRuns, stores, trCarriers, users } from "@/db/schema";
import { brandsFrom, type BrandCode } from "@/lib/brand";
import { SALE_SUM, SALE_WHERE } from "@/lib/queries/master";
import { requireMasterFn, type Actor } from "../access";
import { ecosystemIndex, presenceByDocument } from "./torre";

/**
 * Mapa do Ecossistema vivo (D175, prompt `docs/prompts/mapa-vivo-master.md`): marcas, sites, painéis e conexões com os
 * números de hoje e a saúde de cada marca. Só LÊ: não grava oportunidades (não chama `ecosystemTower`) nem confere
 * endereços (isso é da Central de qualidade). Uma consulta por bloco; só contagens, nenhum dado pessoal.
 */
export type NivelSaude = "BEM" | "OBSERVAR" | "ATENCAO" | "PREPARACAO";
export type SaudeMarca = { nivel: NivelSaude; motivo: string };
export type SiteMarca = { ok: boolean | null; quando: string | null; detalhe: string | null };
export type NoMarca = {
  code: BrandCode; nome: string; cor: string; endereco: string; noAr: boolean;
  clientes: number; rotuloClientes: string;
  vendas: { pedidos: number; gmv: number } | null;
  usuariosPorPapel: { papel: string; rotulo: string; n: number }[];
  site: SiteMarca; saude: SaudeMarca; href: string;
};
export type MapaEcossistema = {
  geradoEm: string;
  marcas: NoMarca[];
  pares: { a: BrandCode; b: BrandCode; n: number }[];
  emVariasMarcas: number;
  motor: { errosAbertos: number; ultimaConferencia: string | null };
};

/** Ordem do foco 60/25/15 (D174): E-commerce, SuperDrop, Brás, Cargas; depois as que estão em preparação. */
export const ORDEM_MARCAS = ["NEXTLEVEL_COMMERCE", "SUPERDROP", "BRAS_DIGITAL", "NEXTLEVEL_CARGAS", "CREATORS_HUB", "CHINA_HUB"] as const satisfies readonly BrandCode[];
const ROTULO_PAPEL: Record<string, string> = {
  STORE_OWNER: "Lojistas e equipe", SUPPLIER_ADMIN: "Fornecedores", SUPPLIER_DISPATCH: "Expedição", AFFILIATE: "Parceiros",
  BRAS_MEMBER: "Membros", BRAS_IMPORTER: "Importadoras", CARRIER: "Transportadoras e ônibus",
};
const HREF: Partial<Record<BrandCode, string>> = {
  NEXTLEVEL_COMMERCE: "/commerce", SUPERDROP: "/master/stores?marca=SUPERDROP", BRAS_DIGITAL: "/bras", NEXTLEVEL_CARGAS: "/bras/transportadoras",
};
const DIA = 86_400_000;

/** Regra pura da saúde de uma marca (motivo sempre em texto; a cor nunca carrega a informação sozinha). */
export function saudeDaMarca(f: { noAr: boolean; site: SiteMarca; errosAbertos: number; clientes: number; vendas: number | null }, agora = new Date()): SaudeMarca {
  if (!f.noAr) return { nivel: "PREPARACAO", motivo: "Ainda não está no ar (página \"em breve\")." };
  if (f.site.ok === false) return { nivel: "ATENCAO", motivo: `O endereço falhou na última conferência${f.site.detalhe ? `: ${f.site.detalhe}` : "."}` };
  if (f.errosAbertos > 0) return { nivel: "ATENCAO", motivo: `${f.errosAbertos} erro(s) aberto(s) ligado(s) à marca.` };
  if (!f.site.quando || agora.getTime() - new Date(f.site.quando).getTime() > 7 * DIA) return { nivel: "OBSERVAR", motivo: "Endereço sem conferência há mais de 7 dias." };
  if (f.clientes === 0) return { nivel: "OBSERVAR", motivo: "No ar, mas ainda sem nenhum cliente cadastrado." };
  if (f.vendas === 0) return { nivel: "OBSERVAR", motivo: "Clientes cadastrados, mas nenhuma venda paga ainda." };
  return { nivel: "BEM", motivo: "Endereço respondendo, sem erro aberto e com movimento." };
}

/** Raio do nó no desenho: proporcional à raiz do número de clientes, entre 26 e 58. */
export const raioDoNo = (clientes: number, maior: number) => Math.round(26 + (maior > 0 ? Math.sqrt(clientes / maior) : 0) * 32);

const origem = (url: string) => { try { return new URL(url).origin; } catch { return url; } };

export async function mapaDoEcossistema(db: Database, actor: Actor, agora = new Date(), env: Record<string, string | undefined> = process.env): Promise<MapaEcossistema> {
  requireMasterFn(actor, ["COMERCIAL"]);
  const brands = brandsFrom(env);
  const [lojas, vendas, papeis, membros, transportadoras, [dominios], erros, presenca] = await Promise.all([
    db.select({ brand: organizations.brand, n: count() }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(isNull(stores.showcaseTheme)).groupBy(organizations.brand),
    db.select({ brand: organizations.brand, n: count(), gmv: SALE_SUM() }).from(orders).innerJoin(stores, eq(stores.id, orders.storeId)).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(SALE_WHERE()).groupBy(organizations.brand),
    db.select({ brand: organizations.brand, role: users.role, n: count() }).from(users).innerJoin(organizations, eq(organizations.id, users.organizationId)).where(and(isNull(users.disabledAt), ne(users.role, "NEXTLEVEL_MASTER"))).groupBy(organizations.brand, users.role),
    db.select({ n: count() }).from(bdMembers),
    db.select({ n: count() }).from(trCarriers),
    db.select().from(qaRuns).where(eq(qaRuns.kind, "DOMINIOS")).orderBy(desc(qaRuns.createdAt)).limit(1),
    db.select({ route: errorEvents.route, context: errorEvents.context }).from(errorEvents).where(isNull(errorEvents.resolvedAt)),
    presenceByDocument(db),
  ]);
  const porMarca = <T extends { brand: string }>(rows: T[], code: string) => rows.filter((r) => r.brand === code);
  const resultado = new Map((dominios?.results ?? []).map((r) => [origem(r.key), r]));
  const index = ecosystemIndex(presenca);

  const marcas = ORDEM_MARCAS.map((code): NoMarca => {
    const b = brands[code];
    const noAr = b.live && !b.soon;
    const clientes = code === "BRAS_DIGITAL" ? membros[0]?.n ?? 0 : code === "NEXTLEVEL_CARGAS" ? transportadoras[0]?.n ?? 0 : porMarca(lojas, code).reduce((s, r) => s + r.n, 0);
    const v = code === "NEXTLEVEL_COMMERCE" || code === "SUPERDROP" ? porMarca(vendas, code).reduce((s, r) => ({ pedidos: s.pedidos + r.n, gmv: s.gmv + Number(r.gmv) }), { pedidos: 0, gmv: 0 }) : null;
    const r = resultado.get(origem(b.baseUrl));
    const site: SiteMarca = r ? { ok: r.ok, quando: dominios!.createdAt, detalhe: r.ok ? null : r.detail } : { ok: null, quando: null, detalhe: null };
    // Erro aberto "da marca": rota de painel ou contexto que cite a marca (só contagem).
    const chave = code === "NEXTLEVEL_COMMERCE" ? /\/commerce|e-?commerce/i : code === "SUPERDROP" ? /superdrop|\/supplier/i : code === "BRAS_DIGITAL" ? /\/bras|\/meu-bras|\/importadora|\/balcao/i : code === "NEXTLEVEL_CARGAS" ? /\/transportadora|\/motorista|cargas/i : null;
    const errosAbertos = chave ? erros.filter((e) => chave.test(e.route) || chave.test(e.context ?? "")).length : 0;
    return {
      code, nome: b.name, cor: b.accentColor, endereco: b.baseUrl, noAr, clientes,
      rotuloClientes: code === "BRAS_DIGITAL" ? "membros" : code === "NEXTLEVEL_CARGAS" ? "transportadoras" : "lojas",
      vendas: v,
      usuariosPorPapel: porMarca(papeis, code).map((p) => ({ papel: p.role, rotulo: ROTULO_PAPEL[p.role] ?? p.role, n: p.n })).sort((a, z) => z.n - a.n),
      site, saude: saudeDaMarca({ noAr, site, errosAbertos, clientes, vendas: v ? v.pedidos : null }, agora),
      href: HREF[code] ?? "/master/marcas",
    };
  });

  const pares = index.pairs.map((p) => { const [a, b] = p.pair.split(" + ") as [BrandCode, BrandCode]; return { a, b, n: p.n }; });
  return { geradoEm: agora.toISOString(), marcas, pares, emVariasMarcas: index.two + index.threePlus, motor: { errosAbertos: erros.length, ultimaConferencia: dominios?.createdAt ?? null } };
}
