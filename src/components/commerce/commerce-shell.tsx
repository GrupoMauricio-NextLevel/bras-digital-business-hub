"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, CreditCard, Inbox, LayoutGrid,
  Menu, Package, Settings, ShoppingBag, Store, X,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ThemeSwitch } from "@/components/commerce/theme-switch";
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

function CommerceNavigation({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  return (
    <nav aria-label="Menu do console Commerce" className="px-3 pb-6">
      {GROUPS.map((group) => (
        <div key={group} className="mb-5">
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group}</div>
          <ul className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((item) => {
              const Icon = item.icon;
              const on = isActive(pathname, item.href, "exact" in item && item.exact);
              return <li key={item.href}><Link href={item.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className="cm-nav-item"><Icon className="size-[18px]" aria-hidden /><span className="flex-1">{item.label}</span></Link></li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Identity() {
  return <div className="px-6 pb-4 pt-6">
    <Link href="/master" className="mb-5 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" aria-hidden /> Voltar ao Master</Link>
    <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-[var(--product-accent-text)]">NextLevel</div>
    <div className="mt-1 text-2xl font-semibold tracking-[-.03em]">Commerce</div>
    <div className="mt-0.5 text-xs text-muted-foreground">Console administrativo das lojas</div>
  </div>;
}

export function CommerceShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const active = (href: string, exact?: boolean) => isActive(pathname, href, exact);
  const current = NAV.find((n) => active(n.href, "exact" in n && n.exact));

  return (
    <div data-product="commerce" className="cm-app cm-theme-anim">
      <div className="cm-ambient" aria-hidden />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm">Pular para o conteúdo</a>
      <aside className="cm-sidebar fixed inset-y-0 left-0 z-30 hidden w-[252px] lg:flex lg:flex-col">
        <Identity />
        <div className="min-h-0 flex-1 overflow-y-auto"><CommerceNavigation pathname={pathname} onNavigate={() => setOpen(false)} /></div>
        <div className="border-t border-[var(--glass-line)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{initials(userName)}</span>
            <div className="min-w-0"><div className="truncate text-sm font-medium">{userName}</div><div className="text-xs text-muted-foreground">Acesso Master</div></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="cm-header sticky top-0 z-20 flex h-16 items-center gap-2 px-4 md:px-8">
          <button type="button" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir navegação"><Menu className="size-5" aria-hidden /></button>
          <div className="min-w-0 flex-1 truncate text-sm"><span className="text-muted-foreground">Console Commerce</span>{current ? <><span aria-hidden className="mx-1.5 text-muted-foreground">/</span><span className="font-semibold">{current.label}</span></> : null}</div>
          <ThemeSwitch className="hidden sm:inline-flex" />
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-[1480px] px-4 pb-28 pt-6 md:px-8 md:pt-8 lg:pb-12">{children}</main>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <div data-product="commerce" className="contents">
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(8,19,41,.55)] lg:hidden" />
            <DialogPrimitive.Content aria-describedby={undefined} className="cm-sidebar fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[340px] flex-col focus:outline-none lg:hidden" style={{ background: "var(--sidebar-bg)", color: "var(--foreground)" }}>
              <DialogPrimitive.Title className="sr-only">Navegação do console Commerce</DialogPrimitive.Title>
              <div className="flex items-start justify-between pr-3"><Identity /><DialogPrimitive.Close className="mt-4 flex size-11 items-center justify-center rounded-xl text-muted-foreground" aria-label="Fechar navegação"><X className="size-5" aria-hidden /></DialogPrimitive.Close></div>
              <div className="min-h-0 flex-1 overflow-y-auto"><CommerceNavigation pathname={pathname} onNavigate={() => setOpen(false)} /></div>
              <div className="flex items-center justify-between border-t border-[var(--glass-line)] px-5 py-4"><span className="text-xs text-muted-foreground">Tema</span><ThemeSwitch /></div>
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <nav aria-label="Atalhos" className="cm-sidebar fixed inset-x-0 bottom-0 z-30 border-t border-[var(--glass-line)] pb-[max(.3rem,env(safe-area-inset-bottom))] lg:hidden" style={{ borderRight: 0 }}>
        <div className="grid grid-cols-5">
          {MOBILE.map((item) => {
            const Icon = item.icon; const on = active(item.href, "exact" in item && item.exact);
            return <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={cn("relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px]", on ? "font-semibold text-[var(--product-accent-text)]" : "text-muted-foreground")}>{on ? <span className="absolute top-0 h-[3px] w-8 rounded-b bg-[var(--product-accent)]" /> : null}<Icon className="size-5" aria-hidden /><span className="max-w-[68px] truncate">{item.label}</span></Link>;
          })}
          <button type="button" onClick={() => setOpen(true)} className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"><Menu className="size-5" aria-hidden /><span>Mais</span></button>
        </div>
      </nav>
    </div>
  );
}
