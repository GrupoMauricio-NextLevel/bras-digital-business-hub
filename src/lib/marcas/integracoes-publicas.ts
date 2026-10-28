/**
 * Integrações da NextLevel E-commerce para as páginas públicas (D192). Fonte única do que pode ser anunciado: só entra
 * aqui o que já existe no código (D187 a D191). Em construção não entra. O nome de cada serviço é só texto (sem logo de
 * terceiros) e o "como liga" diz o que o lojista faz, para não parecer mais fácil do que é.
 */
export type IntegracaoPublica = { nome: string; detalhe: string };
export type GrupoIntegracoes = { key: string; titulo: string; frase: string; como: string; itens: IntegracaoPublica[] };

export const INTEGRACOES_PUBLICAS: readonly GrupoIntegracoes[] = [
  {
    key: "pagamento", titulo: "Receber", frase: "O dinheiro cai na sua conta, sem intermediário da NextLevel.", como: "Conecte a sua conta Mercado Pago no painel.",
    itens: [
      { nome: "Mercado Pago", detalhe: "Pix com confirmação automática e cartão em até 6x." },
      { nome: "Link de pagamento", detalhe: "Monte o pedido e mande o link pelo WhatsApp." },
    ],
  },
  {
    key: "frete", titulo: "Entregar", frase: "Frete cotado por CEP no checkout, com a sua tabela de reserva.", como: "Cole o token da plataforma de envio (ou, nos Correios, os dados do contrato).",
    itens: [
      { nome: "Melhor Envio", detalhe: "Várias transportadoras numa conta só." },
      { nome: "SuperFrete", detalhe: "Correios com preço de plataforma." },
      { nome: "Frenet", detalhe: "Cotação em várias transportadoras ao mesmo tempo." },
      { nome: "Kangu", detalhe: "Frete com pontos de coleta." },
      { nome: "Correios com contrato", detalhe: "SEDEX e PAC pelo preço do seu contrato." },
      { nome: "Onlog", detalhe: "Cotação pela sua conta Onlog." },
      { nome: "Regras próprias e retirada", detalhe: "Frete grátis a partir de um valor, tabela por CEP e retirar na loja." },
    ],
  },
  {
    key: "anuncios", titulo: "Anunciar e medir", frase: "Seus anúncios sabem quais vendas trouxeram.", como: "Cole o código de cada serviço; a compra só conta depois do pagamento confirmado.",
    itens: [
      { nome: "Pixel da Meta e API de conversões", detalhe: "Facebook e Instagram, com a compra avisada pelo servidor." },
      { nome: "Google Analytics 4", detalhe: "Visitas, produto visto, carrinho e compra." },
      { nome: "Google Ads", detalhe: "Conversão de compra." },
      { nome: "Google Tag Manager", detalhe: "Outras tags sem programar." },
      { nome: "Google Search Console", detalhe: "Confirma a loja no Google." },
      { nome: "Pixel do TikTok", detalhe: "Página, produto, carrinho e compra." },
      { nome: "Tag do Pinterest", detalhe: "Página, produto, carrinho e compra." },
    ],
  },
  {
    key: "catalogos", titulo: "Catálogos", frase: "Um endereço de catálogo que se atualiza sozinho com preço e estoque.", como: "Copie o endereço do catálogo e cole no serviço.",
    itens: [
      { nome: "Google Shopping", detalhe: "Pelo Merchant Center." },
      { nome: "Instagram e Facebook", detalhe: "Catálogo da Meta para anúncios e loja no Instagram." },
      { nome: "TikTok", detalhe: "Catálogo para anúncios de produto." },
    ],
  },
  {
    key: "gestao", titulo: "Gestão", frase: "Pedido pago vai sozinho para o ERP; o estoque de lá volta para a loja.", como: "Cole o token do Tiny ou a chave do Omie.",
    itens: [
      { nome: "Tiny (Olist ERP)", detalhe: "Pedidos pagos e estoque por SKU a cada 15 minutos." },
      { nome: "Omie", detalhe: "Pedidos pagos e estoque por SKU a cada 15 minutos." },
    ],
  },
  {
    key: "atendimento", titulo: "Atender e vender mais", frase: "O cliente fala com você e volta para a loja.", como: "Ligue no painel; nada de script colado.",
    itens: [
      { nome: "WhatsApp", detalhe: "Botão na loja e mensagem pronta de pedido e rastreio." },
      { nome: "Tawk.to e JivoChat", detalhe: "Chat ao vivo na loja (o Tawk.to é gratuito)." },
      { nome: "Carrinho abandonado", detalhe: "Lembrete por e-mail a quem aceitou receber." },
      { nome: "Loja no celular", detalhe: "O cliente instala a loja na tela inicial." },
      { nome: "Confirmação de 18 anos", detalhe: "Para bebidas, tabacaria e produtos adultos." },
    ],
  },
  {
    key: "migrar", titulo: "Mudar de plataforma", frase: "Quem vem de outra plataforma não perde o Google.", como: "Cole os endereços antigos numa planilha simples.",
    itens: [
      { nome: "Endereços antigos (301)", detalhe: "O link antigo leva ao produto novo." },
      { nome: "Domínio próprio", detalhe: "A loja no endereço da sua marca." },
      { nome: "Importação por planilha", detalhe: "Produtos e variações de uma vez." },
    ],
  },
];

export const totalDeIntegracoes = () => INTEGRACOES_PUBLICAS.reduce((s, g) => s + g.itens.length, 0);
