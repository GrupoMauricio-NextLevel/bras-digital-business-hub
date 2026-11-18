import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { activities, inventory, inventoryMovements, orderItems, productPackItems, productPacks, productReviews, productStoreAccess, productVariants, products, stockAlerts, storePriceTiers, storeProducts } from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { adjustStock, getLevels, receiveStock } from "./inventory";
import { DomainError, NotFoundError } from "./errors";
import { ensureCategory } from "./products";
import { SIZE_GRID_KEYS } from "./size-grids";
import { ownedBy, toOwner, type OwnerRef } from "./independent";

/**
 * Edição completa do produto (D328): tudo o que o cadastro grava pode ser mudado depois, num salvamento só
 * (fotos, informações, categoria, SKU, endereço, preços, status, frete, buscadores e variações com estoque).
 * Na loja independente, o que o painel mostra é o que a loja vende: preço e status vão juntos para a vitrine.
 */

const money = z.coerce.number().int().nonnegative();
/** Tudo que a loja mostra como foto; "art:" é só a ilustração de quem não tem foto. */
export const ehFotoReal = (s: string) => !!s && !s.startsWith("art:");
export const FOTO_VAZIA = "art:#111827,#ffffff,#9ca3af";
export const MAX_FOTOS = 8;

const variacaoSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Tamanho em branco").max(12, "Tamanho com até 12 letras").transform((s) => s.toUpperCase()),
  color: z.string().trim().max(24).nullish().transform((c) => (c ? c[0]!.toUpperCase() + c.slice(1) : null)),
  sku: z.string().trim().max(60).default("").transform((s) => s.toUpperCase()),
  barcode: z.string().trim().max(20).regex(/^[0-9]*$/, "Código de barras só com números").default(""),
  /** Estoque físico desejado: a diferença vira uma movimentação de ajuste (nunca abaixo do reservado). */
  estoque: z.coerce.number().int().min(0).max(999_999),
});

export const salvarProdutoSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(3, "Nome muito curto"),
  description: z.string().default(""),
  categoryName: z.string().trim().transform((v) => v || "Geral"),
  sku: z.string().trim().min(2, "Informe o SKU").max(40).transform((s) => s.toUpperCase()),
  slug: z.string().trim().max(120).default(""),
  costCents: money,
  suggestedPriceCents: money,
  minimumPriceCents: money,
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
  sellsUnit: z.boolean(),
  sellsPack: z.boolean(),
  seoTitle: z.string().max(120).default(""),
  seoDescription: z.string().max(320).default(""),
  sizeGrid: z.enum(SIZE_GRID_KEYS).optional(),
  weightG: z.coerce.number().int().min(1).max(30000).default(300),
  lengthCm: z.coerce.number().int().min(1).max(200).default(30),
  widthCm: z.coerce.number().int().min(1).max(200).default(25),
  heightCm: z.coerce.number().int().min(1).max(200).default(3),
  images: z.array(z.string().min(1)).max(MAX_FOTOS, `Até ${MAX_FOTOS} fotos`).optional(),
  /** Lista completa das variações. Ausente = não mexe. Variação que sumiu da lista é removida (se nunca vendeu). */
  variacoes: z.array(variacaoSchema).min(1, "O produto precisa de pelo menos um tamanho").max(240).optional(),
});
export type SalvarProdutoInput = z.input<typeof salvarProdutoSchema>;

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Loja independente: a linha da vitrine (`store_products`) acompanha o produto. Ativo = à venda pelo preço de venda;
 * rascunho, arquivado ou excluído = fora da loja. Rede de fornecedor: cada loja define o próprio preço (não mexe).
 */
export async function sincronizarLojaPropria(db: Database | Tx, productId: string) {
  const p = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!p?.storeId) return;
  const ativo = p.status === "ACTIVE";
  const linha = await db.query.storeProducts.findFirst({ where: and(eq(storeProducts.storeId, p.storeId), eq(storeProducts.productId, p.id)) });
  if (linha) {
    await db.update(storeProducts).set({ active: ativo, priceCents: p.suggestedPriceCents, ...(ativo ? {} : { featured: false }) }).where(and(eq(storeProducts.storeId, p.storeId), eq(storeProducts.productId, p.id)));
  } else if (ativo) {
    const pack = p.sellsPack ? await db.query.productPacks.findFirst({ where: eq(productPacks.productId, p.id) }) : null;
    await db.insert(storeProducts).values({ storeId: p.storeId, productId: p.id, priceCents: p.suggestedPriceCents, packPriceCents: pack?.suggestedPriceCents ?? null, active: true, featured: false }).onConflictDoNothing();
  }
}

/** Variações que já aparecem num pedido (não podem ser apagadas: o histórico aponta para elas). */
async function variacoesVendidas(db: Database | Tx, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await db.select({ id: orderItems.variantId }).from(orderItems).where(inArray(orderItems.variantId, ids));
  return new Set(rows.map((r) => r.id!).filter(Boolean));
}

const rotulo = (v: { size: string; color: string | null }) => (v.color ? `${v.color} ${v.size}` : v.size);

/** Salva o produto inteiro numa transação. Devolve o id (o endereço pode ter mudado, o id não). */
export async function salvarProduto(db: Database, ownerRef: OwnerRef, raw: SalvarProdutoInput, actorUserId?: string) {
  const input = salvarProdutoSchema.parse(raw);
  const owner = toOwner(ownerRef);
  const atual = await db.query.products.findFirst({ where: and(eq(products.id, input.productId), ownedBy(products, owner), ne(products.status, "DELETED")) });
  if (!atual) throw new NotFoundError("Produto não encontrado.");
  const minimo = input.minimumPriceCents || input.suggestedPriceCents;
  if (minimo > input.suggestedPriceCents) throw new DomainError("PRICE_RULE", "O preço mínimo não pode ser maior que o preço de venda.");
  if (!input.sellsUnit && !input.sellsPack) throw new DomainError("SALE_TYPE", "Escolha venda unitária, grade ou as duas.");

  if (input.sku !== atual.sku) {
    const dup = await db.query.products.findFirst({ where: and(ownedBy(products, owner), eq(products.sku, input.sku), ne(products.id, atual.id)) });
    if (dup) throw new DomainError("SKU_TAKEN", `Já existe outro produto com o SKU ${input.sku}.`);
  }
  const slug = slugify(input.slug || input.name);
  if (!slug) throw new DomainError("SLUG", "Endereço da página inválido.");
  if (slug !== atual.slug) {
    const dup = await db.query.products.findFirst({ where: and(ownedBy(products, owner), eq(products.slug, slug), ne(products.id, atual.id)) });
    if (dup) throw new DomainError("SLUG_TAKEN", `O endereço “${slug}” já é de outro produto. Escolha outro.`);
  }

  await db.transaction(async (tx) => {
    const categoryId = await ensureCategory(tx, owner, input.categoryName);
    const imagens = input.images ? input.images.filter(ehFotoReal) : null;
    await tx.update(products).set({
      name: input.name, description: input.description, categoryId, sku: input.sku, slug,
      costCents: input.costCents, suggestedPriceCents: input.suggestedPriceCents, minimumPriceCents: minimo,
      status: input.status, sellsUnit: input.sellsUnit, sellsPack: input.sellsPack, seoTitle: input.seoTitle, seoDescription: input.seoDescription,
      ...(input.sizeGrid ? { sizeGrid: input.sizeGrid } : {}),
      weightG: input.weightG, lengthCm: input.lengthCm, widthCm: input.widthCm, heightCm: input.heightCm,
      ...(imagens ? { images: imagens.length ? imagens : [FOTO_VAZIA] } : {}),
      updatedAt: new Date().toISOString(),
    }).where(eq(products.id, atual.id));

    if (input.variacoes) await salvarVariacoes(tx, atual.id, atual.sku, input.sku, input.variacoes, actorUserId);
    await sincronizarLojaPropria(tx, atual.id);
    await tx.insert(activities).values({ id: newId("act"), scope: owner.supplierId ? "SUPPLIER" : "STORE", supplierId: owner.supplierId ?? null, storeId: owner.storeId ?? null, type: "PRODUCT_UPDATED", message: `Produto “${input.name}” atualizado (${input.sku})` });
  });
  return { productId: atual.id };
}

/**
 * Variações (cor × tamanho): cria, renomeia, reordena, muda SKU e código de barras, ajusta o estoque e remove.
 * Remover só o que nunca foi vendido nem está reservado; com venda, o lojista zera o estoque (sai da loja) ou renomeia.
 */
async function salvarVariacoes(tx: Tx, productId: string, skuAntigo: string, skuNovo: string, lista: z.output<typeof variacaoSchema>[], actorUserId?: string) {
  const atuais = await tx.select().from(productVariants).where(eq(productVariants.productId, productId));
  const porId = new Map(atuais.map((v) => [v.id, v]));
  if (lista.some((v) => v.id && !porId.has(v.id))) throw new NotFoundError("Variação não pertence a este produto.");
  const chave = (v: { size: string; color: string | null }) => `${(v.color ?? "").toLowerCase()}|${v.size.toLowerCase()}`;
  const vistos = new Set<string>();
  for (const v of lista) { const k = chave(v); if (vistos.has(k)) throw new DomainError("SIZES", `Tamanho repetido: ${rotulo(v)}.`); vistos.add(k); }

  // SKU de cada variação: em branco = SKU do produto + tamanho (+ cor); trocar o SKU do produto leva junto os que seguiam o antigo.
  const sufixoCor = (c: string | null) => (c ? `-${c.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "").toUpperCase().slice(0, 8)}` : "");
  const skuDe = (v: z.output<typeof variacaoSchema>) => {
    let s = v.sku || `${skuNovo}-${v.size}${sufixoCor(v.color)}`;
    if (skuAntigo !== skuNovo && s.startsWith(`${skuAntigo}-`)) s = `${skuNovo}-${s.slice(skuAntigo.length + 1)}`;
    return s;
  };
  const skus = lista.map(skuDe);
  if (new Set(skus).size !== skus.length) throw new DomainError("SKU_TAKEN", "Duas variações com o mesmo SKU.");

  // Remoções primeiro (liberam tamanho/SKU para quem vier depois).
  const ficam = new Set(lista.map((v) => v.id).filter(Boolean));
  const sair = atuais.filter((v) => !ficam.has(v.id));
  if (sair.length) {
    const vendidas = await variacoesVendidas(tx, sair.map((v) => v.id));
    const niveis = await getLevels(tx as unknown as Database, sair.map((v) => v.id));
    for (const v of sair) {
      if (vendidas.has(v.id)) throw new DomainError("VARIACAO_VENDIDA", `${rotulo(v)} já foi vendido e não pode ser removido (o pedido guarda esse tamanho). Zere o estoque para ele sair da loja, ou renomeie.`);
      if ((niveis.get(v.id)?.reserved ?? 0) > 0) throw new DomainError("VARIACAO_RESERVADA", `${rotulo(v)} tem peças reservadas em pedidos em andamento. Remova depois que o pedido sair.`);
    }
    const ids = sair.map((v) => v.id);
    const itensDeGrade = await tx.select().from(productPackItems).where(inArray(productPackItems.variantId, ids));
    await tx.delete(productPackItems).where(inArray(productPackItems.variantId, ids));
    for (const packId of new Set(itensDeGrade.map((i) => i.packId))) {
      const resto = await tx.select().from(productPackItems).where(eq(productPackItems.packId, packId));
      const total = resto.reduce((s, i) => s + i.quantity, 0);
      if (total === 0) {
        const vendida = await tx.query.orderItems.findFirst({ where: eq(orderItems.packId, packId), columns: { id: true } });
        if (vendida) throw new DomainError("GRADE_EM_USO", "Uma grade já vendida ficaria sem peças. Edite a grade antes de remover esses tamanhos.");
        await tx.delete(productPacks).where(eq(productPacks.id, packId));
      } else await tx.update(productPacks).set({ totalQuantity: total }).where(eq(productPacks.id, packId));
    }
    await tx.delete(stockAlerts).where(inArray(stockAlerts.variantId, ids));
    await tx.delete(inventoryMovements).where(inArray(inventoryMovements.variantId, ids));
    await tx.delete(inventory).where(inArray(inventory.variantId, ids));
    await tx.delete(productVariants).where(inArray(productVariants.id, ids));
  }

  // SKU temporário evita colisão quando dois tamanhos trocam de SKU entre si.
  for (const v of lista) if (v.id) await tx.update(productVariants).set({ sku: `~${v.id}` }).where(eq(productVariants.id, v.id));
  const ids: string[] = [];
  for (const [position, v] of lista.entries()) {
    const sku = skus[position]!;
    if (v.id) {
      await tx.update(productVariants).set({ size: v.size, color: v.color, sku, barcode: v.barcode, position }).where(eq(productVariants.id, v.id));
      ids.push(v.id);
    } else {
      const id = newId("var");
      await tx.insert(productVariants).values({ id, productId, size: v.size, color: v.color, sku, barcode: v.barcode, position });
      ids.push(id);
    }
  }
  const niveis = await getLevels(tx as unknown as Database, ids);
  for (const [i, v] of lista.entries()) {
    const id = ids[i]!;
    const atual = niveis.get(id)?.onHand ?? 0;
    const delta = v.estoque - atual;
    if (delta === 0) continue;
    const ref = { referenceType: "EDITOR", note: "Estoque ajustado no cadastro do produto", actorUserId };
    if (!v.id && delta > 0) await receiveStock(tx as unknown as Database, id, delta, ref);
    else {
      const reservado = niveis.get(id)?.reserved ?? 0;
      if (v.estoque < reservado) throw new DomainError("INSUFFICIENT_STOCK", `${rotulo(v)} tem ${reservado} peça(s) reservada(s): o estoque não pode ficar abaixo disso.`);
      await adjustStock(tx as unknown as Database, id, delta, ref);
    }
  }
}

/** Excluir (D328): sem venda, apaga de verdade; com venda, some de tudo e o pedido antigo continua legível. */
export async function excluirProdutos(db: Database, ownerRef: OwnerRef, ids: string[]): Promise<{ apagados: number; escondidos: number }> {
  if (!ids.length) return { apagados: 0, escondidos: 0 };
  const owner = toOwner(ownerRef);
  const lista = await db.select().from(products).where(and(ownedBy(products, owner), inArray(products.id, ids), ne(products.status, "DELETED")));
  let apagados = 0, escondidos = 0;
  for (const p of lista) {
    const vendido = await db.query.orderItems.findFirst({ where: eq(orderItems.productId, p.id), columns: { id: true } });
    await db.transaction(async (tx) => {
      if (vendido) {
        // Libera SKU e endereço para um produto novo; o pedido guarda nome, tamanho e preço na própria linha.
        const marca = newId("x").slice(-5);
        await tx.update(products).set({ status: "DELETED", sku: `${p.sku}-EXCL-${marca}`, slug: `${p.slug}-excluido-${marca}`, updatedAt: new Date().toISOString() }).where(eq(products.id, p.id));
        await tx.update(storeProducts).set({ active: false, featured: false }).where(eq(storeProducts.productId, p.id));
        escondidos++;
      } else {
        const variantes = (await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, p.id))).map((v) => v.id);
        const packs = (await tx.select({ id: productPacks.id }).from(productPacks).where(eq(productPacks.productId, p.id))).map((x) => x.id);
        await tx.delete(stockAlerts).where(eq(stockAlerts.productId, p.id));
        await tx.delete(productReviews).where(eq(productReviews.productId, p.id));
        await tx.delete(storePriceTiers).where(eq(storePriceTiers.productId, p.id));
        if (packs.length) await tx.delete(productPackItems).where(inArray(productPackItems.packId, packs));
        await tx.delete(productPacks).where(eq(productPacks.productId, p.id));
        if (variantes.length) {
          await tx.delete(inventoryMovements).where(inArray(inventoryMovements.variantId, variantes));
          await tx.delete(inventory).where(inArray(inventory.variantId, variantes));
        }
        await tx.delete(productVariants).where(eq(productVariants.productId, p.id));
        await tx.delete(storeProducts).where(eq(storeProducts.productId, p.id));
        await tx.delete(productStoreAccess).where(eq(productStoreAccess.productId, p.id));
        await tx.delete(products).where(eq(products.id, p.id));
        apagados++;
      }
      await tx.insert(activities).values({ id: newId("act"), scope: owner.supplierId ? "SUPPLIER" : "STORE", supplierId: owner.supplierId ?? null, storeId: owner.storeId ?? null, type: "PRODUCT_DELETED", message: `Produto “${p.name}” excluído (${p.sku})${vendido ? "; pedidos antigos mantidos" : ""}` });
    });
  }
  return { apagados, escondidos };
}
