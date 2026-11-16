import type { Metadata } from "next";
import type { Brand } from "@/lib/brand";

/**
 * Tabela central das páginas públicas da NextLevel Commerce (plano de busca v3, fase S0, D293). Daqui saem o título, a
 * descrição, o endereço principal (canonical), a prévia de link e a linha do sitemap de cada página. Uma página nova só
 * entra no sitemap se estiver aqui, e o teste `seo-paginas` reprova título ou descrição repetida, vazia, longa demais ou
 * com texto vencido. Arquivo puro (sem banco): a tela só passa a marca.
 *
 * Regras de escrita: português claro; nenhum preço (preço vem do sistema na própria página); só fatos estáveis da
 * plataforma; `revisadoEm` muda quando o texto da página muda de verdade (vira o `lastmod` do sitemap).
 */
export type Nucleo = "inicio" | "planos" | "comparar" | "recursos" | "temas" | "ferramentas" | "parceiros" | "empresa" | "ajuda" | "legal";
export type PaginaPublica = {
  caminho: string;
  /** Título curto (o layout acrescenta " · NextLevel Commerce") ou `absoluto` quando a página já leva a marca no título. */
  titulo: string | { absoluto: string };
  descricao: string;
  nucleo: Nucleo;
  /** Data (AAAA-MM-DD) da última revisão real do conteúdo. */
  revisadoEm: string;
  prioridade: number;
  /** Nome curto na trilha de navegação (Início › Parceiros › Indique); sem ele, vale o título curto. */
  nome?: string;
  /** Só entra no sitemap quando a marca atende à condição. */
  quando?: "cadastroAberto" | "cadastroFechado" | "parceiros" | "temas";
};

export const SUFIXO_TITULO = " · NextLevel Commerce";

export const PAGINAS_COMMERCE: PaginaPublica[] = [
  { caminho: "/", nome: "Início", titulo: { absoluto: "NextLevel Commerce · Loja virtual para varejo e atacado" }, nucleo: "inicio", revisadoEm: "2026-11-13", prioridade: 1,
    descricao: "Crie sua loja virtual com atacado em todos os planos: grade, preço por quantidade e pedido mínimo. Pix e cartão, 0% de tarifa da plataforma com Mercado Pago." },
  { caminho: "/planos", titulo: "Planos e preços", nucleo: "planos", revisadoEm: "2026-11-13", prioridade: 0.9,
    descricao: "Compare os planos Start, Pro e Scale da NextLevel Commerce: atacado em todos, Pix e cartão, 0% de tarifa da plataforma com Mercado Pago e teste grátis." },
  { caminho: "/cadastro", titulo: "Criar minha loja", nucleo: "planos", revisadoEm: "2026-11-13", prioridade: 0.8, quando: "cadastroAberto",
    descricao: "Crie sua loja virtual na NextLevel Commerce: escolha o plano, teste grátis e comece a vender no varejo e no atacado, com Pix e cartão." },
  { caminho: "/quero-minha-loja", titulo: "Quero minha loja", nucleo: "planos", revisadoEm: "2026-11-13", prioridade: 0.7,
    descricao: "Deixe seu contato e a equipe da NextLevel Commerce ajuda a montar sua loja virtual: produtos, tema, pagamento e frete, com atendimento pelo WhatsApp." },
  { caminho: "/comparativo", nome: "Comparativo", titulo: "Comparativo de plataformas de loja virtual", nucleo: "comparar", revisadoEm: "2026-11-13", prioridade: 0.8,
    descricao: "Compare mensalidade, tarifa sobre as vendas e limites da NextLevel Commerce com Nuvemshop, Tray, Loja Integrada e Shopify. Dados públicos com fonte e data." },
  { caminho: "/recursos", nome: "Recursos", titulo: "Recursos da loja virtual", nucleo: "recursos", revisadoEm: "2026-11-13", prioridade: 0.7,
    descricao: "Tudo o que a loja virtual da NextLevel Commerce faz: atacado, vitrine, Pix e cartão, frete, temas, domínio próprio, inteligência artificial e integrações." },
  { caminho: "/integracoes", titulo: "Integrações", nucleo: "recursos", revisadoEm: "2026-11-13", prioridade: 0.6,
    descricao: "Mercado Pago, Melhor Envio, Frenet, Correios com contrato, Google, Meta, TikTok, Tiny, Omie e mais: o que a loja conecta hoje e o que você precisa para ligar." },
  { caminho: "/ferramentas", nome: "Calculadoras", titulo: "Calculadoras grátis para quem vende online", nucleo: "ferramentas", revisadoEm: "2026-11-13", prioridade: 0.6,
    descricao: "Calcule o preço de venda com margem e a partir de qual valor vale oferecer frete grátis. Ferramentas grátis da NextLevel Commerce, sem cadastro." },
  { caminho: "/temas", nome: "Temas", titulo: "Temas de loja virtual por nicho", nucleo: "temas", revisadoEm: "2026-11-13", prioridade: 0.7, quando: "temas",
    descricao: "Temas de loja virtual para moda, beleza, casa, celular, esporte e atacado. Veja cada tema funcionando numa loja de exemplo e instale com 1 clique." },
  { caminho: "/temas-nuvemshop", nome: "Temas para Nuvemshop", titulo: "Temas e layout personalizado para Nuvemshop", nucleo: "temas", revisadoEm: "2026-11-13", prioridade: 0.5,
    descricao: "Layout personalizado para a sua loja Nuvemshop, sem trocar de plataforma: lojas que a NextLevel criou, direção visual por nicho e diagnóstico gratuito." },
  { caminho: "/clientes", nome: "Clientes", titulo: "Clientes e lojas que a NextLevel atende", nucleo: "empresa", revisadoEm: "2026-11-13", prioridade: 0.5,
    descricao: "Marcas reais que a equipe NextLevel atende, do Brás para o Brasil, e os temas da NextLevel Commerce que elas usam nas lojas virtuais." },
  { caminho: "/faq", titulo: "Perguntas frequentes", nucleo: "ajuda", revisadoEm: "2026-11-13", prioridade: 0.7,
    descricao: "Respostas diretas sobre a NextLevel Commerce: planos, teste grátis, atacado, pagamento com Mercado Pago, frete, domínio próprio, migração e suporte." },
  { caminho: "/parceiros", nome: "Parceiros", titulo: { absoluto: "Programa de Parceiros NextLevel Commerce: comissão todo mês" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.7, quando: "parceiros",
    descricao: "Indique lojas virtuais e receba comissão sobre toda mensalidade enquanto o lojista pagar, pelo CPF ou pelo CNPJ, com saque por Pix e sem nota fiscal." },
  { caminho: "/parceiros/indique", nome: "Indique pelo CPF", titulo: { absoluto: "Indique e ganhe pelo CPF: Programa de Indicações NextLevel" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.6, quando: "parceiros",
    descricao: "Indique lojas para a NextLevel Commerce só com o seu CPF e receba comissão todo mês sobre as mensalidades, com saque por Pix e sem precisar de nota fiscal." },
  { caminho: "/parceiros/criadores", nome: "Criadores", titulo: { absoluto: "Parceiros criadores: ganhe indicando a NextLevel Commerce" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.5, quando: "parceiros",
    descricao: "Para criadores de conteúdo de moda, negócios e e-commerce: transforme a sua audiência em comissão que se repete todo mês indicando a NextLevel Commerce." },
  { caminho: "/parceiros/vendedores", nome: "Vendedores", titulo: { absoluto: "Parceiros vendedores: ganhe indicando a NextLevel Commerce" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.5, quando: "parceiros",
    descricao: "Para representantes e vendedores que já visitam lojistas: venda a loja virtual da NextLevel Commerce de porta em porta e receba comissão todo mês." },
  { caminho: "/parceiros/agencias", nome: "Agências", titulo: { absoluto: "Parceiros agências: ganhe indicando a NextLevel Commerce" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.5, quando: "parceiros",
    descricao: "Para agências de marketing e consultorias: coloque seus clientes na NextLevel Commerce, receba comissão enquanto eles ficarem e conte com benefícios exclusivos." },
  { caminho: "/parceiros/comissoes", nome: "Comissões e bônus", titulo: { absoluto: "Comissões e bônus do Programa de Parceiros NextLevel" }, nucleo: "parceiros", revisadoEm: "2026-11-13", prioridade: 0.5, quando: "parceiros",
    descricao: "Comissão em toda mensalidade enquanto o lojista pagar, bônus por produção na semana e no mês, garantia e saque por Pix sem nota fiscal: a regra completa." },
  { caminho: "/termos", titulo: "Termos de uso", nucleo: "legal", revisadoEm: "2026-11-13", prioridade: 0.3,
    descricao: "Termos de uso da plataforma NextLevel Commerce: conta, planos, pagamentos e responsabilidades do lojista e da NextLevel Marketing Ltda." },
  { caminho: "/privacidade", titulo: "Política de privacidade", nucleo: "legal", revisadoEm: "2026-11-13", prioridade: 0.3,
    descricao: "Como a NextLevel Commerce coleta, usa e protege os dados de lojistas, clientes e parceiros, de acordo com a LGPD, e como pedir acesso ou exclusão." },
];

export const paginaCommerce = (caminho: string) => PAGINAS_COMMERCE.find((p) => p.caminho === caminho);

/** Título como aparece no navegador e no Google. */
export const tituloCompleto = (p: Pick<PaginaPublica, "titulo">) => (typeof p.titulo === "string" ? `${p.titulo}${SUFIXO_TITULO}` : p.titulo.absoluto);

/** Caminhos do sitemap da Commerce, na ordem da tabela, conforme o que a marca tem ligado. */
export function caminhosCommerce(brand: Pick<Brand, "signupOpen" | "partnersOpen" | "modules">): string[] {
  const vale = (p: PaginaPublica) => {
    if (p.quando === "cadastroAberto") return brand.signupOpen;
    if (p.quando === "cadastroFechado") return !brand.signupOpen;
    if (p.quando === "parceiros") return brand.partnersOpen;
    if (p.quando === "temas") return brand.modules.includes("themes");
    return true;
  };
  return PAGINAS_COMMERCE.filter(vale).map((p) => p.caminho);
}

/**
 * Metadados da página a partir da tabela: título, descrição, canonical e prévia de link (com a imagem da marca, porque
 * o `openGraph` da página substitui o do layout por inteiro).
 */
export function metadadosCommerce(caminho: string, imagem: { url: string; width: number; height: number; alt: string }): Metadata {
  const p = paginaCommerce(caminho);
  if (!p) throw new Error(`Página pública sem linha na tabela de SEO: ${caminho}`);
  const titulo = tituloCompleto(p);
  return {
    title: typeof p.titulo === "string" ? p.titulo : { absolute: p.titulo.absoluto },
    description: p.descricao,
    alternates: { canonical: caminho },
    openGraph: { siteName: "NextLevel Commerce", locale: "pt_BR", type: "website", url: caminho, title: titulo, description: p.descricao, images: [imagem] },
    twitter: { card: "summary_large_image", title: titulo, description: p.descricao, images: [imagem.url] },
  };
}

export type ElosTrilha = { nome: string; caminho: string }[];
const nomeDa = (p: PaginaPublica) => p.nome ?? (typeof p.titulo === "string" ? p.titulo : p.titulo.absoluto);

/**
 * Trilha de navegação de uma página pública (D302): Início, as páginas-mãe que existem na tabela e a própria página.
 * `nomeFinal` serve às páginas fora da tabela (ex.: /temas/trama → "Tema Trama"). A home e páginas desconhecidas não têm trilha.
 */
export function trilhaCommerce(caminho: string, nomeFinal?: string): ElosTrilha {
  if (caminho === "/" || !caminho.startsWith("/")) return [];
  const partes = caminho.split("/").filter(Boolean);
  const elos: ElosTrilha = [{ nome: "Início", caminho: "/" }];
  for (let i = 1; i <= partes.length; i++) {
    const c = `/${partes.slice(0, i).join("/")}`;
    const p = paginaCommerce(c);
    if (i === partes.length) {
      if (p) elos.push({ nome: nomeDa(p), caminho: c });
      else if (nomeFinal) elos.push({ nome: nomeFinal, caminho: c });
      else return [];
    } else if (p) elos.push({ nome: nomeDa(p), caminho: c });
  }
  return elos;
}

/** `BreadcrumbList` com endereços completos: o mesmo texto da trilha visível. */
export const trilhaJsonLd = (baseUrl: string, elos: ElosTrilha) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: elos.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.nome, item: `${baseUrl}${e.caminho === "/" ? "" : e.caminho}` })),
});
