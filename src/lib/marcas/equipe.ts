import type { BrandCode } from "@/lib/brand";
import type { EquipeFotoNome } from "./equipe-imagens";

/**
 * Equipe real da NextLevel nas páginas das marcas (D179). Fotos feitas na sede, em São Paulo; o dono confirmou em
 * 2026-10-27 que o local é real e que todas as pessoas que aparecem autorizaram o uso da imagem (as autorizações
 * assinadas ficam com a empresa, fora do repositório). Regras: a equipe aparece sempre como equipe (nunca como cliente,
 * depoimento ou dentro da loja de um lojista) e o texto diz só o que é verdade.
 */
export const AUTORIZACAO_IMAGEM_CONFIRMADA_EM = "2026-10-27";

export const CEO = { nome: "Maurício Ramos dos Santos Junior", cargo: "CEO da NextLevel Marketing Ltda." } as const;
export const AVATAR_CEO = "/portal/nextlevel/equipe/v1/eq-mauricio-avatar";

/** Texto alternativo de cada foto (o que se vê, sem inventar papel ou resultado). */
export const EQUIPE_ALT: Record<EquipeFotoNome, string> = {
  "eq-analise-tela": "Maurício aponta para o monitor enquanto a equipe analisa gráficos e criativos no escritório da NextLevel.",
  "eq-boas-vindas": "Maurício recebe um visitante no escritório da NextLevel; ao fundo, a equipe trabalha nas mesas.",
  "eq-edicao-gravacao": "Maurício acompanha a edição de vídeo com a equipe enquanto, ao fundo, uma gravação acontece no estúdio.",
  "eq-escritorio-estudio": "Escritório da NextLevel: dois editores de vídeo no computador e, ao fundo, uma gravação no estúdio azul.",
  "eq-gravacao-produto": "Maurício orienta a gravação de um vídeo de produto, com câmera e luz de estúdio.",
  "eq-gravacao": "Maurício conversa com a apresentadora durante uma gravação no estúdio da NextLevel.",
  "eq-loja-com-cliente": "Maurício mostra no monitor, a uma colaboradora e a um cliente, o trabalho em andamento.",
  "eq-mauricio-bancada": "Maurício, CEO da NextLevel, sorrindo, apoiado numa bancada do estúdio.",
  "eq-mauricio-escritorio": "Maurício, CEO da NextLevel, no escritório; ao fundo, a equipe e o estúdio de gravação.",
  "eq-mauricio-retrato": "Retrato de Maurício, CEO da NextLevel.",
  "eq-mesas-logo": "Duas pessoas da equipe trabalham lado a lado sob o logo NextLevel Marketing.",
  "eq-premio-equipe": "Maurício entrega um presente de reconhecimento a uma colaboradora enquanto a equipe comemora.",
  "eq-relatorio-cliente": "Maurício apresenta um relatório a um cliente sob o logo NextLevel Marketing.",
  "eq-reuniao-criativa": "Maurício conversa com a equipe criativa em volta de uma mesa com notebook e fotos.",
  "eq-reuniao-mesa-2": "Reunião na mesa do escritório: Maurício mostra gráficos no notebook a duas pessoas.",
  "eq-reuniao-mesa": "Reunião na mesa do escritório: Maurício mostra gráficos no notebook a duas pessoas.",
  "eq-tour-escritorio": "Maurício mostra o escritório da NextLevel a uma visitante.",
};

/** Fotos que só podem aparecer em telas internas (o prêmio lido em página pública pareceria promessa de ganho). */
export const SO_INTERNAS: readonly EquipeFotoNome[] = ["eq-premio-equipe"];

export type SecaoEquipe = { foto: EquipeFotoNome; titulo: string; texto: string };

/**
 * O bloco "Quem está por trás" de cada marca: uma foto diferente por marca (cada uma com a sua cara) e o mesmo fato,
 * dito do jeito da marca. Sem número, sem promessa, sem depoimento.
 */
export function secaoEquipeDaMarca(code: BrandCode, nomeDaMarca: string): SecaoEquipe {
  const feita = `${nomeDaMarca} é desenvolvida e operada pela NextLevel Marketing, com equipe própria na nossa sede em São Paulo.`;
  switch (code) {
    case "NEXTLEVEL_COMMERCE":
      return { foto: "eq-loja-com-cliente", titulo: "Gente de verdade por trás da sua loja.", texto: `A ${feita} Se preferir não montar sozinho, a equipe monta a loja com você.` };
    case "SUPERDROP":
      return { foto: "eq-boas-vindas", titulo: "Gente de verdade do outro lado.", texto: `O ${nomeDaMarca} é desenvolvido e operado pela NextLevel Marketing, com equipe própria na nossa sede em São Paulo.` };
    case "BRAS_DIGITAL":
      return { foto: "eq-gravacao", titulo: "Quem faz o Club, de perto.", texto: `O ${nomeDaMarca} é desenvolvido e operado pela NextLevel Marketing, com equipe própria e estúdio de gravação na nossa sede em São Paulo.` };
    case "NEXTLEVEL_CARGAS":
      return { foto: "eq-reuniao-mesa", titulo: "Uma equipe acompanhando cada carga.", texto: `A ${feita}` };
    default:
      return { foto: "eq-mauricio-escritorio", titulo: "Um grupo com casa, equipe e dono.", texto: "A NextLevel Marketing Ltda. desenvolve e opera todas as marcas do grupo, com equipe própria na nossa sede em São Paulo." };
  }
}
