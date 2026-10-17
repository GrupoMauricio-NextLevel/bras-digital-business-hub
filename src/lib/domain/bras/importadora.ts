import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { syncLoadCollected } from "../cargas/coleta";
import { z } from "zod";
import type { Database } from "@/db/client";
import { BRAS_IMPORTER_STAFF_ROLES, auditLog, bdImporterUsers, bdImporters, bdProducts, bdRequests, bdStockMovements, bdWarehouses, organizations, users } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { hashPassword } from "@/lib/security/password";
import { isMaster, requireMaster, type Actor } from "../access";
import { recordAudit } from "../audit";
import { DomainError, ForbiddenError, NotFoundError } from "../errors";
import { brasShippingView } from "./catalogo";
import { notifyBrasRequestStatus } from "./avisos";
import { applyStockDelta } from "./estoque";
import { isValidCnpj, onlyDigits } from "./membros";
import { getBrasRules } from "./regras";
import { SUPPLIER_PENDING_MESSAGE, supplierRejectedMessage } from "./fornecedores";

/**
 * Importadora parceira da Brás (D110): painel com login próprio (`BRAS_IMPORTER`) e a ficha 360 no Estúdio.
 * Fronteira (D92): a importadora vê do pedido só `brasShippingView` (o que retirar e para onde enviar), nunca CNPJ,
 * e-mail, WhatsApp, empresa do membro, preço ou o código de retirada (que ela confere, não lê).
 * Cada importadora só enxerga e mexe no que é dela; o Master enxerga todas.
 */
export type BrasStaffRole = (typeof BRAS_IMPORTER_STAFF_ROLES)[number];
export const BRAS_STAFF_LABEL: Record<BrasStaffRole, string> = { DONO: "Dono", COMERCIAL: "Comercial", ESTOQUE: "Estoque", BALCAO: "Balcão", FINANCEIRO: "Financeiro" };
export type BrasImporterAbility = "ficha" | "equipe" | "produtos" | "estoque" | "pedidos_ver" | "pedidos_balcao" | "pedidos_disponibilidade";
const CAN: Record<BrasStaffRole, BrasImporterAbility[]> = {
  DONO: ["ficha", "equipe", "produtos", "estoque", "pedidos_ver", "pedidos_balcao", "pedidos_disponibilidade"],
  COMERCIAL: ["produtos", "pedidos_ver", "pedidos_disponibilidade"],
  ESTOQUE: ["estoque", "pedidos_ver", "pedidos_balcao"],
  BALCAO: ["pedidos_ver", "pedidos_balcao"],
  FINANCEIRO: ["pedidos_ver"],
};
export const brasStaffCan = (role: BrasStaffRole, a: BrasImporterAbility) => CAN[role].includes(a);

/** Importadora e função do usuário logado. Importadora pausada não entra. */
export async function myImporter(db: Database, actor: Actor) {
  if (actor.role !== "BRAS_IMPORTER") throw new ForbiddenError("Área da importadora parceira do Brás Digital Club.");
  const [row] = await db.select({ link: bdImporterUsers, importer: bdImporters }).from(bdImporterUsers).innerJoin(bdImporters, eq(bdImporters.id, bdImporterUsers.importerId)).where(eq(bdImporterUsers.userId, actor.userId)).limit(1);
  if (!row) throw new ForbiddenError("Seu acesso não está ligado a uma importadora. Fale com a equipe do Brás Digital Club.");
  // Rede aberta (D160): fornecedor que se cadastrou sozinho espera a aprovação; recusado vê o motivo.
  if (row.importer.approvalStatus === "PENDENTE") throw new ForbiddenError(SUPPLIER_PENDING_MESSAGE);
  if (row.importer.approvalStatus === "RECUSADO") throw new ForbiddenError(supplierRejectedMessage(row.importer.reviewNote));
  if (!row.importer.active) throw new ForbiddenError("A importadora está pausada no Brás Digital Club. Fale com a equipe.");
  return { importer: row.importer, staffRole: row.link.staffRole };
}

/** Quem pode agir sobre a importadora: o Master (qualquer uma) ou a própria importadora, com a função certa. */
async function importerScope(db: Database, actor: Actor, importerId: string | null, ability: BrasImporterAbility) {
  if (isMaster(actor)) {
    if (!importerId) throw new DomainError("IMPORTER", "Escolha a importadora.");
    const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId) });
    if (!imp) throw new NotFoundError("Importadora não encontrada.");
    return { importer: imp, staffRole: "DONO" as BrasStaffRole, master: true };
  }
  const me = await myImporter(db, actor);
  if (importerId && importerId !== me.importer.id) throw new ForbiddenError();
  if (!brasStaffCan(me.staffRole, ability)) throw new ForbiddenError(`Sua função (${BRAS_STAFF_LABEL[me.staffRole]}) não faz isso. Fale com o dono da importadora.`);
  return { ...me, master: false };
}

// ---------------------------------------------------------------------------
// Acesso (login) da importadora
// ---------------------------------------------------------------------------
const accessSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha provisória precisa ter ao menos 8 caracteres"),
  staffRole: z.enum(BRAS_IMPORTER_STAFF_ROLES).default("DONO"),
});

/** Cria o login de alguém da importadora (Master, ou o dono para a própria equipe). Senha provisória: troca no 1º login. */
export async function createImporterAccess(db: Database, actor: Actor, importerId: string | null, raw: z.input<typeof accessSchema>) {
  const s = await importerScope(db, actor, importerId, "equipe");
  const d = accessSchema.parse(raw);
  if (!s.master && d.staffRole === "DONO") throw new ForbiddenError("Só a equipe da Brás cria outro dono.");
  if (await db.query.users.findFirst({ where: eq(users.email, d.email), columns: { id: true } })) throw new DomainError("EMAIL_IN_USE", "Já existe uma conta com esse e-mail.");
  const imp = s.importer;
  const userId = newId("usr");
  await db.transaction(async (tx) => {
    let orgId = imp.organizationId;
    if (!orgId) {
      orgId = newId("org");
      await tx.insert(organizations).values({ id: orgId, name: imp.legalName || imp.name, slug: `importadora-${slugify(imp.name).slice(0, 40)}-${imp.id.slice(-6)}`, type: "SUPPLIER", brand: "BRAS_DIGITAL" });
      await tx.update(bdImporters).set({ organizationId: orgId }).where(eq(bdImporters.id, imp.id));
    }
    await tx.insert(users).values({ id: userId, name: d.name, email: d.email, role: "BRAS_IMPORTER", organizationId: orgId, passwordHash: hashPassword(d.password), mustChangePassword: true });
    await tx.insert(bdImporterUsers).values({ id: newId("bdiu"), importerId: imp.id, userId, staffRole: d.staffRole, createdBy: actor.userId });
  });
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_ACCESS_CREATED", entityType: "bd_importer", entityId: imp.id, after: { userId, staffRole: d.staffRole } }, { force: true });
  return { userId };
}

export async function listImporterAccess(db: Database, actor: Actor, importerId: string | null) {
  const s = await importerScope(db, actor, importerId, "equipe");
  return db.select({ userId: users.id, name: users.name, email: users.email, staffRole: bdImporterUsers.staffRole, disabledAt: users.disabledAt, lastLoginAt: users.lastLoginAt })
    .from(bdImporterUsers).innerJoin(users, eq(users.id, bdImporterUsers.userId)).where(eq(bdImporterUsers.importerId, s.importer.id)).orderBy(asc(users.createdAt));
}

/** Encerra um acesso (a pessoa não entra mais). O dono não encerra o próprio acesso. */
export async function revokeImporterAccess(db: Database, actor: Actor, importerId: string | null, userId: string) {
  const s = await importerScope(db, actor, importerId, "equipe");
  if (userId === actor.userId) throw new DomainError("SELF", "Você não pode encerrar o próprio acesso.");
  const link = await db.query.bdImporterUsers.findFirst({ where: and(eq(bdImporterUsers.userId, userId), eq(bdImporterUsers.importerId, s.importer.id)) });
  if (!link) throw new NotFoundError("Pessoa não encontrada nesta importadora.");
  await db.update(users).set({ disabledAt: new Date().toISOString() }).where(eq(users.id, userId));
  await recordAudit(db, actor, { action: "BRAS_IMPORTER_ACCESS_REVOKED", entityType: "bd_importer", entityId: s.importer.id, after: { userId } }, { force: true });
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Ficha (Importadora 360)
// ---------------------------------------------------------------------------
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
export const importerProfileSchema = z.object({
  legalName: opt(160), cnpj: z.string().optional().transform((v) => (v ? onlyDigits(v) : null)).refine((v) => !v || isValidCnpj(v), "CNPJ inválido. Confira os 14 números."),
  stateRegistration: opt(30), description: opt(600), origin: opt(80), pickupAddress: opt(200),
  categories: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  contacts: z.array(z.object({ name: z.string().trim().min(2).max(80), role: z.string().trim().min(2).max(40), phone: z.string().trim().max(20).optional(), email: z.string().trim().max(120).optional(), channel: z.string().trim().max(20).optional() })).max(10).default([]),
  minBoxes: z.number().int().min(1).max(10_000).nullable().optional(),
  minOrderCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  paymentMethods: z.array(z.enum(["PIX", "DINHEIRO", "BOLETO", "CARTAO", "TRANSFERENCIA"])).max(5).default([]),
  prepDays: z.number().int().min(0).max(60).nullable().optional(),
  exchangePolicy: opt(1500),
  /** Só o Master: modo de estoque e plano. */
  stockMode: z.enum(["MANUAL", "PLANILHA", "BLING"]).optional(),
  plan: z.enum(["GRATIS", "PRO", "PREMIUM"]).optional(),
});
/** Campos que só a equipe da Brás muda (afetam cobrança e integração). */
const MASTER_ONLY = ["stockMode", "plan"] as const;

export async function updateImporterProfile(db: Database, actor: Actor, importerId: string | null, raw: z.input<typeof importerProfileSchema>) {
  const s = await importerScope(db, actor, importerId, "ficha");
  const v = importerProfileSchema.parse(raw);
  if (!s.master) for (const k of MASTER_ONLY) delete (v as Record<string, unknown>)[k];
  if (v.stockMode === "BLING") throw new DomainError("BLING", "A integração com o Bling entra na fase F7, depois das credenciais do aplicativo da NextLevel.");
  const before = s.importer;
  // Só os campos enviados mudam (a importadora pode mandar só a descrição sem apagar o resto da ficha).
  const enviados = new Set(Object.keys(raw ?? {}));
  const patch = Object.fromEntries(Object.entries(v).filter(([k, x]) => x !== undefined && enviados.has(k)));
  if (!Object.keys(patch).length) return { changed: [] as string[] };
  await db.update(bdImporters).set(patch).where(eq(bdImporters.id, s.importer.id));
  const changed = Object.keys(patch).filter((k) => JSON.stringify((before as Record<string, unknown>)[k] ?? null) !== JSON.stringify((patch as Record<string, unknown>)[k] ?? null));
  if (changed.length) await recordAudit(db, actor, { action: "BRAS_IMPORTER_PROFILE", entityType: "bd_importer", entityId: s.importer.id, before: Object.fromEntries(changed.map((k) => [k, (before as Record<string, unknown>)[k] ?? null])), after: Object.fromEntries(changed.map((k) => [k, (patch as Record<string, unknown>)[k] ?? null])) }, { force: true });
  return { changed };
}

// ---------------------------------------------------------------------------
// Galpões
// ---------------------------------------------------------------------------
export const warehouseSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome (ex.: Galpão Rua Oriente)").max(80),
  address: z.string().trim().min(5, "Informe o endereço").max(200),
  hours: opt(120), rules: opt(400), contact: opt(120),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function listWarehouses(db: Database, actor: Actor, importerId: string | null) {
  const s = await importerScope(db, actor, importerId, "pedidos_ver");
  return db.select().from(bdWarehouses).where(eq(bdWarehouses.importerId, s.importer.id)).orderBy(desc(bdWarehouses.isDefault), asc(bdWarehouses.name));
}

export async function saveWarehouse(db: Database, actor: Actor, importerId: string | null, id: string | null, raw: z.input<typeof warehouseSchema>) {
  const s = await importerScope(db, actor, importerId, "ficha");
  const v = warehouseSchema.parse(raw);
  const existing = await db.select({ id: bdWarehouses.id }).from(bdWarehouses).where(eq(bdWarehouses.importerId, s.importer.id));
  const isDefault = v.isDefault || existing.length === 0 || (existing.length === 1 && existing[0]!.id === id);
  const wid = id ?? newId("bdwh");
  await db.transaction(async (tx) => {
    if (isDefault) await tx.update(bdWarehouses).set({ isDefault: false }).where(eq(bdWarehouses.importerId, s.importer.id));
    if (id) {
      const upd = await tx.update(bdWarehouses).set({ ...v, isDefault }).where(and(eq(bdWarehouses.id, id), eq(bdWarehouses.importerId, s.importer.id))).returning({ id: bdWarehouses.id });
      if (!upd.length) throw new NotFoundError("Galpão não encontrado.");
    } else await tx.insert(bdWarehouses).values({ id: wid, importerId: s.importer.id, ...v, isDefault });
    // O galpão padrão vira o endereço de retirada do comprovante (D103), se a ficha ainda não tem um.
    if (isDefault && !s.importer.pickupAddress) await tx.update(bdImporters).set({ pickupAddress: v.address }).where(eq(bdImporters.id, s.importer.id));
  });
  await recordAudit(db, actor, { action: id ? "BRAS_WAREHOUSE_UPDATED" : "BRAS_WAREHOUSE_CREATED", entityType: "bd_warehouse", entityId: wid, after: { importerId: s.importer.id, name: v.name, isDefault } });
  return { id: wid };
}

// ---------------------------------------------------------------------------
// Produtos de caixa fechada
// ---------------------------------------------------------------------------
const tiers = z.array(z.object({ minBoxes: z.number().int().min(1).max(100_000), priceBoxCents: z.number().int().min(1, "Preço da caixa obrigatório").max(100_000_000) })).min(1, "Informe o preço da caixa").max(6)
  .refine((t) => t[0]!.minBoxes === 1, "A primeira faixa começa em 1 caixa.")
  .refine((t) => t.every((x, i) => i === 0 || x.minBoxes > t[i - 1]!.minBoxes), "As faixas precisam subir: 1, depois 5, depois 20…")
  .refine((t) => t.every((x, i) => i === 0 || x.priceBoxCents <= t[i - 1]!.priceBoxCents), "Quem compra mais caixas não pode pagar mais caro por caixa.");
const mm = z.number().int().min(10, "Medida em centímetros (mínimo 1 cm)").max(5000).nullable().optional();
export const productSchema = z.object({
  sku: z.string().trim().min(1, "Informe o código (SKU)").max(40).transform((v) => v.toUpperCase()),
  title: z.string().trim().min(3, "Dê um nome ao produto").max(140),
  description: opt(1000), category: opt(60),
  unitsPerBox: z.number().int().min(1, "Quantas unidades vêm na caixa?").max(100_000),
  boxLengthMm: mm, boxWidthMm: mm, boxHeightMm: mm,
  grossWeightG: z.number().int().min(1).max(2_000_000).nullable().optional(),
  priceTiers: tiers,
  minBoxes: z.number().int().min(1).max(10_000).default(1),
  warehouseId: opt(60), ncm: opt(10), barcode: opt(20),
  status: z.enum(["RASCUNHO", "ATIVO", "ESGOTADO", "ALTO_MAR"]).default("RASCUNHO"),
});
export type BrasProductInput = z.input<typeof productSchema>;

/** Cubagem da caixa em litros (dm³), com uma casa: 50 × 40 × 30 cm = 60,0 L. */
export function brasBoxLiters(p: { boxLengthMm: number | null; boxWidthMm: number | null; boxHeightMm: number | null }): number | null {
  if (!p.boxLengthMm || !p.boxWidthMm || !p.boxHeightMm) return null;
  return Math.round((p.boxLengthMm * p.boxWidthMm * p.boxHeightMm) / 100_000) / 10;
}
/** Preço da caixa para uma quantidade (faixa mais alta alcançada). */
export function brasTierPrice(t: { minBoxes: number; priceBoxCents: number }[], boxes: number): number {
  return [...t].sort((a, b) => a.minBoxes - b.minBoxes).filter((x) => boxes >= x.minBoxes).at(-1)?.priceBoxCents ?? t[0]!.priceBoxCents;
}

export async function listImporterProducts(db: Database, actor: Actor, importerId: string | null) {
  const s = await importerScope(db, actor, importerId, "pedidos_ver");
  return db.select().from(bdProducts).where(eq(bdProducts.importerId, s.importer.id)).orderBy(asc(bdProducts.title));
}

export async function saveImporterProduct(db: Database, actor: Actor, importerId: string | null, id: string | null, raw: BrasProductInput) {
  const s = await importerScope(db, actor, importerId, "produtos");
  const v = productSchema.parse(raw);
  if (v.warehouseId && !(await db.query.bdWarehouses.findFirst({ where: and(eq(bdWarehouses.id, v.warehouseId), eq(bdWarehouses.importerId, s.importer.id)), columns: { id: true } }))) throw new NotFoundError("Galpão não encontrado.");
  const dup = await db.query.bdProducts.findFirst({ where: and(eq(bdProducts.importerId, s.importer.id), eq(bdProducts.sku, v.sku)), columns: { id: true } });
  if (dup && dup.id !== id) throw new DomainError("SKU_TAKEN", `Já existe um produto com o código ${v.sku}.`);
  const now = new Date().toISOString();
  if (id) {
    const cur = await db.query.bdProducts.findFirst({ where: and(eq(bdProducts.id, id), eq(bdProducts.importerId, s.importer.id)) });
    if (!cur) throw new NotFoundError("Produto não encontrado.");
    // Esgotado é consequência do saldo: só a importadora não marca "ativo" sem caixa.
    const status = v.status === "ATIVO" && cur.stockBoxes === 0 ? "ESGOTADO" : v.status;
    await db.update(bdProducts).set({ ...v, status, updatedAt: now }).where(eq(bdProducts.id, id));
    if (JSON.stringify(cur.priceTiers) !== JSON.stringify(v.priceTiers) || cur.status !== status) await recordAudit(db, actor, { action: "BRAS_PRODUCT_UPDATED", entityType: "bd_product", entityId: id, before: { priceTiers: cur.priceTiers, status: cur.status }, after: { priceTiers: v.priceTiers, status } });
    return { id };
  }
  const nid = newId("bdp");
  await db.insert(bdProducts).values({ id: nid, importerId: s.importer.id, ...v, status: v.status === "ATIVO" ? "ESGOTADO" : v.status, stockBoxes: 0 });
  await recordAudit(db, actor, { action: "BRAS_PRODUCT_CREATED", entityType: "bd_product", entityId: nid, after: { importerId: s.importer.id, sku: v.sku } });
  return { id: nid };
}

// ---------------------------------------------------------------------------
// Estoque manual
// ---------------------------------------------------------------------------
export const stockMoveSchema = z.object({
  productId: z.string().min(1),
  kind: z.enum(["ENTRADA", "SAIDA", "AJUSTE", "CONTAGEM"]),
  /** ENTRADA/SAIDA: caixas (positivo). AJUSTE: diferença (pode ser negativa). CONTAGEM: saldo contado. */
  boxes: z.number().int().min(-1_000_000).max(1_000_000),
  note: z.string().trim().max(200).optional(),
});

export async function moveImporterStock(db: Database, actor: Actor, importerId: string | null, raw: z.input<typeof stockMoveSchema>, source: "MANUAL" | "PLANILHA" = "MANUAL") {
  const s = await importerScope(db, actor, importerId, "estoque");
  if (s.importer.stockMode === "BLING") throw new DomainError("BLING", "O estoque desta importadora vem do Bling: ajuste lá.");
  const v = stockMoveSchema.parse(raw);
  const p = await db.query.bdProducts.findFirst({ where: and(eq(bdProducts.id, v.productId), eq(bdProducts.importerId, s.importer.id)) });
  if (!p) throw new NotFoundError("Produto não encontrado.");
  if ((v.kind === "ENTRADA" || v.kind === "SAIDA") && v.boxes <= 0) throw new DomainError("BOXES", "Informe quantas caixas (mais que zero).");
  if (v.kind === "CONTAGEM" && v.boxes < 0) throw new DomainError("BOXES", "A contagem não pode ser negativa.");
  if (v.kind === "AJUSTE" && (v.boxes === 0 || !v.note)) throw new DomainError("NOTE", "Ajuste precisa da diferença e do motivo (ex.: \"2 caixas avariadas\").");
  const delta = v.kind === "ENTRADA" ? v.boxes : v.kind === "SAIDA" ? -v.boxes : v.kind === "AJUSTE" ? v.boxes : v.boxes - p.stockBoxes;
  // Contagem sem diferença também conta: renova o frescor do saldo.
  return applyStockDelta(db, { productId: p.id, importerId: s.importer.id, delta, kind: v.kind, source, note: v.note ?? null, actorUserId: actor.userId });
}

export async function listStockMovements(db: Database, actor: Actor, importerId: string | null, productId?: string, limit = 100) {
  const s = await importerScope(db, actor, importerId, "pedidos_ver");
  return db.select({ m: bdStockMovements, title: bdProducts.title, sku: bdProducts.sku }).from(bdStockMovements).innerJoin(bdProducts, eq(bdProducts.id, bdStockMovements.productId))
    .where(and(eq(bdStockMovements.importerId, s.importer.id), productId ? eq(bdStockMovements.productId, productId) : undefined)).orderBy(desc(bdStockMovements.createdAt)).limit(limit);
}

// ---------------------------------------------------------------------------
// Planilha de produtos e estoque (prévia antes de aplicar)
// ---------------------------------------------------------------------------
export const STOCK_SHEET_COLUMNS = ["SKU", "Produto", "Unidades por caixa", "Preço da caixa (R$)", "Comprimento (cm)", "Largura (cm)", "Altura (cm)", "Peso (kg)", "Mínimo de caixas", "Categoria", "Caixas em estoque"] as const;
export type StockSheetLine = { line: number; sku: string; action: "CRIAR" | "ATUALIZAR" | "IGNORAR"; title: string; stockBefore: number | null; stockAfter: number | null; errors: string[]; input?: BrasProductInput; productId?: string };

const num = (s: string) => { const t = s.trim().replace(/\s/g, ""); if (!t) return null; const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t); return Number.isFinite(n) ? n : NaN; };

/** Lê a planilha (primeira linha = cabeçalho) e devolve o que vai acontecer em cada linha, sem gravar nada. */
export async function previewStockSheet(db: Database, actor: Actor, importerId: string | null, matrix: string[][]): Promise<StockSheetLine[]> {
  const s = await importerScope(db, actor, importerId, "estoque");
  if (s.importer.stockMode === "BLING") throw new DomainError("BLING", "O estoque desta importadora vem do Bling.");
  const [head, ...rows] = matrix;
  if (!head) throw new DomainError("EMPTY", "A planilha está vazia.");
  const idx = (name: string) => head.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  if (idx("SKU") < 0) throw new DomainError("HEADER", "Falta a coluna SKU. Use a planilha modelo.");
  if (rows.length > 1000) throw new DomainError("TOO_MANY", "Até 1.000 linhas por vez.");
  const existing = new Map((await db.select().from(bdProducts).where(eq(bdProducts.importerId, s.importer.id))).map((p) => [p.sku, p]));
  const seen = new Set<string>();
  return rows.map((r, i): StockSheetLine => {
    const get = (c: (typeof STOCK_SHEET_COLUMNS)[number]) => { const j = idx(c); return j >= 0 ? (r[j] ?? "").trim() : ""; };
    const sku = get("SKU").toUpperCase();
    const line = i + 2;
    if (!sku && r.every((c) => !c?.trim())) return { line, sku: "", action: "IGNORAR", title: "", stockBefore: null, stockAfter: null, errors: [] };
    const errors: string[] = [];
    if (!sku) errors.push("SKU vazio");
    if (seen.has(sku)) errors.push("SKU repetido na planilha");
    seen.add(sku);
    const cur = existing.get(sku);
    const n = { units: num(get("Unidades por caixa")), price: num(get("Preço da caixa (R$)")), l: num(get("Comprimento (cm)")), w: num(get("Largura (cm)")), h: num(get("Altura (cm)")), kg: num(get("Peso (kg)")), min: num(get("Mínimo de caixas")), stock: num(get("Caixas em estoque")) };
    for (const [k, v] of Object.entries(n)) if (Number.isNaN(v)) errors.push(`Número inválido em ${k === "units" ? "Unidades por caixa" : k === "price" ? "Preço" : k === "stock" ? "Caixas em estoque" : "medidas/peso"}`);
    if (n.stock !== null && !Number.isNaN(n.stock) && (n.stock < 0 || !Number.isInteger(n.stock))) errors.push("Caixas em estoque: número inteiro, zero ou mais");
    const title = get("Produto") || cur?.title || "";
    const cm = (v: number | null) => (v === null || Number.isNaN(v) ? undefined : Math.round(v * 10));
    const input: BrasProductInput | undefined = cur || title ? {
      sku, title, category: get("Categoria") || cur?.category || undefined,
      unitsPerBox: n.units !== null && !Number.isNaN(n.units) ? n.units : (cur?.unitsPerBox ?? 0),
      priceTiers: n.price !== null && !Number.isNaN(n.price) ? [{ minBoxes: 1, priceBoxCents: Math.round(n.price * 100) }, ...((cur?.priceTiers ?? []).filter((t) => t.minBoxes > 1 && t.priceBoxCents <= Math.round(n.price! * 100)))] : (cur?.priceTiers ?? []),
      boxLengthMm: cm(n.l) ?? cur?.boxLengthMm ?? null, boxWidthMm: cm(n.w) ?? cur?.boxWidthMm ?? null, boxHeightMm: cm(n.h) ?? cur?.boxHeightMm ?? null,
      grossWeightG: n.kg !== null && !Number.isNaN(n.kg) ? Math.round(n.kg * 1000) : (cur?.grossWeightG ?? null),
      minBoxes: n.min !== null && !Number.isNaN(n.min) ? n.min : (cur?.minBoxes ?? 1),
      description: cur?.description ?? undefined, warehouseId: cur?.warehouseId ?? undefined, ncm: cur?.ncm ?? undefined, barcode: cur?.barcode ?? undefined,
      status: cur?.status ?? "ATIVO",
    } : undefined;
    if (!cur && !title) errors.push("Produto novo precisa do nome");
    if (input) { const p = productSchema.safeParse(input); if (!p.success) errors.push(...p.error.issues.map((x) => x.message)); }
    const stockAfter = n.stock !== null && !Number.isNaN(n.stock) ? n.stock : null;
    return { line, sku, action: errors.length ? "IGNORAR" : cur ? "ATUALIZAR" : "CRIAR", title, stockBefore: cur?.stockBoxes ?? (cur ? 0 : null), stockAfter, errors, input, productId: cur?.id };
  }).filter((l) => l.sku || l.errors.length);
}

/** Aplica só as linhas sem erro: cria ou atualiza o produto e, se veio "Caixas em estoque", grava a contagem. */
export async function applyStockSheet(db: Database, actor: Actor, importerId: string | null, matrix: string[][]) {
  const lines = await previewStockSheet(db, actor, importerId, matrix);
  const s = await importerScope(db, actor, importerId, "estoque");
  let created = 0, updated = 0, counted = 0;
  for (const l of lines) {
    if (l.action === "IGNORAR" || !l.input) continue;
    const { id } = await saveImporterProduct(db, actor, isMaster(actor) ? s.importer.id : null, l.productId ?? null, l.input).catch((e) => { if (e instanceof ForbiddenError && !isMaster(actor)) throw new ForbiddenError("Criar ou mudar produto é do Comercial ou do dono. Peça para eles subirem a planilha."); throw e; });
    if (l.productId) updated++; else created++;
    if (l.stockAfter !== null) { await moveImporterStock(db, actor, isMaster(actor) ? s.importer.id : null, { productId: id, kind: "CONTAGEM", boxes: l.stockAfter, note: `Planilha, linha ${l.line}` }, "PLANILHA"); counted++; }
  }
  await recordAudit(db, actor, { action: "BRAS_STOCK_SHEET", entityType: "bd_importer", entityId: s.importer.id, after: { created, updated, counted, ignored: lines.filter((l) => l.action === "IGNORAR").length } }, { force: true });
  return { created, updated, counted, ignored: lines.filter((l) => l.action === "IGNORAR").length };
}

// ---------------------------------------------------------------------------
// Pedidos (visão da importadora)
// ---------------------------------------------------------------------------
export type ImporterRequest = ReturnType<typeof brasShippingView> & { id: string; createdAt: string; availabilityConfirmedAt: string | null; separatedAt: string | null; pickedUpAt: string | null };
const importerLine = (r: typeof bdRequests.$inferSelect): ImporterRequest => ({
  id: r.id, ...brasShippingView(r), createdAt: new Date(r.createdAt).toISOString(),
  availabilityConfirmedAt: r.availabilityConfirmedAt ? new Date(r.availabilityConfirmedAt).toISOString() : null,
  separatedAt: r.separatedAt ? new Date(r.separatedAt).toISOString() : null,
  pickedUpAt: r.pickedUpAt ? new Date(r.pickedUpAt).toISOString() : null,
});

export async function listImporterRequests(db: Database, actor: Actor, opts: { status?: "ABERTOS" | "RETIRADOS" | "TODOS" } = {}) {
  const s = await importerScope(db, actor, null, "pedidos_ver");
  const st = opts.status === "RETIRADOS" ? ["PICKED_UP"] as const : opts.status === "TODOS" ? null : ["NEW", "CONFIRMED", "PAID"] as const;
  const rows = await db.select().from(bdRequests).where(and(eq(bdRequests.importerId, s.importer.id), st ? inArray(bdRequests.status, [...st]) : undefined)).orderBy(desc(bdRequests.createdAt)).limit(300);
  return rows.map(importerLine);
}

async function ownRequest(db: Database, actor: Actor, requestId: string, ability: BrasImporterAbility) {
  const s = await importerScope(db, actor, null, ability);
  const r = await db.query.bdRequests.findFirst({ where: and(eq(bdRequests.id, requestId), eq(bdRequests.importerId, s.importer.id)) });
  if (!r) throw new NotFoundError("Pedido não encontrado.");
  return { s, r };
}

/** "Tenho as caixas": a importadora confere a disponibilidade de um pedido recebido ou confirmado. */
export async function confirmRequestAvailability(db: Database, actor: Actor, requestId: string) {
  const { r } = await ownRequest(db, actor, requestId, "pedidos_disponibilidade");
  if (r.status !== "NEW" && r.status !== "CONFIRMED") throw new DomainError("STATUS", "Este pedido não está mais aguardando disponibilidade.");
  if (r.availabilityConfirmedAt) return { ok: true as const, already: true };
  await db.update(bdRequests).set({ availabilityConfirmedAt: new Date().toISOString() }).where(eq(bdRequests.id, r.id));
  await recordAudit(db, actor, { action: "BRAS_REQUEST_AVAILABLE", entityType: "bd_request", entityId: r.id, after: { availabilityConfirmed: true } });
  return { ok: true as const, already: false };
}

/** Caixas separadas no galpão (pedido confirmado ou pago), prontas para a transportadora. */
export async function markRequestSeparated(db: Database, actor: Actor, requestId: string) {
  const { r } = await ownRequest(db, actor, requestId, "pedidos_balcao");
  if (r.status !== "CONFIRMED" && r.status !== "PAID") throw new DomainError("STATUS", "Só pedidos confirmados ou pagos são separados.");
  if (r.separatedAt) return { ok: true as const, already: true };
  await db.update(bdRequests).set({ separatedAt: new Date().toISOString() }).where(eq(bdRequests.id, r.id));
  await recordAudit(db, actor, { action: "BRAS_REQUEST_SEPARATED", entityType: "bd_request", entityId: r.id, after: { separated: true } });
  return { ok: true as const, already: false };
}

/** Entrega à transportadora: pedido pago e o código que o motorista apresenta (a importadora não vê o código). */
export async function importerConfirmPickup(db: Database, actor: Actor, requestId: string, code: string) {
  const { s, r } = await ownRequest(db, actor, requestId, "pedidos_balcao");
  if (r.status !== "PAID") throw new DomainError("NOT_PAID", "Este pedido ainda não está pago: a retirada só é liberada depois do pagamento.");
  if (!r.pickupCode || code.trim().toUpperCase().replace(/\s/g, "") !== r.pickupCode) throw new DomainError("CODE", "Código de retirada não confere. Peça ao motorista o código do comprovante.");
  const now = new Date().toISOString();
  const upd = await db.update(bdRequests).set({ status: "PICKED_UP", pickedUpAt: now, separatedAt: r.separatedAt ?? now, updatedAt: now }).where(and(eq(bdRequests.id, r.id), eq(bdRequests.status, "PAID"))).returning({ id: bdRequests.id });
  if (!upd.length) throw new DomainError("STATUS_RACE", "O pedido mudou. Atualize a página.");
  await db.insert(auditLog).values({ id: newId("aud"), actorUserId: actor.userId, actorRole: "BRAS_IMPORTER", action: "BRAS_REQUEST_STATUS", entityType: "bd_request", entityId: r.id, changes: { status: { from: "PAID", to: "PICKED_UP" }, importerId: { to: s.importer.id } } });
  await notifyBrasRequestStatus(db, r.id, "PICKED_UP");
  await syncLoadCollected(db, r.id);
  return { ok: true as const, number: r.number };
}

// ---------------------------------------------------------------------------
// Hoje (fila do dia)
// ---------------------------------------------------------------------------
export async function importerToday(db: Database, actor: Actor, now = new Date()) {
  const me = await myImporter(db, actor);
  const rules = await getBrasRules(db);
  const [reqs, prods, whs] = await Promise.all([
    db.select().from(bdRequests).where(and(eq(bdRequests.importerId, me.importer.id), inArray(bdRequests.status, ["NEW", "CONFIRMED", "PAID"]))).orderBy(asc(bdRequests.createdAt)),
    db.select().from(bdProducts).where(eq(bdProducts.importerId, me.importer.id)),
    db.select({ id: bdWarehouses.id }).from(bdWarehouses).where(and(eq(bdWarehouses.importerId, me.importer.id), eq(bdWarehouses.active, true))),
  ]);
  const staleMs = rules.stock.freshnessHours * 3_600_000;
  const ativos = prods.filter((p) => p.status === "ATIVO" || p.status === "ESGOTADO");
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const [mes] = await db.select({ n: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${bdRequests.boxes}), 0)` }).from(bdRequests).where(and(eq(bdRequests.importerId, me.importer.id), inArray(bdRequests.status, ["PAID", "PICKED_UP"]), gte(bdRequests.createdAt, since)));
  return {
    importer: { id: me.importer.id, name: me.importer.name, stockMode: me.importer.stockMode, plan: me.importer.plan }, staffRole: me.staffRole,
    conferir: reqs.filter((r) => (r.status === "NEW" || r.status === "CONFIRMED") && !r.availabilityConfirmedAt).map(importerLine),
    separar: reqs.filter((r) => r.status === "CONFIRMED" && !r.separatedAt).map(importerLine),
    entregar: reqs.filter((r) => r.status === "PAID").map(importerLine),
    esgotando: ativos.filter((p) => p.stockBoxes <= Math.max(3, p.minBoxes * 2)).map((p) => ({ id: p.id, title: p.title, sku: p.sku, stockBoxes: p.stockBoxes })),
    desatualizados: ativos.filter((p) => !p.stockUpdatedAt || now.getTime() - new Date(p.stockUpdatedAt).getTime() > staleMs).length,
    produtos: prods.length, galpoes: whs.length,
    mes: { pedidos: Number(mes?.n ?? 0), caixas: Number(mes?.total ?? 0) },
  };
}

/** Todos os produtos de caixa fechada (só Master), para ligar oferta de descoberta a produto. */
export async function listAllBrasProducts(db: Database, actor: Actor) {
  requireMaster(actor);
  return db.select().from(bdProducts).orderBy(asc(bdProducts.title)).limit(2000);
}
