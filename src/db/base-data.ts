import type { Database } from "./client";
import * as s from "./schema";
import { newId } from "@/lib/ids";

/**
 * Dados de referência da plataforma (temas, planos e serviços do marketplace).
 * Necessários em qualquer ambiente, inclusive produção. Chame uma única vez por banco (o bootstrap verifica antes).
 */
export async function seedReferenceData(db: Database) {
  const themeRows = [
    { id: newId("thm"), key: "starter", name: "Starter", tier: "STARTER" as const, description: "Tema gratuito e padrão. Limpo, rápido e pronto para vender.", priceCents: 0, features: ["Home com vitrine", "Catálogo e busca", "Página de produto", "Carrinho e checkout", "Cores e logo personalizáveis"], previewAccent: "#16a34a", available: true },
    { id: newId("thm"), key: "pro", name: "Pro", tier: "PRO" as const, description: "Seções avançadas, banners em carrossel, depoimentos e vitrines por categoria.", priceCents: 29700, features: ["Tudo do Starter", "Banners em carrossel", "Vitrines por categoria", "Depoimentos", "Selos de confiança", "Contador de promoção"], previewAccent: "#2563eb", available: false },
    { id: newId("thm"), key: "elite", name: "Elite", tier: "ELITE" as const, description: "Experiência premium com lookbook, vídeo na home e personalização total.", priceCents: 69700, features: ["Tudo do Pro", "Lookbook", "Vídeo na home", "Mega menu", "Tipografia premium", "Suporte prioritário"], previewAccent: "#7c3aed", available: false },
  ];
  await db.insert(s.themes).values(themeRows);
  const versions = themeRows.map((t) => ({ id: newId("thv"), themeId: t.id, version: "1.0.0", status: "PUBLISHED" as const }));
  await db.insert(s.themeVersions).values(versions);
  const plans = [
    { id: newId("pln"), name: "Start", priceCents: 9700, features: ["Loja virtual", "Tema Starter", "Até 100 produtos", "Suporte por e-mail"] },
    { id: newId("pln"), name: "Growth", priceCents: 19700, features: ["Tudo do Start", "Produtos ilimitados", "Venda manual e WhatsApp", "Central de conteúdo"] },
    { id: newId("pln"), name: "Scale", priceCents: 39700, features: ["Tudo do Growth", "Domínio próprio", "Atacado (grades)", "Suporte prioritário"] },
  ];
  await db.insert(s.plans).values(plans);
  const services = [
    { key: "template-premium", name: "Template Premium", description: "Migre para o tema Pro ou Elite com configuração feita por nossa equipe.", category: "Loja", priceFromCents: 29700, icon: "LayoutTemplate" },
    { key: "identidade-visual", name: "Identidade Visual", description: "Logo, paleta e tipografia profissionais para sua loja.", category: "Marca", priceFromCents: 89000, icon: "Palette" },
    { key: "banners", name: "Banners", description: "Pacote mensal de banners para home, campanhas e datas sazonais.", category: "Criativos", priceFromCents: 29000, icon: "Image" },
    { key: "conteudo-redes", name: "Conteúdo para Redes Sociais", description: "Calendário editorial e posts prontos para Instagram e WhatsApp.", category: "Criativos", priceFromCents: 49000, icon: "Share2" },
    { key: "trafego-pago", name: "Tráfego Pago", description: "Gestão de campanhas no Meta e Google com relatórios semanais.", category: "Crescimento", priceFromCents: 120000, icon: "TrendingUp" },
    { key: "automacao-whatsapp", name: "Automação WhatsApp", description: "Respostas automáticas, catálogo e recuperação de carrinho.", category: "Crescimento", priceFromCents: 39000, icon: "MessageCircle" },
    { key: "configuracao-profissional", name: "Configuração Profissional", description: "Deixamos sua loja 100% pronta: pagamentos, frete, domínio e produtos.", category: "Loja", priceFromCents: 59000, icon: "Wrench" },
    { key: "suporte-premium", name: "Suporte Premium", description: "Atendimento prioritário com especialista dedicado.", category: "Suporte", priceFromCents: 19000, icon: "LifeBuoy" },
  ].map((sv) => ({ id: newId("svc"), ...sv }));
  await db.insert(s.services).values(services);
  return { themeRows, versions, plans, services };
}
