/** Integrações só de configuração da loja (Rodada A, D189). Tipo puro, usado pelo banco, pela loja e pelo painel. */
export type IntegracoesLoja = {
  ga4?: string;
  gtm?: string;
  googleVerificacao?: string;
  googleAds?: { id: string; rotulo?: string };
  tiktokPixel?: string;
  pinterestTag?: string;
  chat?: { provedor: "TAWK" | "JIVO"; id: string };
  pwa?: boolean;
  maioridade?: boolean;
};
