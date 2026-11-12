/**
 * Lojas criadas pela NextLevel (página "NextLevel Temas para Nuvemshop", D282). Ordem e descrição do dono (12/11/2026);
 * todos os clientes autorizaram aparecer. Regra: nenhum texto cita a plataforma em que a loja roda, e nenhum número de
 * venda entra sem dado do cliente. Imagens em public/portal/temas-nuvemshop (recortes do layout, sem destacar escudos
 * e marcas de terceiros). Loja sem imagem ainda aparece só com texto e o botão para visitar.
 */
export type Imagem = { src: string; w: number; h: number; alt: string };
export type PontoCase = { titulo: string; texto: string; imagem?: Imagem };
export type CaseLoja = {
  chave: string; nome: string; segmento: string; url: string; rotuloBotao: string;
  /** Resumo "Como o nosso trabalho ajuda". */
  ajuda: string; desafio: string; pontos: PontoCase[];
  computador?: Imagem; celular?: Imagem;
  /** Cor de destaque da identidade da loja (só para o detalhe do bloco). */
  cor: string; autorizado: boolean;
};

const img = (nome: string, w: number, h: number, alt: string): Imagem => ({ src: `/portal/temas-nuvemshop/${nome}.webp`, w, h, alt });

export const CASES_TEMAS: CaseLoja[] = [
  {
    chave: "irest", nome: "iRest", segmento: "Importador de poltronas de massagem, com entrega para todo o Brasil", url: "https://www.irest.com.br/", rotuloBotao: "Visitar a loja", cor: "#f26b1d", autorizado: true,
    ajuda: "Um importador que vende para o Brasil todo precisa parecer tão sólido online quanto no showroom. A loja organiza o catálogo por linha de produto, deixa garantias e parcelamento à vista e põe as campanhas no ar com data marcada, para vender produto de alto valor a quem nunca visitou a loja física.",
    desafio: "Produto importado de alto valor, vendido para quem está longe. O cliente precisa confiar antes de comprar.",
    computador: img("irest-computador", 1200, 750, "Página inicial da iRest no computador"), celular: img("irest-celular", 420, 715, "Página inicial da iRest no celular"),
    pontos: [
      { titulo: "Garantias logo abaixo do banner", texto: "Frete, pagamento seguro, horário de atendimento e parcelamento sem juros: as quatro dúvidas de quem vai gastar alto, respondidas antes da primeira rolagem.", imagem: img("irest-garantias", 1000, 108, "Faixa de garantias da iRest") },
      { titulo: "Campanha com data marcada", texto: "Banner com o dia da oferta escrito: urgência real e datada, não promoção eterna.", imagem: img("irest-banner", 1000, 350, "Banner de campanha da iRest") },
      { titulo: "A parcela embaixo do preço", texto: "Em produto caro, o número que decide é a parcela. Ela aparece em cada cartão da vitrine.", imagem: img("irest-lancamentos", 1000, 349, "Vitrine de lançamentos da iRest com parcelas") },
    ],
  },
  {
    chave: "capistrano", nome: "Capistrano Modas", segmento: "Atacado no circuito de compras da Feira da Madrugada", url: "https://www.capistranomodas.com.br/", rotuloBotao: "Visitar a loja", cor: "#d4a640", autorizado: true,
    ajuda: "Leva a banca da Feira da Madrugada para o Brasil todo. O revendedor compra o atacado pelo celular, misturando tamanhos e modelos, e o cliente final compra a peça avulsa na mesma loja.",
    desafio: "Vender para o revendedor de longe e para o cliente final na mesma vitrine, sem confundir os dois.",
    computador: img("capistrano-computador", 1200, 750, "Página inicial da Capistrano Modas no computador"),
    pontos: [
      { titulo: "Um banner que fala com o revendedor", texto: "\"Quer comprar para revender?\" com quatro vantagens e o botão para conhecer o atacado: o público mais valioso da loja é chamado pelo nome.", imagem: img("capistrano-banner", 940, 440, "Banner do atacado da Capistrano") },
      { titulo: "A regra do atacado na hora da decisão", texto: "Na página do produto: preço, economia em reais e em porcentagem, preço de atacado por unidade e o aviso \"misture tamanhos e modelos para atingir o mínimo\".", imagem: img("capistrano-atacado", 515, 350, "Preço de varejo e de atacado na página do produto") },
      { titulo: "O atacado no centro do celular", texto: "Barra fixa embaixo com o botão \"Atacado\" em destaque entre Início, Categorias, Buscar e Carrinho.", imagem: img("capistrano-barra-celular", 600, 129, "Barra inferior do celular com o botão Atacado no centro") },
    ],
  },
  {
    chave: "luis", nome: "Luis Fornecedor", segmento: "Distribuidor de produtos eletrônicos no Brás, em São Paulo", url: "https://www.luisfornecedor.com.br/", rotuloBotao: "Visitar a loja", cor: "#1d5bff", autorizado: true,
    ajuda: "Leva o atendimento próximo do balcão do Brás para o celular do lojista do Brasil todo: ele vê quem atende, acha o produto pela busca ou pela categoria e fecha o pedido no carrinho ou pelo WhatsApp.",
    desafio: "O lojista compra de um distribuidor sem ver o balcão: precisa confiar e achar rápido num catálogo que vai de eletrônicos a cosméticos e perfumes.",
    computador: img("luis-computador", 1200, 750, "Página inicial da Luis Fornecedor no computador, com os sócios"), celular: img("luis-celular", 420, 909, "Página de produto da Luis Fornecedor no celular"),
    pontos: [
      { titulo: "Os donos e a equipe no topo", texto: "Os sócios Luís e Andreza dão as boas-vindas no computador e a equipe aparece no celular. Para quem compra de longe, rosto e nome geram confiança." },
      { titulo: "Quatro garantias para quem revende", texto: "Curadoria para uso e revenda, preços para girar estoque, entrega nacional e atendimento especialista, logo abaixo do banner.", imagem: img("luis-garantias", 1000, 63, "Faixa de garantias da Luis Fornecedor") },
      { titulo: "Atalhos para o que mais gira", texto: "A barra de categorias leva direto aos produtos mais pedidos, e cada cartão mostra o código para o lojista pedir pelo código.", imagem: img("luis-atalhos", 1000, 435, "Barra de categorias e cartões com código na Luis Fornecedor") },
      { titulo: "Dois caminhos de compra", texto: "Na página do produto, quantidade, \"Adicionar ao carrinho\" e \"Comprar pelo WhatsApp\", com frete pelo CEP e os selos de envio, compra segura e pronta entrega.", imagem: img("luis-compra", 560, 450, "Botões de carrinho e WhatsApp na página do produto") },
    ],
  },
  {
    chave: "futcollection", nome: "Futcollection", segmento: "Loja de camisas de futebol, varejo e atacado", url: "https://www.futcollectionoficial.com.br/", rotuloBotao: "Visitar a loja", cor: "#f4b400", autorizado: true,
    ajuda: "Atende na mesma vitrine o torcedor que quer uma camisa e o revendedor que quer seis ou mais. Personalização e tamanho certo ficam resolvidos antes do carrinho, e quem está em São Paulo ainda retira no Brás.",
    desafio: "Varejo e atacado juntos, com personalização (nome e número) e os tamanhos certos de adulto e criança.",
    computador: img("fut-computador", 1200, 750, "Página inicial da Futcollection no computador"),
    pontos: [
      { titulo: "Online e loja física na mesma faixa", texto: "Frete para todo o Brasil, atacado a partir de 6 peças, PIX à vista e retirada no Brás, logo no topo.", imagem: img("fut-faixa", 780, 38, "Faixa do topo da Futcollection") },
      { titulo: "Navegação do jeito que o torcedor procura", texto: "Pílulas para Infantil, NBA, Seleções, Retrô, Jogador e Torcedor, e vitrines por tema.", imagem: img("fut-pilulas", 900, 59, "Navegação em pílulas da Futcollection") },
      { titulo: "Varejo e atacado no mesmo cartão", texto: "Selo de varejo ou de atacado, o preço de atacado logo abaixo, os tamanhos e o tipo de camisa à vista.", imagem: img("fut-cartoes", 1000, 201, "Cartões com preço de varejo e de atacado") },
      { titulo: "Tamanho infantil pela idade", texto: "\"20 (5 a 6 anos)\": os pais acertam o tamanho e as trocas diminuem.", imagem: img("fut-infantil", 220, 200, "Tamanhos infantis por idade") },
      { titulo: "Personalizar ou não, antes do carrinho", texto: "Botões \"Sem personalização\" e \"Personalizar\", aviso de últimas unidades e frete pelo CEP na própria página.", imagem: img("fut-produto", 560, 450, "Preço de atacado, tamanhos e botões de personalização") },
    ],
  },
  {
    chave: "ccv", nome: "CCV Vidros", segmento: "Site institucional, especialista em envidraçamento e persianas", url: "https://ccvidros.com.br/", rotuloBotao: "Visitar o site", cor: "#2f8cff", autorizado: true,
    ajuda: "Em vez de um site-cartão, a CCV tem um site que conduz o visitante até o pedido de orçamento já com as informações do projeto: a equipe recebe contatos mais prontos para virar visita técnica.",
    desafio: "Serviço sob medida não se vende com carrinho: o site precisa virar um pedido de orçamento qualificado.",
    computador: img("ccv-computador", 1200, 750, "Página inicial da CCV Vidros no computador"), celular: img("ccv-celular", 420, 715, "Página inicial da CCV Vidros no celular"),
    pontos: [
      { titulo: "Navegação como uma conversa", texto: "Visão, Projetos, Sistema, Materiais, Processo e Seu projeto: o menu conta a história na ordem em que o cliente decide.", imagem: img("ccv-navegacao", 1000, 56, "Menu da CCV Vidros em etapas") },
      { titulo: "Orçamento sem medo", texto: "\"Iniciar avaliação\" com a garantia \"leva cerca de 1 minuto, sem cadastro\", e o formulário em etapas sempre à vista.", imagem: img("ccv-avaliacao", 560, 115, "Botão Iniciar avaliação da CCV Vidros") },
      { titulo: "Especificação técnica honesta", texto: "Vidro, espessuras e o aviso de que a especificação final depende da avaliação técnica, com uma pergunta que já qualifica o pedido.", imagem: img("ccv-especificacao", 720, 440, "Especificação de materiais da CCV Vidros") },
    ],
  },
];

/** Só o que o cliente autorizou aparece. */
export const casesPublicos = () => CASES_TEMAS.filter((c) => c.autorizado);

/** Temas da NextLevel em destaque na página (semijoias primeiro, D282). */
export const TEMAS_SEMIJOIAS = ["musa", "aura", "brilho", "petala"] as const;
export const TEMAS_VITRINE = ["musa", "aura", "atelier", "editorial", "brilho", "signature", "arena", "porto", "morada"] as const;
