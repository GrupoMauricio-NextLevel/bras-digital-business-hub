import type { Role } from "@/lib/domain/access";

export type NavIcon =
  | "LayoutDashboard" | "Factory" | "Network" | "Store" | "Package" | "ShoppingCart" | "LayoutTemplate" | "Sparkles" | "CreditCard"
  | "Settings" | "Boxes" | "Users" | "Truck" | "Wallet" | "Image" | "Home" | "Palette" | "Globe"
  | "Printer" | "ScanLine" | "BarChart3" | "UsersRound" | "PackageCheck" | "Bell" | "Landmark" | "Plus" | "Lock" | "Clock";

export type Panel = "master" | "supplier" | "dispatch" | "lite" | "pro";

/** Ícones referenciados por nome para que a config possa cruzar a fronteira server para client. */
export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  exact?: boolean;
  /** Item fixo no topo (Loja NextLevel). */
  pinned?: boolean;
  badge?: string;
  /** Grupo do menu lateral (título de seção). */
  group?: string;
  /** Recurso bloqueado na oferta atual: mostra cadeado e leva ao upgrade. */
  locked?: boolean;
};

export type QuickAction = { label: string; href: string; icon: NavIcon };

export const NEXTLEVEL_ITEM = (base: string): NavItem => ({ label: "Loja NextLevel", href: `${base}/services`, icon: "Sparkles", pinned: true, badge: "Novo" });

export const NAV: Record<Role, { base: string; label: string; items: NavItem[]; quick: QuickAction[] }> = {
  NEXTLEVEL_MASTER: {
    base: "/master",
    label: "NextLevel Master",
    items: [
      NEXTLEVEL_ITEM("/master"),
      { label: "Dashboard", href: "/master", icon: "LayoutDashboard", exact: true, group: "Operação" },
      { label: "Fornecedores", href: "/master/suppliers", icon: "Factory", group: "Rede" },
      { label: "Redes", href: "/master/networks", icon: "Network", group: "Rede" },
      { label: "Lojas", href: "/master/stores", icon: "Store", group: "Rede" },
      { label: "Catálogo", href: "/master/catalog", icon: "Package", group: "Rede" },
      { label: "Pedidos", href: "/master/orders", icon: "ShoppingCart", group: "Operação" },
      { label: "Financeiro", href: "/master/finance", icon: "Wallet", group: "Negócio" },
      { label: "Templates", href: "/master/templates", icon: "LayoutTemplate", group: "Negócio" },
      { label: "Planos", href: "/master/plans", icon: "CreditCard", group: "Negócio" },
      { label: "Configurações", href: "/master/settings", icon: "Settings", group: "Negócio" },
    ],
    quick: [
      { label: "Novo fornecedor", href: "/master/suppliers/new", icon: "Factory" },
      { label: "Fechar competência", href: "/master/finance?tab=invoices", icon: "Wallet" },
      { label: "Simulador de ganhos", href: "/master/finance?tab=simulator", icon: "BarChart3" },
    ],
  },
  SUPPLIER_ADMIN: {
    base: "/supplier",
    label: "Fornecedor",
    items: [
      NEXTLEVEL_ITEM("/supplier"),
      { label: "Esteira", href: "/supplier", icon: "Truck", exact: true, group: "Operação" },
      { label: "Pedidos", href: "/supplier/orders", icon: "ShoppingCart", group: "Operação" },
      { label: "Recargas", href: "/supplier/wallets", icon: "Wallet", group: "Financeiro" },
      { label: "Lojistas", href: "/supplier/stores", icon: "Store", group: "Rede" },
      { label: "Produtos", href: "/supplier/products", icon: "Package", group: "Catálogo" },
      { label: "Estoque", href: "/supplier/inventory", icon: "Boxes", group: "Catálogo" },
      { label: "Equipe", href: "/supplier/team", icon: "UsersRound", group: "Rede" },
      { label: "Corte e operação", href: "/supplier/operations", icon: "Clock", group: "Operação" },
      { label: "Financeiro", href: "/supplier/finance", icon: "Landmark", group: "Financeiro" },
      { label: "Conteúdo", href: "/supplier/content", icon: "Image", group: "Catálogo" },
      { label: "Configurações", href: "/supplier/settings", icon: "Settings", group: "Conta" },
    ],
    quick: [
      { label: "Abrir tela da expedição", href: "/supplier/dispatch", icon: "PackageCheck" },
      { label: "Novo produto", href: "/supplier/products/new", icon: "Package" },
      { label: "Nova loja", href: "/supplier/stores/new", icon: "Store" },
      { label: "Importar produtos por CSV", href: "/supplier/products/import", icon: "Boxes" },
    ],
  },
  SUPPLIER_DISPATCH: {
    base: "/supplier/dispatch",
    label: "Expedição",
    items: [
      { label: "Fila de expedição", href: "/supplier/dispatch", icon: "PackageCheck", exact: true },
      { label: "Imprimir etiquetas", href: "/supplier/dispatch/print", icon: "Printer" },
      { label: "Enviados", href: "/supplier/dispatch/shipped", icon: "Truck" },
    ],
    quick: [{ label: "Fila de expedição", href: "/supplier/dispatch", icon: "PackageCheck" }],
  },
  STORE_OWNER: {
    base: "/merchant",
    label: "Lojista",
    items: [
      NEXTLEVEL_ITEM("/merchant"),
      { label: "Início", href: "/merchant", icon: "Home", exact: true, group: "Vendas" },
      { label: "Pedidos", href: "/merchant/orders", icon: "ShoppingCart", group: "Vendas" },
      { label: "Análise", href: "/merchant/analytics", icon: "BarChart3", group: "Vendas" },
      { label: "Pós-venda", href: "/merchant/after-sales", icon: "PackageCheck", group: "Vendas" },
      { label: "Etiquetas", href: "/merchant/labels", icon: "Printer", group: "Vendas" },
      { label: "Catálogo", href: "/merchant/products", icon: "Package", group: "Catálogo" },
      { label: "Clientes", href: "/merchant/customers", icon: "Users", group: "Vendas" },
      { label: "Loja Virtual", href: "/merchant/storefront", icon: "Globe", group: "Loja virtual" },
      { label: "Editor do tema", href: "/theme-editor", icon: "Palette", group: "Loja virtual" },
      { label: "Templates", href: "/merchant/templates", icon: "LayoutTemplate", group: "Loja virtual" },
      { label: "Conteúdo", href: "/merchant/content", icon: "Image", group: "Catálogo" },
      { label: "Saldo e recargas", href: "/merchant/wallet", icon: "Wallet", group: "Financeiro" },
      { label: "Financeiro", href: "/merchant/finance", icon: "Landmark", group: "Financeiro" },
      { label: "Configurações", href: "/merchant/settings", icon: "Settings", group: "Conta" },
    ],
    quick: [
      { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" },
      { label: "Ver loja NextLevel", href: "/merchant/services", icon: "Sparkles" },
    ],
  },
};
