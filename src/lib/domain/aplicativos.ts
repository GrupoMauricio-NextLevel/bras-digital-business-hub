import type { stores } from "@/db/schema";
import type { IntegracoesLoja } from "./integracoes-tipos";

/**
 * Central de aplicativos (W5, D188): o que a loja da E-commerce tem, o estado de cada um e onde configurar. Só mostra o
 * que existe de verdade; o que ainda não foi construído aparece como "em breve", nunca como disponível.
 */
export type EstadoApp = "ligado" | "desligado" | "em-breve";
export type App = { key: string; nome: string; categoria: "Pagamentos" | "Vendas" | "Marketing" | "Entrega" | "Gestão"; descricao: string; estado: EstadoApp; href?: string };

type Loja = Pick<typeof stores.$inferSelect, "paymentStatus" | "metaPixelId" | "launchMode" | "domainStatus" | "publishedAt" | "shippingProvider"> & { integrations?: IntegracoesLoja | null };

export function aplicativosDaLoja(s: Loja, extra: { redirecionamentos: number }): App[] {
  const mp = s.paymentStatus === "CONNECTED";
  const on = (v: boolean): EstadoApp => (v ? "ligado" : "desligado");
  const i = s.integrations ?? {};
  return [
    { key: "mercado-pago", nome: "Mercado Pago", categoria: "Pagamentos", descricao: "Pix e cartão em até 6x, conferidos automaticamente.", estado: on(mp), href: "/merchant/settings#payments" },
    { key: "link-pagamento", nome: "Link de pagamento", categoria: "Pagamentos", descricao: "Monte o pedido e mande o link pelo WhatsApp.", estado: on(mp), href: "/merchant/orders/propostas" },
    { key: "frete", nome: "Frete", categoria: "Entrega", descricao: "Regras próprias ou plataforma de envio, rastreio por e-mail.", estado: on(!!s.shippingProvider), href: "/merchant/settings#shipping" },
    { key: "dominio", nome: "Domínio próprio", categoria: "Gestão", descricao: "A loja no endereço da sua marca.", estado: on(s.domainStatus === "CONNECTED"), href: "/merchant/settings#domain" },
    { key: "carrinho", nome: "Carrinho abandonado", categoria: "Vendas", descricao: "Lembrete por e-mail a quem aceitou no checkout.", estado: "ligado", href: "/merchant/analytics#carrinhos-t" },
    { key: "compre-junto", nome: "Compre junto", categoria: "Vendas", descricao: "Produtos relacionados escolhidos por você.", estado: "ligado", href: "/merchant/catalogo" },
    { key: "visitas", nome: "Visitas e conversão", categoria: "Gestão", descricao: "Quantas pessoas veem a loja e quantas compram.", estado: "ligado", href: "/merchant/analytics" },
    { key: "pixel", nome: "Pixel da Meta", categoria: "Marketing", descricao: "Anúncios no Facebook e no Instagram medindo as vendas.", estado: on(!!s.metaPixelId), href: "/merchant/migrar#meta" },
    { key: "google", nome: "Google Shopping", categoria: "Marketing", descricao: "Lista de produtos para o Merchant Center.", estado: on(!!s.publishedAt), href: "/merchant/migrar#google" },
    { key: "catalogo-redes", nome: "Catálogo no Instagram e no TikTok", categoria: "Marketing", descricao: "A mesma lista de produtos nos catálogos da Meta e do TikTok.", estado: on(!!s.publishedAt), href: "/merchant/migrar#google" },
    { key: "ga4", nome: "Google Analytics 4", categoria: "Marketing", descricao: "Visitas, produto visto, carrinho e compra no Analytics.", estado: on(!!i.ga4), href: "/merchant/migrar#google-ferramentas" },
    { key: "gtm", nome: "Google Tag Manager", categoria: "Marketing", descricao: "Outras tags sem programar.", estado: on(!!i.gtm), href: "/merchant/migrar#google-ferramentas" },
    { key: "search-console", nome: "Google Search Console", categoria: "Marketing", descricao: "Confirma a loja no Google para aparecer nas buscas.", estado: on(!!i.googleVerificacao), href: "/merchant/migrar#google-ferramentas" },
    { key: "google-ads", nome: "Google Ads", categoria: "Marketing", descricao: "Mede as vendas que vêm dos anúncios do Google.", estado: on(!!i.googleAds), href: "/merchant/migrar#google-ferramentas" },
    { key: "tiktok", nome: "Pixel do TikTok", categoria: "Marketing", descricao: "Anúncios no TikTok medindo as vendas.", estado: on(!!i.tiktokPixel), href: "/merchant/migrar#redes" },
    { key: "pinterest", nome: "Tag do Pinterest", categoria: "Marketing", descricao: "Anúncios no Pinterest medindo as vendas.", estado: on(!!i.pinterestTag), href: "/merchant/migrar#redes" },
    { key: "chat", nome: "Chat ao vivo", categoria: "Vendas", descricao: "Tawk.to (gratuito) ou JivoChat na loja.", estado: on(!!i.chat), href: "/merchant/migrar#chat" },
    { key: "pwa", nome: "Loja instalável no celular", categoria: "Vendas", descricao: "O cliente põe a loja na tela inicial do celular.", estado: on(!!i.pwa), href: "/merchant/migrar#celular" },
    { key: "maioridade", nome: "Confirmação de 18 anos", categoria: "Vendas", descricao: "Para bebidas, tabacaria e produtos adultos.", estado: on(!!i.maioridade), href: "/merchant/migrar#celular" },
    { key: "redirecionamentos", nome: "Endereços antigos", categoria: "Marketing", descricao: "Quem vem de outra plataforma não perde o Google.", estado: on(extra.redirecionamentos > 0), href: "/merchant/migrar#enderecos" },
    { key: "lancamento", nome: "Loja em lançamento", categoria: "Marketing", descricao: "Página \"abre em breve\" com lista de espera.", estado: on(s.launchMode), href: "/merchant/migrar#lancamento" },
    { key: "ferramentas", nome: "Calculadoras", categoria: "Gestão", descricao: "Preço, promoção, parcelamento, frete grátis e mais.", estado: "ligado", href: "/merchant/ferramentas" },
    { key: "pix-direto", nome: "Pix direto com baixa manual", categoria: "Pagamentos", descricao: "Chave Pix da loja, sem intermediário.", estado: "em-breve" },
    { key: "na-entrega", nome: "Receber na entrega ou retirada", categoria: "Pagamentos", descricao: "Para entrega local e loja física.", estado: "em-breve" },
    { key: "balcao", nome: "Balcão (ponto de venda)", categoria: "Vendas", descricao: "Caixa para a loja física, com leitor de código de barras.", estado: "em-breve" },
    { key: "api", nome: "API e avisos para outros sistemas", categoria: "Gestão", descricao: "Integração com ERP e automações.", estado: "em-breve" },
    { key: "afiliados-loja", nome: "Afiliados da loja", categoria: "Marketing", descricao: "Quem indica a sua loja ganha comissão.", estado: "em-breve" },
  ];
}
