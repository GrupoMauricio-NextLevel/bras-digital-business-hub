import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { MASTER_FUNCTIONS } from "@/lib/master-equipe";
import { isMasterOwner, type Actor } from "./access";
import { recordAudit } from "./audit";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

/**
 * Equipe do Master (D138): o dono cadastra pessoas com uma função (Comercial, Suporte, Financeiro, Conteúdo) ou o
 * contador parceiro (só a fila do Meu Contador). Senha provisória, troca obrigatória no primeiro acesso.
 */
const requireOwner = (actor: Actor) => { if (!isMasterOwner(actor)) throw new ForbiddenError("Só o dono do Master cadastra a equipe."); };

export async function listMasterTeam(db: Database, actor: Actor) {
  requireOwner(actor);
  return db.select({ id: users.id, name: users.name, email: users.email, masterFunction: users.masterFunction, disabledAt: users.disabledAt, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
    .from(users).where(eq(users.role, "NEXTLEVEL_MASTER")).orderBy(asc(users.createdAt));
}

export const memberSchema = z.object({
  name: z.string().trim().min(3).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, "A senha provisória precisa de pelo menos 10 caracteres.").max(100),
  masterFunction: z.enum(MASTER_FUNCTIONS),
});

export async function createMasterMember(db: Database, actor: Actor, raw: z.input<typeof memberSchema>) {
  requireOwner(actor);
  const v = memberSchema.parse(raw);
  if (await db.query.users.findFirst({ where: eq(users.email, v.email) })) throw new DomainError("EMAIL_TAKEN", "Já existe um usuário com este e-mail.");
  const id = newId("usr");
  await db.insert(users).values({ id, name: v.name, email: v.email, role: "NEXTLEVEL_MASTER", organizationId: actor.organizationId, passwordHash: hashPassword(v.password), mustChangePassword: true, masterFunction: v.masterFunction });
  await recordAudit(db, actor, { action: "MASTER_TEAM_CREATED", entityType: "user", entityId: id, after: { email: v.email, masterFunction: v.masterFunction } }, { force: true });
  return { id };
}

/** Muda a função ou encerra/devolve o acesso. Nunca mexe em outro dono nem em si mesmo. */
export async function updateMasterMember(db: Database, actor: Actor, userId: string, patch: { masterFunction?: (typeof MASTER_FUNCTIONS)[number]; disabled?: boolean }) {
  requireOwner(actor);
  const u = await db.query.users.findFirst({ where: and(eq(users.id, userId), eq(users.role, "NEXTLEVEL_MASTER")) });
  if (!u) throw new NotFoundError("Pessoa não encontrada.");
  if (u.id === actor.userId || !u.masterFunction) throw new DomainError("OWNER", "O acesso de dono não é alterado por aqui.");
  const set: Partial<typeof users.$inferInsert> = {};
  if (patch.masterFunction) set.masterFunction = z.enum(MASTER_FUNCTIONS).parse(patch.masterFunction);
  if (patch.disabled !== undefined) set.disabledAt = patch.disabled ? new Date().toISOString() : null;
  await db.update(users).set(set).where(eq(users.id, userId));
  await recordAudit(db, actor, { action: "MASTER_TEAM_UPDATED", entityType: "user", entityId: userId, before: { masterFunction: u.masterFunction, disabledAt: u.disabledAt }, after: set }, { force: true });
  return { ok: true };
}

