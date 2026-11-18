/** Produtos de projeto e meios de pagamento (D335). Sem dependência de servidor: usado também nos formulários. */
export const PRODUTOS_PROJETO = {
  LOJA_PRONTA_EXPRESS: { nome: "Loja Virtual Pronta Express", valorCents: 160_000, produtos: 40, banners: 8, prazoDias: 10 },
  MIGRACAO_PLATAFORMA: { nome: "Migração Nuvemshop → NextLevel", valorCents: 50_000, produtos: 40, banners: 8, prazoDias: 7 },
} as const;
export type ProdutoProjeto = keyof typeof PRODUTOS_PROJETO;
export const PRODUTOS_PROJETO_LISTA = Object.keys(PRODUTOS_PROJETO) as ProdutoProjeto[];
export const PLATAFORMAS_ORIGEM = ["Nuvemshop", "Shopify", "Tray", "Loja Integrada", "WooCommerce", "Wix", "Outra"] as const;
export const MEIOS_PAGAMENTO = { PIX: "Pix", TRANSFERENCIA: "Transferência", DINHEIRO: "Dinheiro", CARTAO: "Cartão", MERCADO_PAGO: "Mercado Pago", OUTRO: "Outro" } as const;
export type MeioPagamento = keyof typeof MEIOS_PAGAMENTO;
