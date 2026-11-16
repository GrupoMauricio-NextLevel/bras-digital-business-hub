import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { servicosNegocio } from "@/db/schema";
import { assertCanAccess, type Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId, slugify } from "@/lib/ids";

/**
 * Serviços da empresa (NextLevel Business, NB2, D307): o que o negócio oferece. Aparecem no site (seção "Serviços") e,
 * na NB3, no formulário de orçamento. Preço é "a partir de", em centavos; sem preço = "sob orçamento".
 * Na academia, cada modalidade é um serviço (a grade de aulas é da NB10).
 */
export type ServicoPublico = { id: string; nome: string; slug: string; resumo: string | null; imagemUrl: string | null; precoAPartirCents: number | null };

export const servicoSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao serviço.").max(80),
  resumo: z.string().trim().max(200).optional().nullable(),
  descricao: z.string().trim().max(2000).optional().nullable(),
  imagemUrl: z.string().trim().max(500).refine((v) => !v || v.startsWith("/") || v.startsWith("https://"), "Use uma imagem da sua biblioteca ou um endereço https.").optional().nullable(),
  precoAPartirCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().min(0).max(999).optional(),
});

function podeEditar(actor: Actor, storeId: string) {
  assertCanAccess(actor, { storeId });
  if (actor.role === "STORE_OWNER" && actor.storeRole === "STAFF") throw new ForbiddenError("Só o dono do negócio muda os serviços.");
  if (actor.role !== "STORE_OWNER" && actor.role !== "NEXTLEVEL_MASTER") throw new ForbiddenError();
}

async function slugLivre(db: Database, storeId: string, base: string, ignorarId?: string) {
  const raiz = slugify(base) || "servico";
  for (let n = 1; n < 200; n++) {
    const s = n === 1 ? raiz : `${raiz}-${n}`;
    const outro = await db.query.servicosNegocio.findFirst({ where: and(eq(servicosNegocio.storeId, storeId), eq(servicosNegocio.slug, s)) });
    if (!outro || outro.id === ignorarId) return s;
  }
  throw new DomainError("SLUG", "Não deu para criar o endereço do serviço.");
}

export async function criarServico(db: Database, actor: Actor, storeId: string, raw: z.input<typeof servicoSchema>) {
  podeEditar(actor, storeId);
  const input = servicoSchema.parse(raw);
  const total = (await db.select({ id: servicosNegocio.id }).from(servicosNegocio).where(eq(servicosNegocio.storeId, storeId))).length;
  if (total >= 60) throw new DomainError("LIMITE", "Limite de 60 serviços por site.");
  const id = newId("svn");
  await db.insert(servicosNegocio).values({ id, storeId, nome: input.nome, slug: await slugLivre(db, storeId, input.nome), resumo: input.resumo || null, descricao: input.descricao || null, imagemUrl: input.imagemUrl || null, precoAPartirCents: input.precoAPartirCents ?? null, ativo: input.ativo ?? true, ordem: input.ordem ?? total });
  await recordAudit(db, actor, { action: "SERVICO_CRIADO", entityType: "servico_negocio", entityId: id, storeId, after: { nome: input.nome } });
  return { id };
}

export async function editarServico(db: Database, actor: Actor, storeId: string, id: string, raw: z.input<typeof servicoSchema>) {
  podeEditar(actor, storeId);
  const atual = await db.query.servicosNegocio.findFirst({ where: and(eq(servicosNegocio.id, id), eq(servicosNegocio.storeId, storeId)) });
  if (!atual) throw new NotFoundError("Serviço não encontrado.");
  const input = servicoSchema.parse(raw);
  const slug = input.nome !== atual.nome ? await slugLivre(db, storeId, input.nome, id) : atual.slug;
  await db.update(servicosNegocio).set({ nome: input.nome, slug, resumo: input.resumo || null, descricao: input.descricao || null, imagemUrl: input.imagemUrl || null, precoAPartirCents: input.precoAPartirCents ?? null, ativo: input.ativo ?? atual.ativo, ordem: input.ordem ?? atual.ordem, updatedAt: new Date().toISOString() }).where(eq(servicosNegocio.id, id));
  await recordAudit(db, actor, { action: "SERVICO_EDITADO", entityType: "servico_negocio", entityId: id, storeId, before: { nome: atual.nome, ativo: atual.ativo }, after: { nome: input.nome, ativo: input.ativo ?? atual.ativo } });
}

/** Todos os serviços do negócio (painel). */
export async function listarServicos(db: Database, storeId: string) {
  return db.select().from(servicosNegocio).where(eq(servicosNegocio.storeId, storeId)).orderBy(asc(servicosNegocio.ordem), asc(servicosNegocio.createdAt));
}

/** Só os ativos, sem descrição longa (vitrine). */
export async function servicosPublicos(db: Database, storeId: string): Promise<ServicoPublico[]> {
  return (await listarServicos(db, storeId)).filter((s) => s.ativo).map((s) => ({ id: s.id, nome: s.nome, slug: s.slug, resumo: s.resumo, imagemUrl: s.imagemUrl, precoAPartirCents: s.precoAPartirCents }));
}
