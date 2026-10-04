"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, ChevronRight, CreditCard, Inbox, LayoutGrid,
  Menu, Package, Settings, ShoppingBag, Store, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/commerce", label: "Visão geral", icon: LayoutGrid, exact: true, group: "PLATAFORMA" },
  { href: "/commerce/stores", label: "Lojas", icon: Store, group: "OPERAÇÃO" },
  { href: "/commerce/orders", label: "Vendas", icon: ShoppingBag, group: "OPERAÇÃO" },
  { href: "/commerce/catalog", label: "Catálogo das lojas", icon: Package, group: "OPERAÇÃO" },
  { href: "/commerce/leads", label: "Interessados", icon: Inbox, group: "CRESCIMENTO" },
  { href: "/commerce/plans", label: "Assinaturas", icon: CreditCard, group: "NEGÓCIO" },
  { href: "/commerce/settings", label: "Plataforma", icon: Settings, group: "SISTEMA" },
] as const;

const MOBILE = NAV.slice(0, 4);
const GROUPS = [...new Set(NAV.map((n) => n.group))];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function CommerceNavigation({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className={mobile ? "px-5 pb-8" : "px-5"}>
      {GROUPS.map((group) => (
        <div key={group} className="mb-7">
          <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">{group}</div>
          <div className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((item) => {
              const Icon = item.icon;
              const on = isActive(pathname, item.href, "exact" in item && item.exact);
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate}
                  className={cn("group flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
                    on ? "border-[var(--product-accent)] bg-sidebar-active text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  <Icon className={cn("size-[18px]", on ? "text-[var(--product-accent-text)]" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="flex-1">{item.label}</span>
                  {on ? <ChevronRight className="size-3.5 text-[var(--product-accent-text)]" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommerceShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const active = (href: string, exact?: boolean) => isActive(pathname, href, exact);

  return (
    <div data-product="commerce" className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-border bg-sidebar lg:flex lg:flex-col">
        <div className="px-7 pb-8 pt-7">
          <Link href="/master" className="mb-8 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> CONTROL CENTER
          </Link>
          <div className="border-l-2 border-[var(--product-accent)] pl-4">
            <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--product-accent-text)]">NEXTLEVEL</div>
            <div className="mt-1 text-[25px] font-semibold tracking-[-0.04em]">Commerce</div>
            <div className="mt-1 text-xs text-muted-foreground">Store Operating System</div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto"><CommerceNavigation pathname={pathname} onNavigate={() => setOpen(false)} /></div>
        <div className="border-t border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials(userName)}</span>
            <div className="min-w-0"><div className="truncate text-xs font-medium">{userName}</div><div className="text-[10px] text-muted-foreground">Acesso Master</div></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-border bg-background/95 px-4 backdrop-blur md:px-7">
          <button className="mr-3 p-2 text-muted-foreground lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir navegação"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1 lg:hidden">
            <div className="text-[9px] font-semibold tracking-[0.24em] text-[var(--product-accent-text)]">NEXTLEVEL</div>
            <div className="truncate text-sm font-semibold">Commerce</div>
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <span className="size-1.5 bg-primary" />
            <span className="text-xs tracking-[0.12em] text-muted-foreground">COMMERCE CONSOLE</span>
          </div>
          <Link href="/master" className="mr-1 hidden items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground hover:border-[var(--product-accent)] hover:text-foreground sm:flex"><ArrowLeft className="size-3.5" /> Master</Link>
          <ThemeToggle />
          <span className="ml-2 flex size-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initials(userName)}</span>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-5 pb-28 pt-8 md:px-9 md:pt-10 lg:pb-12">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-label="Fechar navegação" />
          <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] overflow-y-auto border-r border-border bg-sidebar">
            <div className="flex items-start justify-between px-7 pb-8 pt-7">
              <div className="border-l-2 border-[var(--product-accent)] pl-4"><div className="text-[10px] tracking-[0.24em] text-[var(--product-accent-text)]">NEXTLEVEL</div><div className="text-2xl font-semibold">Commerce</div><div className="text-xs text-muted-foreground">Store Operating System</div></div>
              <button onClick={() => setOpen(false)} className="p-2 text-muted-foreground"><X className="size-5" /></button>
            </div>
            <Link href="/master" onClick={() => setOpen(false)} className="mx-7 mb-8 flex items-center gap-2 border-y border-border py-3 text-xs text-muted-foreground"><ArrowLeft className="size-4" /> Voltar ao NextLevel Master</Link>
            <CommerceNavigation pathname={pathname} mobile onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar/98 pb-[max(.3rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE.map((item) => {
            const Icon=item.icon; const on=active(item.href, "exact" in item && item.exact);
            return <Link key={item.href} href={item.href} className={cn("relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px]",on?"text-foreground":"text-muted-foreground")}>{on?<span className="absolute top-0 h-[2px] w-8 bg-primary"/>:null}<Icon className={cn("size-[19px]",on&&"text-[var(--product-accent-text)]")}/><span className="max-w-[68px] truncate">{item.label}</span></Link>
          })}
          <button onClick={() => setOpen(true)} className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px] text-muted-foreground"><Menu className="size-[19px]"/><span>Mais</span></button>
        </div>
      </nav>
    </div>
  );
}
