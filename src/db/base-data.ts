import type { Database } from "./client";
import * as s from "./schema";
import { newId } from "@/lib/ids";
import { syncThemeCatalog } from "@/lib/themes/catalog";

/**
 * Dados de referência da plataforma (temas, planos e serviços do marketplace).
 * Necessários em qualquer ambiente, inclusive produção. Chame uma única vez por banco (o bootstrap verifica antes).
 */
export async function seedReferenceData(db: Database) {
  await syncThemeCatalog(db);
  const plans = [
    { id: newId("pln"), key: "DROP_MANUAL", name: "Drop manual", priceCents: 4900, features: ["Pedidos manuais (WhatsApp, Instagram)", "Estoque central", "Financeiro do lojista"] },
    { id: newId("pln"), key: "STORE_SUBDOMAIN", name: "Loja SuperDrop", priceCents: 9700, features: ["Tudo do Drop manual", "Loja virtual em subdomínio SuperDrop", "Tema Starter", "Central de conteúdo"] },
    { id: newId("pln"), key: "STORE_OWN", name: "Loja própria", priceCents: 19700, features: ["Tudo da Loja SuperDrop", "Marca e domínio próprios", "Sem selo SuperDrop", "Suporte prioritário"] },
  ];
  await db.insert(s.plans).values(plans);
  type Svc = { key: string; name: string; description: string; category: string; priceFromCents: number; icon: string; audience: ("lite" | "pro" | "supplier")[]; kind?: "SERVICE" | "UPGRADE"; upgradeOffer?: "STORE_SUBDOMAIN" | "STORE_OWN"; deliveryDays?: number; highlights: string[]; featured?: boolean };
  const catalogServices: Svc[] = [
    { key: "upgrade-loja-superdrop", name: "Ative sua Loja SuperDrop", description: "Saia do WhatsApp: vitrine no seu subdomínio, checkout com Mercado Pago e o mesmo estoque da Central.", category: "Upgrade", priceFromCents: 9700, icon: "Store", audience: ["lite"], kind: "UPGRADE", upgradeOffer: "STORE_SUBDOMAIN", deliveryDays: 1, highlights: ["Subdomínio slug.superdrop.com.br", "Tema Starter", "Checkout Mercado Pago"], featured: true },
    { key: "upgrade-loja-propria", name: "Migre para a Loja Própria", description: "Sua marca, seu domínio e o painel completo: analytics, equipe e templates premium.", category: "Upgrade", priceFromCents: 19700, icon: "Sparkles", audience: ["lite", "pro"], kind: "UPGRADE", upgradeOffer: "STORE_OWN", deliveryDays: 2, highlights: ["Domínio próprio", "Sem selo SuperDrop", "Analytics e equipe"], featured: true },
    { key: "template-premium", name: "Template Premium", description: "Migre para o tema Pro ou Elite com configuração feita por nossa equipe.", category: "Loja", priceFromCents: 29700, icon: "LayoutTemplate", audience: ["lite", "pro"], deliveryDays: 5, highlights: ["Tema Pro ou Elite", "Configuração assistida"] },
    { key: "identidade-visual", name: "Identidade Visual", description: "Logo, paleta e tipografia profissionais para sua loja.", category: "Marca", priceFromCents: 89000, icon: "Palette", audience: ["lite", "pro"], deliveryDays: 10, highlights: ["Logo e paleta", "Manual de marca resumido"] },
    { key: "banners", name: "Banners", description: "Pacote mensal de banners para home, campanhas e datas sazonais.", category: "Criativos", priceFromCents: 29000, icon: "Image", audience: ["lite", "pro"], deliveryDays: 3, highlights: ["6 banners por mês", "Formatos desktop e mobile"] },
    { key: "conteudo-redes", name: "Conteúdo para Redes Sociais", description: "Calendário editorial e posts prontos para Instagram e WhatsApp.", category: "Criativos", priceFromCents: 49000, icon: "Share2", audience: ["lite", "pro"], deliveryDays: 7, highlights: ["12 posts por mês", "Legendas prontas"] },
    { key: "trafego-pago", name: "Tráfego Pago", description: "Gestão de campanhas no Meta e Google com relatórios semanais.", category: "Crescimento", priceFromCents: 120000, icon: "TrendingUp", audience: ["lite", "pro"], deliveryDays: 7, highlights: ["Meta e Google", "Relatório semanal"], featured: true },
    { key: "automacao-whatsapp", name: "Automação WhatsApp", description: "Respostas automáticas, catálogo e recuperação de carrinho.", category: "Crescimento", priceFromCents: 39000, icon: "MessageCircle", audience: ["lite", "pro"], deliveryDays: 5, highlights: ["Catálogo no WhatsApp", "Recuperação de carrinho"] },
    { key: "configuracao-profissional", name: "Configuração Profissional", description: "Deixamos sua loja 100% pronta: pagamentos, frete, domínio e produtos.", category: "Loja", priceFromCents: 59000, icon: "Wrench", audience: ["lite", "pro"], deliveryDays: 5, highlights: ["Pagamentos e frete", "Cadastro de produtos"] },
    { key: "suporte-premium", name: "Suporte Premium", description: "Atendimento prioritário com especialista dedicado.", category: "Suporte", priceFromCents: 19000, icon: "LifeBuoy", audience: ["lite", "pro", "supplier"], highlights: ["Resposta em até 2h úteis", "Especialista dedicado"] },
    { key: "fotos-catalogo", name: "Fotos do Catálogo", description: "Ensaio e tratamento das fotos dos seus modelos para vender mais em todas as lojas da rede.", category: "Catálogo", priceFromCents: 79000, icon: "Camera", audience: ["supplier"], deliveryDays: 10, highlights: ["Fundo neutro", "Frente, verso e detalhe"], featured: true },
    { key: "captacao-lojistas", name: "Captação de Lojistas", description: "Campanha para atrair novos lojistas para a sua rede SuperDrop (25% do setup fica com você).", category: "Rede", priceFromCents: 150000, icon: "UsersRound", audience: ["supplier"], deliveryDays: 14, highlights: ["Landing de convite", "Anúncios segmentados"], featured: true },
    { key: "treinamento-expedicao", name: "Treinamento de Expedição", description: "Padronize separação, conferência e etiquetas com a equipe da Central.", category: "Operação", priceFromCents: 49000, icon: "PackageCheck", audience: ["supplier"], deliveryDays: 7, highlights: ["Roteiro de separação", "Checklist de conferência"] },
  ];
  const services = catalogServices.map(({ kind, ...sv }) => ({ id: newId("svc"), kind: kind ?? ("SERVICE" as const), ...sv }));
  await db.insert(s.services).values(services);
  const themeRows = await db.select().from(s.themes);
  const versions = await db.select().from(s.themeVersions);
  return { themeRows, versions, plans, services };
}
