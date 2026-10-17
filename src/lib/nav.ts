import type { Role } from "@/lib/domain/access";
import type { Brand, BrandCode } from "@/lib/brand";

export type NavIcon =
  | "LayoutDashboard" | "Factory" | "Network" | "Store" | "Package" | "ShoppingCart" | "LayoutTemplate" | "Sparkles" | "CreditCard"
  | "Settings" | "Boxes" | "Users" | "Truck" | "Wallet" | "Image" | "Home" | "Palette" | "Globe"
  | "Printer" | "ScanLine" | "BarChart3" | "UsersRound" | "PackageCheck" | "Bell" | "Landmark" | "Plus" | "Lock" | "Clock" | "Inbox" | "Link2" | "Ticket" | "HandCoins"
  | "ShoppingBag" | "Megaphone" | "ReceiptText" | "Tag" | "LayoutGrid" | "LifeBuoy";

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
  /** Aparece na barra de atalhos do celular (sem nenhum marcado, vale os 3 primeiros). */
  bottom?: boolean;
  /** Item que só existe em marcas com este módulo (dropshipping) ou com o programa de parceiros aberto. */
  needs?: "dropship" | "partners";
  /** Item exclusivo de uma marca. */
  onlyBrand?: BrandCode;
};

/** Como o menu agrupa: "sections" = títulos de seção sempre abertos; "accordion" = grupos que abrem e fecham (aria-expanded). É estrutura do fluxo, não da empresa. */
export type NavMode = "sections" | "accordion";

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
      { label: "Clientes e suporte", href: "/master/clientes", icon: "LifeBuoy", group: "Operação" },
      { label: "Fornecedores", href: "/master/suppliers", icon: "Factory", group: "Rede", needs: "dropship" },
      { label: "Redes", href: "/master/networks", icon: "Network", group: "Rede", needs: "dropship" },
      { label: "Lojas", href: "/master/stores", icon: "Store", group: "Rede" },
      { label: "Catálogo", href: "/master/catalog", icon: "Package", group: "Rede", needs: "dropship" },
      { label: "Pedidos", href: "/master/orders", icon: "ShoppingCart", group: "Operação" },
      { label: "Resumo do dia", href: "/master/summary", icon: "LayoutDashboard", group: "Operação" },
      { label: "Erros do sistema", href: "/master/errors", icon: "Settings", group: "Operação" },
      { label: "Integridade dos dados", href: "/master/integridade", icon: "Settings", group: "Operação" },
      { label: "Central de qualidade", href: "/master/qualidade", icon: "PackageCheck", group: "Operação" },
      { label: "CRM Loja NextLevel", href: "/master/crm", icon: "Inbox", group: "Operação" },
      { label: "Brás Digital Club", href: "/bras", icon: "Boxes", group: "Plataformas" },
      { label: "Parceiros", href: "/master/partners", icon: "UsersRound", group: "Negócio", needs: "partners" },
      { label: "Escritório virtual", href: "/master/office", icon: "Landmark", group: "Negócio" },
      { label: "Torre do Ecossistema", href: "/master/ecossistema", icon: "Network", group: "Negócio" },
      { label: "Equipe do Master", href: "/master/equipe", icon: "UsersRound", group: "Negócio" },
      { label: "Financeiro NextLevel", href: "/master/financeiro", icon: "Landmark", group: "Negócio" },
      { label: "Financeiro SuperDrop", href: "/master/financeiro/operacao", icon: "Wallet", group: "Negócio" },
      { label: "Templates", href: "/master/templates", icon: "LayoutTemplate", group: "Negócio" },
      { label: "Planos", href: "/master/plans", icon: "CreditCard", group: "Negócio" },
      { label: "Configurações", href: "/master/settings", icon: "Settings", group: "Negócio" },
    ],
    quick: [
      { label: "Novo fornecedor", href: "/master/suppliers/new", icon: "Factory" },
      { label: "Fechar competência", href: "/master/financeiro/operacao?tab=invoices", icon: "Wallet" },
      { label: "Simulador de ganhos", href: "/master/financeiro/operacao?tab=simulator", icon: "BarChart3" },
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
      { label: "Categorias", href: "/supplier/products/categorias", icon: "Tag", group: "Catálogo" },
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
      { label: "Histórico", href: "/merchant/auditoria", icon: "Settings", group: "Conta" },
      { label: "Configurações", href: "/merchant/settings", icon: "Settings", group: "Conta" },
    ],
    quick: [
      { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" },
      { label: "Ver loja NextLevel", href: "/merchant/services", icon: "Sparkles" },
    ],
  },
  BRAS_MEMBER: {
    base: "/meu-bras",
    label: "Membro Brás Digital Club",
    items: [
      { label: "Início", href: "/meu-bras", icon: "Home", exact: true, group: "Meu Brás" },
      { label: "Descobertas", href: "/meu-bras/videos", icon: "LayoutGrid", group: "Meu Brás" },
      { label: "Meus pedidos", href: "/meu-bras/pedidos", icon: "ReceiptText", group: "Meu Brás" },
      { label: "Fretes", href: "/meu-bras/fretes", icon: "Truck", group: "Meu Brás" },
      { label: "Indique e ganhe", href: "/meu-bras/club", icon: "Ticket", group: "Meu Brás" },
      { label: "Meu Contador", href: "/meu-bras/meu-contador", icon: "ReceiptText", group: "Meu Brás" },
      { label: "Suporte", href: "/meu-bras/suporte", icon: "LifeBuoy", group: "Meu Brás" },
      { label: "Meu perfil", href: "/meu-bras/perfil", icon: "UsersRound", group: "Conta" },
      { label: "Minha empresa", href: "/meu-bras/empresa", icon: "Settings", group: "Conta" },
    ],
    quick: [],
  },
  // Painel da importadora parceira da Brás (D110): login próprio, só a própria importadora.
  BRAS_IMPORTER: {
    base: "/importadora",
    label: "Importadora Brás Digital Club",
    items: [
      { label: "Hoje", href: "/importadora", icon: "Home", exact: true, group: "Operação", bottom: true },
      { label: "Pedidos", href: "/importadora/pedidos", icon: "Inbox", group: "Operação", bottom: true },
      { label: "Transportadoras", href: "/importadora/transportadoras", icon: "Truck", group: "Operação" },
      { label: "Indique e ganhe", href: "/importadora/indicacoes", icon: "Ticket", group: "Conta" },
      { label: "Produtos e caixas", href: "/importadora/produtos", icon: "Package", group: "Catálogo", bottom: true },
      { label: "Estoque", href: "/importadora/estoque", icon: "Boxes", group: "Catálogo" },
      { label: "Galpões, equipe e ficha", href: "/importadora/galpoes", icon: "Factory", group: "Conta" },
    ],
    quick: [],
  },
  // Painel da transportadora na NextLevel Cargas (D111): login no endereço da Cargas, só a própria transportadora.
  CARRIER: {
    base: "/transportadora",
    label: "Transportadora NextLevel Cargas",
    items: [
      { label: "Hoje", href: "/transportadora", icon: "Home", exact: true, group: "Cargas", bottom: true },
      { label: "Cargas", href: "/transportadora/cargas", icon: "Truck", group: "Cargas", bottom: true },
      { label: "Rotas e viagens", href: "/transportadora/rotas", icon: "Clock", group: "Cargas" },
      { label: "Importadoras na rede", href: "/transportadora/importadoras", icon: "Store", group: "Cargas" },
      { label: "Indique e ganhe", href: "/transportadora/indicacoes", icon: "Ticket", group: "Conta" },
      { label: "Extrato", href: "/transportadora/extrato", icon: "ReceiptText", group: "Financeiro", bottom: true },
      { label: "Perfil e motorista", href: "/transportadora/perfil", icon: "Settings", group: "Conta" },
    ],
    quick: [],
  },
  AFFILIATE: {
    base: "/partner",
    label: "Parceiro",
    items: [
      { label: "Início", href: "/partner", icon: "Home", exact: true, group: "Escritório" },
      { label: "Links", href: "/partner/links", icon: "Link2", group: "Divulgação" },
      { label: "Cupons de 7 dias", href: "/partner/coupons", icon: "Ticket", group: "Divulgação" },
      { label: "CRM de clientes", href: "/partner/crm", icon: "Inbox", group: "Vendas" },
      { label: "Catálogo comercial", href: "/partner/catalogo", icon: "ShoppingBag", group: "Vendas" },
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

/** Ícone do grupo no modo "accordion". */
export const GROUP_ICONS: Record<string, NavIcon> = { Vendas: "ShoppingBag", "Catálogo": "Package", Marketing: "Megaphone", "Loja virtual": "Store", "Gestão": "BarChart3", "Configurações": "Settings" };

/** Painel do lojista Commerce (grupos que abrem). Só rotas que existem. Equipe (STAFF) é filtrada no servidor pelo `STAFF_NAV_PREFIXES`. */
export const COMMERCE_STORE_NAV: NavItem[] = [
  { label: "Início", href: "/merchant", icon: "Home", exact: true, bottom: true },
  { label: "Pedidos", href: "/merchant/orders", icon: "ShoppingBag", group: "Vendas", bottom: true },
  { label: "Clientes", href: "/merchant/customers", icon: "Users", group: "Vendas" },
  { label: "Pós-venda", href: "/merchant/after-sales", icon: "PackageCheck", group: "Vendas" },
  { label: "Produtos", href: "/merchant/catalogo", icon: "Package", group: "Catálogo", bottom: true },
  { label: "Categorias", href: "/merchant/catalogo/categorias", icon: "Tag", group: "Catálogo" },
  { label: "Campanhas", href: "/merchant/campanhas", icon: "Megaphone", group: "Marketing" },
  { label: "Cupons", href: "/merchant/descontos", icon: "Ticket", group: "Marketing" },
  { label: "Avaliações", href: "/merchant/avaliacoes", icon: "Users", group: "Marketing" },
  { label: "Visão da loja", href: "/merchant/storefront", icon: "Globe", group: "Loja virtual" },
  { label: "Aparência", href: "/theme-editor", icon: "Palette", group: "Loja virtual" },
  { label: "Temas", href: "/merchant/templates", icon: "LayoutTemplate", group: "Loja virtual" },
  { label: "Análise", href: "/merchant/analytics", icon: "BarChart3", group: "Gestão" },
  { label: "Financeiro", href: "/merchant/finance", icon: "Wallet", group: "Gestão", bottom: true },
  { label: "Empresa e loja", href: "/merchant/settings", icon: "Settings", group: "Configurações" },
  { label: "Equipe", href: "/merchant/team", icon: "UsersRound", group: "Configurações" },
  { label: "Minha assinatura", href: "/merchant/finance#assinatura", icon: "CreditCard", group: "Configurações" },
  { label: "Registro de ações", href: "/merchant/auditoria", icon: "Clock", group: "Configurações" },
];
export const STAFF_NAV_PREFIXES = ["/merchant/orders", "/merchant/customers", "/merchant/after-sales", "/merchant/catalogo"];

/** Console administrativo da Commerce (equipe NextLevel). Mesmo menu em seções do Master. */
export const COMMERCE_ADMIN_NAV: NavItem[] = [
  { label: "Visão geral", href: "/commerce", icon: "LayoutGrid", exact: true, group: "Plataforma", bottom: true },
  { label: "Lojas", href: "/commerce/stores", icon: "Store", group: "Operação", bottom: true },
  { label: "Vendas", href: "/commerce/orders", icon: "ShoppingBag", group: "Operação", bottom: true },
  { label: "Catálogo das lojas", href: "/commerce/catalog", icon: "Package", group: "Operação" },
  { label: "Interessados", href: "/commerce/leads", icon: "Inbox", group: "Crescimento" },
  { label: "Assinaturas", href: "/commerce/plans", icon: "CreditCard", group: "Negócio" },
  { label: "Plataforma", href: "/commerce/settings", icon: "Settings", group: "Sistema" },
];

/** Estúdio da Brás Digital (D92): área do Master com menu, nome e cor da Brás. */
export const BRAS_ADMIN_NAV: NavItem[] = [
  { label: "Visão geral", href: "/bras/visao", icon: "LayoutDashboard", group: "Operação" },
  { label: "Pedidos", href: "/bras", icon: "Inbox", exact: true, group: "Operação", bottom: true },
  { label: "Comissões", href: "/bras/comissoes", icon: "HandCoins", group: "Operação" },
  { label: "Atendimento", href: "/bras/atendimento", icon: "LifeBuoy", group: "Operação" },
  { label: "Descobertas", href: "/bras/descobertas", icon: "LayoutGrid", group: "Catálogo", bottom: true },
  { label: "Importadoras", href: "/bras/importadoras", icon: "Factory", group: "Catálogo" },
  { label: "Pauta de conteúdo", href: "/bras/pauta", icon: "Megaphone", group: "Catálogo" },
  { label: "Transportadoras (Cargas)", href: "/bras/transportadoras", icon: "Truck", group: "Catálogo" },
  { label: "Ônibus de excursão", href: "/bras/excursao", icon: "Truck", group: "Catálogo" },
  { label: "Empresas do grupo", href: "/bras/grupo", icon: "Landmark", group: "Configuração" },
  { label: "Indicações e pontos", href: "/bras/club", icon: "Ticket", group: "Pessoas" },
  { label: "Meu Contador", href: "/bras/meu-contador", icon: "ReceiptText", group: "Operação" },
  { label: "Membros", href: "/bras/membros", icon: "Users", group: "Pessoas", bottom: true },
  { label: "Acesso e planos", href: "/bras/acesso", icon: "Lock", group: "Pessoas" },
  { label: "Planos e regras", href: "/bras/regras", icon: "Settings", group: "Configuração" },
];

/** Menu da marca do endereço: tira o que a marca não usa (ex.: fornecedores e redes na NextLevel Commerce) e o que é de outra marca. */
export function navForBrand(items: NavItem[], brand: Pick<Brand, "code" | "modules" | "partnersOpen">): NavItem[] {
  return items.filter((i) => (!i.needs || (i.needs === "dropship" ? brand.modules.includes("dropship") : brand.partnersOpen)) && (!i.onlyBrand || i.onlyBrand === brand.code || brand.code === "NEXTLEVEL"));
}
