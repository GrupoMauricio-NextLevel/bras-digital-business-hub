"use client";
import { BarraDeNavegacao, TransicaoDePagina } from "@/components/transicao-de-pagina";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ExternalLink, ChevronRight, Repeat, KeyRound, ShieldCheck, Layers, Search, Gift, Sparkles, ArrowRight } from "lucide-react";
import { initials } from "@/lib/utils";
import type { NavItem, NavMode, Panel, QuickAction } from "@/lib/nav";
import type { SearchHit } from "@/lib/domain/search";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { BrandLogo, logoOficial, temLogoPng } from "@/components/brand/brand-logo";
import { ICONS } from "./icons";
import { CommandPalette } from "./command-palette";
import { NotificationsMenu, type NoticeView } from "./notifications-menu";
import { ProductSwitcher } from "./product-switcher";
import { productContextForPath } from "@/lib/product-context";
import { OperationalShell, type ShellBottomItem } from "@/design-system/components/operational-shell";
import { SideNav, activeHref } from "@/design-system/components/side-nav";
import { ThemeSwitch } from "@/design-system/components/theme-switch";

export type DemoUser = { id: string; name: string; email: string; role: string };

export type ShellBrand = { code: string; name: string; logo: "superdrop" | "nextlevel"; wordmark?: string; accentColor: string };

export type AppShellProps = {
  /** Marca do endereço: logo e nome do painel. Sem ela, SuperDrop. */
  brand?: ShellBrand;
  panel: Panel;
  /** "minimal" = expedição: sem menu lateral, topo simples. */
  variant?: "full" | "minimal";
  items: NavItem[];
  /** "accordion" = grupos que abrem e fecham (fluxos com muitos módulos); padrão "sections". */
  navMode?: NavMode;
  quick?: QuickAction[];
  roleLabel: string;
  tenantName: string;
  tenantSub?: string;
  userName: string;
  storefrontHref?: string;
  /** Texto do atalho para a página pública (padrão "Ver loja virtual"; academia: "Ver página da academia"). */
  storefrontLabel?: string;
  demoUsers?: DemoUser[];
  onSwitch?: (email: string) => Promise<void>;
  onLogout?: () => Promise<void>;
  passwordHref?: string;
  /** Conta do grupo (D141): perfis da mesma pessoa em outras marcas. */
  groupHref?: string;
  notices?: NoticeView[];
  search?: (q: string) => Promise<SearchHit[]>;
  /** Link fixo acima do menu (ex.: "Voltar ao Master"). */
  sideTop?: React.ReactNode;
  banner?: React.ReactNode;
  /** Capa (D198): faixa do ecossistema no topo, moldura de cantos amplos, conta em popover. Hoje só no Master. */
  capa?: { indiqueHref?: string; oferta?: { texto: string; href: string }; agente?: boolean; negocios?: React.ReactNode };
  /** Painel do lojista (D209): o canto do menu mostra a marca DO CLIENTE (logo da loja ou iniciais), não a da NextLevel. */
  marcaCliente?: { nome: string; logoUrl?: string | null; sub: string };
  /** Botões extras na barra do topo (ex.: "Ajuda" do lojista, D201). */
  extraTop?: React.ReactNode;
  children: React.ReactNode;
};

const ROLE_LABEL: Record<string, string> = { NEXTLEVEL_MASTER: "NextLevel Master", SUPPLIER_ADMIN: "Fornecedor", SUPPLIER_DISPATCH: "Expedição", STORE_OWNER: "Lojista" };

/** Casca do aplicativo: liga dados e ações de cada painel ao `OperationalShell` do sistema de design (a aparência não é decidida aqui). */
/** "Fio & Linha" → "FL": só letras e números, sem símbolos. */
const siglaDaLoja = (nome: string) => nome.split(/\s+/).map((p) => p.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "L";

export function AppShell({ brand: shellBrand, panel, variant = "full", items, navMode = "sections", quick = [], roleLabel, tenantName, tenantSub, userName, storefrontHref, storefrontLabel = "Ver loja virtual", demoUsers, onSwitch, onLogout, passwordHref, groupHref, notices = [], search, sideTop, banner, capa, marcaCliente, extraTop, children }: AppShellProps) {
  const [palette, setPalette] = React.useState(false);
  const pathname = usePathname();
  const minimal = variant === "minimal";
  const product = productContextForPath(pathname, panel, shellBrand?.code);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = activeHref(pathname, items);
  const currentItem = items.find((i) => i.href === current);
  const bottomItems = (items.some((i) => i.bottom) ? items.filter((i) => i.bottom) : items.filter((i) => !i.pinned).slice(0, 3)).slice(0, 4);

  const logo = shellBrand && shellBrand.logo !== "superdrop"
    ? <BrandLogo brand={shellBrand} tone="auto" className="h-6" />
    : <Logo tone="auto" className="h-6" />;
  const brandNode = marcaCliente ? (
    <div className="ds-brand ds-brand--cliente">
      <span className="ds-cliente-logo" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo enviada pelo lojista, de qualquer origem */}
        {marcaCliente.logoUrl ? <img src={marcaCliente.logoUrl} alt="" /> : siglaDaLoja(marcaCliente.nome)}
      </span>
      <span className="ds-brand-text min-w-0"><b className="ds-tenant-name" title={marcaCliente.nome}>{marcaCliente.nome}</b><span className="ds-tenant-sub">{marcaCliente.sub}</span></span>
    </div>
  ) : (
    <div className="ds-brand">
      <span className="ds-brand-full">{logo}</span>
      <span className="ds-brand-mark" aria-hidden>{logoOficial(shellBrand?.code ?? "SUPERDROP") || temLogoPng(shellBrand?.code) ? <BrandLogo brand={{ code: shellBrand?.code ?? "SUPERDROP", name: "" }} variant="monograma" className="h-6" /> : (shellBrand?.name ?? "S").slice(0, 1)}</span>
    </div>
  );

  const bottom: ShellBottomItem[] = bottomItems.map((item) => {
    const Icon = ICONS[item.icon];
    const active = item.href === current;
    return { key: item.href, label: item.label, icon: <Icon className="size-5" aria-hidden />, render: () => <Link href={item.href} aria-current={active ? "page" : undefined}><Icon className="size-5" aria-hidden /><span>{item.label}</span></Link> };
  });

  const crumb = (
    <div className="ds-crumb" aria-label="Você está em">
      <span className="max-w-44 truncate">{tenantName}</span>
      <i aria-hidden><ChevronRight className="size-3.5" /></i>
      <b>{currentItem?.label ?? roleLabel}</b>
    </div>
  );

  const topActions = (
    <>
      {!minimal ? (
        <>
          <button type="button" onClick={() => setPalette(true)} className="ds-search ds-hide-compact" aria-label="Buscar ou ir para">
            <Search className="size-4" aria-hidden /><span>Buscar ou ir para…</span><kbd>Ctrl K</kbd>
          </button>
          <button type="button" onClick={() => setPalette(true)} className="ds-iconbtn ds-only-compact" aria-label="Buscar"><Search className="size-5" aria-hidden /></button>
        </>
      ) : null}
      {demoUsers && onSwitch ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ds-chip" aria-label="Alternar perfil de demonstração"><Repeat className="size-3.5" aria-hidden /><span className="ds-hide-compact">Demo</span></button>
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
      {capa?.agente ? (
        <button type="button" className="ds-faixa-agente" onClick={() => window.dispatchEvent(new Event("nl-mauricio"))} aria-label="Abrir o Maurício, agente da NextLevel (Ctrl+J)">
          <span className="ds-agente-icone" aria-hidden><Sparkles className="size-4" /></span><span className="ds-hide-compact">Agente</span>
        </button>
      ) : null}
      {extraTop}
      {capa ? null : <ThemeSwitch className="ds-hide-compact" />}
      {!minimal ? <NotificationsMenu notices={notices} /> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {capa ? (
            <button type="button" className="ds-faixa-avatar" aria-label={`Conta de ${userName}`}>{initials(userName)}</button>
          ) : (
            <button type="button" className="ds-chip !px-1 !pr-3" aria-label="Menu do usuário">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">{initials(userName)}</span>
              <span className="ds-hide-compact max-w-[120px] truncate">{userName}</span>
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={capa ? "ds-conta" : undefined}>
          {capa ? (
            <div className="ds-conta-topo">
              <span className="ds-conta-avatar" aria-hidden>{initials(userName)}</span>
              <span className="min-w-0"><b className="block truncate">{userName}</b><span className="block truncate text-xs text-muted-foreground">{roleLabel} · {tenantName}</span></span>
            </div>
          ) : (
            <>
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-1.5"><Badge tone="outline">{roleLabel}</Badge><span className="min-w-0 truncate text-xs text-muted-foreground">{tenantName}</span></div>
            </>
          )}
          {storefrontHref ? <DropdownMenuItem asChild><a href={storefrontHref} target="_blank" rel="noreferrer"><ExternalLink /> {storefrontLabel}</a></DropdownMenuItem> : null}
          <DropdownMenuSeparator />
          {groupHref ? <DropdownMenuItem asChild><Link href={groupHref}><Layers /> Suas marcas</Link></DropdownMenuItem> : null}
          {passwordHref ? <DropdownMenuItem asChild><Link href={passwordHref}><KeyRound /> Alterar senha</Link></DropdownMenuItem> : null}
          {passwordHref ? <DropdownMenuItem asChild><Link href="/account/seguranca"><ShieldCheck /> Segurança da conta</Link></DropdownMenuItem> : null}
          {capa?.indiqueHref ? <DropdownMenuItem asChild><Link href={capa.indiqueHref}><Gift /> Indique e ganhe</Link></DropdownMenuItem> : null}
          {capa ? (
            <>
              <DropdownMenuSeparator />
              <div className="ds-conta-tema"><span>Tema</span><ThemeSwitch /></div>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onSelect={() => onLogout?.()}><LogOut /> Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div data-panel={panel} data-product={product.key} data-density={panel === "dispatch" ? "touch" : undefined} className="nl-shell">
      <OperationalShell
        variant={minimal ? "bare" : "full"}
        drawerTitle={`Menu: ${tenantName}`}
        brand={brandNode}
        area={marcaCliente ? undefined : <><b className="ds-tenant-name" title={tenantName}>{tenantName}</b><span className="ds-tenant-sub">{tenantSub ?? roleLabel}</span></>}
        sideTop={<>{sideTop}{capa ? null : <div className="ds-switcher"><ProductSwitcher current={product} master={panel === "master"} /></div>}</>}
        renderNav={({ collapsed, close }) => <SideNav items={items} mode={navMode} collapsed={collapsed} onNavigate={close} />}
        sideFooter={
          <>
            {storefrontHref ? <a href={storefrontHref} target="_blank" rel="noreferrer" className="ds-item"><ExternalLink className="size-[18px]" aria-hidden /><span className="ds-item-label">{storefrontLabel}</span></a> : null}
            <ThemeSwitch className="ds-only-compact" />
          </>
        }
        crumb={crumb}
        topActions={topActions}
        banner={banner}
        bottom={bottom}
        faixa={capa ? {
          inicio: <>{capa.negocios}{capa.indiqueHref ? <Link href={capa.indiqueHref} className="ds-faixa-pilula"><Gift className="size-4" aria-hidden /><span>Indique e ganhe</span></Link> : null}</>,
          agente: !!capa.agente,
          meio: capa.oferta ? <Link href={capa.oferta.href} className="ds-faixa-oferta"><span className="ds-faixa-novo">Novo</span><span className="truncate">{capa.oferta.texto}</span><ArrowRight className="size-4 shrink-0" aria-hidden /></Link> : null,
        } : undefined}
        overlays={!minimal ? <CommandPalette open={palette} onOpenChange={setPalette} items={items} quick={quick} search={search} /> : null}
      >
        <BarraDeNavegacao />
        <TransicaoDePagina>{children}</TransicaoDePagina>
      </OperationalShell>
    </div>
  );
}
