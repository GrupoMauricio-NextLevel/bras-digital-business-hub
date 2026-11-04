import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import type { FetchLike } from "@/lib/payments/mercadopago";
import { timeoutSignal } from "@/lib/http-timeout";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { subscriptionOf } from "./commerce-plans";
import { DomainError } from "./errors";
import { getIaConfig } from "./ia";

/**
 * IA por plano (D243). Duas fontes de chave:
 *  - a da NextLevel (Master), que paga a COTA do plano: Start 40, Pro 350, Scale 1.200 usos por mês (editável no Master);
 *  - a do LOJISTA ("Use sua chave"), guardada criptografada, que ele mesmo paga e não tem limite nosso.
 * Ordem: cota do plano → chave do lojista → nada (o chamador volta às respostas por regras; nunca quebra).
 * Chat da loja com IA: no Start só com a chave do lojista; no Pro e no Scale entra na cota.
 */
export type UsoIa = "painel" | "chat-loja";
export type FonteIa = { chave: string; organizacao?: string; modelo: string; origem: "plano" | "loja" };

const mes = (agora: Date) => new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 7); // mês de Brasília
const kUso = (storeId: string, m: string) => `ia.uso.${storeId}.${m}`;
const kChave = (storeId: string) => `ia.chave-loja.${storeId}`;
const chaveSchema = z.object({ enc: z.string(), fim: z.string(), testadaEm: z.string().nullable(), ok: z.boolean() });

async function ler<T>(db: Database, key: string, schema: z.ZodType<T>): Promise<T | null> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, key) });
  const p = schema.safeParse(row?.value);
  return p.success ? p.data : null;
}
async function gravar(db: Database, key: string, value: unknown) {
  await db.insert(platformSettings).values({ key, value }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date().toISOString() } });
}

export type SituacaoIa = { plano: string | null; cota: number; usados: number; restantes: number; alerta: boolean; chaveLoja: { fim: string; ok: boolean } | null; iaNoChat: "cota" | "chave" | "regras" };

/** O que o painel mostra: cota do mês, quanto usou, se tem chave própria e como o chat da loja responde. */
export async function situacaoIa(db: Database, storeId: string, agora = new Date()): Promise<SituacaoIa> {
  const [cfg, sub, uso, chave] = await Promise.all([getIaConfig(db), subscriptionOf(db, storeId), ler(db, kUso(storeId, mes(agora)), z.object({ usos: z.number() })), ler(db, kChave(storeId), chaveSchema)]);
  const plano = sub && ["active", "trial", "past_due"].includes(sub.status) ? sub.productKey : null;
  const cota = plano ? cfg.cotas[plano] ?? 0 : 0;
  const usados = uso?.usos ?? 0;
  const restantes = Math.max(0, cota - usados);
  const nossa = cfg.usoReal && !!cfg.chaveEnc;
  const chatPelaCota = nossa && plano !== null && plano !== "COMMERCE_START" && restantes > 0;
  return { plano, cota, usados, restantes, alerta: cota > 0 && usados >= cota * 0.8, chaveLoja: chave ? { fim: chave.fim, ok: chave.ok } : null, iaNoChat: chatPelaCota ? "cota" : chave?.ok ? "chave" : "regras" };
}

/** Qual chave usar agora (ou null = respostas por regras). Não conta o uso: chame `registrarUsoIa` depois da resposta. */
export async function fonteDeIa(db: Database, storeId: string, uso: UsoIa, agora = new Date()): Promise<FonteIa | null> {
  const [cfg, s] = await Promise.all([getIaConfig(db), situacaoIa(db, storeId, agora)]);
  const nossa = cfg.usoReal ? decryptSecret(cfg.chaveEnc) : null;
  const podeCota = !!nossa && s.restantes > 0 && (uso === "painel" || (s.plano !== null && s.plano !== "COMMERCE_START"));
  if (podeCota) return { chave: nossa!, organizacao: cfg.organizacao || undefined, modelo: cfg.modeloEconomico, origem: "plano" };
  const c = await ler(db, kChave(storeId), chaveSchema);
  const daLoja = c?.ok ? decryptSecret(c.enc) : null;
  return daLoja ? { chave: daLoja, modelo: cfg.modeloEconomico, origem: "loja" } : null;
}

/** Conta 1 uso da cota do plano (o uso com a chave do lojista não entra na cota). */
export async function registrarUsoIa(db: Database, storeId: string, fonte: FonteIa, agora = new Date()) {
  if (fonte.origem !== "plano") return;
  const k = kUso(storeId, mes(agora));
  const atual = await ler(db, k, z.object({ usos: z.number() }));
  await gravar(db, k, { usos: (atual?.usos ?? 0) + 1 });
}

/** Lojista salva a própria chave da OpenAI: guardada criptografada, testada na hora (lista de modelos, sem custo). */
export async function salvarChaveDaLoja(db: Database, storeId: string, chave: string, fetchImpl: FetchLike = fetch) {
  const k = chave.trim();
  if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(k)) throw new DomainError("IA_CHAVE", "A chave da OpenAI começa com \"sk-\". Crie em platform.openai.com → API keys.");
  let ok = false;
  try { ok = (await fetchImpl("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${k}` }, signal: timeoutSignal() })).ok; } catch { ok = false; }
  if (!ok) throw new DomainError("IA_CHAVE_RECUSADA", "A OpenAI não aceitou essa chave (ou a conta está sem crédito). Confira e tente de novo.");
  await gravar(db, kChave(storeId), { enc: encryptSecret(k), fim: k.slice(-4), testadaEm: new Date().toISOString(), ok: true });
  return { fim: k.slice(-4) };
}
export async function removerChaveDaLoja(db: Database, storeId: string) {
  await db.delete(platformSettings).where(eq(platformSettings.key, kChave(storeId)));
}
