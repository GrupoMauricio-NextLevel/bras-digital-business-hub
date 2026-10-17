/** Opções do cadastro de fornecedor da rede (D160). Puro: serve o formulário (navegador), o domínio e os testes. */
export const SUPPLIER_TYPES = ["IMPORTADORA", "DISTRIBUIDOR", "ATACADISTA"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];
export const SUPPLIER_TYPE_LABEL: Record<SupplierType, string> = { IMPORTADORA: "Importadora", DISTRIBUIDOR: "Distribuidor", ATACADISTA: "Atacadista" };

/** Polos de abastecimento, na ordem de entrada (D160: o Canindé primeiro). */
export const POLOS = [
  { key: "CANINDE", nome: "Canindé", primeiro: true },
  { key: "BRAS", nome: "Brás", primeiro: false },
  { key: "BOM_RETIRO", nome: "Bom Retiro", primeiro: false },
  { key: "VINTE_CINCO", nome: "25 de Março", primeiro: false },
  { key: "OUTRO", nome: "Outro polo", primeiro: false },
] as const;
export type Polo = (typeof POLOS)[number]["key"];
export const POLO_LABEL = Object.fromEntries(POLOS.map((p) => [p.key, p.nome])) as Record<Polo, string>;

/** Categorias sugeridas no cadastro (o fornecedor marca até 8). Texto livre fica para a revisão da equipe. */
export const SUPPLIER_CATEGORIES = [
  "Utilidades domésticas", "Casa e decoração", "Eletrônicos e acessórios", "Celular e acessórios", "Brinquedos", "Papelaria e escritório",
  "Moda e acessórios", "Bijuterias", "Beleza e cuidados", "Ferramentas", "Automotivo", "Pet", "Esporte e lazer", "Festas e datas", "Embalagens",
] as const;
export const SUPPLIER_PAYMENT_METHODS = ["Pix", "Dinheiro", "Boleto", "Cartão", "Prazo para cliente recorrente"] as const;
