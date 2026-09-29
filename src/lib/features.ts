import { DomainError } from "@/lib/domain/errors";
import type { OfferKey } from "@/lib/finance/price-book";

/**
 * Recursos do lojista e quais ofertas os liberam. Fonte única: telas e domínio consultam daqui.
 * Recurso bloqueado aparece com cadeado e caminho de upgrade, nunca escondido.
 */
export const FEATURES = [
  "manualOrders", "catalog", "wallet", "labels", "customers", "financeBasic", "services",
  "storefront", "appearanceBasic", "templatesStarter",
  "templatesPremium", "appearanceAdvanced", "customDomain", "analytics", "team", "reportsExport",
] as const;
export type FeatureKey = (typeof FEATURES)[number];

const LITE_BASE: FeatureKey[] = ["manualOrders", "catalog", "wallet", "labels", "customers", "financeBasic", "services"];
const SUBDOMAIN: FeatureKey[] = [...LITE_BASE, "storefront", "appearanceBasic", "templatesStarter"];
const OWN: FeatureKey[] = [...SUBDOMAIN, "templatesPremium", "appearanceAdvanced", "customDomain", "analytics", "team", "reportsExport"];

const toMap = (on: FeatureKey[]) => Object.fromEntries(FEATURES.map((f) => [f, on.includes(f)])) as Record<FeatureKey, boolean>;

export const OFFER_FEATURES: Record<OfferKey, Record<FeatureKey, boolean>> = {
  DROP_MANUAL: toMap(LITE_BASE),
  STORE_SUBDOMAIN: toMap(SUBDOMAIN),
  STORE_OWN: toMap(OWN),
};

export const canUse = (offer: OfferKey, feature: FeatureKey): boolean => OFFER_FEATURES[offer][feature];

/** Menor oferta que libera o recurso, usada no texto de upgrade. */
export function minOfferFor(feature: FeatureKey): OfferKey {
  return (["DROP_MANUAL", "STORE_SUBDOMAIN", "STORE_OWN"] as OfferKey[]).find((o) => OFFER_FEATURES[o][feature]) ?? "STORE_OWN";
}

export const FEATURE_INFO: Record<FeatureKey, { label: string; pitch: string }> = {
  manualOrders: { label: "Pedidos manuais", pitch: "Venda por WhatsApp, Instagram ou balcão usando o estoque central." },
  catalog: { label: "Catálogo da Central", pitch: "Ative produtos e defina seu preço com margem calculada." },
  wallet: { label: "Saldo e recarga Pix", pitch: "Recarregue por Pix e tenha pedidos liberados automaticamente." },
  labels: { label: "Etiquetas de envio", pitch: "Anexe a etiqueta do SuperFrete para a Central despachar." },
  customers: { label: "Clientes", pitch: "Histórico de compras e consentimentos de marketing." },
  financeBasic: { label: "Financeiro simples", pitch: "Saldo, extrato e recargas em um só lugar." },
  services: { label: "Loja NextLevel", pitch: "Serviços e upgrades para acelerar seu negócio." },
  storefront: { label: "Loja virtual", pitch: "Sua loja online em subdomínio, pronta para vender." },
  appearanceBasic: { label: "Aparência", pitch: "Logo, cores e textos da sua loja." },
  templatesStarter: { label: "Template Starter", pitch: "Visual limpo e rápido, incluso na sua oferta." },
  templatesPremium: { label: "Templates Premium", pitch: "Temas Pro e Elite com seções avançadas." },
  appearanceAdvanced: { label: "Editor avançado da loja", pitch: "Seções, banners e prévia responsiva ao vivo." },
  customDomain: { label: "Domínio próprio", pitch: "Sua marca no endereço, sem o selo SuperDrop." },
  analytics: { label: "Análise de vendas", pitch: "Margem, funil, produtos campeões e clientes recorrentes." },
  team: { label: "Equipe da loja", pitch: "Convide outras pessoas para operar a loja." },
  reportsExport: { label: "Relatórios exportáveis", pitch: "Baixe vendas, clientes e financeiro em CSV." },
};

const OFFER_NAME: Record<OfferKey, string> = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" };

/** Guarda de domínio: recurso bloqueado na oferta vira erro com caminho de upgrade (a tela também mostra o cadeado). */
export function requireFeature(offer: OfferKey, feature: FeatureKey): void {
  if (canUse(offer, feature)) return;
  throw new DomainError("FEATURE_LOCKED", `${FEATURE_INFO[feature].label} está disponível na oferta ${OFFER_NAME[minOfferFor(feature)]}. Veja como liberar na Loja NextLevel.`);
}
