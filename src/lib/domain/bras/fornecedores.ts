import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, bdImporterUsers, bdImporters, bdProducts, organizations, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { brasCommercialAccessFor, isValidCnpj, onlyDigits } from "./membros";
import { canViewBrasCommercialData } from "@/lib/bras/access";
import { POLOS, POLO_LABEL, SUPPLIER_CATEGORIES, SUPPLIER_PAYMENT_METHODS, SUPPLIER_TYPES, SUPPLIER_TYPE_LABEL, type Polo, type SupplierType } from "@/lib/bras/fornecedores-opcoes";

export { POLOS, POLO_LABEL, SUPPLIER_CATEGORIES, SUPPLIER_PAYMENT_METHODS, SUPPLIER_TYPES, SUPPLIER_TYPE_LABEL, type Polo, type SupplierType };

/**
 * Rede aberta de fornecedores do Brás Digital Club (D159/D160). Importadoras, distribuidores e atacadistas se cadastram
 * sozinhos (`/fornecer`), entram como PENDENTE e só aparecem para os compradores depois da aprovação no Estúdio.
 * Mesma tabela das importadoras (`bd_importers`) e mesmo painel (`/importadora`): estender, não duplicar.
 * O diretório mostra o perfil comercial do fornecedor (tipo, polo, categorias, condições); contato e preço continuam
 * passando pela equipe até a cotação pelo sistema (F3).
 */
export const supplierSignupSchema = z.object({
  supplierType: z.enum(SUPPLIER_TYPES, { message: "Escolha o tipo de fornecedor" }),
  polo: z.enum(POLOS.map((p) => p.key) as [Polo, ...Polo[]], { message: "Escolha o polo" }),
  tradeName: z.string().trim().min(2, "Informe o nome da empresa").max(80),
  legalName: z.string().trim().min(2, "Informe a razão social").max(160),
  cnpj: z.string().transform(onlyDigits).refine(isValidCnpj, "CNPJ inválido. Confira os 14 números."),
  categories: z.array(z.enum(SUPPLIER_CATEGORIES)).min(1, "Marque ao menos uma categoria").max(8, "Marque até 8 categorias"),
  description: z.string().trim().max(400).optional().transform((v) => v || null),
  address: z.string().trim().max(200).optional().transform((v) => v || null),
  minBoxes: z.number().int().min(1).max(10_000).nullable().optional(),
  paymentMethods: z.array(z.enum(SUPPLIER_PAYMENT_METHODS)).max(SUPPLIER_PAYMENT_METHODS.length).default([]),
  name: z.string().trim().min(2, "Informe o seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  whatsapp: z.string().transform(onlyDigits).refine((v) => v.length >= 10 && v.length <= 13, "Informe o WhatsApp com DDD"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
  acceptTerms: z.literal(true, { message: "Aceite os termos de uso e a política de privacidade" }),
});
export type SupplierSignupInput = z.input<typeof supplierSignupSchema>;

/** Mensagem do painel enquanto o cadastro não for aprovado (o layout da importadora mostra como aviso, não como erro). */
export const SUPPLIER_PENDING_MESSAGE = "Seu cadastro de fornecedor está em análise pela equipe do Brás Digital Club. Você recebe a resposta pelo WhatsApp ou e-mail informado.";
export const supplierRejectedMessage = (note: string | null) => `Seu cadastro de fornecedor não foi aprovado${note ? `: ${note}` : "."} Fale com a equipe para revisar.`;

/**
 * Cadastro do fornecedor pelo próprio fornecedor. Cria a empresa, o login do responsável (função Dono) e o fornecedor
 * PENDENTE, numa transação. CNPJ e e-mail únicos. Avisa a equipe no sino do Master (sem dado pessoal na mensagem).
 */
export async function signupSupplier(db: Database, raw: SupplierSignupInput) {
  const d = supplierSignupSchema.parse(raw);
  if (await db.query.bdImporters.findFirst({ where: eq(bdImporters.cnpj, d.cnpj), columns: { id: true } })) throw new DomainError("CNPJ_IN_USE", "Já existe um fornecedor com esse CNPJ. Entre com a sua conta ou fale com a equipe.");
  if (await db.query.users.findFirst({ where: eq(users.email, d.email), columns: { id: true } })) throw new DomainError("EMAIL_IN_USE", "Já existe uma conta com esse e-mail. Entre com ela ou use outro e-mail.");
  const importerId = newId("bdi"), orgId = newId("org"), userId = newId("usr");
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({ id: orgId, name: d.legalName, slug: `fornecedor-${slugify(d.tradeName).slice(0, 40)}-${importerId.slice(-6)}`, type: "SUPPLIER", brand: "BRAS_DIGITAL" });
    await tx.insert(bdImporters).values({
      id: importerId, name: d.tradeName, legalName: d.legalName, cnpj: d.cnpj, description: d.description, categories: [...d.categories],
      contacts: [{ name: d.name, role: "Responsável", phone: d.whatsapp, email: d.email, channel: "WhatsApp" }],
      minBoxes: d.minBoxes ?? null, paymentMethods: [...d.paymentMethods], pickupAddress: d.address,
      supplierType: d.supplierType, polo: d.polo, approvalStatus: "PENDENTE", signupSource: "AUTOCADASTRO", submittedAt: now, active: false, organizationId: orgId,
    });
    await tx.insert(users).values({ id: userId, name: d.name, email: d.email, role: "BRAS_IMPORTER", organizationId: orgId, passwordHash: hashPassword(d.password), mustChangePassword: false });
    await tx.insert(bdImporterUsers).values({ id: newId("bdiu"), importerId, userId, staffRole: "DONO", createdBy: userId });
    await tx.insert(activities).values({ id: newId("act"), scope: "PLATFORM", type: "BRAS_SUPPLIER_SIGNUP", message: `Brás Digital Club: novo fornecedor para aprovar (${SUPPLIER_TYPE_LABEL[d.supplierType]}, ${POLO_LABEL[d.polo]})` });
  });
  return { importerId, userId };
}

/** Fornecedores aguardando aprovação, os mais antigos primeiro (só o Master). */
export async function listPendingSuppliers(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.query.bdImporters.findMany({ where: eq(bdImporters.approvalStatus, "PENDENTE"), orderBy: [asc(bdImporters.submittedAt)] });
}

export const supplierReviewSchema = z.object({
  decision: z.enum(["APROVAR", "RECUSAR"]),
  note: z.string().trim().max(300).optional().transform((v) => v || null),
}).refine((v) => v.decision === "APROVAR" || !!v.note, { message: "Escreva o motivo da recusa (o fornecedor vê).", path: ["note"] });

/** Aprova (entra no diretório e no painel) ou recusa com motivo. Só o Master; fica na auditoria. */
export async function reviewSupplier(db: Database, actor: Actor, importerId: string, raw: z.input<typeof supplierReviewSchema>) {
  requireMaster(actor);
  const d = supplierReviewSchema.parse(raw);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
  if (!imp) throw new NotFoundError("Fornecedor não encontrado.");
  const approved = d.decision === "APROVAR";
  const after = { approvalStatus: approved ? "APROVADO" as const : "RECUSADO" as const, active: approved, reviewedAt: new Date().toISOString(), reviewedBy: actor.userId, reviewNote: d.note };
  await db.update(bdImporters).set(after).where(eq(bdImporters.id, importerId));
  await recordAudit(db, actor, { action: approved ? "BRAS_SUPPLIER_APPROVED" : "BRAS_SUPPLIER_REJECTED", entityType: "bd_importer", entityId: importerId, before: { approvalStatus: imp.approvalStatus, active: imp.active }, after }, { force: true });
  return { ok: true as const, approvalStatus: after.approvalStatus };
}

export type SupplierDirectoryFilter = { polo?: Polo | null; supplierType?: SupplierType | null; category?: string | null };

/**
 * Diretório para o comprador (D160): só membro ativo (ou o Master), só fornecedores aprovados e ativos. Mostra o perfil
 * comercial (tipo, polo, categorias, descrição, mínimo, pagamento, prazo) e quantos produtos à venda; nunca contato,
 * CNPJ, anotações internas, comissão ou plano.
 */
export async function listSupplierDirectory(db: Database, session: { user: { id: string; role: string } } | null, actor: Actor | null, f: SupplierDirectoryFilter = {}) {
  const master = actor?.role === "NEXTLEVEL_MASTER";
  if (!master && !canViewBrasCommercialData(await brasCommercialAccessFor(db, session))) throw new ForbiddenError("O diretório de fornecedores é para membros com cadastro ativo.");
  const conds = [eq(bdImporters.approvalStatus, "APROVADO"), eq(bdImporters.active, true)];
  if (f.polo) conds.push(eq(bdImporters.polo, f.polo));
  if (f.supplierType) conds.push(eq(bdImporters.supplierType, f.supplierType));
  if (f.category) conds.push(sql`${bdImporters.categories} @> ${JSON.stringify([f.category])}::jsonb`);
  const rows = await db.select({
    id: bdImporters.id, name: bdImporters.name, supplierType: bdImporters.supplierType, polo: bdImporters.polo, categories: bdImporters.categories,
    description: bdImporters.description, minBoxes: bdImporters.minBoxes, minOrderCents: bdImporters.minOrderCents, paymentMethods: bdImporters.paymentMethods, prepDays: bdImporters.prepDays,
  }).from(bdImporters).where(and(...conds)).orderBy(sql`case ${bdImporters.plan} when 'PREMIUM' then 0 when 'PRO' then 1 else 2 end`, asc(bdImporters.name)).limit(200);
  if (!rows.length) return [];
  const counts = await db.select({ importerId: bdProducts.importerId, n: sql<number>`count(*)::int` }).from(bdProducts)
    .where(and(inArray(bdProducts.importerId, rows.map((r) => r.id)), eq(bdProducts.status, "ATIVO"))).groupBy(bdProducts.importerId);
  const byId = new Map(counts.map((c) => [c.importerId, c.n]));
  return rows.map((r) => ({ ...r, productsOnSale: byId.get(r.id) ?? 0 }));
}
