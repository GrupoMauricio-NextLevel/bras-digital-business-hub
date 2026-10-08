import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { bdMembers, organizations, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import type { BrasCommercialAccess } from "@/lib/bras/access";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, NotFoundError } from "../errors";

/**
 * Membro comprador da Brás Digital (D92): cadastro grátis e simples com CNPJ, liberado na hora.
 * O Master pode bloquear (ex.: concorrente ou importadora se passando por lojista). A validação do CNPJ na Receita
 * fica para a segunda etapa; aqui só os dígitos verificadores e um cadastro por CNPJ.
 */
export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Dígitos verificadores do CNPJ (14 dígitos, sem sequência repetida). */
export function isValidCnpj(raw: string): boolean {
  const c = onlyDigits(raw);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((s, d, i) => s + Number(d) * pesos[i]!, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

export const formatCnpj = (raw: string) => onlyDigits(raw).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

export const brasSignupSchema = z.object({
  name: z.string().trim().min(2, "Informe o seu nome"),
  companyName: z.string().trim().min(2, "Informe o nome da empresa"),
  cnpj: z.string().refine(isValidCnpj, "CNPJ inválido. Confira os 14 números."),
  whatsapp: z.string().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 13, "Informe o WhatsApp com DDD"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

/** Cadastro público: cria a organização da empresa (marca Brás), o usuário membro e o registro do CNPJ. Sem taxa. */
export async function signupBrasMember(db: Database, raw: z.input<typeof brasSignupSchema>) {
  const input = brasSignupSchema.parse(raw);
  const cnpj = onlyDigits(input.cnpj);
  const email = input.email.toLowerCase();
  if (await db.query.bdMembers.findFirst({ where: eq(bdMembers.cnpj, cnpj), columns: { id: true } })) {
    throw new DomainError("CNPJ_TAKEN", "Este CNPJ já tem cadastro. Entre com o e-mail cadastrado ou fale com o suporte.");
  }
  if (await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } })) {
    throw new DomainError("EMAIL_TAKEN", "Já existe uma conta com este e-mail. Entre com ele ou use outro.");
  }
  const organizationId = newId("org");
  const userId = newId("usr");
  const memberId = newId("bdm");
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({ id: organizationId, name: input.companyName, slug: `${slugify(input.companyName).slice(0, 40)}-${cnpj.slice(-6)}`, type: "MERCHANT", brand: "BRAS_DIGITAL" });
    await tx.insert(users).values({ id: userId, name: input.name, email, role: "BRAS_MEMBER", organizationId, passwordHash: hashPassword(input.password) });
    await tx.insert(bdMembers).values({ id: memberId, userId, organizationId, cnpj, companyName: input.companyName, whatsapp: input.whatsapp });
  });
  return { userId, memberId };
}

export async function getBrasMemberByUser(db: Database, userId: string) {
  return (await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, userId) })) ?? null;
}

/**
 * Acesso comercial a partir do banco (nunca de cookie, parâmetro ou corpo da requisição):
 * membro da Brás com cadastro ativo vê preço e estoque; bloqueado, visitante e qualquer outro papel não.
 */
export async function brasCommercialAccessFor(db: Database, session: { user: { id: string; role: string } } | null | undefined): Promise<BrasCommercialAccess> {
  if (!session?.user?.id) return { authenticated: false, approvedMember: false };
  if (session.user.role !== "BRAS_MEMBER") return { authenticated: true, approvedMember: false };
  const m = await getBrasMemberByUser(db, session.user.id);
  return { authenticated: true, approvedMember: m?.status === "ACTIVE" };
}

/** Lista para o Estúdio (só Master): dados de contato do membro nunca saem para importadora. */
export async function listBrasMembers(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select({ id: bdMembers.id, companyName: bdMembers.companyName, cnpj: bdMembers.cnpj, whatsapp: bdMembers.whatsapp, status: bdMembers.status, blockedReason: bdMembers.blockedReason, createdAt: bdMembers.createdAt, name: users.name, email: users.email })
    .from(bdMembers).innerJoin(users, eq(users.id, bdMembers.userId)).orderBy(desc(bdMembers.createdAt)).limit(500);
}

/** Bloqueia ou libera um membro (só Master, com motivo ao bloquear). Fica na trilha de auditoria. */
export async function setBrasMemberStatus(db: Database, actor: Actor, memberId: string, status: "ACTIVE" | "BLOCKED", reason?: string) {
  requireMaster(actor);
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.id, memberId) });
  if (!m) throw new NotFoundError("Membro não encontrado.");
  const motivo = reason?.trim().slice(0, 200) || null;
  if (status === "BLOCKED" && !motivo) throw new DomainError("REASON", "Informe o motivo do bloqueio.");
  const after = status === "BLOCKED" ? { status, blockedAt: new Date().toISOString(), blockedReason: motivo } : { status, blockedAt: null, blockedReason: null };
  await db.update(bdMembers).set(after).where(eq(bdMembers.id, memberId));
  await recordAudit(db, actor, { action: status === "BLOCKED" ? "BRAS_MEMBER_BLOCKED" : "BRAS_MEMBER_ACTIVATED", entityType: "bd_member", entityId: memberId, before: { status: m.status }, after: { status } });
  return { ok: true as const };
}
