/**
 * Famílias de temas: catálogo sintético das lojas de demonstração e contrato de imagens (manifesto legível por máquina).
 * Dentro de uma família, os QUATRO níveis usam os MESMOS produtos e as MESMAS imagens: a diferença vem dos módulos e da
 * composição, nunca de fotos piores no grátis. Nomes de lojas são fictícios (não são marcas registradas).
 *
 * Imagens: cada asset tem um id estável. A loja usa o arquivo final (public/temas/familias/<família>/<id>.webp, entregue pelo
 * dono depois do GPT) quando ele existe; até lá, usa uma imagem PROVISÓRIA do acervo autorizado do repositório, identificada.
 * Trocar a imagem não exige mexer em componente: basta salvar o arquivo com o nome do manifesto.
 */
import type { ThemeFamily, ThemeLevel } from "./levels";

export type DemoProduct = { name: string; sku: string; price: number; photo: string; category: string; featured?: boolean; variants: string[]; soldOut?: boolean; description: string };
export type AssetStatus = "pendente" | "provisório" | "recebido" | "validado" | "integrado";
export type FamilyAsset = {
  id: string; family: ThemeFamily;
  /** Posição e página (seção do tema) e níveis em que é usado. */
  position: string; levels: ThemeLevel[];
  desktop: { ratio: string; size: [number, number] }; mobile?: { ratio: string; size: [number, number] };
  focus: string; safeArea: string; scene: string; palette: string; light: string;
  /** Texto que o SISTEMA escreve por cima (nunca dentro da fotografia). */
  overlayText: string; alt: string;
  /** Imagem do acervo usada enquanto a final não chega (null = fundo nas cores do tema). */
  provisional: string | null;
};

const P = (n: string) => `/portal/commerce/${n}.webp`;

// ---------------------------------------------------------------------------------------------------- Moda · Trama Urbana
const MODA_PRODUCTS: DemoProduct[] = [
  { name: "Conjunto de moletom mostarda", sku: "TU-01", price: 24990, photo: P("moda-hero"), category: "Conjuntos", featured: true, variants: ["P", "M", "G", "GG"], description: "Moletom flanelado com calça de cintura elástica. Tecido: 70% algodão e 30% poliéster. Modelagem ampla." },
  { name: "Conjunto canelado areia", sku: "TU-02", price: 19990, photo: "art:#e7d8c3,#c8b49a,#f5efe6", category: "Conjuntos", variants: ["P", "M", "G"], description: "Blusa e calça em malha canelada. Tecido: viscose com elastano. Modelagem justa. Imagem provisória (ilustração)." },
  { name: "Poncho de tricô cru", sku: "TU-03", price: 17990, photo: P("moda-1"), category: "Peças avulsas", featured: true, variants: ["Único"], description: "Tricô de fio acrílico com franjas. Tamanho único, veste do P ao G." },
  { name: "Jaqueta de couro sintético", sku: "TU-04", price: 28990, photo: P("moda-3"), category: "Peças avulsas", featured: true, variants: ["P", "M", "G"], description: "Jaqueta estilo motociclista com zíper metálico. Material: poliuretano com forro de poliéster." },
  { name: "Blazer xadrez azul", sku: "TU-05", price: 32990, photo: P("moda-5"), category: "Peças avulsas", variants: ["P", "M", "G"], soldOut: true, description: "Blazer de alfaiataria com dois botões. Tecido: poliviscose. Produto esgotado (estado de exemplo)." },
  { name: "Camiseta básica verde-musgo", sku: "TU-06", price: 7990, photo: P("moda-2"), category: "Básicos", variants: ["P", "M", "G", "GG"], description: "Malha 100% algodão penteado, gola careca. Modelagem reta." },
  { name: "Camiseta básica branca", sku: "TU-07", price: 6990, photo: "art:#ffffff,#e5e5e5,#f4f4f4", category: "Básicos", featured: true, variants: ["P", "M", "G", "GG"], description: "Malha 100% algodão, gola careca. Imagem provisória (ilustração)." },
  { name: "Regata canelada off-white", sku: "TU-08", price: 5990, photo: "art:#f4efe6,#e8e0d2,#fbf8f2", category: "Básicos", variants: ["P", "M", "G"], description: "Malha canelada com elastano. Imagem provisória (ilustração)." },
  { name: "Calça jogger preta", sku: "TU-09", price: 15990, photo: "art:#1f1f1f,#3a3a3a,#2a2a2a", category: "Básicos", variants: ["P", "M", "G", "GG"], description: "Moletom leve com punho na barra e bolsos laterais. Imagem provisória (ilustração)." },
  { name: "Sandália de salto bloco", sku: "TU-10", price: 21990, photo: P("moda-4"), category: "Acessórios", variants: ["34", "35", "36", "37", "38", "39"], description: "Salto bloco de 6 cm, tiras finas e fivela. Material sintético." },
  { name: "Bolsa estruturada vermelha", sku: "TU-11", price: 32990, photo: P("ace-1"), category: "Acessórios", featured: true, variants: ["Único"], description: "Bolsa de mão com alça removível. Material sintético, forro em tecido." },
  { name: "Bolsa de palha laranja", sku: "TU-12", price: 26990, photo: P("ace-2"), category: "Acessórios", variants: ["Único"], description: "Palha sintética trançada com alças de couro sintético." },
  { name: "Brincos dourados trançados", sku: "TU-13", price: 8990, photo: P("ace-3"), category: "Acessórios", variants: ["Único"], description: "Metal com banho dourado, fecho de pressão." },
  { name: "Carteira de couro marrom", sku: "TU-14", price: 11990, photo: P("ace-4"), category: "Acessórios", variants: ["Único"], description: "Couro legítimo com divisórias para cartões." },
];

const HERO = { desktop: { ratio: "21:9", size: [2400, 1029] as [number, number] }, mobile: { ratio: "4:5", size: [1080, 1350] as [number, number] } };
const DUO = { desktop: { ratio: "4:3", size: [1600, 1200] as [number, number] }, mobile: { ratio: "4:3", size: [1080, 810] as [number, number] } };
const STRIP = { desktop: { ratio: "4:1", size: [2400, 600] as [number, number] }, mobile: { ratio: "3:2", size: [1200, 800] as [number, number] } };
const MOSAIC_BIG = { desktop: { ratio: "4:5", size: [1200, 1500] as [number, number] }, mobile: { ratio: "4:5", size: [1080, 1350] as [number, number] } };
const SQUARE = { desktop: { ratio: "1:1", size: [1200, 1200] as [number, number] }, mobile: { ratio: "1:1", size: [1080, 1080] as [number, number] } };
const MODA_LOOK = { palette: "Neutros quentes (areia, cru, preto) com acento ferrugem; sem verde corporativo", light: "Luz natural lateral, suave, fim de tarde" };
const modaAsset = (a: Omit<FamilyAsset, "family" | "palette" | "light">): FamilyAsset => ({ family: "moda", ...MODA_LOOK, ...a });

const MODA_ASSETS: FamilyAsset[] = [
  modaAsset({ id: "moda-hero-1", position: "Página inicial · Destaque com banners · slide 1", levels: [1, 2, 3, 4], ...HERO, focus: "Pessoa à direita do quadro (foco 70% / 50% no computador; 50% / 40% no celular)", safeArea: "Metade esquerda livre para o título (computador); terço inferior livre no celular", scene: "Modelo de costas/perfil, sem rosto reconhecível, vestindo conjunto de moletom mostarda numa rua de bairro com muro claro", overlayText: "Coleção da estação · Básicos que combinam com tudo · Ver coleção", alt: "Conjunto de moletom mostarda em uma rua clara", provisional: P("moda-hero-wide") }),
  modaAsset({ id: "moda-hero-2", position: "Página inicial · Destaque com banners · slide 2", levels: [2, 3, 4], ...HERO, focus: "Peças no centro-direita", safeArea: "Metade esquerda livre", scene: "Arara com peças em tons de areia e preto num estúdio claro, sem etiquetas legíveis", overlayText: "Básicos para todo dia · Ver básicos", alt: "Arara com básicos em tons neutros", provisional: P("moda-2") }),
  modaAsset({ id: "moda-hero-3", position: "Página inicial · Destaque com banners · slide 3", levels: [3, 4], ...HERO, focus: "Centro", safeArea: "Metade esquerda livre", scene: "Detalhe de jaqueta de couro sintético preta sobre cadeira de madeira", overlayText: "Jaquetas e peças avulsas · Ver peças", alt: "Jaqueta preta sobre cadeira de madeira", provisional: P("moda-3") }),
  modaAsset({ id: "moda-hero-4", position: "Página inicial · Destaque com banners · slide de campanha agendada", levels: [4], ...HERO, focus: "Centro", safeArea: "Metade esquerda livre", scene: "Composição de acessórios (bolsa, brincos, carteira) sobre tecido cru, vista de cima", overlayText: "Campanha da estação (agendada) · Ver acessórios", alt: "Acessórios sobre tecido cru", provisional: P("ace-hero") }),
  modaAsset({ id: "moda-apoio-1", position: "Página inicial · Dois banners de apoio · esquerda", levels: [1, 2, 3, 4], ...DUO, focus: "Centro", safeArea: "Terço inferior livre para título e botão", scene: "Poncho de tricô cru dobrado sobre banco de madeira", overlayText: "Peças avulsas · Ver", alt: "Poncho de tricô cru sobre banco", provisional: P("moda-1") }),
  modaAsset({ id: "moda-apoio-2", position: "Página inicial · Dois banners de apoio · direita", levels: [1, 2, 3, 4], ...DUO, focus: "Centro", safeArea: "Terço inferior livre", scene: "Bolsa estruturada vermelha sobre pedestal claro", overlayText: "Acessórios · Ver", alt: "Bolsa vermelha sobre pedestal", provisional: P("ace-1") }),
  modaAsset({ id: "moda-faixa-1", position: "Página inicial · Faixa de campanha", levels: [1, 2, 3, 4], ...STRIP, focus: "Assunto à direita (75% / 50%)", safeArea: "55% à esquerda livres para texto (computador)", scene: "Textura de malha canelada areia com uma peça dobrada à direita", overlayText: "Monte o seu conjunto · Ver conjuntos", alt: "Malha canelada areia com peça dobrada", provisional: P("moda-5") }),
  modaAsset({ id: "moda-sobre", position: "Página inicial · Imagem com texto (sobre a marca)", levels: [2, 3, 4], desktop: { ratio: "1:1", size: [1200, 1200] }, focus: "Centro", safeArea: "Sem texto por cima", scene: "Mãos ajustando a barra de uma calça numa bancada de costura", overlayText: "(texto ao lado da imagem)", alt: "Mãos ajustando a barra de uma calça", provisional: P("moda-hero") }),
  modaAsset({ id: "moda-mosaico-1", position: "Página inicial · Mosaico de banners · peça grande", levels: [3, 4], ...MOSAIC_BIG, focus: "Centro", safeArea: "Canto inferior esquerdo livre para título", scene: "Modelo de corpo inteiro (sem rosto) com conjunto canelado areia", overlayText: "Conjuntos", alt: "Conjunto canelado areia", provisional: P("moda-hero") }),
  modaAsset({ id: "moda-mosaico-2", position: "Página inicial · Mosaico de banners · menor 1", levels: [3, 4], ...SQUARE, focus: "Centro", safeArea: "Canto inferior esquerdo livre", scene: "Pilha de camisetas básicas dobradas em tons neutros", overlayText: "Básicos", alt: "Camisetas básicas dobradas", provisional: P("moda-2") }),
  modaAsset({ id: "moda-mosaico-3", position: "Página inicial · Mosaico de banners · menor 2", levels: [3, 4], ...SQUARE, focus: "Centro", safeArea: "Canto inferior esquerdo livre", scene: "Sandália de salto bloco sobre piso de cimento queimado", overlayText: "Calçados e acessórios", alt: "Sandália de salto bloco", provisional: P("moda-4") }),
  modaAsset({ id: "moda-mosaico-4", position: "Página inicial · Mosaico 1+4 · menor 3", levels: [4], ...SQUARE, focus: "Centro", safeArea: "Canto inferior esquerdo livre", scene: "Brincos dourados trançados sobre linho", overlayText: "Bijuterias", alt: "Brincos dourados sobre linho", provisional: P("ace-3") }),
  modaAsset({ id: "moda-mosaico-5", position: "Página inicial · Mosaico 1+4 · menor 4", levels: [4], ...SQUARE, focus: "Centro", safeArea: "Canto inferior esquerdo livre", scene: "Carteira de couro marrom aberta sobre madeira", overlayText: "Carteiras", alt: "Carteira de couro marrom", provisional: P("ace-4") }),
  modaAsset({ id: "moda-look-1", position: "Página inicial · Lookbook · 1", levels: [3, 4], desktop: { ratio: "4:5", size: [1080, 1350] }, focus: "Centro", safeArea: "Título abaixo da imagem (fora da foto)", scene: "Look urbano com jaqueta preta e calça jogger, de costas, numa escada", overlayText: "(título abaixo)", alt: "Look urbano com jaqueta preta", provisional: P("moda-3") }),
  modaAsset({ id: "moda-look-2", position: "Página inicial · Lookbook · 2", levels: [3, 4], desktop: { ratio: "4:5", size: [1080, 1350] }, focus: "Centro", safeArea: "Título abaixo", scene: "Look de fim de semana com conjunto mostarda e tênis branco", overlayText: "(título abaixo)", alt: "Look de fim de semana mostarda", provisional: P("moda-hero") }),
  modaAsset({ id: "moda-look-3", position: "Página inicial · Lookbook · 3", levels: [3, 4], desktop: { ratio: "4:5", size: [1080, 1350] }, focus: "Centro", safeArea: "Título abaixo", scene: "Look com poncho cru e bolsa de palha num café", overlayText: "(título abaixo)", alt: "Look com poncho e bolsa de palha", provisional: P("moda-1") }),
  modaAsset({ id: "moda-look-4", position: "Página inicial · Lookbook · 4", levels: [3, 4], desktop: { ratio: "4:5", size: [1080, 1350] }, focus: "Centro", safeArea: "Título abaixo", scene: "Look com blazer xadrez azul e camiseta branca", overlayText: "(título abaixo)", alt: "Look com blazer xadrez azul", provisional: P("moda-5") }),
];

export type FamilyDemo = { family: ThemeFamily; storeName: string; tagline: string; products: DemoProduct[]; assets: FamilyAsset[]; menu: { label: string; children: string }[] };
export const FAMILY_DEMOS: Partial<Record<ThemeFamily, FamilyDemo>> = {
  moda: { family: "moda", storeName: "Trama Urbana", tagline: "Básicos e conjuntos para o dia a dia", products: MODA_PRODUCTS, assets: MODA_ASSETS, menu: [{ label: "Básicos", children: "Camisetas | /catalog?category=basicos\nCalças | /catalog?category=basicos" }, { label: "Conjuntos", children: "" }, { label: "Peças avulsas", children: "" }, { label: "Acessórios", children: "Bolsas | /catalog?category=acessorios\nBijuterias | /catalog?category=acessorios" }] },
};

/** Família que cada tema usa na demonstração (temas base reaproveitam o catálogo Moda, como antes). */
export const demoFamilyOf = (family: ThemeFamily): FamilyDemo | undefined => FAMILY_DEMOS[family] ?? FAMILY_DEMOS.moda;
export const assetById = (id: string): FamilyAsset | undefined => Object.values(FAMILY_DEMOS).flatMap((d) => d?.assets ?? []).find((a) => a.id === id);
/** Endereço final esperado (o dono salva o arquivo com este nome). */
export const finalAssetPath = (a: Pick<FamilyAsset, "id" | "family">, variant: "desktop" | "mobile" = "desktop") => `/temas/familias/${a.family}/${a.id}${variant === "mobile" ? "-mobile" : ""}.webp`;
