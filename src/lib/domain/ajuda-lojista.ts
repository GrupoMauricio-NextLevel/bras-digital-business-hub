import { randomBytes, createHash } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { iaConversas, iaMensagens, organizations, stores, users } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, ForbiddenError } from "./errors";
import type { Actor } from "./access";

/**
 * Ajuda do lojista (D201): o lojista fala com a equipe NextLevel dentro do painel. A conversa é a mesma `ia_conversas`
 * (canal PAINEL, ligada à loja), então cai na mesma caixa de atendimento do Master e na fila "Agora". O lojista só vê as
 * conversas da própria loja; a equipe responde pelo Master (`responderComoEquipe`).
 */
const ABERTAS = ["NOVA", "IA", "HUMANO"] as const;
const agoraIso = () => new Date().toISOString();
export const AVISO_HORARIO = "Recebemos a sua mensagem. A equipe NextLevel responde aqui mesmo, de segunda a sexta, das 9h às 18h. Fora desse horário, respondemos no próximo período.";

function lojaDo(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("A ajuda é do painel da loja.");
  return actor.storeId;
}

async function conversaAberta(db: Database, storeId: string) {
  return (await db.select().from(iaConversas).where(and(eq(iaConversas.canal, "PAINEL"), eq(iaConversas.storeId, storeId), inArray(iaConversas.status, [...ABERTAS]))).orderBy(desc(iaConversas.ultimaEm)).limit(1))[0] ?? null;
}

async function mensagens(db: Database, conversaId: string, depoisDe?: string | null) {
  const ms = await db.select().from(iaMensagens).where(depoisDe ? and(eq(iaMensagens.conversaId, conversaId), gt(iaMensagens.createdAt, depoisDe)) : eq(iaMensagens.conversaId, conversaId)).orderBy(asc(iaMensagens.createdAt));
  return ms.map(({ id, autor, autorNome, texto, createdAt }) => ({ id, autor, autorNome, texto, createdAt }));
}

/** Abre o painel de ajuda: devolve a conversa aberta da loja (se houver) e as mensagens. Não cria nada até a 1ª mensagem. */
export async function verAjuda(db: Database, actor: Actor, depoisDe?: string | null) {
  const storeId = lojaDo(actor);
  const c = await conversaAberta(db, storeId);
  return c ? { conversaId: c.id, status: c.status, mensagens: await mensagens(db, c.id, depoisDe) } : { conversaId: null, status: null, mensagens: [] };
}

/** Mensagem do lojista: cria a conversa na primeira vez (com nome, e-mail e WhatsApp da loja) e avisa a equipe. */
export async function enviarAjuda(db: Database, actor: Actor, texto: string, depoisDe?: string | null) {
  const storeId = lojaDo(actor);
  const t = texto.trim().slice(0, 1000);
  if (!t) throw new DomainError("VAZIA", "Escreva a sua mensagem.");
  let c = await conversaAberta(db, storeId);
  if (!c) {
    const [loja] = await db.select({ nome: stores.name, whatsapp: stores.whatsapp, email: stores.contactEmail, brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, storeId)).limit(1);
    const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, actor.userId)).limit(1);
    const id = newId("iac");
    await db.insert(iaConversas).values({
      id, brand: loja?.brand ?? "NEXTLEVEL_COMMERCE", canal: "PAINEL", storeId, status: "NOVA",
      tokenHash: createHash("sha256").update(randomBytes(24)).digest("hex"),
      nome: `${loja?.nome ?? "Loja"} · ${u?.name?.split(" ")[0] ?? "lojista"}`, whatsapp: loja?.whatsapp ?? null, email: u?.email ?? loja?.email ?? null,
      interesse: "suporte", pagina: "painel da loja",
    });
    await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: id, autor: "SISTEMA", texto: AVISO_HORARIO, createdAt: agoraIso() });
    c = (await db.select().from(iaConversas).where(eq(iaConversas.id, id)).limit(1))[0]!;
  }
  await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: c.id, autor: "CLIENTE", texto: t, createdAt: agoraIso() });
  await db.update(iaConversas).set({ mensagens: sql`${iaConversas.mensagens} + 1`, naoLidas: sql`${iaConversas.naoLidas} + 1`, ultimaMensagem: t.slice(0, 160), ultimaEm: agoraIso() }).where(eq(iaConversas.id, c.id));
  return { conversaId: c.id, status: c.status, mensagens: await mensagens(db, c.id, depoisDe) };
}
