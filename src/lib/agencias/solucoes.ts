import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { agencias, partners, stores, users } from "@/db/schema";
import type { Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError } from "@/lib/domain/errors";
import { signupMember } from "@/lib/domain/store-access";
import { registerPartner } from "@/lib/domain/partners";
import { businessLigado, chaveDoModulo, modulosDoNegocio, MODULO_LABEL, type Modulo } from "@/lib/business/modulos";
import { escopoDaAgencia } from "./acesso";

/**
 * Soluções NextLevel no Painel da Agência (D323): a agência vira usuária do NextLevel Business sem nada recriado.
 * - "Conectar" usa o MESMO cadastro do site público (signupMember: caminho Site ou Loja, plano e teste de sempre) com os
 *   dados da agência, e liga a conta nova ao login de quem conectou pela conta do grupo (D141): troca de perfil sem novo login.
 * - Cada solução abre a tela que já existe no painel do negócio (Site, Loja virtual, Contatos, Plano e módulos).
 * Só o administrador da agência.
 */
async function escopoAdmin(db: Database, actor: Actor) {
  const e = await escopoDaAgencia(db, actor);
  if (e.membro.funcao !== "ADMIN") throw new ForbiddenError("As soluções NextLevel são do administrador da agência.");
  return e;
}

/** Destinos que a janela pode abrir no painel do negócio (lista fechada). */
export const DESTINOS = { painel: "/merchant", site: "/merchant/site/paginas", loja: "/merchant/products", contatos: "/merchant/contatos", plano: "/merchant/negocio/plano" } as const;
export type Destino = keyof typeof DESTINOS;

/** E-mail sugerido para o perfil do negócio: o mesmo endereço com "+negocio" (cada perfil do grupo tem o próprio e-mail). */
export function emailSugerido(email: string) {
  const [local = "", dominio = ""] = email.toLowerCase().split("@");
  return `${local.split("+")[0]}+negocio@${dominio}`;
}

/** O perfil do negócio ligado a quem está logado (mesmo grupo, dono da loja da agência). */
async function perfilDoNegocio(db: Database, userId: string, storeId: string | null) {
  if (!storeId) return null;
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!me?.groupId) return null;
  return (await db.query.users.findFirst({ where: and(eq(users.groupId, me.groupId), eq(users.storeId, storeId), eq(users.role, "STORE_OWNER"), isNull(users.disabledAt)) })) ?? null;
}

export async function solucoesDaAgencia(db: Database, actor: Actor) {
  const { agencia } = await escopoAdmin(db, actor);
  const me = (await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { email: true } }))!;
  const indique = await indiqueDaAgencia(db, actor.userId, agencia.partnerId);
  const base = { business: businessLigado(), temDocumento: !!agencia.documento, emailSugerido: emailSugerido(me.email), emailParceiro: emailSugerido(me.email).replace("+negocio@", "+parceiro@"), indique };
  if (!agencia.negocioStoreId) return { ...base, conectada: false as const };
  const [loja, perfil, m] = await Promise.all([
    db.query.stores.findFirst({ where: eq(stores.id, agencia.negocioStoreId), columns: { name: true, slug: true, formato: true } }),
    perfilDoNegocio(db, actor.userId, agencia.negocioStoreId),
    modulosDoNegocio(db, agencia.negocioStoreId),
  ]);
  const extras = (["captacao", "caixa", "meta", "portal"] as const).map((k: Modulo) => ({ chave: chaveDoModulo(k), nome: MODULO_LABEL[k], ativo: m.ativos.has(k) }));
  return { ...base, conectada: true as const, negocio: { nome: loja?.name ?? agencia.nome, slug: loja?.slug ?? null, formato: m.formato, business: m.business, site: m.ativos.has("site"), loja: m.ativos.has("loja"), extras }, euConectado: !!perfil };
}

export const conexaoSchema = z.object({
  formato: z.enum(["SITE", "LOJA"]),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  aceite: z.literal(true, { message: "Marque que você concorda em ligar os perfis." }),
});

/** Um clique: cria a conta NextLevel Business da agência pelo cadastro de sempre e liga ao seu login. */
export async function conectarAoBusiness(db: Database, actor: Actor, raw: z.input<typeof conexaoSchema>, now = new Date()) {
  const { agencia } = await escopoAdmin(db, actor);
  const d = conexaoSchema.parse(raw);
  if (agencia.negocioStoreId) throw new DomainError("JA_CONECTADA", "A agência já está conectada ao NextLevel Business.");
  if (!agencia.documento) throw new DomainError("SEM_DOCUMENTO", "Preencha o CNPJ ou CPF da agência em Equipe, em Dados da agência.");
  const me = (await db.query.users.findFirst({ where: eq(users.id, actor.userId) }))!;
  const criada = await signupMember(db, {
    storeName: agencia.nome, ownerName: me.name, email: d.email, password: randomBytes(24).toString("base64url"), taxId: agencia.documento,
    independent: true, brand: "NEXTLEVEL_COMMERCE", formato: businessLigado() ? d.formato : "LOJA", conheceuPor: "agencia",
  }, now);
  const groupId = me.groupId ?? me.id;
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(eq(users.id, me.id));
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(eq(users.id, criada.userId));
  await db.update(agencias).set({ negocioStoreId: criada.storeId, updatedAt: now.toISOString() }).where(eq(agencias.id, agencia.id));
  await recordAudit(db, actor, { action: "AGENCIA_CONECTADA_BUSINESS", entityType: "agencia", entityId: agencia.id, after: { storeId: criada.storeId, formato: d.formato, consentAt: now.toISOString() } }, { force: true });
  return { storeId: criada.storeId, perfilId: criada.userId };
}

/** Perfil a abrir e o caminho de destino (só da lista fechada). Quem não está ligado recebe orientação clara. */
export async function destinoDaSolucao(db: Database, actor: Actor, destino: string) {
  const { agencia } = await escopoAdmin(db, actor);
  const caminho = (DESTINOS as Record<string, string>)[destino];
  if (!caminho) throw new DomainError("DESTINO", "Solução não encontrada.");
  const perfil = await perfilDoNegocio(db, actor.userId, agencia.negocioStoreId);
  if (!perfil) throw new DomainError("NAO_LIGADO", "A conta do negócio foi conectada por outra pessoa da agência. Peça a ela, ou ligue o perfil em Suas marcas.");
  return { perfilId: perfil.id, caminho };
}

// ---------------------------------------------------------------------------
// Indique e ganhe (D325): a agência entra no programa de parceiros pelo cadastro de sempre (registerPartner)
// ---------------------------------------------------------------------------
async function indiqueDaAgencia(db: Database, userId: string, partnerId: string | null) {
  if (!partnerId) return { ativo: false as const };
  const p = await db.query.partners.findFirst({ where: eq(partners.id, partnerId), columns: { code: true, userId: true, status: true } });
  if (!p) return { ativo: false as const };
  const me = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { groupId: true } });
  const dele = await db.query.users.findFirst({ where: eq(users.id, p.userId), columns: { groupId: true } });
  return { ativo: true as const, codigo: p.code, euLigado: !!me?.groupId && me.groupId === dele?.groupId };
}

export const indiqueSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  telefone: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido (com DDD)"),
  aceite: z.literal(true, { message: "Marque que você aceita os termos do programa de parceiros." }),
});

/** Um clique: cadastra a agência no programa de parceiros (mesmos termos e comissões) e liga ao login de quem ativou. */
export async function ativarIndiqueEGanhe(db: Database, actor: Actor, raw: z.input<typeof indiqueSchema>, now = new Date()) {
  const { agencia } = await escopoAdmin(db, actor);
  const d = indiqueSchema.parse(raw);
  if (agencia.partnerId) throw new DomainError("JA_PARCEIRA", "A agência já está no Indique e ganhe.");
  if (!agencia.documento) throw new DomainError("SEM_DOCUMENTO", "Preencha o CNPJ ou CPF da agência em Equipe, em Dados da agência.");
  const me = (await db.query.users.findFirst({ where: eq(users.id, actor.userId) }))!;
  const r = await registerPartner(db, { name: agencia.nome, email: d.email, password: randomBytes(24).toString("base64url"), taxId: agencia.documento, phone: d.telefone, acceptTerms: true, brand: "NEXTLEVEL_COMMERCE" }, now);
  const groupId = me.groupId ?? me.id;
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(eq(users.id, me.id));
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(eq(users.id, r.userId));
  await db.update(agencias).set({ partnerId: r.partnerId, updatedAt: now.toISOString() }).where(eq(agencias.id, agencia.id));
  await recordAudit(db, actor, { action: "AGENCIA_INDIQUE_ATIVADO", entityType: "agencia", entityId: agencia.id, after: { partnerId: r.partnerId, code: r.code, consentAt: now.toISOString() } }, { force: true });
  return { codigo: r.code };
}

/** Perfil de parceiro da agência para abrir o painel de indicações sem novo login. */
export async function perfilDoIndique(db: Database, actor: Actor) {
  const { agencia } = await escopoAdmin(db, actor);
  const p = agencia.partnerId ? await db.query.partners.findFirst({ where: eq(partners.id, agencia.partnerId), columns: { userId: true } }) : null;
  const me = await db.query.users.findFirst({ where: eq(users.id, actor.userId), columns: { groupId: true } });
  const dele = p ? await db.query.users.findFirst({ where: eq(users.id, p.userId), columns: { groupId: true, id: true } }) : null;
  if (!dele || !me?.groupId || me.groupId !== dele.groupId) throw new DomainError("NAO_LIGADO", "O Indique e ganhe foi ativado por outra pessoa da agência. Ligue o perfil em Suas marcas.");
  return dele.id;
}
