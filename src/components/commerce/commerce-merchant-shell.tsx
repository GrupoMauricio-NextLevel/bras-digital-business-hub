"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  BarChart3, ChevronDown, ExternalLink, Home, LogOut, Megaphone, Menu, Package, Search, Settings, ShoppingBag, Store, Wallet, X,
  type LucideIcon,
} from "lucide-react";
import { CommandPalette } from "@/components/app/command-palette";
import { ThemeSwitch } from "@/components/commerce/theme-switch";
import type { NavItem, QuickAction } from "@/lib/nav";
import type { SearchHit } from "@/lib/domain/search";
import { cn, initials } from "@/lib/utils";

type Leaf = { href: string; label: string };
type Group = { id: string; label: string; icon: LucideIcon; items: Leaf[] };

/** Só rotas que existem no painel. A ordem segue o mapa em COMMERCE_NAVIGATION_MAP.md. */
const HOME: Leaf = { href: "/merchant", label: "Início" };
const GROUPS: Group[] = [
  { id: "vendas", label: "Vendas", icon: ShoppingBag, items: [{ href: "/merchant/orders", label: "Pedidos" }, { href: "/merchant/customers", label: "Clientes" }, { href: "/merchant/after-sales", label: "Pós-venda" }] },
  { id: "catalogo", label: "Catálogo", icon: Package, items: [{ href: "/merchant/catalogo", label: "Produtos" }, { href: "/merchant/catalogo/categorias", label: "Categorias" }] },
  { id: "marketing", label: "Marketing", icon: Megaphone, items: [{ href: "/merchant/campanhas", label: "Campanhas" }, { href: "/merchant/descontos", label: "Cupons" }, { href: "/merchant/avaliacoes", label: "Avaliações" }] },
  { id: "loja", label: "Loja virtual", icon: Store, items: [{ href: "/merchant/storefront", label: "Visão da loja" }, { href: "/theme-editor", label: "Aparência" }, { href: "/merchant/templates", label: "Temas" }] },
  { id: "gestao", label: "Gestão", icon: BarChart3, items: [{ href: "/merchant/analytics", label: "Análise" }, { href: "/merchant/finance", label: "Financeiro" }] },
  { id: "config", label: "Configurações", icon: Settings, items: [{ href: "/merchant/settings", label: "Empresa e loja" }, { href: "/merchant/team", label: "Equipe" }, { href: "/merchant/finance#assinatura", label: "Minha assinatura" }, { href: "/merchant/auditoria", label: "Registro de ações" }] },
];

const STAFF_PREFIXES = ["/merchant/orders", "/merchant/customers", "/merchant/after-sales", "/merchant/catalogo"];
const MOBILE: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/merchant", label: "Início", icon: Home },
  { href: "/merchant/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/merchant/catalogo", label: "Produtos", icon: Package },
  { href: "/merchant/finance", label: "Financeiro", icon: Wallet },
];
const QUICK: QuickAction[] = [{ label: "Novo produto", href: "/merchant/catalogo/new", icon: "Plus" }, { label: "Novo pedido", href: "/merchant/orders/new", icon: "Plus" }];

const pathOf = (href: string) => href.split("#")[0]!;

/** O item ativo é o de caminho mais longo que casa com a rota atual; links com âncora nunca ficam "ativos". */
function activeHref(pathname: string, leaves: Leaf[]) {
  let best = "";
  for (const l of leaves) {
    if (l.href.includes("#")) continue;
    const base = pathOf(l.href);
    const hit = l.href === "/merchant" ? pathname === base : pathname === base || pathname.startsWith(base + "/");
    if (hit && base.length > best.length) best = l.href;
  }
  return best;
}

function visibleGroups(staff: boolean) {
  if (!staff) return GROUPS;
  return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => STAFF_PREFIXES.some((p) => i.href.startsWith(p))) })).filter((g) => g.items.length);
}

function Navigation({ pathname, staff, onNavigate }: { pathname: string; staff: boolean; onNavigate?: () => void }) {
  const groups = visibleGroups(staff);
  const current = activeHref(pathname, [HOME, ...groups.flatMap((g) => g.items)]);
  const activeGroup = groups.find((g) => g.items.some((i) => i.href === current))?.id;
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const isOpen = (id: string) => open[id] ?? id === activeGroup;
  return <nav aria-label="Menu da loja" className="space-y-1 px-3 pb-6">
    <Link href={HOME.href} onClick={onNavigate} aria-current={current === HOME.href ? "page" : undefined} className="cm-nav-item font-medium">
      <Home className="size-[18px]" aria-hidden /><span>{HOME.label}</span>
    </Link>
    {groups.map((g) => {
      const Icon = g.icon;
      const expanded = isOpen(g.id);
      const hasActive = g.id === activeGroup;
      return <div key={g.id}>
        <button type="button" className="cm-nav-group" data-has-active={hasActive} aria-expanded={expanded} aria-controls={`sub-${g.id}`}
          onClick={() => setOpen((o) => ({ ...o, [g.id]: !expanded }))}>
          <Icon className="size-[18px]" aria-hidden /><span className="flex-1 text-left">{g.label}</span>
          <ChevronDown className={cn("size-4 transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
        </button>
        <div id={`sub-${g.id}`} className="cm-nav-sub" data-open={expanded} inert={!expanded}>
          <div><ul className="ml-[22px] space-y-0.5 border-l border-[var(--glass-line)] py-1 pl-3">
            {g.items.map((i) => <li key={i.href}>
              <Link href={i.href} onClick={onNavigate} aria-current={current === i.href ? "page" : undefined} className="cm-nav-item min-h-10">{i.label}</Link>
            </li>)}
          </ul></div>
        </div>
      </div>;
    })}
  </nav>;
}

function Identity({ storeName }: { storeName: string }) {
  return <div className="px-6 pb-5 pt-6">
    <span className="cm-brand-plate"><Image src="/brand/nextlevel-logo.webp" width={640} height={174} alt="NextLevel" className="h-6 w-auto" /></span>
    <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--product-accent-text)]">Commerce</div>
    <div className="mt-2 truncate text-lg font-semibold tracking-[-.02em]">{storeName}</div>
    <div className="mt-0.5 text-xs text-muted-foreground">Painel da loja</div>
  </div>;
}

function crumbOf(pathname: string, staff: boolean) {
  if (pathname === "/merchant") return ["Início"];
  const groups = visibleGroups(staff);
  const current = activeHref(pathname, groups.flatMap((g) => g.items));
  const g = groups.find((x) => x.items.some((i) => i.href === current));
  const leaf = g?.items.find((i) => i.href === current);
  return g && leaf ? [g.label, leaf.label] : ["Painel da loja"];
}

export function CommerceMerchantShell({
  children, storeName, userName, storefrontHref, staff, onLogout, assisted = false, onReturnToMaster, search,
}: {
  children: React.ReactNode;
  storeName: string;
  userName: string;
  storefrontHref?: string;
  staff: boolean;
  onLogout?: () => Promise<void>;
  assisted?: boolean;
  onReturnToMaster?: () => Promise<void>;
  search?: (q: string) => Promise<SearchHit[]>;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = React.useState(false);
  const [palette, setPalette] = React.useState(false);
  const crumbs = crumbOf(pathname, staff);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteItems: NavItem[] = React.useMemo(() => [
    { label: HOME.label, href: HOME.href, icon: "Home" as const },
    ...visibleGroups(staff).flatMap((g) => g.items.filter((i) => !i.href.includes("#")).map((i) => ({ label: i.label, href: i.href, icon: "LayoutDashboard" as const }))),
  ], [staff]);

  const profile = <div className="flex items-center gap-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{initials(userName)}</span>
    <div className="min-w-0"><div className="truncate text-sm font-medium">{userName}</div><div className="text-xs text-muted-foreground">{staff ? "Equipe da loja" : "Administrador da loja"}</div></div>
  </div>;

  return <div data-product="commerce" className="cm-app cm-theme-anim">
    <div className="cm-ambient" aria-hidden />
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm">Pular para o conteúdo</a>

    <aside className="cm-sidebar fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:flex lg:flex-col">
      <Identity storeName={storeName} />
      <div className="min-h-0 flex-1 overflow-y-auto"><Navigation pathname={pathname} staff={staff} /></div>
      <div className="space-y-3 border-t border-[var(--glass-line)] px-5 py-4">
        {storefrontHref ? <a href={storefrontHref} target="_blank" rel="noreferrer" className="cm-glass-fn flex min-h-10 items-center justify-center gap-2 text-sm font-medium text-[var(--product-accent-text)]"><ExternalLink className="size-4" aria-hidden /> Ver loja</a> : null}
        {profile}
      </div>
    </aside>

    <div className="lg:pl-[248px]">
      {assisted ? <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border bg-accent-soft px-4 text-xs text-[var(--product-accent-text)] md:px-7"><span>Modo suporte · você está vendo a loja como o lojista.</span><form action={onReturnToMaster}><button className="font-semibold underline underline-offset-4">Voltar ao Commerce</button></form></div> : null}
      <header className="cm-header sticky top-0 z-20 flex h-16 items-center gap-2 px-4 md:px-8">
        <button type="button" onClick={() => setDrawer(true)} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground lg:hidden" aria-label="Abrir menu"><Menu className="size-5" aria-hidden /></button>
        <nav aria-label="Você está em" className="min-w-0 flex-1">
          <ol className="flex items-center gap-1.5 truncate text-sm">
            {crumbs.map((c, i) => <li key={c} className={cn("truncate", i === crumbs.length - 1 ? "font-semibold" : "hidden text-muted-foreground sm:block")} aria-current={i === crumbs.length - 1 ? "page" : undefined}>{i > 0 ? <span aria-hidden className="mr-1.5 hidden text-muted-foreground sm:inline">/</span> : null}{c}</li>)}
          </ol>
        </nav>
        {search ? <button type="button" onClick={() => setPalette(true)} className="cm-glass-fn hidden h-10 w-64 items-center gap-2 px-3 text-sm text-muted-foreground hover:text-foreground md:flex" style={{ borderRadius: 14 }} aria-label="Buscar pedidos, produtos e clientes">
          <Search className="size-4" aria-hidden /><span className="flex-1 text-left">Buscar…</span><kbd className="rounded border border-border px-1.5 text-[10px]">Ctrl K</kbd>
        </button> : null}
        {search ? <button type="button" onClick={() => setPalette(true)} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground md:hidden" aria-label="Buscar"><Search className="size-5" aria-hidden /></button> : null}
        <ThemeSwitch className="hidden sm:inline-flex" />
        <button type="button" onClick={() => onLogout?.()} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground" aria-label="Sair"><LogOut className="size-[18px]" aria-hidden /></button>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">{children}</main>
    </div>

    <DialogPrimitive.Root open={drawer} onOpenChange={setDrawer}>
      <DialogPrimitive.Portal>
        <div data-product="commerce" className="cm-app-portal contents">
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(8,19,41,.55)] lg:hidden" />
          <DialogPrimitive.Content aria-describedby={undefined} className="cm-sidebar fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] flex-col bg-sidebar focus:outline-none lg:hidden" style={{ background: "var(--sidebar-bg)", color: "var(--foreground)" }}>
            <div className="flex items-start justify-between pr-3"><Identity storeName={storeName} />
              <DialogPrimitive.Close className="mt-4 flex size-11 items-center justify-center rounded-xl text-muted-foreground" aria-label="Fechar menu"><X className="size-5" aria-hidden /></DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Title className="sr-only">Menu da loja</DialogPrimitive.Title>
            <div className="min-h-0 flex-1 overflow-y-auto"><Navigation pathname={pathname} staff={staff} onNavigate={() => setDrawer(false)} /></div>
            <div className="space-y-3 border-t border-[var(--glass-line)] px-5 py-4">
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Tema</span><ThemeSwitch /></div>
              {storefrontHref ? <a href={storefrontHref} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--glass-line)] text-sm font-medium text-[var(--product-accent-text)]"><ExternalLink className="size-4" aria-hidden /> Ver loja</a> : null}
              {profile}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>

    {search ? <CommandPalette open={palette} onOpenChange={setPalette} items={paletteItems} quick={QUICK} search={search} /> : null}

    <nav aria-label="Atalhos" className="cm-sidebar fixed inset-x-0 bottom-0 z-30 border-t border-[var(--glass-line)] pb-[max(.3rem,env(safe-area-inset-bottom))] lg:hidden" style={{ borderRight: 0 }}>
      <div className="grid grid-cols-5">{MOBILE.map((item) => {
        const Icon = item.icon;
        const on = item.href === "/merchant" ? pathname === "/merchant" : pathname === item.href || pathname.startsWith(item.href + "/");
        return <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={cn("relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px]", on ? "font-semibold text-[var(--product-accent-text)]" : "text-muted-foreground")}>
          {on ? <span className="absolute top-0 h-[3px] w-8 rounded-b bg-[var(--product-accent)]" /> : null}<Icon className="size-5" aria-hidden /><span>{item.label}</span>
        </Link>;
      })}<button type="button" onClick={() => setDrawer(true)} className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"><Menu className="size-5" aria-hidden /><span>Mais</span></button></div>
    </nav>
  </div>;
}
