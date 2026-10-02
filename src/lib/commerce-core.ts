export type CommerceCoreModuleStatus = "ACTIVE" | "PARTIAL" | "PLANNED";

export type CommerceCoreModule = {
  key:
    | "organizations"
    | "access"
    | "catalog"
    | "inventory"
    | "customers"
    | "orders"
    | "payments"
    | "shipping"
    | "finance"
    | "storefront"
    | "integrations"
    | "events";
  label: string;
  description: string;
  href?: string;
  status: CommerceCoreModuleStatus;
  ownership: "CORE";
};

export const COMMERCE_CORE_MODULES: CommerceCoreModule[] = [
  {
    key: "organizations",
    label: "Organizações",
    description: "Fornecedores, lojistas e empresas que participam do ecossistema.",
    href: "/master/suppliers",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "access",
    label: "Acessos e permissões",
    description: "Usuários, grants por vertical e escopos por organização.",
    href: "/master/settings",
    status: "PARTIAL",
    ownership: "CORE",
  },
  {
    key: "catalog",
    label: "Catálogo central",
    description: "Produtos, variantes e canais comerciais sem duplicar SKU.",
    href: "/master/catalog",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "inventory",
    label: "Estoque central",
    description: "Disponibilidade física compartilhada pelas verticais.",
    href: "/supplier/inventory",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "customers",
    label: "Clientes",
    description: "Cadastro de compradores associado às lojas e pedidos.",
    href: "/merchant/customers",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "orders",
    label: "Pedidos",
    description: "Pedido único com origem identificada por source_area.",
    href: "/master/orders",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "payments",
    label: "Pagamentos e carteiras",
    description: "Cobranças, saldo e movimentações financeiras operacionais.",
    href: "/supplier/wallets",
    status: "PARTIAL",
    ownership: "CORE",
  },
  {
    key: "shipping",
    label: "Frete e expedição",
    description: "Etiquetas, separação, envio e rastreio de pedidos.",
    href: "/supplier/shipping",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "finance",
    label: "Financeiro",
    description: "Consolidação financeira da plataforma e da operação.",
    href: "/master/finance",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "storefront",
    label: "Lojas, temas e checkout",
    description: "Infraestrutura de storefront reutilizada por diferentes canais.",
    href: "/merchant/storefront",
    status: "ACTIVE",
    ownership: "CORE",
  },
  {
    key: "integrations",
    label: "Integrações",
    description: "Conectores de pagamento, frete, canais externos e serviços.",
    href: "/master/settings",
    status: "PARTIAL",
    ownership: "CORE",
  },
  {
    key: "events",
    label: "Eventos de domínio",
    description: "Eventos e trilha técnica para integrar as verticais sem acoplamento.",
    status: "PLANNED",
    ownership: "CORE",
  },
];

export const VERTICAL_ONLY_CONCERNS = {
  SUPERDROP: ["rede de lojistas", "regras de dropshipping", "recargas operacionais"],
  BRAS_DIGITAL: ["oferta B2B", "grade atacadista", "retirada"],
  CREATORS_HUB: ["campanhas", "atribuição", "comissões de creator"],
  CHINA_HUB: ["onboarding de importador", "representantes", "localização comercial"],
} as const;
