"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ExternalLink, ChevronDown, Repeat, KeyRound, Search, PanelLeftClose, PanelLeftOpen, MoreHorizontal, Lock, Sparkles } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { NavItem, Panel, QuickAction } from "@/lib/nav";
import type { SearchHit } from "@/lib/domain/search";
import { Drawer } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ICONS } from "./icons";
import { CommandPalette } from "./command-palette";
import { NotificationsMenu, type NoticeView } from "./notifications-menu";
import { ThemeToggle } from "./theme-toggle";

export type DemoUser = { id: string; name: string; email: string; role: string };

export type AppShellProps = {
  panel: Panel;
  /** "minimal" = expedição: sem menu lateral, topo simples. */
  variant?: "full" | "minimal";
  items: NavItem[];
  quick?: QuickAction[];
  roleLabel: string;
  tenantName: string;
  tenantSub?: string;
  userName: string;
  storefrontHref?: string;
  demoUsers?: DemoUser[];
  onSwitch?: (email: string) => Promise<void>;
  onLogout?: () => Promise<void>;
  passwordHref?: string;
  notices?: NoticeView[];
  search?: (q: string) => Promise<SearchHit[]>;
  banner?: React.ReactNode;
  children: React.ReactNode;
};

const ROLE_LABEL: Record<string, string> = { NEXTLEVEL_MASTER: "NextLevel Master", SUPPLIER_ADMIN: "Fornecedor", SUPPLIER_DISPATCH: "Expedição", STORE_OWNER: "Lojista" };

function NavLinks({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  return (
    <nav className="flex flex-col gap-1" aria-label="Menu principal">
      {pinned.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}
            className={cn("group mb-2 flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-sm font-semibold transition-colors", active ? "border-accent bg-accent text-primary-foreground" : "border-accent/40 bg-accent-soft text-accent-foreground hover:border-accent", collapsed && "justify-center px-0")}>
            <Icon className="size-4 shrink-0" />
            {collapsed ? null : <><span className="flex-1 truncate">{item.label}</span>{item.badge ? <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", active ? "bg-white/20" : "bg-accent text-primary-foreground")}>{item.badge}</span> : null}</>}
          </Link>
        );
      })}
      {rest.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined}
            className={cn("relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors", active ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-hover", collapsed && "justify-center px-0")}>
            {active ? <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" aria-hidden /> : null}
            <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-sidebar-muted")} />
            {collapsed ? null : <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && item.locked ? <Lock className="size-3.5 text-sidebar-muted" aria-label="Recurso bloqueado no seu plano" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ panel, variant = "full", items, quick = [], roleLabel, tenantName, tenantSub, userName, storefrontHref, demoUsers, onSwitch, onLogout, passwordHref, notices = [], search, banner, children }: AppShellProps) {
  const [open, setOpen] = React.useState(false);
  const [palette, setPalette] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const minimal = variant === "minimal";

  React.useEffect(() => { const id = requestAnimationFrame(() => { try { setCollapsed(localStorage.getItem("nl-sidebar") === "1"); } catch { /* ignore */ } }); return () => cancelAnimationFrame(id); }, []);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const toggleCollapsed = () => setCollapsed((c) => { const n = !c; try { localStorage.setItem("nl-sidebar", n ? "1" : "0"); } catch { /* ignore */ } return n; });

  const brand = (compact?: boolean) => (
    <div className={cn("flex items-center gap-2.5", compact ? "justify-center" : "px-3")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-xs font-extrabold tracking-tight text-primary-foreground">NL</div>
      {compact ? null : <div className="min-w-0"><div className="truncate text-sm font-semibold leading-tight text-sidebar-active-foreground">{tenantName}</div><div className="truncate text-xs text-sidebar-muted">{tenantSub ?? roleLabel}</div></div>}
    </div>
  );

  const bottomItems = items.filter((i) => !i.pinned).slice(0, 4);
  const pinnedItem = items.find((i) => i.pinned);

  return (
    <div data-panel={panel} className="min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Pular para o conteúdo</a>

      {!minimal ? (
        <aside className={cn("fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-[72px]" : "w-64")}>
          <div className="flex h-16 items-center border-b border-sidebar-border">{brand(collapsed)}</div>
          <div className="nl-scroll flex-1 overflow-y-auto p-3">
            <NavLinks items={items} collapsed={collapsed} />
            {storefrontHref && !collapsed ? (
              <a href={storefrontHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-sidebar-border px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"><ExternalLink className="size-4" /> Ver loja virtual</a>
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-sidebar-border p-3">
            {collapsed ? null : <span className="text-[11px] text-sidebar-muted">NextLevel Commerce Engine</span>}
            <button onClick={toggleCollapsed} className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground" aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button>
          </div>
        </aside>
      ) : null}

      {!minimal ? (
        <Drawer open={open} onOpenChange={setOpen} title={tenantName} description={roleLabel} side="left" className="max-w-xs">
          <NavLinks items={items} onNavigate={() => setOpen(false)} />
          {storefrontHref ? <a href={storefrontHref} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"><ExternalLink className="size-4" /> Ver loja virtual</a> : null}
        </Drawer>
      ) : null}

      <div className={cn(!minimal && "transition-[padding] duration-200", !minimal && (collapsed ? "lg:pl-[72px]" : "lg:pl-64"))}>
        <header className="nl-no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur sm:gap-3 sm:px-6">
          {!minimal ? <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></Button> : (
            <div className="flex items-center gap-2.5"><div className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-xs font-extrabold text-primary-foreground">NL</div><div className="min-w-0"><div className="truncate text-sm font-semibold leading-tight">{tenantName}</div><div className="truncate text-xs text-muted-foreground">{roleLabel}</div></div></div>
          )}
          {!minimal ? <div className="min-w-0 flex-1 truncate text-sm font-semibold lg:hidden">{tenantName}</div> : null}
          <div className="flex-1" />
          {!minimal ? (
            <button onClick={() => setPalette(true)} className="hidden h-9 w-72 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-muted px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground md:flex" aria-label="Buscar e navegar (Ctrl K)">
              <Search className="size-4" /><span className="flex-1 text-left">Buscar ou ir para…</span><kbd className="rounded border border-border bg-surface px-1.5 text-[10px]">Ctrl K</kbd>
            </button>
          ) : null}
          {!minimal ? <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setPalette(true)} aria-label="Buscar"><Search /></Button> : null}
          {demoUsers && onSwitch ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2"><Repeat className="size-3.5" /><span className="hidden sm:inline">Demo:</span> <span className="hidden max-w-24 truncate sm:inline">{roleLabel}</span><ChevronDown className="size-3.5 text-muted-foreground" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Alternar perfil de demonstração</DropdownMenuLabel>
                {demoUsers.map((u) => (
                  <DropdownMenuItem key={u.id} onSelect={() => onSwitch(u.email)}>
                    <span className="flex size-7 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold">{initials(u.name)}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm">{u.name}</span><span className="block truncate text-xs text-muted-foreground">{ROLE_LABEL[u.role]}</span></span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <ThemeToggle />
          {!minimal ? <NotificationsMenu notices={notices} /> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full border border-border bg-surface p-0.5 pr-2 text-sm hover:bg-surface-hover" aria-label="Menu do usuário">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{initials(userName)}</span>
                <span className="hidden max-w-[120px] truncate sm:inline">{userName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <div className="px-2.5 pb-1.5"><Badge tone="outline">{roleLabel}</Badge></div>
              <DropdownMenuSeparator />
              {passwordHref ? <DropdownMenuItem asChild><Link href={passwordHref}><KeyRound /> Alterar senha</Link></DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => onLogout?.()}><LogOut /> Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main id="conteudo" className={cn("mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-fade-in", minimal ? "max-w-6xl" : "max-w-7xl", !minimal && "pb-28 lg:pb-8")}>{banner}{children}</main>
      </div>

      {!minimal ? (
        <nav className="nl-no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Atalhos">
          <ul className="grid grid-cols-5">
            {bottomItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-accent-foreground" : "text-muted-foreground")}><Icon className={cn("size-5", active && "text-accent")} /><span className="max-w-full truncate px-1">{item.label}</span></Link></li>
              );
            })}
            <li><button onClick={() => setOpen(true)} className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground">{pinnedItem ? <Sparkles className="size-5 text-accent" /> : <MoreHorizontal className="size-5" />}<span>Mais</span></button></li>
          </ul>
        </nav>
      ) : null}

      {!minimal ? <CommandPalette open={palette} onOpenChange={setPalette} items={items} quick={quick} search={search} /> : null}
    </div>
  );
}
