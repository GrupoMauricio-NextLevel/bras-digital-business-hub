import type { Role } from "@/lib/domain/access";

export type NavIcon =
  | "LayoutDashboard" | "Factory" | "Network" | "Store" | "Package" | "ShoppingCart" | "LayoutTemplate" | "Sparkles" | "CreditCard"
  | "Settings" | "Boxes" | "Users" | "Truck" | "Wallet" | "Image" | "Home" | "Palette" | "Globe"
  | "Printer" | "ScanLine" | "BarChart3" | "UsersRound" | "PackageCheck" | "Bell" | "Landmark" | "Plus" | "Lock";

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
      { label: "Dashboard", href: "/master", icon: "LayoutDashboard", exact: true },
      { label: "Fornecedores", href: "/master/suppliers", icon: "Factory" },
      { label: "Redes", href: "/master/networks", icon: "Network" },
      { label: "Lojas", href: "/master/stores", icon: "Store" },
      { label: "Catálogo", href: "/master/catalog", icon: "Package" },
      { label: "Pedidos", href: "/master/orders", icon: "ShoppingCart" },
      { label: "Financeiro", href: "/master/finance", icon: "Wallet" },
      { label: "Templates", href: "/master/templates", icon: "LayoutTemplate" },
      { label: "Planos", href: "/master/plans", icon: "CreditCard" },
      { label: "Configurações", href: "/master/settings", icon: "Settings" },
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
      { label: "Início", href: "/supplier", icon: "Home", exact: true },
      { label: "Pedidos", href: "/supplier/orders", icon: "ShoppingCart" },
      { label: "Expedição", href: "/supplier/shipping", icon: "Truck" },
      { label: "Produtos", href: "/supplier/products", icon: "Package" },
      { label: "Estoque", href: "/supplier/inventory", icon: "Boxes" },
      { label: "Lojistas", href: "/supplier/stores", icon: "Store" },
      { label: "Financeiro", href: "/supplier/finance", icon: "Wallet" },
      { label: "Conteúdo", href: "/supplier/content", icon: "Image" },
      { label: "Configurações", href: "/supplier/settings", icon: "Settings" },
    ],
    quick: [
      { label: "Novo produto", href: "/supplier/products/new", icon: "Package" },
      { label: "Nova loja", href: "/supplier/stores/new", icon: "Store" },
      { label: "Importar produtos por CSV", href: "/supplier/products/import", icon: "Boxes" },
    ],
  },
  STORE_OWNER: {
    base: "/merchant",
    label: "Lojista",
    items: [
      NEXTLEVEL_ITEM("/merchant"),
      { label: "Início", href: "/merchant", icon: "Home", exact: true },
      { label: "Pedidos", href: "/merchant/orders", icon: "ShoppingCart" },
      { label: "Produtos", href: "/merchant/products", icon: "Package" },
      { label: "Clientes", href: "/merchant/customers", icon: "Users" },
      { label: "Loja Virtual", href: "/merchant/storefront", icon: "Globe" },
      { label: "Aparência", href: "/merchant/appearance", icon: "Palette" },
      { label: "Templates", href: "/merchant/templates", icon: "LayoutTemplate" },
      { label: "Conteúdo", href: "/merchant/content", icon: "Image" },
      { label: "Financeiro", href: "/merchant/finance", icon: "Wallet" },
      { label: "Configurações", href: "/merchant/settings", icon: "Settings" },
    ],
    quick: [
      { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" },
      { label: "Ver loja NextLevel", href: "/merchant/services", icon: "Sparkles" },
    ],
  },
};
