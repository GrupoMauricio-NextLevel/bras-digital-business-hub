import type { Role } from "@/lib/domain/access";
import type { Brand, BrandCode } from "@/lib/brand";

export type NavIcon =
  | "LayoutDashboard" | "Factory" | "Network" | "Store" | "Package" | "ShoppingCart" | "LayoutTemplate" | "Sparkles" | "CreditCard"
  | "Settings" | "Boxes" | "Users" | "Truck" | "Wallet" | "Image" | "Home" | "Palette" | "Globe"
  | "Printer" | "ScanLine" | "BarChart3" | "UsersRound" | "PackageCheck" | "Bell" | "Landmark" | "Plus" | "Lock" | "Clock" | "Inbox" | "Link2" | "Ticket" | "HandCoins";

export type Panel = "master" | "supplier" | "dispatch" | "lite" | "pro" | "partner";

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
  /** Item que só existe em marcas com este módulo (dropshipping) ou com o programa de parceiros aberto. */
  needs?: "dropship" | "partners";
  /** Item exclusivo de uma marca. */
  onlyBrand?: BrandCode;
};

export type QuickAction = { label: string; href: string; icon: NavIcon };

export const NEXTLEVEL_ITEM = (base: string): NavItem => ({ label: "Loja NextLevel", href: `${base}/services`, icon: "Sparkles", pinned: true, badge: "Novo" });

export const NAV: Record<Role, { base: string; label: string; items: NavItem[]; quick: QuickAction[] }> = {
  NEXTLEVEL_MASTER: {
    base: "/master",
    label: "NextLevel Master",
    items: [
      NEXTLEVEL_ITEM("/master"),
      { label: "NextLevel Commerce", href: "/commerce", icon: "Globe", group: "Plataformas", onlyBrand: "NEXTLEVEL_COMMERCE" },
      { label: "Dashboard", href: "/master", icon: "LayoutDashboard", exact: true, group: "Operação" },
      { label: "Fornecedores", href: "/master/suppliers", icon: "Factory", group: "Rede", needs: "dropship" },
      { label: "Redes", href: "/master/networks", icon: "Network", group: "Rede", needs: "dropship" },
      { label: "Lojas", href: "/master/stores", icon: "Store", group: "Rede" },
      { label: "Catálogo", href: "/master/catalog", icon: "Package", group: "Rede", needs: "dropship" },
      { label: "Pedidos", href: "/master/orders", icon: "ShoppingCart", group: "Operação" },
      { label: "Resumo do dia", href: "/master/summary", icon: "LayoutDashboard", group: "Operação" },
      { label: "Erros do sistema", href: "/master/errors", icon: "Settings", group: "Operação" },
      { label: "CRM Loja NextLevel", href: "/master/crm", icon: "Inbox", group: "Operação" },
      { label: "Parceiros", href: "/master/partners", icon: "UsersRound", group: "Negócio", needs: "partners" },
      { label: "Escritório virtual", href: "/master/office", icon: "Landmark", group: "Negócio" },
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
      { label: "Minha loja", href: "/supplier/store", icon: "Globe", group: "Rede" },
      { label: "Produtos", href: "/supplier/products", icon: "Package", group: "Catálogo" },
      { label: "Estoque", href: "/supplier/inventory", icon: "Boxes", group: "Catálogo" },
      { label: "Equipe", href: "/supplier/team", icon: "UsersRound", group: "Rede" },
      { label: "Corte e operação", href: "/supplier/operations", icon: "Clock", group: "Operação" },
      { label: "Faturas", href: "/supplier/invoices", icon: "CreditCard", group: "Financeiro" },
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
      { label: "Campanhas", href: "/merchant/campanhas", icon: "Image", group: "Loja virtual" },
      { label: "Cupons", href: "/merchant/descontos", icon: "Sparkles", group: "Loja virtual" },
      { label: "Avaliações", href: "/merchant/avaliacoes", icon: "Users", group: "Loja virtual" },
      { label: "Avise-me", href: "/merchant/avise-me", icon: "Users", group: "Loja virtual" },
      { label: "Atacado", href: "/merchant/atacado", icon: "Package", group: "Loja virtual" },
      { label: "Conteúdo", href: "/merchant/content", icon: "Image", group: "Catálogo" },
      { label: "Saldo e recargas", href: "/merchant/wallet", icon: "Wallet", group: "Financeiro" },
      { label: "Financeiro", href: "/merchant/finance", icon: "Landmark", group: "Financeiro" },
      { label: "Equipe", href: "/merchant/team", icon: "Users", group: "Conta" },
      { label: "Configurações", href: "/merchant/settings", icon: "Settings", group: "Conta" },
    ],
    quick: [
      { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" },
      { label: "Ver loja NextLevel", href: "/merchant/services", icon: "Sparkles" },
    ],
  },
  AFFILIATE: {
    base: "/partner",
    label: "Parceiro",
    items: [
      { label: "Início", href: "/partner", icon: "Home", exact: true, group: "Escritório" },
      { label: "Links", href: "/partner/links", icon: "Link2", group: "Divulgação" },
      { label: "Cupons de 7 dias", href: "/partner/coupons", icon: "Ticket", group: "Divulgação" },
      { label: "Indicados", href: "/partner/referrals", icon: "Users", group: "Resultados" },
      { label: "Financeiro", href: "/partner/finance", icon: "HandCoins", group: "Resultados" },
      { label: "Meu perfil", href: "/partner/profile", icon: "Settings", group: "Conta" },
    ],
    quick: [
      { label: "Novo link", href: "/partner/links", icon: "Link2" },
      { label: "Novo cupom", href: "/partner/coupons", icon: "Ticket" },
    ],
  },
};

/** Menu da marca do endereço: tira o que a marca não usa (ex.: fornecedores e redes na NextLevel Commerce) e o que é de outra marca. */
export function navForBrand(items: NavItem[], brand: Pick<Brand, "code" | "modules" | "partnersOpen">): NavItem[] {
  return items.filter((i) => (!i.needs || (i.needs === "dropship" ? brand.modules.includes("dropship") : brand.partnersOpen)) && (!i.onlyBrand || i.onlyBrand === brand.code || brand.code === "NEXTLEVEL"));
}
