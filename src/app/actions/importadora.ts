"use server";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getDb } from "@/db/client";
import { getSession } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { ForbiddenError } from "@/lib/domain/errors";
import { readSpreadsheet, type ImportSource } from "@/lib/domain/product-import-server";
import {
  applyStockSheet, confirmRequestAvailability, createImporterAccess, importerConfirmPickup, markRequestSeparated, moveImporterStock, previewStockSheet,
  revokeImporterAccess, saveImporterProduct, saveWarehouse, updateImporterProfile, type BrasProductInput, type importerProfileSchema, type stockMoveSchema, type warehouseSchema,
} from "@/lib/domain/bras/importadora";
import { rateLimit } from "@/lib/rate-limit";
import { DomainError } from "@/lib/domain/errors";

/**
 * Ações do painel da importadora (D110) e da Importadora 360 no Estúdio. `importerId` vazio = a importadora do usuário logado;
 * preenchido = só o Master (o domínio confere). Nada aqui confia no navegador para saber de quem é o dado.
 */
async function ctx() {
  const s = await getSession();
  if (!s) throw new ForbiddenError("Sessão expirada.");
  return { actor: s.actor, db: await getDb() };
}
const refresh = (importerId?: string | null) => { revalidatePath("/importadora", "layout"); revalidatePath("/bras/importadoras", "layout"); if (importerId) revalidatePath(`/bras/importadoras/${importerId}`); };

export async function confirmAvailabilityAction(requestId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await confirmRequestAvailability(db, actor, requestId); refresh(); revalidatePath("/bras"); return r; });
}
export async function markSeparatedAction(requestId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await markRequestSeparated(db, actor, requestId); refresh(); return r; });
}
export async function importerPickupAction(requestId: string, code: string) {
  return runAction(async () => {
    const { actor, db } = await ctx();
    if (!rateLimit(`imp-pickup:${actor.userId}`, 12, 15 * 60_000)) throw new DomainError("RATE_LIMIT", "Muitas tentativas de código. Aguarde alguns minutos.");
    const r = await importerConfirmPickup(db, actor, requestId, code); refresh(); revalidatePath("/bras"); return r;
  });
}
export async function saveProductAction(importerId: string | null, id: string | null, input: BrasProductInput) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveImporterProduct(db, actor, importerId, id, input); refresh(importerId); return r; });
}
export async function moveStockAction(importerId: string | null, input: z.input<typeof stockMoveSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await moveImporterStock(db, actor, importerId, input); refresh(importerId); revalidatePath("/meu-bras", "layout"); return r; });
}
export async function previewStockSheetAction(importerId: string | null, file: ImportSource) {
  return runAction(async () => { const { actor, db } = await ctx(); return previewStockSheet(db, actor, importerId, await readSpreadsheet(file)); });
}
export async function applyStockSheetAction(importerId: string | null, file: ImportSource) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await applyStockSheet(db, actor, importerId, await readSpreadsheet(file)); refresh(importerId); revalidatePath("/meu-bras", "layout"); return r; });
}
export async function saveWarehouseAction(importerId: string | null, id: string | null, input: z.input<typeof warehouseSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await saveWarehouse(db, actor, importerId, id, input); refresh(importerId); return r; });
}
export async function updateImporterProfileAction(importerId: string | null, input: z.input<typeof importerProfileSchema>) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await updateImporterProfile(db, actor, importerId, input); refresh(importerId); return r; });
}
export async function createImporterAccessAction(importerId: string | null, input: { name: string; email: string; password: string; staffRole?: "DONO" | "COMERCIAL" | "ESTOQUE" | "BALCAO" | "FINANCEIRO" }) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await createImporterAccess(db, actor, importerId, input); refresh(importerId); return r; });
}
export async function revokeImporterAccessAction(importerId: string | null, userId: string) {
  return runAction(async () => { const { actor, db } = await ctx(); const r = await revokeImporterAccess(db, actor, importerId, userId); refresh(importerId); return r; });
}
