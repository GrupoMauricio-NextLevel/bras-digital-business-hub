/**
 * "Como você conheceu a NextLevel?" (D302, plano de busca v3, seção 13.5). É a única forma de medir quem chega por uma IA
 * sem deixar rastro (copiou o link, o aplicativo não informa de onde veio). Resposta opcional no cadastro e no "Quero
 * minha loja"; fica em `origens_contato.conheceu_por`. Arquivo puro (tela e servidor).
 */
export const CONHECEU_POR = [
  { chave: "google", rotulo: "Pesquisa no Google", grupo: "busca" },
  { chave: "chatgpt", rotulo: "ChatGPT", grupo: "ia" },
  { chave: "gemini", rotulo: "Gemini (Google)", grupo: "ia" },
  { chave: "perplexity", rotulo: "Perplexity", grupo: "ia" },
  { chave: "copilot", rotulo: "Copilot (Microsoft)", grupo: "ia" },
  { chave: "claude", rotulo: "Claude", grupo: "ia" },
  { chave: "meta_ai", rotulo: "Meta AI (WhatsApp ou Instagram)", grupo: "ia" },
  { chave: "outra_ia", rotulo: "Outra inteligência artificial", grupo: "ia" },
  { chave: "instagram", rotulo: "Instagram", grupo: "redes" },
  { chave: "tiktok", rotulo: "TikTok", grupo: "redes" },
  { chave: "youtube", rotulo: "YouTube", grupo: "redes" },
  { chave: "facebook", rotulo: "Facebook", grupo: "redes" },
  { chave: "parceiro", rotulo: "Indicação de um parceiro NextLevel", grupo: "indicacao" },
  { chave: "executivo", rotulo: "Um vendedor da NextLevel me visitou", grupo: "indicacao" },
  { chave: "amigo", rotulo: "Amigo, conhecido ou outro lojista", grupo: "indicacao" },
  { chave: "outro", rotulo: "Outro lugar", grupo: "outro" },
] as const;
export type ConheceuPor = (typeof CONHECEU_POR)[number]["chave"];
export const GRUPO_CONHECEU: Record<(typeof CONHECEU_POR)[number]["grupo"], string> = { busca: "Busca", ia: "Inteligência artificial", redes: "Redes sociais", indicacao: "Indicação", outro: "Outro" };

const CHAVES = new Set<string>(CONHECEU_POR.map((c) => c.chave));
/** Só aceita uma das chaves da lista; qualquer outra coisa vira "não respondeu". */
export const conheceuValido = (v: unknown): ConheceuPor | null => (typeof v === "string" && CHAVES.has(v) ? (v as ConheceuPor) : null);
export const rotuloConheceu = (v: string | null | undefined) => CONHECEU_POR.find((c) => c.chave === v)?.rotulo ?? null;
export const ehIa = (v: string | null | undefined) => CONHECEU_POR.some((c) => c.chave === v && c.grupo === "ia");
