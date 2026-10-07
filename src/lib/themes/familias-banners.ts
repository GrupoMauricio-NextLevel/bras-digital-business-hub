/**
 * Banners que organizam a navegação, por família (D88). Textos da escada de copy de
 * docs/prompts/banners-navegacao-temas-gpt.md: N2 benefício com motivo, N3 editorial, N4 voz de marca.
 * Nada de promessa que a loja não cumpre: microtextos de confiança ficam vazios (o lojista escreve no editor);
 * valores de cupom vêm do cupom real da loja, nunca do texto.
 * `file`: nome da imagem em /demos/<loja>/v1/banners/ (lojas de demonstração); clientes trocam pelo editor.
 */
import { slugify } from "@/lib/ids";

export type NavTxt = { eyebrow?: string; title: string; subtitle?: string; cta: string };
export type NavCard = { file: string; link: string; n2?: NavTxt; n3: NavTxt; n4: NavTxt };
export type Step = { eyebrow?: string; title: string; subtitle?: string };
export type FamilyBanners = {
  layers: { eyebrow: string; title: string; subtitle: string; cta: string; secondary: string; secondaryLink?: string };
  immersive: { steps: [Step, Step, Step]; cta: string; secondary: string; secondaryLink?: string; mobileTitle: string };
  /** Quatro cartões, na ordem em que aparecem; o N2 usa os que têm texto `n2`. */
  nav: [NavCard, NavCard, NavCard, NavCard];
  /** Subtítulo do banner de cada categoria (pelo nome da categoria), N3 e N4. */
  categories: Record<string, { n3: string; n4: string }>;
  welcome: { n2: { title: string; subtitle: string }; n3: { eyebrow: string; title: string; subtitle: string }; n4: { title: string; subtitle: string } };
};

const cat = (name: string) => `/catalog?category=${slugify(name)}`;
const NEW = "/catalog?sort=newest";

export const BANNERS: Record<"moda" | "sport" | "casa" | "beauty" | "conecta" | "atacado", FamilyBanners> = {
  moda: {
    layers: { eyebrow: "EDITORIAL", title: "O *básico* que virou assinatura", subtitle: "Camadas leves para o calor da cidade.", cta: "Comprar a coleção", secondary: "Ver lookbook" },
    immersive: { steps: [{ title: "Toda cidade tem um *ritmo*." }, { title: "Toda peça tem um motivo." }, { eyebrow: "TEMPORADA 01", title: "Vista o seu", subtitle: "Peças em camadas que vão do café ao fim do dia." }], cta: "Montar meu look", secondary: "Ver lookbook", mobileTitle: "Vista o *seu* ritmo" },
    nav: [
      { file: "nav-novidades", link: NEW, n2: { title: "Novidades", cta: "Ver o que chegou" }, n3: { eyebrow: "CHEGOU AGORA", title: "Novidades da semana", cta: "Ver novidades" }, n4: { title: "Acabou de *chegar*", subtitle: "Peças novas toda semana", cta: "Ver primeiro" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas", cta: "Ver ofertas" }, n3: { eyebrow: "PREÇO ESPECIAL", title: "Básicos com desconto", cta: "Aproveitar" }, n4: { title: "Últimas *peças* da temporada", subtitle: "Quando acabar, não volta", cta: "Ver ofertas" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "OS PREFERIDOS", title: "Os mais vendidos", cta: "Ver lista" }, n4: { title: "As peças que *voltam* para o carrinho", cta: "Ver favoritas" } },
      { file: "nav-presentes", link: "/catalog", n3: { eyebrow: "PARA PRESENTEAR", title: "Presentes", cta: "Escolher presente" }, n4: { title: "Presente que *acerta* o tamanho", cta: "Escolher presente" } },
    ],
    categories: { "Básicos": { n3: "Algodão que não deforma", n4: "Básicos que viram *assinatura*" }, "Calças": { n3: "Do corte reto ao wide", n4: "O *caimento* certo para cada dia" }, "Camisas": { n3: "Textura natural, toque leve", n4: "Camisas que *respiram* com você" }, "Conjuntos": { n3: "Duas peças, zero dúvida", n4: "Monte uma vez, use a *semana*" } },
    welcome: { n2: { title: "Desconto na primeira compra", subtitle: "Deixe seu e-mail e receba o cupom." }, n3: { eyebrow: "BOAS-VINDAS", title: "Sua primeira peça com desconto", subtitle: "Cadastre o e-mail e receba o cupom na hora:" }, n4: { title: "Comece pela *peça* que você mais vai usar", subtitle: "Seu cupom de boas-vindas:" } },
  },
  sport: {
    layers: { eyebrow: "ARENA", title: "A bola vem até *você*", subtitle: "Equipamento para quem joga toda semana.", cta: "Comprar agora", secondary: "Ver lançamentos", secondaryLink: NEW },
    immersive: { steps: [{ title: "Antes do jogo, a *preparação*." }, { title: "Durante, a entrega." }, { eyebrow: "PÓDIO", title: "Depois, a história", subtitle: "Camisas, treino e acessórios para o time inteiro." }], cta: "Montar meu kit", secondary: "Ver lançamentos", secondaryLink: NEW, mobileTitle: "Jogue *completo*" },
    nav: [
      { file: "nav-novidades", link: NEW, n2: { title: "Lançamentos", cta: "Ver" }, n3: { eyebrow: "ACABOU DE CHEGAR", title: "Lançamentos da temporada", cta: "Ver lançamentos" }, n4: { title: "Nova *temporada* em campo", cta: "Ver primeiro" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas", cta: "Ver ofertas" }, n3: { eyebrow: "PREÇO DE TREINO", title: "Ofertas da semana", cta: "Aproveitar" }, n4: { title: "Equipe-se *antes* do apito final", cta: "Ver ofertas" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "OS TITULARES", title: "Mais vendidos", cta: "Ver lista" }, n4: { title: "Os *titulares* da loja", cta: "Ver os favoritos" } },
      { file: "nav-kits", link: "/catalog", n3: { eyebrow: "COMPRE JUNTO", title: "Kits para o time", cta: "Montar kit" }, n4: { title: "O time *inteiro* num pedido só", cta: "Montar kit" } },
    ],
    categories: { "Camisas": { n3: "Tecido leve, secagem rápida", n4: "Camisas para *suar* sem pesar" }, "Treino": { n3: "Do aquecimento ao tiro final", n4: "Treino que *rende*" }, "Vestuário": { n3: "Antes e depois do jogo", n4: "Do *aquecimento* à resenha" }, "Acessórios": { n3: "O que falta na mochila", n4: "Nada *esquecido* no vestiário" } },
    welcome: { n2: { title: "Desconto no primeiro pedido", subtitle: "Deixe seu e-mail e receba o cupom." }, n3: { eyebrow: "BEM-VINDO AO TIME", title: "Seu primeiro pedido com desconto", subtitle: "Cadastre o e-mail e receba o cupom na hora:" }, n4: { title: "Seu *primeiro* jogo com a gente tem vantagem", subtitle: "Seu cupom de boas-vindas:" } },
  },
  casa: {
    layers: { eyebrow: "VARANDA", title: "Traga a *luz* da manhã para dentro", subtitle: "Peças escolhidas para durar e combinar entre si.", cta: "Comprar decoração", secondary: "Ver ambientes" },
    immersive: { steps: [{ title: "Uma casa vazia é só *espaço*." }, { title: "Os detalhes fazem dela um lugar." }, { eyebrow: "MORADA", title: "Faça da sua um *lar*", subtitle: "Cozinha, decoração, organização e têxteis que combinam." }], cta: "Decorar agora", secondary: "Ver ambientes", mobileTitle: "Sua casa, *seu* lugar" },
    nav: [
      { file: "nav-novidades", link: NEW, n2: { title: "Novidades", cta: "Ver" }, n3: { eyebrow: "CHEGOU", title: "Novidades para a casa", cta: "Ver novidades" }, n4: { title: "Peças *novas* para cantos antigos", cta: "Ver primeiro" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas", cta: "Aproveitar" }, n3: { eyebrow: "PREÇO ESPECIAL", title: "Organização com desconto", cta: "Ver ofertas" }, n4: { title: "Organize *mais*, gaste menos", cta: "Ver ofertas" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "OS PREFERIDOS", title: "Mais vendidos", cta: "Ver lista" }, n4: { title: "As peças que *todo mundo* pergunta onde comprou", cta: "Ver favoritos" } },
      { file: "nav-presentes", link: "/catalog", n3: { eyebrow: "PARA PRESENTEAR", title: "Presentes para casa", cta: "Escolher" }, n4: { title: "Presente que *fica* na casa de quem você gosta", cta: "Escolher presente" } },
    ],
    categories: { "Cozinha": { n3: "Para cozinhar com calma", n4: "Cozinha com *calma*" }, "Decoração": { n3: "Detalhes que acolhem", n4: "O *detalhe* que acolhe" }, "Organização": { n3: "Cada coisa no seu lugar", n4: "Espaço para o que *importa*" }, "Têxteis": { n3: "Toque macio, lavagem fácil", n4: "*Aconchego* que se toca" } },
    welcome: { n2: { title: "Desconto na primeira compra", subtitle: "Deixe seu e-mail e receba o cupom." }, n3: { eyebrow: "BOAS-VINDAS", title: "Sua casa merece começar bem", subtitle: "Cadastre o e-mail e receba o cupom na hora:" }, n4: { title: "O primeiro *detalhe* é por nossa conta", subtitle: "Seu cupom de boas-vindas:" } },
  },
  beauty: {
    layers: { eyebrow: "AURA", title: "A maciez que você *sente* no primeiro toque", subtitle: "Ferramentas de beleza escolhidas uma a uma.", cta: "Comprar pincéis", secondary: "Ver coleção" },
    immersive: { steps: [{ title: "Todo ritual começa num *espaço*." }, { title: "E nas ferramentas certas." }, { eyebrow: "MUSA", title: "O seu, do *seu* jeito", subtitle: "Pincéis, organizadores e acessórios para a sua penteadeira." }], cta: "Montar meu ritual", secondary: "Ver coleção", mobileTitle: "Seu ritual, *sua* essência" },
    nav: [
      { file: "nav-novidades", link: NEW, n2: { title: "Novidades", cta: "Ver" }, n3: { eyebrow: "CHEGOU", title: "Novidades do ritual", cta: "Ver lista" }, n4: { title: "O que acabou de *chegar* à penteadeira", cta: "Ver primeiro" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas", cta: "Ver" }, n3: { eyebrow: "PREÇO ESPECIAL", title: "Ofertas da semana", cta: "Ver lista" }, n4: { title: "Cuidar de si com *preço* gentil", cta: "Ver ofertas" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "OS PREFERIDOS", title: "Mais vendidos", cta: "Ver lista" }, n4: { title: "O pincel que *ninguém* devolve", cta: "Ver favoritos" } },
      { file: "nav-kits", link: "/catalog", n3: { eyebrow: "COMPRE JUNTO", title: "Kits prontos", cta: "Escolher kit" }, n4: { title: "Um kit, um *ritual* completo", cta: "Escolher kit" } },
    ],
    categories: { "Pincéis": { n3: "Cerdas macias que não soltam", n4: "Maciez no *primeiro* toque" }, "Organização": { n3: "Tudo à vista", n4: "Penteadeira em *ordem*" }, "Embalagens": { n3: "Para levar o seu ritual", n4: "Seu ritual, *onde* for" }, "Acessórios": { n3: "O acabamento que faz diferença", n4: "O *detalhe* que fica" } },
    welcome: { n2: { title: "Desconto na primeira compra", subtitle: "Deixe seu e-mail e receba o cupom." }, n3: { eyebrow: "BOAS-VINDAS", title: "Comece o seu ritual com desconto", subtitle: "Cadastre o e-mail e receba o cupom na hora:" }, n4: { title: "O primeiro *cuidado* é nosso", subtitle: "Seu cupom de boas-vindas:" } },
  },
  conecta: {
    layers: { eyebrow: "CIRCUITO", title: "Desligue o *barulho*, ligue o foco", subtitle: "Acessórios confortáveis para o dia inteiro.", cta: "Comprar agora", secondary: "Ver áudio", secondaryLink: cat("Áudio") },
    immersive: { steps: [{ title: "Toda ideia precisa de um *ponto* de partida." }, { title: "Uma mesa que conecta." }, { eyebrow: "ÓRBITA", title: "Tudo no *seu* alcance", subtitle: "Áudio, mesa, mobilidade e conexões num lugar só." }], cta: "Montar minha mesa", secondary: "Ver áudio", secondaryLink: cat("Áudio"), mobileTitle: "Conecte o *seu* dia" },
    nav: [
      { file: "nav-novidades", link: NEW, n2: { title: "Lançamentos", cta: "Ver" }, n3: { eyebrow: "ACABOU DE CHEGAR", title: "Lançamentos", cta: "Ver lista" }, n4: { title: "O que há de *novo* na sua mesa", cta: "Ver primeiro" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas", cta: "Ver" }, n3: { eyebrow: "PREÇO ESPECIAL", title: "Ofertas da semana", cta: "Ver lista" }, n4: { title: "*Upgrade* com preço de ocasião", cta: "Ver ofertas" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "OS PREFERIDOS", title: "Mais vendidos", cta: "Ver lista" }, n4: { title: "Os *favoritos* de quem trabalha de casa", cta: "Ver favoritos" } },
      { file: "nav-kits", link: "/catalog", n3: { eyebrow: "COMPRE JUNTO", title: "Kits home office", cta: "Montar kit" }, n4: { title: "A mesa *inteira* num pedido só", cta: "Montar kit" } },
    ],
    categories: { "Áudio": { n3: "Som sem fio", n4: "Seu dia tem *trilha*" }, "Mesa": { n3: "Postura e foco", n4: "Menos cabo, mais *foco*" }, "Mobilidade": { n3: "Para levar", n4: "*Carregado* o dia todo" }, "Conexões": { n3: "Tudo ligado", n4: "Tudo *conectado*" } },
    welcome: { n2: { title: "Desconto na primeira compra", subtitle: "Deixe seu e-mail e receba o cupom." }, n3: { eyebrow: "BOAS-VINDAS", title: "Sua primeira conexão com desconto", subtitle: "Cadastre o e-mail e receba o cupom na hora:" }, n4: { title: "Sua *primeira* conexão com a gente tem vantagem", subtitle: "Seu cupom de boas-vindas:" } },
  },
  atacado: {
    layers: { eyebrow: "GALPÃO", title: "A *caixa* certa para a sua prateleira", subtitle: "Caixas fechadas com preço por volume.", cta: "Ver catálogo", secondary: "Como comprar no atacado", secondaryLink: "#perguntas" },
    immersive: { steps: [{ title: "Separado." }, { title: "Conferido." }, { eyebrow: "PORTO", title: "*Despachado* para a sua loja", subtitle: "Do nosso galpão para lojistas e distribuidores de todo o Brasil." }], cta: "Montar meu pedido", secondary: "Como comprar no atacado", secondaryLink: "#perguntas", mobileTitle: "Atacado que *gira*" },
    nav: [
      { file: "nav-como-comprar", link: "#perguntas", n2: { title: "Como comprar no atacado", cta: "Entender" }, n3: { eyebrow: "PRIMEIRA VEZ?", title: "Como funciona a compra por caixa", subtitle: "Quantidades e prazos", cta: "Ver o passo a passo" }, n4: { title: "Comprar no atacado é *simples*", subtitle: "Escolha as caixas, pague e receba", cta: "Ver como funciona" } },
      { file: "nav-ofertas", link: "/catalog", n2: { title: "Ofertas por volume", cta: "Ver ofertas" }, n3: { eyebrow: "PREÇO POR VOLUME", title: "Quanto mais caixas, menor o preço", cta: "Ver ofertas" }, n4: { title: "O preço *cai* conforme o pedido cresce", cta: "Ver ofertas" } },
      { file: "nav-novidades", link: NEW, n3: { eyebrow: "CHEGOU NO GALPÃO", title: "Novidades para revenda", cta: "Ver novidades" }, n4: { title: "*Primeiro* no seu catálogo, primeiro na vitrine", cta: "Ver primeiro" } },
      { file: "nav-mais-vendidos", link: "/catalog", n3: { eyebrow: "GIRO RÁPIDO", title: "Os que mais saem", cta: "Ver lista" }, n4: { title: "Os itens que *giram* mais rápido", cta: "Repor estes" } },
    ],
    categories: { "Têxteis": { n3: "Caixa fechada, preço por volume", n4: "Têxteis que *giram*" }, "Utilidades": { n3: "Kits prontos para revenda", n4: "Utilidades para *abastecer*" }, "Papelaria": { n3: "Reposição para escola e escritório", n4: "Papelaria o ano *inteiro*" }, "Acessórios": { n3: "Itens de alto giro", n4: "Acessórios de *alto* giro" } },
    welcome: { n2: { title: "Condição especial no primeiro pedido", subtitle: "Deixe o e-mail da sua loja e receba o cupom." }, n3: { eyebrow: "NOVO CLIENTE", title: "Primeiro pedido com condição especial", subtitle: "Cadastre o e-mail da sua loja e receba o cupom:" }, n4: { title: "Sua loja *abastecida* desde o primeiro pedido", subtitle: "Cupom para o primeiro pedido:" } },
  },
};
