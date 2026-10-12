import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { groupPassCodes, organizations, users, type User } from "@/db/schema";
import { accountBrandConflict, brandByCode, type Brand, type BrandCode } from "@/lib/brand";
import { NAV } from "@/lib/nav";
import { newId } from "@/lib/ids";
import { verifyPassword } from "@/lib/security/password";
import type { Actor } from "./access";
import { recordAudit } from "./audit";
import { DomainError, ForbiddenError } from "./errors";

/**
 * Conta do grupo (D141): a mesma pessoa com perfis em marcas diferentes (loja no SuperDrop, loja na Commerce, membro da
 * Brás, transportadora…), **ligados por ela mesma com aceite** e provando que é dona dos dois (e-mail e senha do outro
 * perfil). Cada perfil continua com os próprios dados, permissões e e-mail; o grupo só permite trocar de perfil sem novo
 * login e entrar com um login só em qualquer marca do grupo. Nenhum perfil lê dados do outro.
 */
export const GROUP_MAX_PROFILES = 8;
const PASS_TTL_MS = 2 * 60_000;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

/** Só contas de cliente entram no grupo: equipe da NextLevel, expedição e equipe de loja ficam de fora. */
export function canJoinGroup(u: Pick<User, "role" | "storeRole" | "disabledAt">) {
  if (u.disabledAt) return false;
  if (u.role === "NEXTLEVEL_MASTER" || u.role === "SUPPLIER_DISPATCH") return false;
  if (u.role === "STORE_OWNER" && u.storeRole === "STAFF") return false;
  return true;
}

/** "ma***@gmail.com": o suficiente para a pessoa reconhecer o perfil, sem expor o e-mail inteiro na tela. */
export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, Math.min(3, local.length - 2)))}@${domain}`;
}

async function brandOf(db: Database, organizationId: string): Promise<BrandCode> {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId), columns: { brand: true } });
  return (org?.brand ?? "SUPERDROP") as BrandCode;
}

export type GroupProfile = { id: string; name: string; email: string; role: User["role"]; roleLabel: string; brand: BrandCode; brandName: string; current: boolean };

/** Perfis do grupo da pessoa (inclui o atual). Sem grupo: só o atual. */
export async function groupProfiles(db: Database, userId: string): Promise<GroupProfile[]> {
  const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!me) return [];
  const rows = me.groupId ? await db.select().from(users).where(and(eq(users.groupId, me.groupId), isNull(users.disabledAt))) : [me];
  const out: GroupProfile[] = [];
  for (const u of rows) {
    const brand = await brandOf(db, u.organizationId);
    out.push({ id: u.id, name: u.name, email: maskEmail(u.email), role: u.role, roleLabel: NAV[u.role].label, brand, brandName: brandByCode(brand).name, current: u.id === me.id });
  }
  return out.sort((a, b) => Number(b.current) - Number(a.current) || a.brandName.localeCompare(b.brandName));
}

export const linkSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha do outro perfil"),
  consent: z.literal(true, { message: "Para ligar os perfis, marque que você concorda." }),
});

/**
 * Liga outro perfil à conta do grupo de quem está logado. Exige o e-mail e a senha do outro perfil (prova de que é da
 * mesma pessoa) e o aceite. Se o outro perfil já tinha grupo, os dois grupos viram um só (até o limite).
 */
export async function linkProfile(db: Database, actor: Actor, raw: z.input<typeof linkSchema>, now = new Date()) {
  const v = linkSchema.parse(raw);
  const me = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
  if (!me || !canJoinGroup(me)) throw new ForbiddenError("Este tipo de conta não entra na conta do grupo.");
  const other = await db.query.users.findFirst({ where: eq(users.email, v.email) });
  // Mesma resposta para e-mail inexistente e senha errada (não revela quem tem conta).
  if (!other || !verifyPassword(v.password, other.passwordHash)) throw new DomainError("INVALID_CREDENTIALS", "E-mail ou senha do outro perfil incorretos.");
  if (other.id === me.id) throw new DomainError("GROUP_SELF", "Este já é o perfil em que você está.");
  if (!canJoinGroup(other)) throw new DomainError("GROUP_ROLE", "Este perfil não pode entrar na conta do grupo (contas da equipe ficam de fora).");
  if (me.groupId && me.groupId === other.groupId) throw new DomainError("GROUP_ALREADY", "Este perfil já está na sua conta do grupo.");
  const groupId = me.groupId ?? me.id;
  const memberIds = new Set<string>([me.id, other.id]);
  for (const g of [me.groupId, other.groupId]) if (g) for (const r of await db.select({ id: users.id }).from(users).where(eq(users.groupId, g))) memberIds.add(r.id);
  if (memberIds.size > GROUP_MAX_PROFILES) throw new DomainError("GROUP_LIMIT", `A conta do grupo junta até ${GROUP_MAX_PROFILES} perfis.`);
  await db.update(users).set({ groupId, groupLinkedAt: now.toISOString() }).where(inArray(users.id, [...memberIds]));
  await recordAudit(db, actor, { action: "GROUP_LINKED", entityType: "user", entityId: other.id, after: { groupId, profiles: memberIds.size, consentAt: now.toISOString() } }, { force: true });
  return { groupId, profiles: memberIds.size };
}

/** Tira um perfil do grupo (o próprio ou outro do mesmo grupo). Sobrou um só: o grupo deixa de existir. */
export async function unlinkProfile(db: Database, actor: Actor, profileId: string) {
  const me = await db.query.users.findFirst({ where: eq(users.id, actor.userId) });
  const target = await db.query.users.findFirst({ where: eq(users.id, profileId) });
  if (!me?.groupId || !target || target.groupId !== me.groupId) throw new ForbiddenError("Este perfil não está na sua conta do grupo.");
  await db.update(users).set({ groupId: null, groupLinkedAt: null }).where(eq(users.id, target.id));
  const rest = await db.select({ id: users.id }).from(users).where(eq(users.groupId, me.groupId));
  if (rest.length <= 1) await db.update(users).set({ groupId: null, groupLinkedAt: null }).where(eq(users.groupId, me.groupId));
  await recordAudit(db, actor, { action: "GROUP_UNLINKED", entityType: "user", entityId: target.id, before: { groupId: me.groupId } }, { force: true });
  return { ok: true };
}

/** Perfil de destino, conferido: do mesmo grupo, ativo e de cliente. */
async function sameGroupTarget(db: Database, fromUserId: string, targetId: string) {
  const [me, target] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, fromUserId) }), db.query.users.findFirst({ where: eq(users.id, targetId) })]);
  if (!me?.groupId || me.disabledAt || !target || target.groupId !== me.groupId || !canJoinGroup(target)) throw new ForbiddenError("Este perfil não está na sua conta do grupo.");
  return target;
}

/**
 * Trocar de perfil. Mesmo endereço (a marca do destino entra por aqui): troca a sessão direto. Outra marca: código de
 * uso único (2 minutos) para abrir o perfil no endereço dela, sem novo login.
 */
export async function switchProfile(db: Database, actor: Actor, targetId: string, hostBrand: Brand | null, now = new Date()): Promise<{ kind: "SESSION"; userId: string; home: string } | { kind: "PASS"; url: string }> {
  const target = await sameGroupTarget(db, actor.userId, targetId);
  const brand = await brandOf(db, target.organizationId);
  if (!accountBrandConflict({ role: target.role, brand }, hostBrand)) return { kind: "SESSION", userId: target.id, home: NAV[target.role].base };
  const code = randomBytes(24).toString("base64url");
  await db.insert(groupPassCodes).values({ id: newId("gpc"), codeHash: hash(code), userId: target.id, fromUserId: actor.userId, expiresAt: new Date(now.getTime() + PASS_TTL_MS).toISOString() });
  await recordAudit(db, actor, { action: "GROUP_PASS_CREATED", entityType: "user", entityId: target.id }, { force: true });
  return { kind: "PASS", url: `${brandByCode(brand).baseUrl}/account/passagem?c=${encodeURIComponent(code)}` };
}

/** Usa o código da passagem (uma vez, no prazo, com os dois perfis ainda no mesmo grupo). Devolve o perfil a abrir. */
export async function consumePassCode(db: Database, code: string, now = new Date()): Promise<{ userId: string; home: string } | null> {
  if (!code || code.length > 100) return null;
  const [row] = await db.update(groupPassCodes).set({ usedAt: now.toISOString() }).where(and(eq(groupPassCodes.codeHash, hash(code)), isNull(groupPassCodes.usedAt), gt(groupPassCodes.expiresAt, now.toISOString()))).returning();
  if (!row) return null;
  try {
    const target = await sameGroupTarget(db, row.fromUserId, row.userId);
    return { userId: target.id, home: NAV[target.role].base };
  } catch { return null; }
}

/**
 * Login com a conta do grupo: a senha certa de um perfil abre o perfil do grupo que é da marca deste endereço. Sem
 * perfil desta marca, devolve `null` (vale o aviso de sempre: "sua conta é da marca X").
 */
export async function profileForHost(db: Database, user: User, hostBrand: Brand | null): Promise<User | null> {
  if (!accountBrandConflict({ role: user.role, brand: await brandOf(db, user.organizationId) }, hostBrand)) return user;
  if (!user.groupId || !canJoinGroup(user)) return null;
  const rows = await db.select().from(users).where(and(eq(users.groupId, user.groupId), isNull(users.disabledAt)));
  for (const u of rows) if (canJoinGroup(u) && !accountBrandConflict({ role: u.role, brand: await brandOf(db, u.organizationId) }, hostBrand)) return u;
  return null;
}
