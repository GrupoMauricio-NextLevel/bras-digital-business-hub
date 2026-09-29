"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, KeyRound, ExternalLink, ChevronDown, Repeat, LayoutDashboard, Factory, Network, Store, Package, ShoppingCart, LayoutTemplate, Sparkles, CreditCard, Settings, Boxes, Users, Truck, Wallet, Image, Home, Palette, Globe, type LucideIcon } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { NavItem, NavIcon } from "@/lib/nav";

const ICONS: Record<NavIcon, LucideIcon> = { LayoutDashboard, Factory, Network, Store, Package, ShoppingCart, LayoutTemplate, Sparkles, CreditCard, Settings, Boxes, Users, Truck, Wallet, Image, Home, Palette, Globe };
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type DemoUser = { id: string; name: string; email: string; role: string };

export type AppShellProps = {
  items: NavItem[];
  roleLabel: string;
  tenantName: string;
  tenantSub?: string;
  userName: string;
  storefrontHref?: string;
  demoUsers?: DemoUser[];
  onSwitch?: (email: string) => Promise<void>;
  onLogout?: () => Promise<void>;
  passwordHref?: string;
  children: React.ReactNode;
};

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:bg-surface hover:text-foreground")}>
            <Icon className={cn("size-4", active ? "text-foreground" : "text-subtle-foreground")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const ROLE_LABEL: Record<string, string> = { NEXTLEVEL_MASTER: "NextLevel Master", SUPPLIER_ADMIN: "Fornecedor", STORE_OWNER: "Lojista" };

export function AppShell({ items, roleLabel, tenantName, tenantSub, userName, storefrontHref, demoUsers, onSwitch, onLogout, passwordHref, children }: AppShellProps) {
  const [open, setOpen] = React.useState(false);

  const brand = (
    <div className="flex items-center gap-2.5 px-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">NL</div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold leading-tight">{tenantName}</div>
        <div className="truncate text-xs text-muted-foreground">{tenantSub ?? roleLabel}</div>
      </div>
    </div>
  );

  const sidebarBody = (onNavigate?: () => void) => (
    <>
      <NavLinks items={items} onNavigate={onNavigate} />
      {storefrontHref ? (
        <a href={storefrontHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground">
          <ExternalLink className="size-4" /> Ver loja virtual
        </a>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface-muted/60 lg:flex">
        <div className="flex h-14 items-center border-b border-border/70">{brand}</div>
        <div className="nl-scroll flex-1 overflow-y-auto p-3">{sidebarBody()}</div>
        <div className="border-t border-border/70 p-3 text-[11px] text-subtle-foreground">NextLevel Commerce Engine · MVP</div>
      </aside>

      {/* Drawer mobile */}
      <Drawer open={open} onOpenChange={setOpen} title={tenantName} description={roleLabel} side="left" className="max-w-xs">
        {sidebarBody(() => setOpen(false))}
      </Drawer>

      <div className="lg:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <div className="min-w-0 flex-1 lg:hidden">
            <div className="truncate text-sm font-semibold">{tenantName}</div>
          </div>
          <div className="hidden flex-1 lg:block" />
          {demoUsers && onSwitch ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Repeat className="size-3.5" />
                  <span className="hidden sm:inline">Demo:</span> {roleLabel}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Alternar perfil de demonstração</DropdownMenuLabel>
                {demoUsers.map((u) => (
                  <DropdownMenuItem key={u.id} onSelect={() => onSwitch(u.email)}>
                    <span className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold">{initials(u.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{u.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{ROLE_LABEL[u.role]}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-surface p-0.5 pr-2 text-sm hover:bg-surface-hover">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{initials(userName)}</span>
                <span className="hidden max-w-[120px] truncate sm:inline">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <div className="px-2.5 pb-1.5"><Badge tone="outline">{roleLabel}</Badge></div>
              <DropdownMenuSeparator />
              {passwordHref ? <DropdownMenuItem asChild><Link href={passwordHref}><KeyRound /> Alterar senha</Link></DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => onLogout?.()}>
                <LogOut /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
