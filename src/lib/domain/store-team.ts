import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { recordAudit } from "./audit";
import type { Database } from "@/db/client";
import { stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { assertStoreAdmin, type Actor } from "./access";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";

/**
 * Equipe da loja: pessoas com acesso operacional (pedidos, catálogo, clientes, etiquetas, pós-venda, avaliações)
 * SEM acesso a finanças, saldo, configurações, pagamentos, preços/publicação, cupons, serviços e à própria equipe.
 * Só o dono convida e remove. Cada pessoa tem login próprio (auditoria por usuário).
 */
const MAX_STAFF = 5;

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha provisória precisa ter ao menos 8 caracteres"),
});

function ownerStore(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("Só o dono da loja gerencia a equipe.");
  assertStoreAdmin(actor);
  return actor.storeId;
}

export async function listTeam(db: Database, actor: Actor) {
  const storeId = ownerStore(actor);
  return db.select({ id: users.id, name: users.name, email: users.email, storeRole: users.storeRole, disabledAt: users.disabledAt, lastLoginAt: users.lastLoginAt, lastLoginIp: users.lastLoginIp }).from(users).where(and(eq(users.storeId, storeId), eq(users.role, "STORE_OWNER"))).orderBy(asc(users.createdAt));
}

/** O dono cria o acesso com uma senha provisória (a pessoa troca no primeiro login). Nada é enviado por e-mail. */
export async function inviteStaff(db: Database, actor: Actor, raw: z.input<typeof inviteSchema>) {
  const storeId = ownerStore(actor);
  const d = inviteSchema.parse(raw);
  const team = await listTeam(db, actor);
  // D247 (PV6): na Commerce vale o limite de pessoas do plano (contando o dono); nas outras marcas, o limite fixo de sempre.
  const { ehLojaEcommerce, exigirVagaDePessoa } = await import("./beneficios-plano");
  if (await ehLojaEcommerce(db, storeId)) await exigirVagaDePessoa(db, storeId);
  else if (team.filter((m) => m.storeRole === "STAFF" && !m.disabledAt).length >= MAX_STAFF) throw new DomainError("TEAM_FULL", `A equipe pode ter até ${MAX_STAFF} pessoas.`);
  if (await db.query.users.findFirst({ where: eq(users.email, d.email) })) throw new DomainError("EMAIL_IN_USE", "Já existe uma conta com esse e-mail.");
  const store = await db.query.stores.findFirst({ where: eq(stores.id, storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  const id = newId("usr");
  await db.insert(users).values({ id, name: d.name, email: d.email, role: "STORE_OWNER", storeRole: "STAFF", organizationId: store.organizationId, storeId, passwordHash: hashPassword(d.password), mustChangePassword: true });
  await recordAudit(db, actor, { action: "STAFF_INVITED", entityType: "user", entityId: id, storeId }, { force: true });
  return { id };
}

/** Encerra o acesso: a pessoa não entra mais e a sessão aberta deixa de valer. O histórico (pedidos, notas) continua. */
export async function removeStaff(db: Database, actor: Actor, userId: string) {
  const storeId = ownerStore(actor);
  const done = await db.update(users).set({ disabledAt: new Date().toISOString() }).where(and(eq(users.id, userId), eq(users.storeId, storeId), eq(users.storeRole, "STAFF"))).returning({ id: users.id });
  if (done.length === 0) throw new NotFoundError("Pessoa da equipe não encontrada.");
  await recordAudit(db, actor, { action: "STAFF_REMOVED", entityType: "user", entityId: userId, storeId }, { force: true });
}
