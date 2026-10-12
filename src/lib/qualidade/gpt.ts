import type { BrandCode } from "@/lib/brand";

/**
 * O que falta numa tela e o pedido de imagens para o GPT (D143). Arquivo puro (servidor e tela). As regras de imagem são
 * as mesmas de `docs/prompts/imagens-paginas-publicas-gpt.md`, que já geraram os lotes no ar.
 */
export const NEEDS = ["IMAGEM", "TEXTO", "VIDEO", "FUNCAO", "DADOS"] as const;
export type Need = (typeof NEEDS)[number];
export const NEED_LABEL: Record<Need, string> = { IMAGEM: "Imagem (gerar no GPT)", TEXTO: "Texto", VIDEO: "Vídeo", FUNCAO: "Função ou botão", DADOS: "Dados de exemplo" };

export type ImageBrand = "superdrop" | "commerce" | "bras" | "nextlevel";
export type ImageRequest = { file: string; brand: ImageBrand; ratio: string; scene: string; where: string };

export const imageBrandOf = (host: BrandCode): ImageBrand =>
  host === "SUPERDROP" ? "superdrop" : host === "NEXTLEVEL_COMMERCE" ? "commerce" : host === "BRAS_DIGITAL" ? "bras" : "nextlevel";

const ACCENT: Record<ImageBrand, string> = {
  superdrop: "VERDE (#2D9E3B)",
  commerce: "AZUL (#2F81F4)",
  bras: "LARANJA (#FB8342), só em detalhes",
  nextlevel: "VERDE-ESCURO discreto (#1F6F3A)",
};
const BRAND_NAME: Record<ImageBrand, string> = { superdrop: "SuperDrop", commerce: "NextLevel Commerce", bras: "Brás Digital", nextlevel: "NextLevel (painéis do grupo)" };

/** Nome de arquivo sugerido para a imagem de uma tela (`/master/financeiro/precos` → `tela-master-financeiro-precos`). */
export function fileForScreen(route: string, brand: ImageBrand) {
  const slug = route.replace(/\[[^\]]+\]/g, "item").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "inicio";
  const prefix = brand === "superdrop" ? "sd" : brand === "commerce" ? "cm" : brand === "bras" ? "bd" : "nl";
  return `${prefix}-tela-${slug}`;
}

/** Pedido completo para colar no GPT: papel, regras de toda imagem, a lista agrupada por marca e o que fazer depois. */
export function gptImagePrompt(items: ImageRequest[]): string {
  if (!items.length) return "";
  const brands = [...new Set(items.map((i) => i.brand))];
  const lots = brands.map((b) => [
    `LOTE ${BRAND_NAME[b].toUpperCase()} (acento da marca: ${ACCENT[b]}; formato PNG na proporção indicada)`,
    ...items.filter((i) => i.brand === b).map((i) => `${i.file}.png — ${i.ratio} — ${i.scene}${i.where ? ` (onde aparece: ${i.where})` : ""}`),
  ].join("\n")).join("\n\n");
  return [
    "PAPEL",
    "Você é diretor de arte de uma agência que cria páginas e telas de sistema para plataformas brasileiras de comércio do Grupo NextLevel. Vai produzir fotografias editoriais em lotes. Tudo é fictício.",
    "",
    "REGRAS GLOBAIS (obrigatórias em TODA imagem)",
    "1. Nenhum texto, letra, número ou logotipo visível. Caixas, etiquetas, sacolas e roupas lisas.",
    "2. Nenhuma marca real, nenhum clube real, nenhuma estampa reconhecível.",
    "3. Nenhum rosto reconhecível e nenhuma criança: mãos, costas, recortes, silhuetas desfocadas.",
    "4. Telas de notebook, celular e tablet aparecem LISAS (cinza-azulado neutro) ou desfocadas; não desenhe interface.",
    "5. Fotografia real de alta qualidade (não ilustração, não 3D plástico), luz natural suave, profundidade de campo rasa, grão fino.",
    "6. Paleta: base navy profundo (#101B34) e off-white quente (#F4F1E9), madeira clara e papel kraft; o acento da marca aparece só em objetos pequenos.",
    "7. Assunto no centro com 15% de respiro nas bordas (as imagens largas são recortadas no celular).",
    "8. Cenário brasileiro plausível: pequena empresa, ateliê, estoque, comércio do Brás, home office.",
    "9. Entregue UMA imagem por vez, no formato pedido, e diga o nome do arquivo exatamente como listado.",
    "",
    lots,
    "",
    "Comece pela primeira imagem do primeiro lote. Depois de cada imagem, pergunte se pode seguir para a próxima.",
  ].join("\n");
}
