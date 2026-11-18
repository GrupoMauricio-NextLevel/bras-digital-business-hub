/**
 * As quatro frentes da NextLevel Commerce (ecossistema tudo em um, D336): Commerce (loja virtual), Sites (captação),
 * Business (gestão) e Soluções (agência). Uma casa, quatro portas, um painel: as páginas usam o mesmo molde e só a copy
 * muda. Arquivo puro (testado): nenhum preço aqui; preço vem da tabela do Master e do catálogo, na própria página.
 * Plano: `docs/prompts/ecossistema-tudo-em-um-aproveitamento.md`.
 */
export const CHAVES_FRENTE = ["commerce", "sites", "business", "solucoes"] as const;
export type ChaveFrente = (typeof CHAVES_FRENTE)[number];

export type Frente = {
  chave: ChaveFrente;
  nome: string;
  curto: string;
  /** Uma linha para menu, rodapé e cartões. */
  linha: string;
  /** Endereço na Commerce; Soluções usa o site do grupo (resolvido na página). */
  href: string;
  icone: "Store" | "Globe" | "LayoutDashboard" | "Handshake";
  heroi: { rotulo: string; antes: string; destaque: string; depois?: string; texto: string };
  /** Seis cartões "O que vem" (só o que já funciona; "em breve" marcado no texto). */
  beneficios: [string, string][];
  passos: [string, string][];
  faq: { q: string; a: string }[];
  /** Linhas do quadro "Sem a NextLevel × Com a NextLevel" (o que muda no dia a dia, sem preço de concorrente). */
  quadro: { tema: string; sem: string; com: string }[];
};

export const FRENTES: Record<ChaveFrente, Frente> = {
  commerce: {
    chave: "commerce", nome: "NextLevel Commerce", curto: "Loja virtual", href: "/", icone: "Store",
    linha: "Loja virtual para varejo e atacado, com 0% de tarifa da plataforma no Mercado Pago.",
    heroi: { rotulo: "NextLevel Commerce", antes: "Sua loja virtual para", destaque: "varejo e atacado", texto: "Catálogo, carrinho, Pix e cartão, grade, preço por quantidade e pedido mínimo. Temas prontos e o mesmo painel para cuidar do negócio." },
    beneficios: [
      ["Atacado em todos os planos", "Grade, preço por quantidade e pedido mínimo na mesma loja do varejo."],
      ["0% de tarifa da plataforma", "Com o Mercado Pago, da NextLevel você paga só a mensalidade."],
      ["Temas por nicho", "Moda, beleza, casa, celular, esporte e atacado, prontos para editar."],
      ["Pix e cartão", "Checkout próprio, cupom, frete e domínio próprio."],
      ["Clientes e pós-venda", "Funil de clientes, atendimento e avaliações no mesmo painel."],
      ["Maurício, a IA do painel", "Escreve descrições e ajuda no dia a dia."],
    ],
    passos: [["Escolha o tema", "Comece por um tema do seu nicho."], ["Cadastre os produtos", "Ou migre da sua plataforma atual."], ["Comece a vender", "Pix, cartão e frete prontos."]],
    faq: [],
    quadro: [],
  },
  sites: {
    chave: "sites", nome: "NextLevel Sites", curto: "Sites", href: "/sites", icone: "Globe",
    linha: "Site que transforma anúncio em cliente, com a origem de cada pedido de orçamento.",
    heroi: { rotulo: "NextLevel Sites", antes: "Seu site que", destaque: "transforma anúncio em cliente", texto: "Páginas da empresa e das suas campanhas, pedido de orçamento com a origem de cada contato e o painel para responder e fechar. Pronto em minutos, no seu domínio." },
    beneficios: [
      ["Site da empresa pronto", "Início, Sobre, Serviços e Contato prontos para trocar os textos, no seu domínio."],
      ["Serviços com pedido de orçamento", "Cada serviço com resumo, foto e “a partir de” ou “sob orçamento”."],
      ["Origem de cada contato", "Você vê se o pedido veio de anúncio da Meta, do Google, do Instagram ou direto."],
      ["Contatos e orçamentos", "Assuma, responda pelo WhatsApp e marque orçamento enviado, fechou ou perdeu."],
      ["Pronto para o seu tipo de serviço", "Vidraçaria, manutenção, instalação, consultoria, escritório e qualquer empresa que vende por orçamento."],
      ["Loja virtual quando quiser", "Ligue a loja na mesma conta, com desconto no segundo produto."],
    ],
    passos: [["Comece pelo modelo", "Início, Sobre, Serviços e Contato nascem prontos."], ["Troque textos e fotos", "No painel, sem programador."], ["Ligue o anúncio", "Cada pedido chega com a origem, no painel."]],
    faq: [
      { q: "Preciso saber programar?", a: "Não. O site nasce com as páginas prontas; você troca textos, fotos e serviços no painel." },
      { q: "Como sei de onde veio o cliente?", a: "O formulário de orçamento guarda a origem: anúncio da Meta, do Google, Instagram ou acesso direto, com o nome da campanha quando houver." },
      { q: "Posso ter loja virtual também?", a: "Sim. Na mesma conta e no mesmo painel, com desconto no segundo produto." },
      { q: "Tem fidelidade?", a: "Não. Você cancela quando quiser, direto no painel." },
    ],
    quadro: [
      { tema: "De onde veio o cliente", sem: "Ninguém sabe qual anúncio trouxe o pedido", com: "Cada pedido chega com a origem e a campanha" },
      { tema: "Pedido de orçamento", sem: "Cai num e-mail ou se perde no WhatsApp", com: "Entra no painel com responsável e situação" },
      { tema: "Andamento", sem: "Planilha ou memória", com: "Novo, orçamento enviado, fechou ou perdeu" },
      { tema: "Vender online", sem: "Outra plataforma, outra conta", com: "Liga a loja virtual na mesma conta" },
      { tema: "Ajuda para anunciar", sem: "Procurar uma agência à parte", com: "A equipe NextLevel roda os anúncios pelo painel" },
    ],
  },
  business: {
    chave: "business", nome: "NextLevel Business", curto: "Business", href: "/business", icone: "LayoutDashboard",
    linha: "Funil de clientes, atendimento, equipe e anúncios: o coração do seu negócio num lugar só.",
    heroi: { rotulo: "NextLevel Business", antes: "O", destaque: "coração do seu negócio", depois: "num lugar só", texto: "Funil de clientes, atendimento, equipe e resultados dos anúncios no mesmo painel do seu site e da sua loja. Para a empresa que cresceu e não cabe mais no WhatsApp e na planilha." },
    beneficios: [
      ["Funil de clientes", "Quem conversou, pediu orçamento e comprou, em etapas que andam sozinhas."],
      ["Contatos com origem", "Cada contato com o anúncio ou a página que trouxe, e o responsável."],
      ["Atendimento", "As perguntas do site e da loja num lugar só, para a equipe responder."],
      ["Equipe com acessos", "Cada pessoa com o seu login, o que pode ver e o registro do que fez."],
      ["Resultados dos anúncios", "O que a Meta trouxe de contato e de venda, ao lado do funil."],
      ["Maurício, a IA do painel", "Ajuda a escrever, responder e entender os números."],
    ],
    passos: [["Fale com a equipe", "Entendemos o seu negócio e montamos a conta."], ["Traga a equipe", "Cada pessoa com o seu acesso."], ["Organize o dia", "Funil, atendimento e números no mesmo painel."]],
    faq: [
      { q: "O que é o NextLevel Business?", a: "O sistema de gestão da NextLevel: funil de clientes, atendimento, contratos, equipe e resultados dos anúncios, no mesmo painel do site e da loja virtual." },
      { q: "Já tenho loja ou site na NextLevel. Preciso trocar de conta?", a: "Não. O Business liga na mesma conta. Quem tem o plano Scale já tem o Business Essencial incluso." },
      { q: "Vou pagar por cliente no portal?", a: "Não. O portal do cliente, que está chegando, não terá limite de clientes nem cobrança por cliente. O preço é por empresa, com a equipe inclusa no nível." },
      { q: "O que ainda está chegando?", a: "Projetos e tarefas, contratos com os seus clientes, portal do cliente e o caixa da loja física. Mostramos aqui só o que já funciona; o resto aparece como “em breve”." },
    ],
    quadro: [
      { tema: "Clientes", sem: "Planilha, caderno e conversas soltas", com: "Funil com etapas e histórico de cada cliente" },
      { tema: "Origem das vendas", sem: "Não sabe qual anúncio funciona", com: "Origem do contato até a venda" },
      { tema: "Equipe", sem: "Todo mundo no mesmo WhatsApp", com: "Cada pessoa com acesso e responsável" },
      { tema: "Ferramentas", sem: "Site, loja e CRM em empresas diferentes", com: "Site, loja e gestão no mesmo painel" },
      { tema: "Preço", sem: "Por usuário e muitas vezes em dólar", com: "Em reais, com a equipe inclusa no nível" },
      { tema: "Portal do cliente (em breve)", sem: "Cobrado por acesso", com: "Sem limite e sem cobrança por cliente" },
    ],
  },
  solucoes: {
    chave: "solucoes", nome: "NextLevel Soluções", curto: "Soluções", href: "/solucoes", icone: "Handshake",
    linha: "A agência que usa o sistema que você usa: montamos, anunciamos e cuidamos com você.",
    heroi: { rotulo: "NextLevel Soluções", antes: "A", destaque: "agência", depois: "que usa o sistema que você usa", texto: "Montamos seu site ou loja, rodamos seus anúncios e cuidamos do seu painel. Você acompanha tudo pelo Meu negócio." },
    beneficios: [], passos: [], faq: [], quadro: [],
  },
};

export const frenteDe = (c: ChaveFrente) => FRENTES[c];

/** As outras três frentes, na ordem fixa (a ponte "Também da NextLevel"). */
export const pontes = (c: ChaveFrente): Frente[] => CHAVES_FRENTE.filter((k) => k !== c).map((k) => FRENTES[k]);
