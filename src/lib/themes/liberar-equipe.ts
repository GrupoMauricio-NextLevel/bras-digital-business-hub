import { and, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { entitlements, financeInvoices, stores, storeThemes, themes } from "@/db/schema";
import { emitEvent } from "@/lib/domain/events";
import { DomainError, NotFoundError } from "@/lib/domain/errors";
import { grantEntitlement } from "@/lib/domain/entitlements";
import { markInvoicePaid } from "@/lib/domain/finance";
import { supplierOfStore, themeQuote } from "@/lib/domain/nextlevel-billing";
import { newId } from "@/lib/ids";
import { THEME_BY_KEY, themeEntitlementKey } from "./catalog";
import { applyThemeToStore } from "./install";
import { hasStorefront, ownedThemeKeys } from "./license";

/**
 * Liberação de temas pagos pela equipe NextLevel (D329): o Master (ou quem está agindo em nome do cliente no modo suporte)
 * libera um tema avançado para uma loja de duas formas:
 *  - CORTESIA: sem custo para o cliente (licença de cortesia, permanente, com o motivo e quem liberou);
 *  - PAGO_FORA: o cliente pagou por fora (Pix direto, dinheiro, transferência, maquininha). Gera a fatura do tema já paga,
 *    que entra no caixa (financeiro do Master) com a forma de pagamento informada, e a licença sai pelo caminho normal.
 * Opcionalmente instala o tema na hora (o visual anterior fica no histórico, como na instalação do lojista).
 *
 * Também libera a "Edição completa" (EDITOR_COMPLETO): todas as funções do editor em qualquer tema, para os sites
 * montados pela equipe (Sites Express).
 */
export const EDITOR_COMPLETO = "EDITOR_COMPLETO";
export const FORMAS_PAGAMENTO_FORA = { PIX: "Pix direto", DINHEIRO: "Dinheiro", TRANSFERENCIA: "Transferência", CARTAO: "Cartão na maquininha", OUTRO: "Outro" } as const;

export const liberarTemaSchema = z.object({
  /** Chave do tema, ou "editor-completo" para a Edição completa. */
  item: z.string().min(1).max(40),
  modo: z.enum(["CORTESIA", "PAGO_FORA"]),
  forma: z.enum(["PIX", "DINHEIRO", "TRANSFERENCIA", "CARTAO", "OUTRO"]).optional(),
  /** Valor recebido em centavos (PAGO_FORA). Sem valor, usa o preço do tema no Pix. */
  valorCents: z.number().int().min(0).max(10_000_000).optional(),
  nota: z.string().trim().max(300).optional(),
  instalar: z.boolean().default(false),
});
export type LiberarTemaInput = z.input<typeof liberarTemaSchema>;

export type TemaParaLiberar = { key: string; name: string; level: number; priceCents: number; owned: boolean; active: boolean; release: string };

/** Lista para a tela da equipe: temas pagos (e a Edição completa), com o que a loja já tem e o ativo. */
export async function temasParaLiberar(db: Database, storeId: string, now = new Date()) {
  const [owned, ativo, editor] = await Promise.all([
    ownedThemeKeys(db, storeId, now),
    db.select({ key: themes.key }).from(storeThemes).innerJoin(themes, eq(themes.id, storeThemes.themeId)).where(eq(storeThemes.storeId, storeId)).limit(1),
    temEditorCompleto(db, storeId, now),
  ]);
  const temas: TemaParaLiberar[] = Object.values(THEME_BY_KEY)
    .filter((t) => t.priceCents > 0)
    .map((t) => ({ key: t.key, name: t.name, level: t.level, priceCents: t.priceCents, owned: owned.has(t.key), active: ativo[0]?.key === t.key, release: t.release }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  return { temas, editorCompleto: editor, ativo: ativo[0]?.key ?? "starter" };
}

export async function temEditorCompleto(db: Database, storeId: string, now = new Date()) {
  const rows = await db.select({ endsAt: entitlements.endsAt }).from(entitlements).where(and(eq(entitlements.storeId, storeId), eq(entitlements.key, EDITOR_COMPLETO)));
  return rows.some((r) => !r.endsAt || new Date(r.endsAt) > now);
}

export async function liberarTemaPelaEquipe(db: Database, input: { storeId: string; operatorId: string; operatorName: string } & LiberarTemaInput, now = new Date()) {
  const p = liberarTemaSchema.parse(input);
  const store = await db.query.stores.findFirst({ where: eq(stores.id, input.storeId) });
  if (!store) throw new NotFoundError("Loja não encontrada.");
  if (!hasStorefront(store)) throw new DomainError("NO_STOREFRONT", "Esta loja não tem loja virtual: temas não se aplicam.");
  const editor = p.item === "editor-completo";
  const info = editor ? null : THEME_BY_KEY[p.item];
  // Tema em rascunho (exclusivo da equipe, ex.: Manto Premium, D348) também pode ser liberado: só a equipe chega aqui.
  if (!editor && !info) throw new NotFoundError("Tema não encontrado.");
  if (info && info.priceCents === 0) throw new DomainError("FREE_THEME", "Este tema já é grátis: é só instalar.");
  if (editor && p.instalar) throw new DomainError("INVALID", "A Edição completa não se instala: ela vale para o tema que estiver ativo.");
  const ent = editor ? EDITOR_COMPLETO : themeEntitlementKey(p.item);
  const nome = editor ? "Edição completa do editor" : `Tema ${info!.name}`;
  const jaTem = editor ? await temEditorCompleto(db, store.id, now) : (await ownedThemeKeys(db, store.id, now)).has(p.item);
  const quem = `${input.operatorName}${p.nota ? `: ${p.nota}` : ""}`;

  let invoiceId: string | null = null;
  if (!jaTem) {
    // Fatura do tema que o lojista deixou aberta: na cortesia é cancelada; no pagamento por fora é ela que recebe a baixa.
    const abertas = (await db.select().from(financeInvoices).where(and(eq(financeInvoices.storeId, store.id), eq(financeInvoices.kind, "ADDON"), inArray(financeInvoices.status, ["OPEN", "OVERDUE"]), like(financeInvoices.dedupeKey, `ADDON:${store.id}:${ent}:%`))));
    if (p.modo === "CORTESIA") {
      await grantEntitlement(db, { type: "STORE", storeId: store.id }, { key: ent, source: "COURTESY", note: `Cortesia da equipe (${quem})`, now });
      if (abertas.length) await db.update(financeInvoices).set({ status: "CANCELED" }).where(inArray(financeInvoices.id, abertas.map((a) => a.id)));
    } else {
      if (!p.forma) throw new DomainError("INVALID", "Informe como o cliente pagou.");
      const padrao = info ? (await themeQuote(db, p.item)).pixCents : 0;
      const valor = p.valorCents ?? padrao;
      if (valor <= 0) throw new DomainError("INVALID", "Informe o valor recebido.");
      const forma = FORMAS_PAGAMENTO_FORA[p.forma];
      const line = { kind: "THEME_MANUAL", description: `${nome} · pago por fora (${forma}) · baixa por ${quem}`, amountCents: valor };
      const description = `${nome} (licença permanente) · pagamento manual: ${forma}`;
      const aberta = abertas[0];
      if (aberta) {
        await db.update(financeInvoices).set({ amountCents: valor, lines: [line], description }).where(eq(financeInvoices.id, aberta.id));
        invoiceId = aberta.id;
      } else {
        invoiceId = newId("fin");
        await db.insert(financeInvoices).values({ id: invoiceId, dedupeKey: `ADDON:${store.id}:${ent}:LIFETIME:MANUAL:${now.getTime()}`, payerType: "STORE", supplierId: await supplierOfStore(db, store.id), storeId: store.id, kind: "ADDON", description, amountCents: valor, lines: [line], status: "OPEN", dueDate: now.toISOString() });
      }
      // A baixa segue o caminho normal: a fatura paga concede a licença permanente (fulfillPaidInvoice) e entra no caixa.
      await markInvoicePaid(db, invoiceId, now);
    }
  }
  await emitEvent(db, { type: "THEME_GRANTED_BY_TEAM", storeId: store.id, actorRole: "NEXTLEVEL_MASTER", payload: { item: p.item, modo: jaTem ? "JA_TINHA" : p.modo, forma: p.forma ?? null, invoiceId, operatorId: input.operatorId, nota: p.nota ?? null } });

  let instalado = false;
  if (p.instalar && info) {
    await applyThemeToStore(db, store, p.item, input.operatorId, now);
    await emitEvent(db, { type: "THEME_INSTALLED", storeId: store.id, actorRole: "NEXTLEVEL_MASTER", payload: { key: p.item, byTeam: true } });
    instalado = true;
  }
  return { nome, jaTinha: jaTem, invoiceId, instalado };
}
