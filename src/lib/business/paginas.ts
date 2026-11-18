import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { paginasSite, themeTemplateVersions, PAGINA_TIPOS, type PaginaTipo } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { newId, slugify } from "@/lib/ids";
import { editingContextFor } from "@/lib/themes/license";
import { checkPublishable, checkTemplateChange } from "@/lib/themes/policy";
import { assertEditor, assertNothingDropped, assertRevision, loadStore, saveSnapshot, throwViolations } from "@/lib/themes/store";
import { normalizeTemplate, sameTemplate } from "@/lib/themes/template";
import type { Template } from "@/lib/themes/types";

/**
 * Páginas livres do site do negócio (NextLevel Business, NB2, D307): Sobre, Serviços, Contato, campanha e página livre.
 * - O modelo é o mesmo das páginas da loja e é validado como página "home" (as mesmas seções e a mesma política do tema).
 * - Rascunho, revisão (duas abas não se sobrescrevem), publicação e histórico iguais aos das páginas fixas; no histórico,
 *   `page = "pagina:<id>"`.
 * - Endereço público: `/<slug>` no domínio próprio ou `/store/<loja>/<slug>`. Rotas da loja e do portal ficam reservadas.
 */
export const CHAVE_PAGINA = (id: string) => `p:${id}` as const;
export const ehChavePagina = (k: string): k is `p:${string}` => k.startsWith("p:") && k.length > 2;
export const idDaChave = (k: `p:${string}`) => k.slice(2);
export const historicoDaPagina = (id: string) => `pagina:${id}` as const;

/** Endereços que já são da loja (ou serão, como o portal da academia): nenhuma página livre pode usar. */
export const SLUGS_RESERVADOS = new Set([
  "catalog", "catalogo", "cart", "carrinho", "checkout", "product", "produto", "order", "pedido", "acompanhar", "conta", "proposta",
  "portal", "p", "l", "r", "c", "api", "feed.xml", "sitemap.xml", "robots.txt", "manifest.webmanifest", "icone.svg", "login", "admin", "merchant",
]);

export const TIPO_ROTULO: Record<PaginaTipo, string> = { INSTITUCIONAL: "Sobre", SERVICO: "Serviços", CONTATO: "Contato", CAMPANHA: "Campanha", LIVRE: "Página livre" };

const slugSchema = z.string().trim().toLowerCase().min(2, "O endereço precisa de ao menos 2 letras.").max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífens (ex.: sobre-nos).");

export const novaPaginaSchema = z.object({
  titulo: z.string().trim().min(2, "Dê um título à página.").max(80),
  slug: z.string().trim().max(60).optional(),
  tipo: z.enum(PAGINA_TIPOS).default("LIVRE"),
  noMenu: z.boolean().optional(),
});

/** Confere o endereço: formato, reservado e repetido (na mesma loja). */
export async function conferirSlug(db: Database, storeId: string, slugBruto: string, ignorarId?: string): Promise<string> {
  const slug = slugSchema.parse(slugBruto);
  if (SLUGS_RESERVADOS.has(slug)) throw new DomainError("SLUG_RESERVADO", `O endereço "/${slug}" já é usado pelo site. Escolha outro.`);
  const outra = await db.query.paginasSite.findFirst({ where: and(eq(paginasSite.storeId, storeId), eq(paginasSite.slug, slug)) });
  if (outra && outra.id !== ignorarId) throw new DomainError("SLUG_REPETIDO", `Já existe uma página com o endereço "/${slug}".`);
  return slug;
}

async function editor(db: Database, actor: Actor, storeId: string) {
  const store = await loadStore(db, storeId); assertEditor(actor, store); return store;
}

async function paginaDaLoja(db: Database, storeId: string, id: string) {
  const p = await db.query.paginasSite.findFirst({ where: and(eq(paginasSite.id, id), eq(paginasSite.storeId, storeId)) });
  if (!p) throw new NotFoundError("Página não encontrada.");
  return p;
}

/** Cria a página com um modelo inicial (rascunho). O dono edita no editor e publica. */
export async function criarPagina(db: Database, actor: Actor, storeId: string, raw: z.input<typeof novaPaginaSchema>, modelo?: Template, agora = new Date()) {
  await editor(db, actor, storeId);
  const input = novaPaginaSchema.parse(raw);
  const slug = await conferirSlug(db, storeId, input.slug || slugify(input.titulo));
  const ordem = (await db.select({ id: paginasSite.id }).from(paginasSite).where(eq(paginasSite.storeId, storeId))).length;
  const id = newId("pag");
  const draft = modelo ? normalizeTemplate(modelo, "content", "home").template : { v: 1 as const, sections: {}, order: [] };
  await db.insert(paginasSite).values({ id, storeId, slug, tipo: input.tipo, titulo: input.titulo, draft, revision: 0, indexar: input.tipo !== "CAMPANHA", noMenu: input.noMenu ?? input.tipo !== "CAMPANHA", ordem, createdBy: actor.userId, createdAt: agora.toISOString(), updatedAt: agora.toISOString() });
  await recordAudit(db, actor, { action: "PAGINA_CRIADA", entityType: "pagina_site", entityId: id, storeId, after: { titulo: input.titulo, slug, tipo: input.tipo } });
  return { id, slug };
}

export const editarPaginaSchema = z.object({
  titulo: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().max(60).optional(),
  noMenu: z.boolean().optional(),
  indexar: z.boolean().optional(),
  ordem: z.number().int().min(0).max(999).optional(),
  seoTitulo: z.string().trim().max(70).nullable().optional(),
  seoDescricao: z.string().trim().max(160).nullable().optional(),
});

/** Título, endereço, menu e SEO (o conteúdo é pelo editor). */
export async function editarPagina(db: Database, actor: Actor, storeId: string, id: string, raw: z.input<typeof editarPaginaSchema>) {
  await editor(db, actor, storeId);
  const p = await paginaDaLoja(db, storeId, id);
  const input = editarPaginaSchema.parse(raw);
  const slug = input.slug !== undefined && input.slug !== p.slug ? await conferirSlug(db, storeId, input.slug, id) : p.slug;
  await db.update(paginasSite).set({ ...input, slug, updatedAt: new Date().toISOString() }).where(eq(paginasSite.id, id));
  await recordAudit(db, actor, { action: "PAGINA_EDITADA", entityType: "pagina_site", entityId: id, storeId, before: { titulo: p.titulo, slug: p.slug }, after: { ...input, slug } });
}

/** Tira a página do ar e do menu (não apaga: dá para trazer de volta). */
export async function arquivarPagina(db: Database, actor: Actor, storeId: string, id: string, arquivar = true) {
  await editor(db, actor, storeId);
  await paginaDaLoja(db, storeId, id);
  await db.update(paginasSite).set({ arquivadaEm: arquivar ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }).where(eq(paginasSite.id, id));
  await recordAudit(db, actor, { action: arquivar ? "PAGINA_ARQUIVADA" : "PAGINA_RESTAURADA", entityType: "pagina_site", entityId: id, storeId });
}

/** Páginas da loja para o painel e o editor (arquivadas por último). */
export async function listarPaginas(db: Database, storeId: string) {
  const rows = await db.select().from(paginasSite).where(eq(paginasSite.storeId, storeId)).orderBy(asc(paginasSite.ordem), asc(paginasSite.createdAt));
  return rows.sort((a, b) => Number(!!a.arquivadaEm) - Number(!!b.arquivadaEm));
}

/** Modelo da página: o publicado para o visitante; o rascunho na prévia do dono e no editor. */
export function modeloDaPagina(p: { draft: Template | null; published: Template | null }, rascunho = false): Template {
  const raw = rascunho && p.draft ? p.draft : p.published ?? p.draft;
  return normalizeTemplate(raw ?? { v: 1, sections: {}, order: [] }, "content", "home").template;
}

/** Página publicada (ou, na prévia do dono, mesmo ainda não publicada) pelo endereço. Arquivada não aparece. */
export async function paginaPublica(db: Database, storeId: string, slug: string, opts: { previa?: boolean } = {}) {
  const p = await db.query.paginasSite.findFirst({ where: and(eq(paginasSite.storeId, storeId), eq(paginasSite.slug, slug.toLowerCase()), isNull(paginasSite.arquivadaEm)) });
  if (!p) return null;
  if (!p.published && !(opts.previa && p.draft)) return null;
  return { pagina: p, modelo: modeloDaPagina(p, !!opts.previa) };
}

/** Itens do menu do site: páginas publicadas, não arquivadas, marcadas para o menu. */
export async function menuDoSite(db: Database, storeId: string): Promise<{ label: string; slug: string }[]> {
  const rows = await listarPaginas(db, storeId);
  return rows.filter((p) => p.published && !p.arquivadaEm && p.noMenu).map((p) => ({ label: p.titulo, slug: p.slug }));
}

/** Salva o rascunho (com a mesma política e o mesmo controle de revisão das páginas da loja). */
export async function salvarRascunhoDaPagina(db: Database, actor: Actor, storeId: string, id: string, raw: unknown, opts: { baseRevision?: number; skipPolicy?: boolean } = {}) {
  const store = await editor(db, actor, storeId);
  const p = await paginaDaLoja(db, storeId, id);
  const { template, issues } = normalizeTemplate(raw, "content", "home");
  assertNothingDropped(raw, template, issues);
  assertRevision(p.revision, opts.baseRevision);
  if (!opts.skipPolicy) throwViolations(checkTemplateChange(await editingContextFor(db, store), modeloDaPagina(p, true), template, { region: "content", page: "home" }));
  const revision = p.revision + 1;
  await db.update(paginasSite).set({ draft: template, revision, updatedAt: new Date().toISOString() }).where(eq(paginasSite.id, id));
  return { issues, revision };
}

/** Publica as páginas com rascunho (junto com "Publicar" do editor). Guarda cada versão no histórico. */
export async function publicarPaginas(db: Database, actor: Actor, storeId: string, label = "Publicação", opts: { expected?: Record<string, number | undefined>; /** Só estas páginas (ex.: a página de campanha recém-criada, D338); sem ela, todas com rascunho. */ somente?: string[] } = {}) {
  const store = await editor(db, actor, storeId);
  const ctx = await editingContextFor(db, store);
  const rows = (await db.select().from(paginasSite).where(eq(paginasSite.storeId, storeId))).filter((r) => r.draft && (!opts.somente || opts.somente.includes(r.id)));
  for (const r of rows) { const e = opts.expected?.[CHAVE_PAGINA(r.id)]; if (e !== undefined) assertRevision(r.revision, e); }
  const publicadas: string[] = [];
  for (const r of rows) {
    const template = normalizeTemplate(r.draft, "content", "home").template;
    const antigas = (await db.select({ s: themeTemplateVersions.snapshot }).from(themeTemplateVersions).where(and(eq(themeTemplateVersions.storeId, storeId), eq(themeTemplateVersions.page, historicoDaPagina(r.id))))).map((v) => normalizeTemplate(v.s, "content", "home").template);
    throwViolations(checkPublishable(ctx, template, [modeloDaPagina(r), ...antigas], { region: "content", page: "home" }));
    if (r.published && sameTemplate(template, normalizeTemplate(r.published, "content", "home").template)) { await db.update(paginasSite).set({ draft: null }).where(eq(paginasSite.id, r.id)); continue; }
    const agora = new Date().toISOString();
    await db.update(paginasSite).set({ published: template, draft: null, revision: r.revision + 1, publicadaEm: r.publicadaEm ?? agora, updatedAt: agora }).where(eq(paginasSite.id, r.id));
    await saveSnapshot(db, storeId, historicoDaPagina(r.id), template, label, actor.userId);
    publicadas.push(r.id);
  }
  if (publicadas.length) await recordAudit(db, actor, { action: "PAGINAS_PUBLICADAS", entityType: "pagina_site", storeId, after: { ids: publicadas } });
  return { publicadas };
}

/** Descarta os rascunhos das páginas (volta ao publicado). */
export async function descartarRascunhosDasPaginas(db: Database, actor: Actor, storeId: string) {
  await editor(db, actor, storeId);
  const rows = (await db.select().from(paginasSite).where(eq(paginasSite.storeId, storeId))).filter((r) => r.draft && r.published);
  for (const r of rows) await db.update(paginasSite).set({ draft: null, revision: r.revision + 1, updatedAt: new Date().toISOString() }).where(eq(paginasSite.id, r.id));
}

/** Revisões das páginas para o editor (chave `p:<id>`). */
export async function revisoesDasPaginas(db: Database, storeId: string): Promise<Record<string, number>> {
  const rows = await db.select({ id: paginasSite.id, revision: paginasSite.revision }).from(paginasSite).where(eq(paginasSite.storeId, storeId));
  return Object.fromEntries(rows.map((r) => [CHAVE_PAGINA(r.id), r.revision]));
}
