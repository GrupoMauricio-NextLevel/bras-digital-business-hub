"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, ChevronRight, CircleUserRound, CreditCard, ExternalLink, Globe2, Home, LogOut,
  Menu, Package, Palette, ReceiptText, Settings, ShoppingBag, Store, Tag, Users, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/merchant", label: "Início", icon: Home, exact: true, group: "MINHA LOJA" },
  { href: "/merchant/orders", label: "Vendas", icon: ShoppingBag, group: "VENDAS" },
  { href: "/merchant/analytics", label: "Análise", icon: BarChart3, group: "VENDAS" },
  { href: "/merchant/customers", label: "Clientes", icon: Users, group: "VENDAS" },
  { href: "/merchant/after-sales", label: "Pós-venda", icon: ReceiptText, group: "VENDAS" },
  { href: "/merchant/catalogo", label: "Produtos", icon: Package, group: "CATÁLOGO" },
  { href: "/merchant/catalogo/categorias", label: "Categorias", icon: Tag, group: "CATÁLOGO" },
  { href: "/merchant/storefront", label: "Loja virtual", icon: Globe2, group: "LOJA ONLINE" },
  { href: "/theme-editor", label: "Aparência", icon: Palette, group: "LOJA ONLINE" },
  { href: "/merchant/templates", label: "Temas", icon: Store, group: "LOJA ONLINE" },
  { href: "/merchant/campanhas", label: "Campanhas", icon: Tag, group: "CRESCIMENTO" },
  { href: "/merchant/descontos", label: "Cupons", icon: Tag, group: "CRESCIMENTO" },
  { href: "/merchant/avaliacoes", label: "Avaliações", icon: CircleUserRound, group: "CRESCIMENTO" },
  { href: "/merchant/finance", label: "Financeiro", icon: ReceiptText, group: "GESTÃO" },
  { href: "/merchant/finance#assinatura", label: "Minha assinatura", icon: CreditCard, group: "GESTÃO" },
  { href: "/merchant/team", label: "Equipe", icon: Users, group: "GESTÃO" },
  { href: "/merchant/settings", label: "Configurações", icon: Settings, group: "GESTÃO" },
] as const;

const STAFF_PREFIXES = ["/merchant/orders", "/merchant/customers", "/merchant/after-sales", "/merchant/catalogo"];
const MOBILE = NAV.filter((item) => ["/merchant", "/merchant/orders", "/merchant/catalogo", "/merchant/storefront"].includes(item.href));
const GROUPS = [...new Set(NAV.map((item) => item.group))];

function active(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function Navigation({ pathname, staff, onNavigate }: { pathname: string; staff: boolean; onNavigate?: () => void }) {
  const items = staff ? NAV.filter((item) => STAFF_PREFIXES.some((prefix) => item.href.startsWith(prefix))) : NAV;
  return <nav className="px-5 pb-8">
    {GROUPS.map((group) => {
      const grouped = items.filter((item) => item.group === group);
      if (!grouped.length) return null;
      return <div key={group} className="mb-7">
        <div className="mb-2 px-2 text-[9px] font-semibold tracking-[.24em] text-muted-foreground">{group}</div>
        <div className="space-y-0.5">{grouped.map((item) => {
          const Icon = item.icon;
          const on = active(pathname, item.href, "exact" in item && item.exact);
          return <Link key={item.href} href={item.href} onClick={onNavigate}
            className={cn("relative flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
              on ? "border-[var(--product-accent)] bg-sidebar-active font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <Icon className={cn("size-[18px]", on ? "text-[var(--product-accent-text)]" : "text-muted-foreground")} />
            <span className="flex-1">{item.label}</span>
            {on ? <ChevronRight className="size-3.5 text-[var(--product-accent-text)]" /> : null}
          </Link>;
        })}</div>
      </div>;
    })}
  </nav>;
}

export function CommerceMerchantShell({
  children, storeName, userName, storefrontHref, staff, onLogout, assisted = false, onReturnToMaster,
}: {
  children: React.ReactNode;
  storeName: string;
  userName: string;
  storefrontHref?: string;
  staff: boolean;
  onLogout?: () => Promise<void>;
  assisted?: boolean;
  onReturnToMaster?: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  return <div data-product="commerce" className="min-h-dvh bg-background text-foreground ">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="px-7 pb-8 pt-7">
        <div className="text-[9px] font-semibold tracking-[.28em] text-[var(--product-accent-text)]">NEXTLEVEL COMMERCE</div>
        <div className="mt-2 truncate text-xl font-semibold tracking-[-.035em]">{storeName}</div>
        <div className="mt-1 text-xs text-muted-foreground">Painel da loja</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto"><Navigation pathname={pathname} staff={staff} /></div>
      <div className="border-t border-border px-7 py-5">
        <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials(userName)}</span><div className="min-w-0"><div className="truncate text-xs font-medium">{userName}</div><div className="text-[10px] text-muted-foreground">{staff ? "Equipe da loja" : "Administrador da loja"}</div></div></div>
      </div>
    </aside>

    <div className="lg:pl-[248px]">
      {assisted ? <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border bg-accent-soft px-4 text-xs text-[var(--product-accent-text)] md:px-7"><span>Modo suporte · você está vendo a loja como o lojista.</span><form action={onReturnToMaster}><button className="font-semibold underline underline-offset-4">Voltar ao Commerce</button></form></div> : null}
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-7">
        <button onClick={() => setOpen(true)} className="mr-3 p-2 text-muted-foreground lg:hidden" aria-label="Abrir menu"><Menu className="size-5"/></button>
        <div className="min-w-0 flex-1"><div className="text-[9px] font-semibold tracking-[.22em] text-[var(--product-accent-text)]">COMMERCE</div><div className="truncate text-sm font-medium">{storeName}</div></div>
        {storefrontHref ? <a href={storefrontHref} target="_blank" rel="noreferrer" className="mr-2 hidden items-center gap-2 border border-border bg-sidebar px-3 py-2 text-xs text-muted-foreground hover:text-foreground sm:flex"><ExternalLink className="size-3.5"/> Ver loja</a> : null}
        <ThemeToggle/>
        <button onClick={() => onLogout?.()} className="ml-2 flex size-9 items-center justify-center border border-border bg-sidebar text-muted-foreground hover:text-foreground" aria-label="Sair"><LogOut className="size-4"/></button>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-[1480px] px-5 pb-28 pt-8 md:px-9 md:pt-10 lg:pb-12">{children}</main>
    </div>

    {open ? <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fechar menu"/>
      <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] overflow-y-auto bg-sidebar">
        <div className="flex items-start justify-between px-7 pb-8 pt-7"><div><div className="text-[9px] tracking-[.25em] text-[var(--product-accent-text)]">NEXTLEVEL COMMERCE</div><div className="mt-2 text-xl font-semibold">{storeName}</div></div><button onClick={() => setOpen(false)} className="p-2 text-muted-foreground"><X className="size-5"/></button></div>
        <Navigation pathname={pathname} staff={staff} onNavigate={() => setOpen(false)}/>
      </aside>
    </div> : null}

    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/98 pb-[max(.3rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="grid grid-cols-5">{MOBILE.map((item) => { const Icon=item.icon; const on=active(pathname,item.href,"exact" in item&&item.exact); return <Link key={item.href} href={item.href} className={cn("relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px]",on?"text-foreground":"text-muted-foreground")}>{on?<span className="absolute top-0 h-[2px] w-8 bg-[var(--product-accent)]"/>:null}<Icon className={cn("size-[19px]",on&&"text-[var(--product-accent-text)]")}/><span>{item.label}</span></Link>})}<button onClick={() => setOpen(true)} className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px] text-muted-foreground"><Menu className="size-[19px]"/><span>Mais</span></button></div>
    </nav>
  </div>;
}
