import { z } from "zod";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { timeoutSignal } from "@/lib/http-timeout";
import type { FetchLike } from "@/lib/payments/mercadopago";
import { DomainError } from "./errors";
import { requireMasterFn, type Actor } from "./access";
import { subscriptionOf } from "./commerce-plans";
import { estadoDaFerramenta, FERRAMENTAS_IA, NOME_PLANO, type EstadoIa, type FerramentaIa } from "@/lib/ia/ferramentas";

/**
 * Maurício, fase IA0 (D194): configuração no Master (chave do GPT só criptografada), estado de cada ferramenta por plano
 * e o que o painel mostra. Nenhuma chamada à OpenAI acontece aqui, exceto o "Testar conexão" pedido pelo dono.
 */
const KEY = "ia";
const configSchema = z.object({
  mostrar: z.boolean().default(true),
  usoReal: z.boolean().default(false),
  provedor: z.literal("OPENAI").default("OPENAI"),
  chaveEnc: z.string().nullable().default(null),
  chaveFim: z.string().nullable().default(null),
  organizacao: z.string().max(80).default(""),
  modeloPadrao: z.string().min(2).max(60).default("gpt-4.1"),
  modeloEconomico: z.string().min(2).max(60).default("gpt-4.1-mini"),
  planoTexto: z.string().default("COMMERCE_PRO"),
  planoAvancado: z.string().default("COMMERCE_SCALE"),
  cotas: z.record(z.string(), z.number().int().nonnegative()).default({ COMMERCE_START: 3, COMMERCE_PRO: 200, COMMERCE_SCALE: 1000, COMMERCE_ENTERPRISE: 3000 }),
  testadoEm: z.string().nullable().default(null),
  testeOk: z.boolean().default(false),
});
export type IaConfig = z.infer<typeof configSchema>;

export async function getIaConfig(db: Database): Promise<IaConfig> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, KEY) });
  const p = configSchema.safeParse(row?.value ?? {});
  return p.success ? p.data : configSchema.parse({});
}
async function gravar(db: Database, actor: Actor, value: IaConfig) {
  await db.insert(platformSettings).values({ key: KEY, value, updatedBy: actor.userId }).onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedBy: actor.userId, updatedAt: new Date().toISOString() } });
}

/** O que a tela do Master pode ver: nunca a chave, só o final dela. */
export const configPublica = (c: IaConfig) => { const { chaveEnc, ...resto } = c; return { ...resto, temChave: !!chaveEnc }; };

const ajustesSchema = z.object({
  mostrar: z.boolean(), usoReal: z.boolean(), organizacao: z.string().max(80), modeloPadrao: z.string().trim().min(2).max(60), modeloEconomico: z.string().trim().min(2).max(60),
  planoTexto: z.enum(["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE", "COMMERCE_ENTERPRISE"]), planoAvancado: z.enum(["COMMERCE_START", "COMMERCE_PRO", "COMMERCE_SCALE", "COMMERCE_ENTERPRISE"]),
  cotas: z.record(z.string(), z.coerce.number().int().min(0).max(100000)),
});
/** Só o dono (Master sem função) muda a IA. Uso real só liga com chave testada. */
export async function salvarAjustesIa(db: Database, actor: Actor, raw: z.input<typeof ajustesSchema>) {
  requireMasterFn(actor, []);
  const a = ajustesSchema.parse(raw);
  const atual = await getIaConfig(db);
  if (a.usoReal && !(atual.chaveEnc && atual.testeOk)) throw new DomainError("IA_SEM_CHAVE", "Para ligar o uso real, salve a chave e teste a conexão primeiro.");
  await gravar(db, actor, { ...atual, ...a });
}

export async function salvarChaveIa(db: Database, actor: Actor, chave: string) {
  requireMasterFn(actor, []);
  const k = chave.trim();
  if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(k)) throw new DomainError("IA_CHAVE", "A chave da OpenAI começa com \"sk-\". Copie de platform.openai.com, em API keys.");
  const atual = await getIaConfig(db);
  // Chave nova precisa de teste novo; o uso real desliga até lá.
  await gravar(db, actor, { ...atual, chaveEnc: encryptSecret(k), chaveFim: k.slice(-4), testadoEm: null, testeOk: false, usoReal: false });
}

export async function removerChaveIa(db: Database, actor: Actor) {
  requireMasterFn(actor, []);
  await gravar(db, actor, { ...(await getIaConfig(db)), chaveEnc: null, chaveFim: null, testadoEm: null, testeOk: false, usoReal: false });
}

/** Confere a chave com uma chamada mínima (lista de modelos, sem custo de uso). A chave nunca volta para a tela. */
export async function testarConexaoIa(db: Database, actor: Actor, fetchImpl: FetchLike = fetch): Promise<{ ok: boolean; mensagem: string }> {
  requireMasterFn(actor, []);
  const c = await getIaConfig(db);
  const chave = decryptSecret(c.chaveEnc);
  if (!chave) throw new DomainError("IA_SEM_CHAVE", "Salve a chave antes de testar.");
  let r: { ok: boolean; mensagem: string };
  try {
    const res = await fetchImpl("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${chave}`, ...(c.organizacao ? { "OpenAI-Organization": c.organizacao } : {}) }, signal: timeoutSignal() });
    r = res.ok ? { ok: true, mensagem: "Conectado à OpenAI." } : res.status === 401 ? { ok: false, mensagem: "A OpenAI recusou a chave. Gere uma nova e salve de novo." } : res.status === 429 ? { ok: false, mensagem: "A conta da OpenAI está sem crédito ou no limite de uso." } : { ok: false, mensagem: `A OpenAI respondeu com erro (${res.status}).` };
  } catch { r = { ok: false, mensagem: "Não foi possível falar com a OpenAI. Tente de novo em instantes." }; }
  await gravar(db, actor, { ...c, testadoEm: new Date().toISOString(), testeOk: r.ok, usoReal: r.ok ? c.usoReal : false });
  return r;
}

export type FerramentaComEstado = FerramentaIa & { estado: EstadoIa };
export type MauricioDaLoja = { mostrar: boolean; plano: string; ferramentas: FerramentaComEstado[]; minimoTexto: string; minimoAvancado: string; emTeste: boolean };

/** O que o painel da loja mostra do Maurício: plano atual e o estado de cada ferramenta. */
export async function mauricioDaLoja(db: Database, storeId: string | null, opts: { master?: boolean } = {}): Promise<MauricioDaLoja> {
  const cfg = await getIaConfig(db);
  const sub = storeId ? await subscriptionOf(db, storeId) : null;
  const emTeste = sub?.status === "trial";
  const plano = sub && ["active", "trial", "past_due"].includes(sub.status) ? sub.productKey : null;
  const c = { usoReal: cfg.usoReal, temChave: !!cfg.chaveEnc, planoTexto: cfg.planoTexto, planoAvancado: cfg.planoAvancado };
  return {
    mostrar: cfg.mostrar, emTeste, plano: opts.master ? "Master" : plano ? NOME_PLANO[plano] ?? plano : "sem plano",
    minimoTexto: NOME_PLANO[cfg.planoTexto] ?? cfg.planoTexto, minimoAvancado: NOME_PLANO[cfg.planoAvancado] ?? cfg.planoAvancado,
    ferramentas: FERRAMENTAS_IA.map((f) => ({ ...f, estado: estadoDaFerramenta(f, c, { plano, emTeste, master: opts.master }) })),
  };
}
