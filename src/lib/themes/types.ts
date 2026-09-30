/** Motor de temas: modelo de dados (seções, blocos, modelos de página em JSON e estilo global). */
export const PAGE_KINDS = ["home", "product", "collection", "cart"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];
export const PAGE_LABEL: Record<PageKind, string> = { home: "Página inicial", product: "Página de produto", collection: "Coleção", cart: "Carrinho" };

export const SETTING_TYPES = ["text", "textarea", "richtext", "image", "video", "datetime", "color", "range", "number", "select", "checkbox", "url", "product", "collection", "font"] as const;
export type SettingType = (typeof SETTING_TYPES)[number];
export type SettingValue = string | number | boolean;

export type SettingDef = {
  id: string;
  type: SettingType;
  label: string;
  default?: SettingValue;
  info?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number; max?: number; step?: number; unit?: string;
  maxLength?: number;
};

export type BlockDef = { type: string; name: string; settings: SettingDef[]; limit?: number };
export type SectionRegion = "header" | "content" | "footer";
export type SectionCategory = "Cabeçalho" | "Rodapé" | "Destaque" | "Produtos" | "Conteúdo" | "Confiança";

export type SectionSchema = {
  type: string;
  name: string;
  description: string;
  category: SectionCategory;
  region: SectionRegion;
  /** Páginas em que a seção pode ser usada (só vale para a região de conteúdo). */
  pages: PageKind[];
  /** Só pode existir uma por modelo (ex.: cabeçalho). */
  singleton?: boolean;
  /** Seções de um mesmo espaço se excluem (ex.: cabeçalho simples e cabeçalho com menu grande). */
  slot?: string;
  /** Recurso pago ou avançado: o editor mostra cadeado nas ofertas que não liberam. */
  premium?: boolean;
  /** Temas que incluem esta seção. Sem a lista, a seção é livre; com ela, só quem tem um desses temas pode usá-la. */
  themes?: string[];
  settings: SettingDef[];
  blocks?: BlockDef[];
  maxBlocks?: number;
  presets: { name: string; settings?: Record<string, SettingValue>; blocks?: { type: string; settings?: Record<string, SettingValue> }[] }[];
};

export type BlockInstance = { type: string; settings: Record<string, SettingValue>; hidden?: boolean };
export type SectionInstance = { type: string; settings: Record<string, SettingValue>; blocks: Record<string, BlockInstance>; blockOrder: string[]; hidden?: boolean };
/** Modelo de uma página (ou de um grupo global): seções por id e a ordem de exibição. */
export type Template = { v: 1; sections: Record<string, SectionInstance>; order: string[] };

export type ThemeStyle = { primary: string; accent: string; headingFont: string; bodyFont: string; radius: number; buttons: "solid" | "outline"; /** Botão "Compra rápida" nos cartões de produto. */ quickView: boolean; /** Seções aparecem com movimento discreto ao rolar. */ animations: boolean };
/** Estilo do tema e os grupos globais (cabeçalho e rodapé) compartilhados por todas as páginas. */
export type ThemeGlobals = { v: 1; style: ThemeStyle; header: Template; footer: Template };

export const LIMITS = { sections: 40, blocks: 24, idLength: 40 } as const;
export const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;
