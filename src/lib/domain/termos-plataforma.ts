import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { aceitesTermos, organizations, stores, users } from "@/db/schema";
import { brandByCode } from "@/lib/brand";
import { HASH_TERMOS, TITULO_TERMOS, VERSAO_TERMOS } from "@/lib/contratos/termos-plataforma";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import type { Actor } from "./access";
import { DomainError, ForbiddenError } from "./errors";
import { emitEvent } from "./events";

/**
 * Termos de uso da plataforma (D279): todo dono de loja da NextLevel E-commerce aceita a versão atual no painel, com o
 * próprio login, antes de usar. A equipe da loja não aceita (quem contrata é o dono). Versão nova = aceite novo.
 */
const ehDono = (actor: Actor) => actor.role === "STORE_OWNER" && !!actor.storeId && actor.storeRole !== "STAFF";

async function lojaEhEcommerce(db: Database, storeId: string) {
  const r = (await db.select({ brand: organizations.brand }).from(stores).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(eq(stores.id, storeId)).limit(1))[0];
  return r?.brand === "NEXTLEVEL_COMMERCE";
}

/** O dono desta sessão ainda precisa aceitar a versão atual? (Contas de demonstração da vitrine não travam.) */
export async function precisaAceitarTermos(db: Database, actor: Actor, opts: { contaDemo?: boolean } = {}): Promise<boolean> {
  if (!ehDono(actor) || opts.contaDemo) return false;
  if (!(await lojaEhEcommerce(db, actor.storeId!))) return false;
  const r = await db.select({ id: aceitesTermos.id }).from(aceitesTermos).where(and(eq(aceitesTermos.userId, actor.userId), eq(aceitesTermos.versao, VERSAO_TERMOS))).limit(1);
  return r.length === 0;
}

export const aceiteTermosSchema = z.object({
  concordo: z.literal(true, { error: "Marque \"Li e concordo\" para continuar." }),
  hashVisto: z.string().length(64),
  nome: z.string().trim().min(3, "Digite o seu nome completo").max(200),
});

/** Grava o aceite com a prova. Aceitar de novo a mesma versão não duplica. */
export async function aceitarTermos(db: Database, actor: Actor, raw: z.input<typeof aceiteTermosSchema>, prova: { ip: string | null; aparelho: string | null }, now = new Date()) {
  if (!ehDono(actor)) throw new ForbiddenError("Só o dono da loja aceita os termos de uso.");
  const input = aceiteTermosSchema.parse(raw);
  if (input.hashVisto !== HASH_TERMOS) throw new DomainError("TERMOS_MUDARAM", "Os termos foram atualizados desde que você abriu a página. Recarregue e leia de novo.");
  const r = await db.insert(aceitesTermos).values({ id: newId("act"), userId: actor.userId, storeId: actor.storeId, versao: VERSAO_TERMOS, hash: HASH_TERMOS, nome: input.nome, aceitoEm: now.toISOString(), ip: prova.ip?.slice(0, 100) ?? null, aparelho: prova.aparelho?.slice(0, 300) ?? null }).onConflictDoNothing().returning({ id: aceitesTermos.id });
  if (!r.length) return { jaAceito: true };
  const u = (await db.select({ email: users.email }).from(users).where(eq(users.id, actor.userId)).limit(1))[0];
  const base = brandByCode("NEXTLEVEL_COMMERCE").baseUrl.replace(/\/$/, "");
  const quando = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  if (u) await sendEmail(db, {
    kind: "TERMOS_ACEITOS", to: u.email, brand: "NEXTLEVEL_COMMERCE", dedupeKey: `termos:${actor.userId}:${VERSAO_TERMOS}`,
    subject: "Você aceitou os termos de uso da NextLevel E-commerce",
    text: `Olá, ${input.nome.split(" ")[0]}!\n\nRegistramos o seu aceite dos ${TITULO_TERMOS} (versão de ${VERSAO_TERMOS.split("-").reverse().join("/")}) em ${quando}.\n\nO texto completo fica sempre disponível no link abaixo.\n\nImpressão digital do texto aceito: ${HASH_TERMOS}`,
    cta: { label: "Ler os termos de uso", url: `${base}/termos` },
  });
  await emitEvent(db, { type: "TERMOS_ACEITOS", storeId: actor.storeId, actorRole: actor.role, payload: { versao: VERSAO_TERMOS, hash: HASH_TERMOS } });
  return { jaAceito: false };
}

/** Master: cada dono de loja da E-commerce e se já aceitou a versão atual. */
export async function aceitesDoMaster(db: Database, actor: Actor) {
  if (actor.role !== "NEXTLEVEL_MASTER" || actor.masterFunction === "CONTADOR") throw new ForbiddenError();
  const donos = await db.select({ userId: users.id, nome: users.name, storeId: stores.id, loja: stores.name, criadaEm: stores.createdAt }).from(users).innerJoin(stores, eq(stores.id, users.storeId)).innerJoin(organizations, eq(organizations.id, stores.organizationId)).where(and(eq(users.role, "STORE_OWNER"), eq(users.storeRole, "OWNER"), eq(organizations.brand, "NEXTLEVEL_COMMERCE"))).orderBy(desc(stores.createdAt)).limit(500);
  const aceites = await db.select().from(aceitesTermos).where(eq(aceitesTermos.versao, VERSAO_TERMOS));
  const porUsuario = new Map(aceites.map((a) => [a.userId, a]));
  return donos.map((d) => ({ ...d, aceite: porUsuario.get(d.userId) ?? null }));
}
