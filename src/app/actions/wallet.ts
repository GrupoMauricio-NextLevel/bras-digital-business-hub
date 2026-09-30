"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { suppliers } from "@/db/schema";
import { getSession, isDemoMode } from "@/lib/auth";
import { runAction } from "@/lib/action-result";
import { requireStoreId, requireSupplierId } from "@/lib/domain/access";
import { DomainError, ForbiddenError, NotFoundError } from "@/lib/domain/errors";
import { createDemoRecharge, createRecharge, manualCredit, simulateDemoRecharge, syncRecharge } from "@/lib/domain/wallet";
import { walletRecharges } from "@/db/schema";
import { getBaseUrl, isPublicHttps } from "@/lib/base-url";
import { encryptSecret } from "@/lib/security/crypto";
import { MercadoPagoError, verifyAccessToken } from "@/lib/payments/mercadopago";

async function ctx() {
  const session = await getSession();
  if (!session) throw new ForbiddenError("Sessão expirada.");
  return { session, db: await getDb() };
}

function refresh() {
  revalidatePath("/merchant", "layout");
  revalidatePath("/supplier", "layout");
}

/** Lojista: gera o Pix de recarga. Sem token do fornecedor, só a demonstração gera Pix fictício. */
export async function createRechargeAction(amountCents: number) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const storeId = requireStoreId(session.actor);
    try {
      const url = await getBaseUrl();
      const r = await createRecharge(db, session.actor, storeId, amountCents, { notificationBaseUrl: isPublicHttps(url) ? url : undefined, payerEmail: session.user.email });
      refresh();
      return r;
    } catch (e) {
      if (e instanceof DomainError && e.code === "WALLET_NOT_CONFIGURED" && isDemoMode()) {
        const r = await createDemoRecharge(db, session.actor, storeId, amountCents);
        refresh();
        return { ...r, demo: true };
      }
      throw e;
    }
  });
}

/** Consulta o estado da recarga (polling da tela). */
export async function checkRechargeAction(rechargeId: string) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const storeId = requireStoreId(session.actor);
    const r = await db.query.walletRecharges.findFirst({ where: eq(walletRecharges.id, rechargeId) });
    if (!r || r.storeId !== storeId) throw new NotFoundError("Recarga não encontrada.");
    const res = await syncRecharge(db, rechargeId);
    if (res.paid) refresh();
    return res;
  });
}

export async function simulateRechargeAction(rechargeId: string) {
  return runAction(async () => {
    if (!isDemoMode()) throw new ForbiddenError("Disponível apenas na demonstração.");
    const { session, db } = await ctx();
    await simulateDemoRecharge(db, session.actor, rechargeId);
    refresh();
    return undefined;
  });
}

const creditSchema = z.object({ storeId: z.string().min(1), amountCents: z.number().int().positive(), note: z.string() });

/** ADM do fornecedor (ou master): crédito manual auditado. */
export async function manualCreditAction(input: z.input<typeof creditSchema>) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const data = creditSchema.parse(input);
    const r = await manualCredit(db, session.actor, data.storeId, { amountCents: data.amountCents, note: data.note });
    refresh();
    return r;
  });
}

const tokenSchema = z.object({ accessToken: z.string().min(20, "Cole o Access Token completo") });

/** Fornecedor conecta a própria conta Mercado Pago para receber as recargas Pix dos lojistas. */
export async function connectSupplierWalletAction(input: z.input<typeof tokenSchema>) {
  return runAction(async () => {
    const { session, db } = await ctx();
    const supplierId = requireSupplierId(session.actor);
    const token = tokenSchema.parse(input).accessToken.trim();
    if (!/^(TEST|APP_USR)-/.test(token)) throw new DomainError("MP_TOKEN", "O Access Token deve começar com APP_USR- (produção) ou TEST- (teste).");
    let account;
    try { account = await verifyAccessToken(token); } catch (e) { throw new DomainError("MP_TOKEN", e instanceof MercadoPagoError ? e.message : "Não foi possível validar o token."); }
    await db.update(suppliers).set({ walletMpTokenEnc: encryptSecret(token), walletMpAccountId: String(account.id) }).where(eq(suppliers.id, supplierId));
    refresh();
    return { nickname: account.nickname, isTest: account.isTest };
  });
}

export async function disconnectSupplierWalletAction() {
  return runAction(async () => {
    const { session, db } = await ctx();
    const supplierId = requireSupplierId(session.actor);
    await db.update(suppliers).set({ walletMpTokenEnc: null, walletMpAccountId: null }).where(eq(suppliers.id, supplierId));
    refresh();
    return undefined;
  });
}
