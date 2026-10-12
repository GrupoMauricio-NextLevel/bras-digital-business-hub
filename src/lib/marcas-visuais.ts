/**
 * Fonte única dos kits visuais das marcas (D152, pacote "marcas selecionadas" do GPT imagens). Arquivos em
 * `public/marcas/<slug>/{logos,imagens}`: originais em PNG (preservados) e derivados WebP para exibição
 * (`-640` logos, `-256` monogramas e ícones, `-1600`/`-800` imagens). Marca sem kit de imagens fica `assetless`:
 * as páginas usam composição com HTML e CSS e passam a usar a imagem quando o arquivo entrar aqui, sem refazer a página.
 * Textos sem métrica, depoimento ou promessa de ganho; só o que o sistema faz hoje.
 */
export type AssetStatus = "complete" | "partial" | "pending";
export type MarcaSlug = "nextlevel" | "superdrop" | "nextlevel-commerce" | "bras-digital" | "nextlevel-cargas" | "nextlevel-club" | "loja-nextlevel" | "meu-contador" | "parceiros";
type Item = { titulo: string; texto: string };
type Icone = Item & { arquivo: string };

export type MarcaVisual = {
  slug: MarcaSlug;
  nome: string;
  accent: string;
  parent?: MarcaSlug;
  logos: { clara?: boolean; escura?: boolean; monograma?: boolean; ratio: number };
  /** Kit institucional completo (13 arquivos) ou nenhum. */
  imagens: boolean;
  status: { logos: AssetStatus; imagens: AssetStatus };
  headline: string;
  apoio: string;
  icones: Icone[];
  capacidades: [Item, Item];
  prova: { titulo: string; pontos: string[] };
  cta: { titulo: string; texto: string };
  pendencias?: string;
};

const LOGO = 2172 / 724;
export const MARCAS: Record<MarcaSlug, MarcaVisual> = {
  nextlevel: {
    slug: "nextlevel", nome: "NextLevel", accent: "#F5BC00", logos: { ratio: LOGO }, imagens: true, status: { logos: "complete", imagens: "complete" },
    headline: "Estrutura digital para negócios que querem ir além.",
    apoio: "Loja virtual, migração, temas, tráfego e consultoria do mesmo grupo que opera SuperDrop, NextLevel Commerce, Brás Digital e NextLevel Cargas.",
    icones: [
      { arquivo: "strategy", titulo: "Estratégia", texto: "Diagnóstico gratuito antes de qualquer proposta." },
      { arquivo: "integration", titulo: "Integração", texto: "Loja, pagamento, frete e catálogo no mesmo sistema." },
      { arquivo: "automation", titulo: "Automação", texto: "Pedidos, cobranças e avisos sem planilha paralela." },
      { arquivo: "growth", titulo: "Crescimento", texto: "Jornada em etapas: fundação, lançamento, aquisição, otimização e escala." },
      { arquivo: "visibility", titulo: "Visibilidade", texto: "Temas profissionais e gestão de tráfego e redes sociais." },
      { arquivo: "support", titulo: "Suporte", texto: "Equipe NextLevel acompanha a implantação." },
    ],
    capacidades: [
      { titulo: "Do diagnóstico à loja no ar", texto: "Loja Pronta, Migração e White Label com escopo, prazo e entregáveis descritos em cada solução." },
      { titulo: "Um grupo, várias frentes", texto: "Quem começa numa marca encontra as outras quando o negócio pede: atacado, logística e loja própria." },
    ],
    prova: { titulo: "O que você contrata está escrito", pontos: ["Escopo, entregáveis e prazo em cada página de solução", "Preço publicado ou proposta sob consulta, sem letra miúda", "Sem promessa de faturamento: o resultado depende do seu produto e da sua operação"] },
    cta: { titulo: "Comece pelo diagnóstico gratuito", texto: "Conte o momento do seu negócio e receba o caminho recomendado." },
  },
  superdrop: {
    slug: "superdrop", nome: "SuperDrop", accent: "#2D9E3B", logos: { ratio: LOGO }, imagens: true, status: { logos: "complete", imagens: "complete" },
    headline: "Sua próxima venda começa com uma operação mais simples.",
    apoio: "Escolha produtos de fornecedores parceiros, monte a loja e venda. O fornecedor separa e envia; você fica com a margem.",
    icones: [
      { arquivo: "catalog", titulo: "Catálogo pronto", texto: "Produtos com fotos e estoque dos fornecedores da rede." },
      { arquivo: "margin", titulo: "Sua margem", texto: "Você define o preço de venda e vê o lucro de cada produto." },
      { arquivo: "order", titulo: "Pedido automático", texto: "A venda da loja vira pedido para o fornecedor." },
      { arquivo: "shipping", titulo: "Envio pelo fornecedor", texto: "Separação, etiqueta e envio direto ao seu cliente." },
      { arquivo: "automation", titulo: "Esteira ao vivo", texto: "Acompanhe cada pedido do pagamento ao envio." },
      { arquivo: "suppliers", titulo: "Fornecedores parceiros", texto: "Centrais com operação de expedição própria." },
    ],
    capacidades: [
      { titulo: "Loja no ar sem estoque em casa", texto: "Tema profissional, domínio e pagamento por Pix na conta Mercado Pago da sua loja." },
      { titulo: "O fornecedor cuida do galpão", texto: "Horário de corte, ondas de separação e etiquetas em PDF do lado de quem envia." },
    ],
    prova: { titulo: "Cada um com o seu papel e o seu dinheiro", pontos: ["O pagamento do cliente cai direto na conta da loja", "O custo do produto sai do saldo recarregado por Pix", "A NextLevel cobra só o que é dela, em fatura separada"] },
    cta: { titulo: "Crie a sua loja e comece a vender", texto: "Pix na hora, sem fidelidade." },
  },
  "nextlevel-commerce": {
    slug: "nextlevel-commerce", nome: "NextLevel Commerce", accent: "#2F81F4", logos: { ratio: LOGO }, imagens: true, status: { logos: "complete", imagens: "complete" },
    headline: "Sua loja pronta para acompanhar o próximo nível.",
    apoio: "Loja virtual com a sua marca, tema profissional, Pix e cartão na sua conta e um painel completo para vender.",
    icones: [
      { arquivo: "vitrine", titulo: "Vitrine da sua marca", texto: "Temas por segmento, editor com prévia ao vivo e domínio próprio." },
      { arquivo: "catalogo", titulo: "Catálogo completo", texto: "Grade de tamanhos, estoque, categorias e importação por planilha." },
      { arquivo: "checkout", titulo: "Checkout", texto: "Pix e cartão direto na conta Mercado Pago da loja." },
      { arquivo: "conversao", titulo: "Conversão", texto: "Cupons, campanhas, avaliações e avise-me." },
      { arquivo: "dados", titulo: "Dados", texto: "Análise de vendas, clientes e histórico de ações." },
      { arquivo: "crescimento", titulo: "Crescimento", texto: "Atacado, equipe com permissões e serviços da NextLevel." },
    ],
    capacidades: [
      { titulo: "Você no controle do visual", texto: "Troque cores, banners e seções no editor e publique quando estiver pronto." },
      { titulo: "Venda organizada do pedido à entrega", texto: "Pedidos, etiquetas e pós-venda no mesmo painel." },
    ],
    prova: { titulo: "Feita para a operação real", pontos: ["Os pagamentos dos seus clientes vão para a sua conta", "Teste grátis antes de pagar o plano", "Cancele quando quiser, sem multa"] },
    cta: { titulo: "Crie a sua loja NextLevel Commerce", texto: "Comece pelo teste grátis e escolha o plano depois." },
  },
  "bras-digital": {
    slug: "bras-digital", nome: "Brás Digital", accent: "#D35C00", logos: { clara: true, ratio: 1774 / 887 }, imagens: true, status: { logos: "partial", imagens: "complete" },
    headline: "O ritmo do Brás, conectado ao digital.",
    apoio: "Clube de compras para empresas com CNPJ: descobertas em vídeo, caixas fechadas direto das importadoras e retirada organizada.",
    icones: [
      { arquivo: "descoberta", titulo: "Descobertas", texto: "Vídeos curtos dos produtos encontrados nas importadoras." },
      { arquivo: "atacado", titulo: "Caixa fechada", texto: "Compra no atacado, com a quantidade de cada caixa clara." },
      { arquivo: "fornecedores", titulo: "Importadoras", texto: "Pedido confirmado pela importadora antes da retirada." },
      { arquivo: "pedido", titulo: "Pedido acompanhado", texto: "Situação do pedido e comprovante de retirada no Meu Brás." },
      { arquivo: "conexao", titulo: "Frete conectado", texto: "Transportadoras e ônibus de excursão da NextLevel Cargas." },
      { arquivo: "escala", titulo: "Escala", texto: "Club com pontos e benefícios para quem compra sempre." },
    ],
    capacidades: [
      { titulo: "Do vídeo ao pedido", texto: "Viu a descoberta, analisou e pediu as caixas pelo Meu Brás." },
      { titulo: "Retirada sem confusão", texto: "Comprovante de retirada e frete combinado no mesmo lugar." },
    ],
    prova: { titulo: "Só para empresas", pontos: ["Cadastro com CNPJ conferido", "Preço e análise só para membros", "Termos próprios da Brás Digital, com aceite registrado"] },
    cta: { titulo: "Cadastre a sua empresa", texto: "Cadastro grátis com CNPJ." },
    pendencias: "Monograma, favicons e logo escura com fundo transparente (a logo escura veio com fundo sólido).",
  },
  "nextlevel-cargas": {
    slug: "nextlevel-cargas", nome: "NextLevel Cargas", accent: "#4B4FD8", logos: { clara: true, ratio: LOGO }, imagens: true, status: { logos: "partial", imagens: "complete" },
    headline: "Movimento que chega com controle.",
    apoio: "Transportadoras e ônibus de excursão recebem cargas das importadoras da rede, com rota, coleta e extrato no mesmo painel.",
    icones: [
      { arquivo: "coleta", titulo: "Coleta", texto: "Cargas chamadas pelas importadoras, com local de retirada." },
      { arquivo: "rota", titulo: "Rotas", texto: "Rotas fixas e viagens para ônibus de excursão." },
      { arquivo: "prazo", titulo: "Prazo", texto: "Saída, cancelamento e capacidade definidos em regras claras." },
      { arquivo: "rastreio", titulo: "Acompanhamento", texto: "Situação de cada carga: chamada, aceita, coletada, entregue." },
      { arquivo: "volumes", titulo: "Volumes", texto: "Fardos por tamanho, com a capacidade do veículo." },
      { arquivo: "seguranca", titulo: "Cadastro conferido", texto: "Dados da transportadora e do motorista registrados." },
    ],
    capacidades: [
      { titulo: "Cargas da rede da Brás", texto: "As importadoras chamam a carga e a transportadora aceita com o frete informado." },
      { titulo: "Motorista com link próprio", texto: "O motorista acompanha a viagem por um link no celular." },
    ],
    prova: { titulo: "Regras na mesa", pontos: ["Comissão da plataforma definida no aceite", "Extrato do que há para receber", "Cadastro grátis para transportadoras"] },
    cta: { titulo: "Cadastre a sua transportadora", texto: "Entre na rede e receba cargas das importadoras." },
    pendencias: "Monograma, favicons e logo escura com fundo transparente (a logo escura veio com fundo sólido).",
  },
  "nextlevel-club": {
    slug: "nextlevel-club", nome: "NextLevel Club", accent: "#F5BC00", parent: "nextlevel", logos: { clara: true, escura: true, monograma: true, ratio: LOGO }, imagens: false, status: { logos: "complete", imagens: "pending" },
    headline: "Quanto mais você avança, mais valor acompanha.",
    apoio: "O programa de vantagens do Grupo NextLevel: pontos em compras e indicações, válidos nas marcas do grupo.",
    icones: [
      { arquivo: "", titulo: "Pontos", texto: "Compras e indicações viram pontos no Club." },
      { arquivo: "", titulo: "Todas as marcas", texto: "Uma carteira de pontos para o grupo inteiro." },
      { arquivo: "", titulo: "Cartão no balcão", texto: "Cartão do Club nas compras presenciais das importadoras." },
      { arquivo: "", titulo: "Indique e ganhe", texto: "Código de indicação em cada painel." },
    ],
    capacidades: [
      { titulo: "Club", texto: "Grátis para quem usa qualquer marca do grupo." },
      { titulo: "Club+ e Club Total", texto: "Níveis de assinatura com mais vantagens, publicados pela NextLevel quando disponíveis." },
    ],
    prova: { titulo: "Regras claras", pontos: ["Pontos valem desconto em serviços do grupo", "Pontos não são dinheiro, não se sacam e vencem", "Nenhuma assinatura garante venda ou lucro"] },
    cta: { titulo: "Já usa uma marca do grupo?", texto: "Você já está no Club. Entre no seu painel para ver os pontos." },
  },
  "loja-nextlevel": {
    slug: "loja-nextlevel", nome: "Loja NextLevel", accent: "#F5BC00", parent: "nextlevel", logos: { clara: true, escura: true, monograma: true, ratio: LOGO }, imagens: false, status: { logos: "complete", imagens: "pending" },
    headline: "Uma vitrine para quem vive o próximo nível.",
    apoio: "Temas, serviços e produtos digitais do ecossistema NextLevel, com compra em poucos cliques.",
    icones: [], capacidades: [{ titulo: "Temas", texto: "" }, { titulo: "Serviços", texto: "" }],
    prova: { titulo: "", pontos: [] }, cta: { titulo: "", texto: "" },
  },
  "meu-contador": {
    slug: "meu-contador", nome: "Meu Contador", accent: "#2F81F4", parent: "nextlevel", logos: { clara: true, escura: true, monograma: true, ratio: LOGO }, imagens: false, status: { logos: "complete", imagens: "pending" },
    headline: "Clareza para decidir. Organização para crescer.",
    apoio: "Apoio de contador parceiro para os membros da Brás Digital: nota fiscal em dia e chamados resolvidos com prioridade.",
    icones: [
      { arquivo: "", titulo: "Nota em dia", texto: "Ajuda para emitir e organizar as notas dos seus pedidos." },
      { arquivo: "", titulo: "Chamado urgente", texto: "Precisa de nota para liberar um fardo? Abra um chamado prioritário." },
      { arquivo: "", titulo: "Contador parceiro", texto: "Atendimento de um contador parceiro do grupo." },
      { arquivo: "", titulo: "Tudo no painel", texto: "Chamados e respostas no Meu Brás." },
    ],
    capacidades: [
      { titulo: "Para membros da Brás Digital", texto: "O Meu Contador fica dentro do Meu Brás, ao lado dos seus pedidos." },
      { titulo: "Sem papelada solta", texto: "Cada chamado fica registrado com a situação e a resposta." },
    ],
    prova: { titulo: "O que esperar", pontos: ["Atendimento por chamado, com histórico", "Orientação de contador parceiro", "Não substitui a contabilidade da sua empresa"] },
    cta: { titulo: "Já é membro da Brás Digital?", texto: "Entre no Meu Brás e abra um chamado no Meu Contador." },
  },
  parceiros: {
    slug: "parceiros", nome: "Parceiros NextLevel", accent: "#2D9E3B", parent: "nextlevel", logos: { clara: true, escura: true, monograma: true, ratio: LOGO }, imagens: false, status: { logos: "complete", imagens: "pending" },
    headline: "Parcerias que transformam conexão em resultado.",
    apoio: "Indique lojistas e soluções da NextLevel e acompanhe as suas comissões com regras claras.",
    icones: [], capacidades: [{ titulo: "", texto: "" }, { titulo: "", texto: "" }],
    prova: { titulo: "", pontos: [] }, cta: { titulo: "", texto: "" },
  },
};

export const marcaBase = (slug: MarcaSlug) => `/marcas/${slug}`;
/** Logo pronta para exibir (WebP leve). `escura` = letras claras, para fundos escuros. */
export const logoMarca = (slug: MarcaSlug, tom: "clara" | "escura", tier?: "club-plus" | "club-total") =>
  `${marcaBase(slug)}/logos/${tier ? `tiers/${tier}/` : ""}logo-${tom}-640.webp`;
export const monogramaMarca = (slug: MarcaSlug, tom: "claro" | "escuro", tier?: "club-plus" | "club-total") =>
  `${marcaBase(slug)}/logos/${tier ? `tiers/${tier}/` : ""}monograma-${tom}-256.webp`;
export const imagemMarca = (slug: MarcaSlug, nome: string, largura: 800 | 1600 = 1600) => `${marcaBase(slug)}/imagens/${nome}-${largura}.webp`;
export const iconeMarca = (slug: MarcaSlug, nome: string) => `${marcaBase(slug)}/imagens/icons/${nome}-256.webp`;

/** Código de marca do sistema → kit visual. */
export const MARCA_DO_CODIGO: Record<string, MarcaSlug> = {
  NEXTLEVEL: "nextlevel", SUPERDROP: "superdrop", NEXTLEVEL_COMMERCE: "nextlevel-commerce", BRAS_DIGITAL: "bras-digital", NEXTLEVEL_CARGAS: "nextlevel-cargas",
};
