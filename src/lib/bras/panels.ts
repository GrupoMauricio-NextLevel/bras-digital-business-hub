import { isMaster, type Actor } from "@/lib/domain/access";

/**
 * Cascas dos painéis da Brás Digital (Fase 0): Estúdio, Balcão e Meu Brás, sem lógica de negócio nem dado comercial.
 * Enquanto não houver decisão sobre quem opera cada área ([CONFIRMAR] D91 Estúdio no Master, papéis da importadora,
 * modelo de membro B2B), as cascas ficam DESLIGADAS por padrão e, ligadas, só o Master as vê, como prévia.
 * Ligar: BRAS_PANELS=true. Nenhum papel, tabela ou item de menu novo é criado aqui.
 */
export const BRAS_PANELS = [
  { key: "estudio", path: "/master/bras/estudio", name: "Estúdio", audience: "Importadora e operação (dono da Brás)", pending: "D91: o Estúdio fica dentro do Master ou em área própria? E quem da importadora acessa." },
  { key: "balcao", path: "/master/bras/balcao", name: "Balcão", audience: "Equipe de retirada e expedição da importadora", pending: "Papéis da importadora (reuso dos papéis de fornecedor com contexto de marca ou papéis próprios) e dados pessoais exibidos na retirada." },
  { key: "meu-bras", path: "/master/bras/meu-bras", name: "Meu Brás", audience: "Membro comprador aprovado (lojista B2B)", pending: "Modelo de membro B2B, aprovação por CNPJ e o que o membro não aprovado vê." },
] as const;
export type BrasPanelKey = (typeof BRAS_PANELS)[number]["key"];

export function brasPanelsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.BRAS_PANELS?.trim().toLowerCase() === "true";
}

/** Quem pode abrir a prévia: só o Master, e só com a chave ligada. Falha fechada. */
export function canOpenBrasPanelPreview(actor: Actor | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  return !!actor && isMaster(actor) && brasPanelsEnabled(env);
}
