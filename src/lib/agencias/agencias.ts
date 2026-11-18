import { and, asc, count, desc, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { AGENCIA_FUNCOES, agenciaClienteEquipe, agenciaClientes, agenciaMembros, agencias, organizations, users } from "@/db/schema";
import { requireMaster, type Actor } from "@/lib/domain/access";
import { recordAudit } from "@/lib/domain/audit";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { escopoDaAgencia, exigirAgenciasLigado, pode } from "./acesso";

/**
 * Agências (D313): o Master cria a agência e o primeiro acesso (administrador); o administrador monta a equipe com a
 * função de cada pessoa. Senha provisória trocada no primeiro login; nada é enviado por e-mail.
 */
const pessoaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "A senha provisória precisa ter ao menos 8 caracteres").max(200),
});
export const novaAgenciaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da agência").max(120),
  fundadora: z.boolean().default(false),
  responsavel: pessoaSchema,
});
export const novoMembroSchema = pessoaSchema.extend({
  funcao: z.enum(AGENCIA_FUNCOES),
  todosClientes: z.boolean().default(false),
});

async function emailLivre(db: Database, email: string) {
  if (await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } })) throw new DomainError("EMAIL_IN_USE", "Já existe uma conta com esse e-mail.");
}

/** Só o Master: cria a agência (organização própria) e o login do administrador dela. */
export async function criarAgencia(db: Database, actor: Actor, raw: z.input<typeof novaAgenciaSchema>) {
  exigirAgenciasLigado();
  requireMaster(actor);
  const d = novaAgenciaSchema.parse(raw);
  await emailLivre(db, d.responsavel.email);
  const agenciaId = newId("agc"); const orgId = newId("org"); const userId = newId("usr");
  const slug = `${slugify(d.nome).slice(0, 40) || "agencia"}-${agenciaId.slice(-6)}`;
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({ id: orgId, name: d.nome, slug: `agencia-${slug}`, type: "AGENCY", brand: "NEXTLEVEL_COMMERCE" });
    await tx.insert(agencias).values({ id: agenciaId, organizationId: orgId, nome: d.nome, slug, fundadora: d.fundadora });
    await tx.insert(users).values({ id: userId, name: d.responsavel.nome, email: d.responsavel.email, role: "AGENCY", organizationId: orgId, passwordHash: hashPassword(d.responsavel.senha), mustChangePassword: true });
    await tx.insert(agenciaMembros).values({ id: newId("agm"), agenciaId, userId, funcao: "ADMIN", todosClientes: true });
  });
  await recordAudit(db, actor, { action: "AGENCIA_CRIADA", entityType: "agencia", entityId: agenciaId, after: { nome: d.nome, fundadora: d.fundadora, adminUserId: userId } }, { force: true });
  return { agenciaId, userId };
}

/** Só o Master: as agências com o tamanho da carteira e da equipe. */
export async function listarAgencias(db: Database, actor: Actor) {
  requireMaster(actor);
  const lista = await db.select().from(agencias).where(isNull(agencias.demoDeId)).orderBy(desc(agencias.createdAt));
  const clientes = await db.select({ agenciaId: agenciaClientes.agenciaId, n: count() }).from(agenciaClientes).where(ne(agenciaClientes.situacao, "ENCERRADO")).groupBy(agenciaClientes.agenciaId);
  const equipe = await db.select({ agenciaId: agenciaMembros.agenciaId, n: count() }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId)).where(isNull(users.disabledAt)).groupBy(agenciaMembros.agenciaId);
  const nC = new Map(clientes.map((c) => [c.agenciaId, Number(c.n)])); const nE = new Map(equipe.map((e) => [e.agenciaId, Number(e.n)]));
  return lista.map((a) => ({ ...a, clientes: nC.get(a.id) ?? 0, equipe: nE.get(a.id) ?? 0 }));
}

/** Só o Master: muda a situação (piloto, ativa, pausada). Pausada, ninguém da agência entra no painel. */
export async function mudarSituacaoDaAgencia(db: Database, actor: Actor, agenciaId: string, situacao: "PILOTO" | "ATIVA" | "PAUSADA") {
  exigirAgenciasLigado();
  requireMaster(actor);
  const a = await db.query.agencias.findFirst({ where: eq(agencias.id, agenciaId) });
  if (!a) throw new NotFoundError("Agência não encontrada.");
  await db.update(agencias).set({ situacao, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agenciaId));
  await recordAudit(db, actor, { action: "AGENCIA_SITUACAO", entityType: "agencia", entityId: agenciaId, before: { situacao: a.situacao }, after: { situacao } });
}

/**
 * Só o Master: marca a agência interna (D331), a própria NextLevel Marketing Ltda. Ela usa os dados da empresa e o Pix do
 * Itaú nos contratos e pode trazer contratos de serviço do Master. No máximo uma: marcar outra desmarca a anterior.
 */
export async function marcarAgenciaInterna(db: Database, actor: Actor, agenciaId: string, interna: boolean) {
  exigirAgenciasLigado();
  requireMaster(actor);
  if (actor.masterFunction) throw new ForbiddenError("Só o dono marca a agência interna.");
  const a = await db.query.agencias.findFirst({ where: eq(agencias.id, agenciaId) });
  if (!a || a.demoDeId) throw new NotFoundError("Agência não encontrada.");
  await db.transaction(async (tx) => {
    if (interna) await tx.update(agencias).set({ interna: false, updatedAt: new Date().toISOString() }).where(and(eq(agencias.interna, true), ne(agencias.id, agenciaId)));
    await tx.update(agencias).set({ interna, updatedAt: new Date().toISOString() }).where(eq(agencias.id, agenciaId));
  });
  await recordAudit(db, actor, { action: "AGENCIA_INTERNA", entityType: "agencia", entityId: agenciaId, before: { interna: a.interna }, after: { interna } }, { force: true });
}

/** Equipe da agência (qualquer pessoa da agência vê quem é quem; só o administrador muda). */
export async function listarEquipe(db: Database, actor: Actor) {
  const { membro } = await escopoDaAgencia(db, actor);
  return db.select({ userId: users.id, nome: users.name, email: users.email, funcao: agenciaMembros.funcao, todosClientes: agenciaMembros.todosClientes, desligadoEm: users.disabledAt, ultimoAcesso: users.lastLoginAt })
    .from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(eq(agenciaMembros.agenciaId, membro.agenciaId)).orderBy(asc(users.disabledAt), asc(users.name));
}

export async function convidarMembro(db: Database, actor: Actor, raw: z.input<typeof novoMembroSchema>) {
  const { agencia, membro } = await escopoDaAgencia(db, actor);
  if (!pode.gerirEquipe(membro)) throw new ForbiddenError("Só o administrador da agência monta a equipe.");
  const d = novoMembroSchema.parse(raw);
  await emailLivre(db, d.email);
  const userId = newId("usr");
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, name: d.nome, email: d.email, role: "AGENCY", organizationId: agencia.organizationId, passwordHash: hashPassword(d.senha), mustChangePassword: true });
    await tx.insert(agenciaMembros).values({ id: newId("agm"), agenciaId: agencia.id, userId, funcao: d.funcao, todosClientes: d.todosClientes });
  });
  await recordAudit(db, actor, { action: "AGENCIA_MEMBRO_CONVIDADO", entityType: "agencia", entityId: agencia.id, after: { userId, funcao: d.funcao } }, { force: true });
  return { userId };
}

async function membroDaMinhaAgencia(db: Database, agenciaId: string, userId: string) {
  const m = await db.query.agenciaMembros.findFirst({ where: and(eq(agenciaMembros.userId, userId), eq(agenciaMembros.agenciaId, agenciaId)) });
  if (!m) throw new NotFoundError("Pessoa da equipe não encontrada.");
  return m;
}

/** Garante que sempre sobra um administrador ativo. */
async function outrosAdminsAtivos(db: Database, agenciaId: string, userId: string) {
  const r = await db.select({ n: count() }).from(agenciaMembros).innerJoin(users, eq(users.id, agenciaMembros.userId))
    .where(and(eq(agenciaMembros.agenciaId, agenciaId), eq(agenciaMembros.funcao, "ADMIN"), ne(agenciaMembros.userId, userId), isNull(users.disabledAt)));
  return Number(r[0]?.n ?? 0);
}

export async function mudarFuncao(db: Database, actor: Actor, userId: string, raw: { funcao: (typeof AGENCIA_FUNCOES)[number]; todosClientes: boolean }) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.gerirEquipe(membro)) throw new ForbiddenError("Só o administrador da agência muda funções.");
  const d = z.object({ funcao: z.enum(AGENCIA_FUNCOES), todosClientes: z.boolean() }).parse(raw);
  const alvo = await membroDaMinhaAgencia(db, membro.agenciaId, userId);
  if (alvo.funcao === "ADMIN" && d.funcao !== "ADMIN" && (await outrosAdminsAtivos(db, membro.agenciaId, userId)) === 0) throw new DomainError("ULTIMO_ADMIN", "A agência precisa de pelo menos um administrador.");
  await db.update(agenciaMembros).set({ funcao: d.funcao, todosClientes: d.todosClientes }).where(eq(agenciaMembros.id, alvo.id));
  await recordAudit(db, actor, { action: "AGENCIA_MEMBRO_FUNCAO", entityType: "user", entityId: userId, before: { funcao: alvo.funcao, todosClientes: alvo.todosClientes }, after: d });
}

/** Encerra o acesso: não entra mais e a sessão aberta deixa de valer. Sai da equipe dos clientes; o histórico fica. */
export async function desligarMembro(db: Database, actor: Actor, userId: string) {
  const { membro } = await escopoDaAgencia(db, actor);
  if (!pode.gerirEquipe(membro)) throw new ForbiddenError("Só o administrador da agência desliga pessoas.");
  if (userId === actor.userId) throw new DomainError("SI_MESMO", "Você não pode desligar o seu próprio acesso.");
  const alvo = await membroDaMinhaAgencia(db, membro.agenciaId, userId);
  if (alvo.funcao === "ADMIN" && (await outrosAdminsAtivos(db, membro.agenciaId, userId)) === 0) throw new DomainError("ULTIMO_ADMIN", "A agência precisa de pelo menos um administrador.");
  await db.transaction(async (tx) => {
    const agora = new Date().toISOString();
    await tx.update(users).set({ disabledAt: agora }).where(eq(users.id, userId));
    await tx.delete(agenciaClienteEquipe).where(eq(agenciaClienteEquipe.userId, userId));
    await tx.update(agenciaClientes).set({ responsavelId: null, updatedAt: agora }).where(and(eq(agenciaClientes.agenciaId, membro.agenciaId), eq(agenciaClientes.responsavelId, userId)));
  });
  await recordAudit(db, actor, { action: "AGENCIA_MEMBRO_DESLIGADO", entityType: "user", entityId: userId }, { force: true });
}
