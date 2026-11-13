import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/db/client";
import { platformSettings } from "@/db/schema";
import { requireMaster, type Actor } from "./access";
import { ForbiddenError } from "./errors";

/**
 * Ajustes do Comercial (D205), editáveis no Master: meta de pagantes, tempo de espera que acende o amarelo e o vermelho
 * e as mensagens prontas de WhatsApp. Guardados em `platform_settings` (chave "comercial"); sem ajuste, valem os padrões.
 * Nas mensagens, {nome}, {loja}, {dias} e {passo} são trocados pelos dados da pessoa.
 */
export const CHAVES_MENSAGEM = ["interessado", "cadastro", "teste", "parada", "cobranca", "primeiraVenda"] as const;
export type ChaveMensagem = (typeof CHAVES_MENSAGEM)[number];

export const ROTULO_MENSAGEM: Record<ChaveMensagem, string> = {
  interessado: "Interessado novo ou conversa do site", cadastro: "Cadastro novo (loja criada)", teste: "Teste acabando",
  parada: "Ativação parada num passo", cobranca: "Pagamento pendente", primeiraVenda: "Primeira venda da loja",
};

export const PADRAO = {
  metaPagantes: 10,
  esperaAmarelaMin: 5,
  esperaVermelhaMin: 15,
  mensagens: {
    interessado: "Oi {nome}! Aqui é da NextLevel Commerce. Recebi o seu contato. Quer que eu te mostre como a sua loja fica no ar ainda hoje?",
    cadastro: "Oi {nome}! Aqui é da NextLevel Commerce. Vi que você criou a loja {loja}. Posso te ajudar a deixar tudo pronto para vender hoje?",
    teste: "Oi {nome}! O teste da loja {loja} termina em {dias} dia(s). Quer ajuda para escolher o plano e não perder nada do que já montou?",
    parada: "Oi {nome}! Vi que falta só um passo na sua loja: {passo}. Posso te ajudar agora?",
    cobranca: "Oi {nome}! O pagamento do plano da loja {loja} ficou pendente. Quer que eu te envie o link de novo?",
    primeiraVenda: "Parabéns, {nome}! A primeira venda da loja {loja} entrou. Conte com a gente para a próxima!",
  } satisfies Record<ChaveMensagem, string>,
};
export type ConfigComercial = { metaPagantes: number; esperaAmarelaMin: number; esperaVermelhaMin: number; mensagens: Record<ChaveMensagem, string> };

const schema = z.object({
  metaPagantes: z.coerce.number().int().min(1, "Meta mínima: 1").max(100_000),
  esperaAmarelaMin: z.coerce.number().int().min(1).max(600),
  esperaVermelhaMin: z.coerce.number().int().min(1).max(1440),
  mensagens: z.object(Object.fromEntries(CHAVES_MENSAGEM.map((k) => [k, z.string().trim().min(10, "Mensagem muito curta").max(600)])) as Record<ChaveMensagem, z.ZodString>),
}).refine((v) => v.esperaVermelhaMin > v.esperaAmarelaMin, { message: "O vermelho precisa vir depois do amarelo.", path: ["esperaVermelhaMin"] });

export async function getConfigComercial(db: Database): Promise<ConfigComercial> {
  const r = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, "comercial") });
  const v = (r?.value ?? {}) as Partial<ConfigComercial>;
  return {
    metaPagantes: Number(v.metaPagantes) || PADRAO.metaPagantes,
    esperaAmarelaMin: Number(v.esperaAmarelaMin) || PADRAO.esperaAmarelaMin,
    esperaVermelhaMin: Number(v.esperaVermelhaMin) || PADRAO.esperaVermelhaMin,
    mensagens: { ...PADRAO.mensagens, ...(v.mensagens ?? {}) },
  };
}

/** Só o dono e a função Comercial mudam os ajustes. */
export async function salvarConfigComercial(db: Database, actor: Actor, entrada: unknown) {
  requireMaster(actor);
  if (actor.masterFunction && actor.masterFunction !== "COMERCIAL") throw new ForbiddenError("Só o dono e o Comercial mudam estes ajustes.");
  const value = schema.parse(entrada);
  await db.insert(platformSettings).values({ key: "comercial", value }).onConflictDoUpdate({ target: platformSettings.key, set: { value } });
}

/** Troca {nome}, {loja}, {dias} e {passo}. */
export function preencher(modelo: string, vars: Partial<Record<"nome" | "loja" | "dias" | "passo", string | number>>): string {
  return modelo.replace(/\{(nome|loja|dias|passo)\}/g, (_, k: "nome" | "loja" | "dias" | "passo") => String(vars[k] ?? "")).replace(/\s{2,}/g, " ").trim();
}

/** As mensagens prontas já com as variáveis: usadas na fila "Agora" e no Comercial. */
export function mensageiro(cfg: ConfigComercial) {
  const m = cfg.mensagens;
  return {
    interessado: (nome: string) => preencher(m.interessado, { nome }),
    cadastro: (nome: string, loja: string) => preencher(m.cadastro, { nome, loja }),
    teste: (nome: string, loja: string, dias: number) => preencher(m.teste, { nome, loja, dias }),
    parada: (nome: string, passo: string, loja = "") => preencher(m.parada, { nome, passo, loja }),
    cobranca: (nome: string, loja: string) => preencher(m.cobranca, { nome, loja }),
    primeiraVenda: (nome: string, loja = "") => preencher(m.primeiraVenda, { nome, loja }),
  };
}
