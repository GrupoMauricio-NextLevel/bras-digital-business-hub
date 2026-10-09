import { and, asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db/client";
import { bdImporters, bdMembers, bdRequests } from "@/db/schema";
import { requireMaster, type Actor } from "../access";
import { ForbiddenError, NotFoundError } from "../errors";
import { brasShippingView, type BrasRequestStatus } from "./catalogo";

/**
 * Retirada no Brás (D103). O membro imprime ou manda ao motorista o comprovante (código, caixas, endereço da importadora);
 * o Estúdio gera o romaneio da importadora com APENAS a visão de envio (`brasShippingView`) e o código: nada do membro.
 */
const COM_RETIRADA: BrasRequestStatus[] = ["CONFIRMED", "PAID", "PICKED_UP"];

/** Comprovante de retirada do próprio pedido. Outro membro, pedido não confirmado ou inexistente: não encontrado. */
export async function getMyBrasPickup(db: Database, actor: Actor, requestId: string) {
  if (actor.role !== "BRAS_MEMBER") throw new ForbiddenError("Disponível só para membros da Brás Digital.");
  const m = await db.query.bdMembers.findFirst({ where: eq(bdMembers.userId, actor.userId), columns: { id: true, companyName: true } });
  if (!m) throw new NotFoundError("Pedido não encontrado.");
  const [row] = await db.select({ r: bdRequests, address: bdImporters.pickupAddress }).from(bdRequests).innerJoin(bdImporters, eq(bdImporters.id, bdRequests.importerId))
    .where(and(eq(bdRequests.id, requestId), eq(bdRequests.memberId, m.id), inArray(bdRequests.status, COM_RETIRADA))).limit(1);
  if (!row) throw new NotFoundError("Pedido não encontrado.");
  const r = row.r;
  return {
    number: r.number, status: r.status, pickupCode: r.pickupCode, productTitle: r.productTitle, boxes: r.boxes, unitsPerBox: r.unitsPerBox,
    importerName: r.importerName, importerAddress: row.address, company: m.companyName,
    carrier: r.carrier, shipName: r.shipName, shipAddress: r.shipAddress, shipCity: r.shipCity, shipState: r.shipState, shipZip: r.shipZip,
  };
}

/** Linha do romaneio: só o envio do pedido e o código. */
export type BrasRomaneioLine = ReturnType<typeof brasShippingView> & { pickupCode: string | null };

/** Romaneio de uma importadora: pedidos Pagos (prontos para retirar) com a visão de envio e o código. Só Master. */
export async function brasRomaneio(db: Database, actor: Actor, importerId: string): Promise<{ importer: { id: string; name: string; pickupAddress: string | null }; lines: BrasRomaneioLine[] }> {
  requireMaster(actor);
  const imp = await db.query.bdImporters.findFirst({ where: eq(bdImporters.id, importerId), columns: { id: true, name: true, pickupAddress: true } });
  if (!imp) throw new NotFoundError("Importadora não encontrada.");
  const rows = await db.select().from(bdRequests).where(and(eq(bdRequests.importerId, importerId), eq(bdRequests.status, "PAID"))).orderBy(asc(bdRequests.number));
  return { importer: imp, lines: rows.map((r) => ({ ...brasShippingView(r), pickupCode: r.pickupCode })) };
}

/** Texto do romaneio para colar no WhatsApp da importadora (sem nenhum dado do membro além do envio). */
export function brasRomaneioText(importerName: string, lines: BrasRomaneioLine[], today = new Date()): string {
  const dia = today.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const head = `Romaneio Brás Digital · ${importerName} · ${dia}\n${lines.length} pedido(s) para retirar`;
  const body = lines.map((l) => `\nPedido ${l.number} · código ${l.pickupCode ?? "—"}\n${l.boxes} caixa(s) de ${l.productTitle} (${l.unitsPerBox} un. cada)\nTransportadora: ${l.carrier}\nEnviar para: ${l.shipName}, ${l.shipAddress}, ${l.shipCity}/${l.shipState}, CEP ${l.shipZip}`);
  return [head, ...body].join("\n");
}
