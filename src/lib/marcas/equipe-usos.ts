import type { BrandCode } from "@/lib/brand";
import type { EquipeFotoNome } from "./equipe-imagens";
import { secaoEquipeDaMarca } from "./equipe";

/**
 * Mapa único dos lugares onde a equipe real da NextLevel aparece (D181, onda 2). Trocar a foto de um lugar é mudar uma
 * linha aqui. Regras com teste (`tests/equipe-usos.test.ts`): foto do prêmio só em tela interna; numa mesma página, um
 * letreiro só e nunca os dois de um par quase igual; toda foto pública tem legenda.
 */

/**
 * Letreiro visível na parede (A: 3D cinza e azul; B: neon; C: ciano com linhas). Fotos sem letreiro à vista ficam fora.
 * Uma mesma página não mostra dois letreiros diferentes.
 */
export const LETREIRO: Partial<Record<EquipeFotoNome, "A" | "B" | "C">> = {
  "eq-escritorio-estudio": "A", "eq-boas-vindas": "A", "eq-mauricio-escritorio": "A",
  "eq-reuniao-mesa": "B", "eq-reuniao-mesa-2": "B",
  "eq-mesas-logo": "C", "eq-relatorio-cliente": "C",
};
/** Pares quase iguais (a mesma cena): nunca os dois na mesma página. */
export const PARES_QUASE_IGUAIS: readonly [EquipeFotoNome, EquipeFotoNome][] = [["eq-loja-com-cliente", "eq-analise-tela"], ["eq-reuniao-mesa", "eq-reuniao-mesa-2"]];

export type LugarEquipe =
  | "planos-ajuda" | "faq" | "quero-minha-loja" | "seja-fornecedor" | "como-funciona" | "parceiros" | "solucoes-diagnostico"
  | "carta-fundador" | "loja-nextlevel" | "login-master" | "master-equipe" | "estudio-gravacao"
  | "lojista-boas-vindas" | "lojista-vazio" | "parceiro-escritorio";

export type UsoEquipe = { fotos: readonly EquipeFotoNome[]; publico: boolean; titulo: string; texto: string; legenda?: string };

const LEGENDA = "Equipe NextLevel na nossa sede, em São Paulo.";

export const USOS_EQUIPE: Record<LugarEquipe, UsoEquipe> = {
  "planos-ajuda": { fotos: ["eq-relatorio-cliente"], publico: true, legenda: LEGENDA, titulo: "Prefere que a gente monte com você?", texto: "A equipe NextLevel monta a loja, traz os seus produtos de outra plataforma ou faz um diagnóstico gratuito do seu negócio. Operação maior? Pedimos uma proposta sob medida." },
  faq: { fotos: ["eq-tour-escritorio"], publico: true, legenda: LEGENDA, titulo: "Não achou a sua dúvida?", texto: "Fale com a equipe NextLevel. Quem responde é gente de verdade, na nossa sede em São Paulo." },
  "quero-minha-loja": { fotos: ["eq-reuniao-mesa"], publico: true, legenda: LEGENDA, titulo: "Quem vai falar com você", texto: "Os pedidos deste formulário chegam à equipe NextLevel, que responde pelo WhatsApp ou pelo e-mail que você deixar." },
  "seja-fornecedor": { fotos: ["eq-reuniao-mesa-2"], publico: true, legenda: LEGENDA, titulo: "Uma equipe acompanha a sua entrada", texto: "Cadastro, catálogo e primeiras lojas da sua rede: a equipe NextLevel acompanha cada passo, da nossa sede em São Paulo." },
  "como-funciona": { fotos: ["eq-edicao-gravacao"], publico: true, legenda: LEGENDA, titulo: "Quem faz isso funcionar", texto: "Tecnologia, conteúdo e atendimento feitos pela equipe NextLevel, com sede em São Paulo." },
  parceiros: { fotos: ["eq-reuniao-criativa"], publico: true, legenda: "Equipe NextLevel em reunião de criação.", titulo: "Quem está por trás do programa", texto: "Materiais, links e acompanhamento dos parceiros são feitos pela equipe NextLevel." },
  "solucoes-diagnostico": { fotos: ["eq-analise-tela"], publico: true, legenda: LEGENDA, titulo: "Quem olha o seu diagnóstico", texto: "As respostas chegam à equipe NextLevel, que estuda o seu caso e volta com o próximo passo." },
  "carta-fundador": { fotos: ["eq-mauricio-bancada"], publico: true, legenda: "Maurício Ramos dos Santos Junior, CEO da NextLevel Marketing Ltda.", titulo: "Palavra do fundador", texto: "" },
  "loja-nextlevel": { fotos: ["eq-escritorio-estudio"], publico: true, legenda: LEGENDA, titulo: "Feito aqui, por gente de verdade", texto: "Temas, lojas montadas, migrações e conteúdo são produzidos pela equipe NextLevel, com estúdio próprio na nossa sede em São Paulo." },
  // Painéis internos (o rodízio troca a foto por dia, sempre do mesmo letreiro).
  "login-master": { fotos: ["eq-mauricio-escritorio", "eq-boas-vindas", "eq-tour-escritorio"], publico: false, titulo: "", texto: "" },
  "master-equipe": { fotos: ["eq-premio-equipe"], publico: false, titulo: "Reconhecimento", texto: "Cada conquista da equipe é comemorada aqui dentro." },
  "estudio-gravacao": { fotos: ["eq-gravacao"], publico: false, titulo: "", texto: "" },
  "lojista-boas-vindas": { fotos: ["eq-loja-com-cliente"], publico: false, titulo: "", texto: "" },
  "lojista-vazio": { fotos: ["eq-analise-tela"], publico: false, titulo: "", texto: "" },
  "parceiro-escritorio": { fotos: ["eq-reuniao-criativa"], publico: false, titulo: "", texto: "" },
};

/** Páginas públicas e os lugares que aparecem nelas (com a foto do bloco "Quem está por trás" quando a página é uma home). */
export const PAGINAS_EQUIPE: Record<string, { lugares: LugarEquipe[]; home?: BrandCode }> = {
  "home-ecommerce": { lugares: ["carta-fundador"], home: "NEXTLEVEL_COMMERCE" },
  "planos-ecommerce": { lugares: ["planos-ajuda"] },
  faq: { lugares: ["faq"] },
  "quero-minha-loja": { lugares: ["quero-minha-loja"] },
  "seja-fornecedor": { lugares: ["seja-fornecedor"] },
  "como-funciona": { lugares: ["como-funciona"] },
  parceiros: { lugares: ["parceiros"] },
  solucoes: { lugares: ["solucoes-diagnostico", "carta-fundador"], home: "NEXTLEVEL" },
  "loja-nextlevel": { lugares: ["loja-nextlevel"] },
};

/** Fotos de cena de uma página (sem o retrato pequeno do CEO, que aparece em todo bloco). */
export function fotosDaPagina(pagina: string): EquipeFotoNome[] {
  const p = PAGINAS_EQUIPE[pagina]!;
  const fotos = p.lugares.flatMap((l) => USOS_EQUIPE[l].fotos);
  if (p.home) fotos.push(secaoEquipeDaMarca(p.home, "X").foto);
  return fotos;
}

/** Rodízio diário (no servidor, pela data): a mesma foto o dia inteiro, sem sorteio no navegador. */
export function fotoDoDia(lugar: LugarEquipe, agora = new Date()): EquipeFotoNome {
  const fotos = USOS_EQUIPE[lugar].fotos;
  const dia = Math.floor(agora.getTime() / 86_400_000);
  return fotos[dia % fotos.length]!;
}

/**
 * Textos em nome do CEO (D181), escritos a pedido do dono para inspirar quem quer crescer online. Sem número, sem
 * promessa de ganho e sem história pessoal que o dono não contou.
 */
export const CARTA_DO_FUNDADOR = [
  "Quem empreende tem pressa: quer crescer sem perder o controle do próprio negócio. A NextLevel existe para isso.",
  "Juntamos tecnologia para vender online com uma equipe de verdade, aqui na nossa sede em São Paulo, para ajudar quando você travar.",
  "Crescer online não é sorte nem fórmula mágica. É dar o primeiro passo, aprender com cada venda e melhorar um pouco todo dia.",
  "Se você tem um bom produto e vontade de fazer acontecer, a gente coloca a estrutura do seu lado. Vamos juntos para o próximo nível.",
] as const;

/** Frase curta do CEO no bloco "Quem está por trás" de cada marca. */
export function fraseDoCeo(code: BrandCode): string {
  switch (code) {
    case "NEXTLEVEL_COMMERCE": return "Sua marca merece uma loja à altura. A gente cuida da tecnologia para você cuidar do que mais importa: o seu cliente.";
    case "SUPERDROP": return "Vender sem estoque é um jeito real de começar. A gente cuida da estrutura para você focar em vender.";
    case "BRAS_DIGITAL": return "O Brás tem tudo para crescer online. Nossa parte é aproximar quem compra de quem produz.";
    case "NEXTLEVEL_CARGAS": return "Toda carga leva o trabalho de alguém. Por isso a gente acompanha cada uma de perto.";
    default: return "Tecnologia e gente de verdade, do mesmo lado de quem empreende.";
  }
}

/** Boas-vindas do CEO na primeira tela do lojista novo (D181): aparece nos 14 primeiros dias, até a primeira venda paga. */
export const DIAS_BOAS_VINDAS = 14;
export function mostrarBoasVindas(input: { criadaEm: string; temVendaPaga: boolean }, agora = new Date()): boolean {
  if (input.temVendaPaga) return false;
  return agora.getTime() - new Date(input.criadaEm).getTime() < DIAS_BOAS_VINDAS * 86_400_000;
}
