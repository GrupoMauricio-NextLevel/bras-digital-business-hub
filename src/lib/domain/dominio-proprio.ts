import { promises as dns } from "node:dns";
import { and, eq, ne, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { stores } from "@/db/schema";
import { DomainError } from "./errors";

/**
 * Domínio próprio da loja (D234): liberado para todo lojista da NextLevel E-commerce, em todos os planos.
 * Fluxo: o lojista informa o domínio → recebe os registros de DNS → "Verificar" confere o DNS e, quando o endereço já
 * responde pela plataforma, a loja passa a abrir nele (CONNECTED). Com `RENDER_API_KEY` e `RENDER_SERVICE_ID` no ambiente,
 * o domínio é cadastrado sozinho na hospedagem (certificado HTTPS automático); sem eles, fica na fila do Master.
 * O proxy (`src/proxy.ts`) serve a vitrine em qualquer host cadastrado aqui (`lojaPorDominio`).
 */
export const ALVO_CNAME = () => (process.env.LOJA_DOMINIO_CNAME || "nextlevel-demo.onrender.com").toLowerCase();
/** IP de entrada da hospedagem para domínio sem "www" (registro A). */
export const ALVO_A = () => process.env.LOJA_DOMINIO_IP || "216.24.57.1";

const ROTULO = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
/** Hosts que nunca podem ser domínio de loja (da própria plataforma). */
const RESERVADOS = ["nextlevelgroup.com.br", "onrender.com", "superdrop.com.br", "localhost"];

/** "https://WWW.MinhaLoja.com.br/" → "www.minhaloja.com.br". Erro claro quando não é um domínio. */
export function normalizarDominio(raw: string): string {
  const d = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
  const partes = d.split(".");
  if (partes.length < 2 || !partes.every((p) => ROTULO.test(p)) || !/^[a-z]{2,}$/.test(partes.at(-1)!)) throw new DomainError("DOMINIO_INVALIDO", "Domínio inválido. Use o formato www.sualoja.com.br.");
  if (RESERVADOS.some((r) => d === r || d.endsWith(`.${r}`))) throw new DomainError("DOMINIO_RESERVADO", "Esse endereço é da plataforma. Use o domínio da sua marca.");
  return d;
}

/** Domínio sem subdomínio (ex.: sualoja.com.br) usa registro A; com subdomínio (www.sualoja.com.br), CNAME. */
const SUFIXOS_DUPLOS = ["com.br", "net.br", "org.br", "art.br", "eco.br", "ind.br", "co.uk", "com.ar", "com.mx"];
export function ehRaiz(d: string): boolean {
  const partes = d.split(".");
  const sufixo2 = partes.slice(-2).join(".");
  return partes.length === (SUFIXOS_DUPLOS.includes(sufixo2) ? 3 : 2);
}

export type RegistroDns = { tipo: "CNAME" | "A"; nome: string; valor: string };
/** Registros que o lojista cria no provedor do domínio (Registro.br, GoDaddy, Hostinger…). */
export function registrosDns(d: string): RegistroDns[] {
  if (ehRaiz(d)) return [{ tipo: "A", nome: "@", valor: ALVO_A() }, { tipo: "CNAME", nome: "www", valor: ALVO_CNAME() }];
  return [{ tipo: "CNAME", nome: d.split(".")[0]!, valor: ALVO_CNAME() }];
}

/** Grava o domínio da loja (PENDING). Um domínio só pode estar em uma loja. */
export async function salvarDominio(db: Database, storeId: string, raw: string) {
  const d = normalizarDominio(raw);
  const outra = await db.query.stores.findFirst({ where: and(sql`lower(${stores.customDomain}) = ${d}`, ne(stores.id, storeId)), columns: { id: true } });
  if (outra) throw new DomainError("DOMINIO_EM_USO", "Esse domínio já está ligado a outra loja.");
  await db.update(stores).set({ customDomain: d, domainStatus: "PENDING", updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
  limparCache();
  const hospedagem = await cadastrarNaHospedagem(d);
  return { dominio: d, registros: registrosDns(d), hospedagem };
}

export async function removerDominio(db: Database, storeId: string) {
  await db.update(stores).set({ customDomain: null, domainStatus: "NOT_CONFIGURED", updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId));
  limparCache();
}

export type Verificacao = { dns: boolean; responde: boolean; conectado: boolean; detalhe: string };
type Sondas = { cname: (h: string) => Promise<string[]>; a: (h: string) => Promise<string[]>; ping: (d: string) => Promise<string | null> };
const SONDAS: Sondas = {
  cname: (h) => dns.resolveCname(h).catch(() => []),
  a: (h) => dns.resolve4(h).catch(() => []),
  ping: async (d) => {
    try {
      const r = await fetch(`https://${d}/api/store/dominio`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      return r.ok ? ((await r.json()) as { loja?: string }).loja ?? null : null;
    } catch { return null; }
  },
};

/** Confere o DNS e se o endereço já abre a loja pela plataforma (HTTPS ativo). Conectado → a loja passa a usar o domínio. */
export async function verificarDominio(db: Database, storeId: string, sondas: Sondas = SONDAS): Promise<Verificacao> {
  const s = await db.query.stores.findFirst({ where: eq(stores.id, storeId), columns: { id: true, slug: true, customDomain: true, domainStatus: true } });
  if (!s?.customDomain) throw new DomainError("SEM_DOMINIO", "Cadastre o domínio primeiro.");
  const d = s.customDomain;
  const [cname, a] = await Promise.all([sondas.cname(d), sondas.a(d)]);
  const dnsOk = cname.some((c) => c.toLowerCase().replace(/\.$/, "") === ALVO_CNAME()) || a.includes(ALVO_A());
  const responde = dnsOk ? (await sondas.ping(d)) === s.slug : false;
  const conectado = dnsOk && responde;
  const status = conectado ? "CONNECTED" as const : "PENDING" as const;
  if (status !== s.domainStatus) { await db.update(stores).set({ domainStatus: status, updatedAt: new Date().toISOString() }).where(eq(stores.id, storeId)); limparCache(); }
  const detalhe = conectado ? "Domínio conectado: a sua loja já abre nele, com HTTPS."
    : !dnsOk ? "O DNS ainda não aponta para a plataforma. Confira os registros acima; a mudança pode levar até 24 horas para valer."
    : "O DNS já aponta para a plataforma. Falta o certificado de segurança (HTTPS), que sai sozinho em alguns minutos. Verifique de novo em seguida.";
  return { dns: dnsOk, responde, conectado, detalhe };
}

/** Cadastra o domínio na hospedagem (Render) quando a chave existe. Sem chave: a equipe NextLevel ativa pela fila do Master. */
async function cadastrarNaHospedagem(d: string): Promise<"automatica" | "equipe"> {
  const chave = process.env.RENDER_API_KEY, servico = process.env.RENDER_SERVICE_ID;
  if (!chave || !servico) return "equipe";
  const nomes = ehRaiz(d) ? [d, `www.${d}`] : [d];
  for (const name of nomes) {
    try {
      await fetch(`https://api.render.com/v1/services/${servico}/custom-domains`, { method: "POST", headers: { authorization: `Bearer ${chave}`, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ name }), signal: AbortSignal.timeout(10_000) });
    } catch { return "equipe"; }
  }
  return "automatica";
}

// ---------------------------------------------------------------------------------------------------------------------
// Resolução por host (proxy): cache curto para não consultar o banco a cada requisição.
// ---------------------------------------------------------------------------------------------------------------------
const cache = new Map<string, { slug: string | null; ate: number }>();
const limparCache = () => cache.clear();

/** Slug da loja cadastrada para o host (com ou sem "www."), ou null. */
export async function lojaPorDominio(db: Database, host: string, agora = Date.now()): Promise<string | null> {
  const h = host.split(":")[0]!.toLowerCase();
  const c = cache.get(h);
  if (c && c.ate > agora) return c.slug;
  const alternativo = h.startsWith("www.") ? h.slice(4) : `www.${h}`;
  const row = await db.query.stores.findFirst({ where: and(sql`lower(${stores.customDomain}) in (${h}, ${alternativo})`, ne(stores.domainStatus, "NOT_CONFIGURED")), columns: { slug: true } });
  const slug = row?.slug ?? null;
  cache.set(h, { slug, ate: agora + (slug ? 60_000 : 30_000) });
  return slug;
}
