import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { iaConversas, iaMensagens, organizations, stores } from "@/db/schema";
import { newId } from "@/lib/ids";
import { DomainError, ForbiddenError, NotFoundError } from "./errors";
import type { Actor } from "./access";
import { mensagensDepois } from "./ia-conversas";

/**
 * Atendimento da loja (D206): o cliente final pergunta na loja do lojista; o Maurício responde pelo manual do comprador
 * (no navegador) e, quando a pessoa quer falar com a loja, abre uma conversa `ia_conversas` com canal LOJA ligada à loja.
 * Ela cai na caixa de Atendimento do PAINEL DO LOJISTA (o CRM dele), nunca no Master. Token aleatório; guardamos o hash.
 */
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const agora = () => new Date().toISOString();

const contato = z.object({
  nome: z.string().trim().min(2, "Informe o seu nome").max(80),
  whatsapp: z.string().transform((v) => v.replace(/\D/g, "")).refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp com DDD"),
  texto: z.string().trim().min(2, "Escreva a sua dúvida").max(800),
});

export async function abrirConversaComLoja(db: Database, input: { slug: string; pagina?: string } & z.input<typeof contato>) {
  const d = contato.parse(input);
  const [loja] = await db.select({ id: stores.id, brand: organizations.brand, status: stores.status }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.slug, input.slug)).limit(1);
  if (!loja || loja.status !== "ACTIVE") throw new NotFoundError("Loja não encontrada.");
  const token = randomBytes(24).toString("hex");
  const id = newId("iac");
  await db.insert(iaConversas).values({
    id, brand: loja.brand ?? "NEXTLEVEL_COMMERCE", canal: "LOJA", storeId: loja.id, status: "NOVA", tokenHash: hash(token),
    nome: d.nome, whatsapp: d.whatsapp, interesse: "cliente da loja", pagina: input.pagina?.slice(0, 200) ?? null,
    mensagens: 1, naoLidas: 1, ultimaMensagem: d.texto.slice(0, 160), ultimaEm: agora(),
  });
  await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: id, autor: "CLIENTE", texto: d.texto, createdAt: agora() });
  await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: id, autor: "SISTEMA", texto: "Mensagem enviada para a loja. A resposta aparece aqui mesmo e a loja também pode te chamar no WhatsApp.", createdAt: agora() });
  return { id, token, ...(await mensagensDepois(db, id, token)) };
}

export async function enviarParaLoja(db: Database, input: { id: string; token: string; texto: string; depoisDe?: string | null }) {
  const t = input.texto.trim().slice(0, 800);
  if (!t) throw new DomainError("VAZIA", "Escreva uma mensagem.");
  const atual = await mensagensDepois(db, input.id, input.token); // confere o token
  if (["GANHA", "PERDIDA"].includes(atual.status)) throw new DomainError("ENCERRADA", "Esta conversa foi encerrada pela loja. Abra uma nova se precisar.");
  await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: input.id, autor: "CLIENTE", texto: t, createdAt: agora() });
  await db.update(iaConversas).set({ mensagens: sql`${iaConversas.mensagens} + 1`, naoLidas: sql`${iaConversas.naoLidas} + 1`, ultimaMensagem: t.slice(0, 160), ultimaEm: agora() }).where(eq(iaConversas.id, input.id));
  return mensagensDepois(db, input.id, input.token, input.depoisDe);
}

// ---------------------------------------------------------------------------------------------------------------
// Painel do lojista: a caixa de atendimento dos clientes da loja
// ---------------------------------------------------------------------------------------------------------------
function lojaDo(actor: Actor): string {
  if (actor.role !== "STORE_OWNER" || !actor.storeId) throw new ForbiddenError("O atendimento é do painel da loja.");
  return actor.storeId;
}

export async function listarAtendimentoDaLoja(db: Database, actor: Actor, filtro: "ABERTAS" | "RESOLVIDAS" = "ABERTAS") {
  const storeId = lojaDo(actor);
  const status = filtro === "ABERTAS" ? ["NOVA", "IA", "HUMANO"] as const : ["GANHA", "PERDIDA"] as const;
  const lista = await db.select({ id: iaConversas.id, status: iaConversas.status, nome: iaConversas.nome, whatsapp: iaConversas.whatsapp, ultimaMensagem: iaConversas.ultimaMensagem, ultimaEm: iaConversas.ultimaEm, naoLidas: iaConversas.naoLidas, pagina: iaConversas.pagina })
    .from(iaConversas).where(and(eq(iaConversas.canal, "LOJA"), eq(iaConversas.storeId, storeId), inArray(iaConversas.status, [...status]))).orderBy(desc(iaConversas.ultimaEm)).limit(100);
  const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(iaConversas).where(and(eq(iaConversas.canal, "LOJA"), eq(iaConversas.storeId, storeId), inArray(iaConversas.status, ["NOVA", "IA", "HUMANO"]), sql`${iaConversas.naoLidas} > 0`));
  return { lista, esperando: n?.n ?? 0 };
}

async function daLoja(db: Database, actor: Actor, id: string) {
  const storeId = lojaDo(actor);
  const [c] = await db.select().from(iaConversas).where(and(eq(iaConversas.id, id), eq(iaConversas.storeId, storeId), eq(iaConversas.canal, "LOJA"))).limit(1);
  if (!c) throw new NotFoundError("Conversa não encontrada.");
  return c;
}

export async function abrirAtendimentoDaLoja(db: Database, actor: Actor, id: string) {
  const c = await daLoja(db, actor, id);
  await db.update(iaConversas).set({ naoLidas: 0 }).where(eq(iaConversas.id, id));
  const mensagens = await db.select({ id: iaMensagens.id, autor: iaMensagens.autor, autorNome: iaMensagens.autorNome, texto: iaMensagens.texto, createdAt: iaMensagens.createdAt }).from(iaMensagens).where(eq(iaMensagens.conversaId, id)).orderBy(asc(iaMensagens.createdAt));
  return { conversa: { id: c.id, nome: c.nome, whatsapp: c.whatsapp, status: c.status, pagina: c.pagina, notas: c.notas }, mensagens };
}

export async function responderComoLoja(db: Database, actor: Actor, id: string, texto: string) {
  const c = await daLoja(db, actor, id);
  const t = texto.trim().slice(0, 1000);
  if (!t) throw new DomainError("VAZIA", "Escreva a resposta.");
  const [loja] = await db.select({ nome: stores.name }).from(stores).where(eq(stores.id, c.storeId!)).limit(1);
  await db.insert(iaMensagens).values({ id: newId("iam"), conversaId: id, autor: "HUMANO", autorNome: loja?.nome ?? "Loja", texto: t, createdAt: agora() });
  await db.update(iaConversas).set({ status: "HUMANO", naoLidas: 0, responsavelId: actor.userId, ultimaMensagem: `Loja: ${t.slice(0, 150)}`, ultimaEm: agora(), mensagens: sql`${iaConversas.mensagens} + 1` }).where(eq(iaConversas.id, id));
}

export async function resolverAtendimentoDaLoja(db: Database, actor: Actor, id: string, notas?: string) {
  await daLoja(db, actor, id);
  await db.update(iaConversas).set({ status: "GANHA", naoLidas: 0, ...(notas !== undefined ? { notas: notas.slice(0, 2000) } : {}) }).where(eq(iaConversas.id, id));
}
