import { isMaster, type Actor } from "@/lib/domain/access";

/**
 * Painéis da Brás Digital. D92: o Estúdio é uma área do Master com a cara da Brás (`/bras`, só o Master entra) e o Meu Brás é a área do membro (`/meu-bras`).
 * O Balcão (importadora) segue só como prévia do Master, DESLIGADA por padrão (BRAS_PANELS=true), até existirem os papéis
 * de acesso da importadora. Regra já decidida: a importadora vê só os dados de envio do pedido, nunca o cadastro do cliente.
 */
export const BRAS_PANELS = [
  { key: "estudio", path: "/bras", name: "Estúdio", audience: "Dono do Brás Digital Club (Master): membros e vídeos", live: true, pending: "Próximas funções: lives, conteúdo das importadoras e alertas de estoque (segunda etapa)." },
  { key: "balcao", path: "/bras/balcao", name: "Balcão", audience: "Equipe de retirada da importadora", live: false, pending: "Papéis de acesso da importadora e fluxo de pedido. Decidido (D92): a importadora vê só os dados de envio; atendimento, ocorrência e reembolso são do Brás Digital Club." },
  { key: "meu-bras", path: "/meu-bras", name: "Meu Brás", audience: "Membro comprador (lojista com CNPJ)", live: true, pending: "Catálogo com preço e estoque em caixas e pedido pelo sistema, quando as importadoras forem conectadas." },
] as const;
export type BrasPanelKey = (typeof BRAS_PANELS)[number]["key"];

export function brasPanelsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.BRAS_PANELS?.trim().toLowerCase() === "true";
}

/** Quem pode abrir a prévia do Balcão: só o Master, e só com a chave ligada. Falha fechada. */
export function canOpenBrasPanelPreview(actor: Actor | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  return !!actor && isMaster(actor) && brasPanelsEnabled(env);
}
