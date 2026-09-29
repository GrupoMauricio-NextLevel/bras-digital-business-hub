import type { Role } from "@/lib/domain/access";

export type NavIcon = "LayoutDashboard" | "Factory" | "Network" | "Store" | "Package" | "ShoppingCart" | "LayoutTemplate" | "Sparkles" | "CreditCard" | "Settings" | "Boxes" | "Users" | "Truck" | "Wallet" | "Image" | "Home" | "Palette" | "Globe";

/** Ícones referenciados por nome para que a config possa cruzar a fronteira server → client. */
export type NavItem = { label: string; href: string; icon: NavIcon; exact?: boolean };

export const NAV: Record<Role, { base: string; label: string; items: NavItem[] }> = {
  NEXTLEVEL_MASTER: {
    base: "/master",
    label: "NextLevel Master",
    items: [
      { label: "Dashboard", href: "/master", icon: "LayoutDashboard", exact: true },
      { label: "Fornecedores", href: "/master/suppliers", icon: "Factory" },
      { label: "Redes", href: "/master/networks", icon: "Network" },
      { label: "Lojas", href: "/master/stores", icon: "Store" },
      { label: "Catálogo", href: "/master/catalog", icon: "Package" },
      { label: "Pedidos", href: "/master/orders", icon: "ShoppingCart" },
      { label: "Financeiro", href: "/master/finance", icon: "Wallet" },
      { label: "Templates", href: "/master/templates", icon: "LayoutTemplate" },
      { label: "Serviços", href: "/master/services", icon: "Sparkles" },
      { label: "Planos", href: "/master/plans", icon: "CreditCard" },
      { label: "Configurações", href: "/master/settings", icon: "Settings" },
    ],
  },
  SUPPLIER_ADMIN: {
    base: "/supplier",
    label: "Fornecedor",
    items: [
      { label: "Início", href: "/supplier", icon: "Home", exact: true },
      { label: "Produtos", href: "/supplier/products", icon: "Package" },
      { label: "Estoque", href: "/supplier/inventory", icon: "Boxes" },
      { label: "Pedidos", href: "/supplier/orders", icon: "ShoppingCart" },
      { label: "Lojistas", href: "/supplier/stores", icon: "Store" },
      { label: "Expedição", href: "/supplier/shipping", icon: "Truck" },
      { label: "Financeiro", href: "/supplier/finance", icon: "Wallet" },
      { label: "Conteúdo", href: "/supplier/content", icon: "Image" },
      { label: "Configurações", href: "/supplier/settings", icon: "Settings" },
    ],
  },
  STORE_OWNER: {
    base: "/merchant",
    label: "Lojista",
    items: [
      { label: "Início", href: "/merchant", icon: "Home", exact: true },
      { label: "Pedidos", href: "/merchant/orders", icon: "ShoppingCart" },
      { label: "Produtos", href: "/merchant/products", icon: "Package" },
      { label: "Clientes", href: "/merchant/customers", icon: "Users" },
      { label: "Loja Virtual", href: "/merchant/storefront", icon: "Globe" },
      { label: "Aparência", href: "/merchant/appearance", icon: "Palette" },
      { label: "Templates", href: "/merchant/templates", icon: "LayoutTemplate" },
      { label: "Conteúdo", href: "/merchant/content", icon: "Image" },
      { label: "Serviços NextLevel", href: "/merchant/services", icon: "Sparkles" },
      { label: "Financeiro", href: "/merchant/finance", icon: "Wallet" },
      { label: "Configurações", href: "/merchant/settings", icon: "Settings" },
    ],
  },
};
