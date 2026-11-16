import type { Store } from "@/db/schema";
import type { PublicProduct } from "@/lib/queries/storefront";
import type { PageKind, SettingValue, ThemeGlobals } from "@/lib/themes/types";

/** Tudo o que uma seção precisa para se desenhar. Os dados já vêm resolvidos pelo servidor. */
export type SectionCtx = {
  slug: string;
  /** Endereço base da loja (ex.: /store/minha-loja). Links do tema começam por aqui. */
  base: string;
  store: Store;
  /** Marca dona da loja (organização). O selo "Tecnologia SuperDrop" do rodapé só aparece em loja do SuperDrop. */
  brandCode?: string;
  categories: { id: string; name: string; slug: string }[];
  products: PublicProduct[];
  /** Produtos de cada seção de vitrine ou grade, já repartidos (sem repetir). */
  planned: Record<string, PublicProduct[]>;
  hero: PublicProduct | undefined;
  globals: ThemeGlobals;
  page: PageKind;
  /** Página de produto: o produto aberto e os relacionados da mesma categoria. */
  product?: PublicProduct;
  related?: PublicProduct[];
  /** Página de catálogo: filtros da busca e a categoria escolhida. */
  query?: { category?: string; q?: string; sort?: string; produtos?: string };
  /** Prévia do editor: posições de imagem vazias aparecem (fundo do tema) para o lojista saber onde colocar a foto. */
  editing?: boolean;
  /** Momento da renderização (agenda de banners) e categoria aberta na coleção (condição por contexto). */
  now?: Date;
  categoryId?: string | null;
  /** Cupom de boas-vindas válido agora (só o rótulo; o código é revelado pela ação, com consentimento). */
  welcome?: { label: string; minText: string | null } | null;
  /** Id da primeira seção visível de conteúdo (recebe o título principal da página). */
  firstId?: string;
  /** NextLevel Business (NB2, D307): serviços ativos do negócio (seção "Serviços"). */
  servicos?: import("@/lib/business/servicos").ServicoPublico[];
  /** Negócio sem loja virtual (caminho Site): o cabeçalho troca carrinho e catálogo pelas páginas do site. */
  semLoja?: boolean;
  /** Páginas publicadas que vão no menu do site (já com o endereço completo). */
  menuSite?: { label: string; href: string }[];
};

export type SectionProps = {
  id: string;
  settings: Record<string, SettingValue>;
  blocks: { id: string; type: string; settings: Record<string, SettingValue> }[];
  ctx: SectionCtx;
};
