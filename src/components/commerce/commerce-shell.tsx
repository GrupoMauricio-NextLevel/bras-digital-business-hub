"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, BarChart3, ChevronRight, CreditCard, Globe2, Inbox, LayoutGrid,
  Menu, Package, ReceiptText, Settings, ShoppingBag, Store, Users, X,
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

export function CommerceShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const active = (href: string, exact?: boolean) => exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const groups = [...new Set(NAV.map((n) => n.group))];

  const Navigation = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={mobile ? "px-5 pb-8" : "px-5"}>
      {groups.map((group) => (
        <div key={group} className="mb-7">
          <div className="mb-2 px-2 text-[10px] font-semibold tracking-[0.22em] text-zinc-500">{group}</div>
          <div className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((item) => {
              const Icon = item.icon;
              const on = active(item.href, "exact" in item && item.exact);
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={cn("group flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
                    on ? "border-cyan-400 bg-cyan-400/[0.07] text-zinc-50" : "border-transparent text-zinc-400 hover:text-zinc-100")}>
                  <Icon className={cn("size-[18px]", on ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400")} />
                  <span className="flex-1">{item.label}</span>
                  {on ? <ChevronRight className="size-3.5 text-cyan-500" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div data-product="commerce" className="min-h-dvh bg-[#08090b] text-zinc-100 [--product-accent:#22d3ee] [--product-accent-soft:#083344]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-white/10 bg-[#0b0c0f] lg:flex lg:flex-col">
        <div className="px-7 pb-8 pt-7">
          <Link href="/master" className="mb-8 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-zinc-500 hover:text-zinc-200">
            <ArrowLeft className="size-3.5" /> CONTROL CENTER
          </Link>
          <div className="border-l-2 border-cyan-400 pl-4">
            <div className="text-[10px] font-semibold tracking-[0.28em] text-cyan-400">NEXTLEVEL</div>
            <div className="mt-1 text-[25px] font-semibold tracking-[-0.04em]">Commerce</div>
            <div className="mt-1 text-xs text-zinc-500">Store Operating System</div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto"><Navigation /></div>
        <div className="border-t border-white/10 px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-900">{initials(userName)}</span>
            <div className="min-w-0"><div className="truncate text-xs font-medium">{userName}</div><div className="text-[10px] text-zinc-600">Acesso Master</div></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center border-b border-white/10 bg-[#08090b]/95 px-4 backdrop-blur md:px-7">
          <button className="mr-3 p-2 text-zinc-400 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir navegação"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1 lg:hidden">
            <div className="text-[9px] font-semibold tracking-[0.24em] text-cyan-400">NEXTLEVEL</div>
            <div className="truncate text-sm font-semibold">Commerce</div>
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <span className="size-1.5 bg-cyan-400" />
            <span className="text-xs tracking-[0.12em] text-zinc-500">COMMERCE CONSOLE</span>
          </div>
          <Link href="/master" className="mr-1 hidden items-center gap-2 border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:border-cyan-400/40 hover:text-zinc-100 sm:flex"><ArrowLeft className="size-3.5" /> Master</Link>
          <ThemeToggle />
          <span className="ml-2 flex size-8 items-center justify-center rounded-full bg-cyan-50 text-[10px] font-bold text-zinc-900">{initials(userName)}</span>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-5 pb-28 pt-8 md:px-9 md:pt-10 lg:pb-12">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Fechar navegação" />
          <aside className="absolute inset-y-0 left-0 w-[86%] max-w-[340px] overflow-y-auto border-r border-white/10 bg-[#0b0c0f]">
            <div className="flex items-start justify-between px-7 pb-8 pt-7">
              <div className="border-l-2 border-cyan-400 pl-4"><div className="text-[10px] tracking-[0.24em] text-cyan-400">NEXTLEVEL</div><div className="text-2xl font-semibold">Commerce</div><div className="text-xs text-zinc-500">Store Operating System</div></div>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-500"><X className="size-5" /></button>
            </div>
            <Link href="/master" onClick={() => setOpen(false)} className="mx-7 mb-8 flex items-center gap-2 border-y border-white/10 py-3 text-xs text-zinc-400"><ArrowLeft className="size-4" /> Voltar ao NextLevel Master</Link>
            <Navigation mobile />
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0c0f]/98 pb-[max(.3rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="grid grid-cols-5">
          {MOBILE.map((item) => {
            const Icon=item.icon; const on=active(item.href, "exact" in item && item.exact);
            return <Link key={item.href} href={item.href} className={cn("relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px]",on?"text-zinc-100":"text-zinc-500")}>{on?<span className="absolute top-0 h-[2px] w-8 bg-cyan-400"/>:null}<Icon className={cn("size-[19px]",on&&"text-cyan-400")}/><span className="max-w-[68px] truncate">{item.label}</span></Link>
          })}
          <button onClick={() => setOpen(true)} className="flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px] text-zinc-500"><Menu className="size-[19px]"/><span>Mais</span></button>
        </div>
      </nav>
    </div>
  );
}
