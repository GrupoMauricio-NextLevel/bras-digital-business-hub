"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICONS } from "@/components/app/icons";
import { GROUP_ICONS, type NavItem, type NavMode } from "@/lib/nav";

const pathOf = (href: string) => href.split("#")[0]!;

/** O item ativo é o de caminho mais longo que casa com a rota atual; links com âncora nunca ficam "ativos". */
export function activeHref(pathname: string, items: Pick<NavItem, "href" | "exact">[]): string {
  let best = "";
  for (const i of items) {
    if (i.href.includes("#")) continue;
    const base = pathOf(i.href);
    const hit = i.exact ? pathname === base : pathname === base || pathname.startsWith(base + "/");
    if (hit && base.length > best.length) best = i.href;
  }
  return best;
}

/**
 * Menu lateral do sistema de design. Duas apresentações do MESMO componente (escolhidas pelo fluxo, não pela empresa):
 *  - "sections": títulos de seção sempre abertos;
 *  - "accordion": grupos que abrem e fecham (aria-expanded), com o grupo da página atual aberto.
 */
export function SideNav({ items, mode = "sections", collapsed = false, onNavigate }: { items: NavItem[]; mode?: NavMode; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = activeHref(pathname, items);
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  const leaf = (item: NavItem, sub = false) => {
    const Icon = ICONS[item.icon];
    const active = item.href === current;
    return (
      <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className={cn("ds-item", sub && "ds-item--sub")}>
        {sub ? null : <Icon className="size-[18px]" aria-hidden />}
        <span className="ds-item-label">{item.label}</span>
        {item.badge && !collapsed ? <em className="ds-badge">{item.badge}</em> : null}
        {item.locked && !collapsed ? <Lock className="size-3.5" aria-label="Recurso bloqueado no seu plano" /> : null}
      </Link>
    );
  };
  const pins = pinned.map((item) => {
    const Icon = ICONS[item.icon];
    const active = item.href === current;
    return (
      <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} className="ds-item ds-item--pinned">
        <Icon className="size-[18px]" aria-hidden />
        <span className="ds-item-label">{item.label}</span>
        {item.badge && !collapsed ? <em className="ds-badge">{item.badge}</em> : null}
      </Link>
    );
  });

  if (mode === "accordion") return <AccordionNav items={rest} pins={pins} current={current} collapsed={collapsed} leaf={leaf} />;

  // "sections": agrupa por seção mantendo a ordem em que cada grupo aparece pela primeira vez.
  // Itens de rodapé (D324) saem das seções e vão para uma gaveta recolhida no fim do menu.
  const corpo = rest.filter((i) => !i.rodape);
  const rodape = rest.filter((i) => i.rodape);
  const order = [...new Set(corpo.map((i) => i.group ?? ""))];
  return (
    <nav className="ds-nav-inner" aria-label="Menu principal">
      {pins}
      {order.map((g) => (
        <div className="ds-group" key={g || "_"}>
          {g ? <p className="ds-group-label">{g}</p> : null}
          <ul>{corpo.filter((i) => (i.group ?? "") === g).map((i) => <li key={i.href}>{leaf(i)}</li>)}</ul>
        </div>
      ))}
      {rodape.length ? <GavetaRodape items={rodape} current={current} collapsed={collapsed} leaf={leaf} /> : null}
    </nav>
  );
}

/** Gaveta do rodapé (D324): título com seta, fechada por padrão e aberta sozinha quando a página atual está nela. */
function GavetaRodape({ items, current, collapsed, leaf }: { items: NavItem[]; current: string; collapsed: boolean; leaf: (i: NavItem, sub?: boolean) => React.ReactNode }) {
  const titulo = items[0]!.group ?? "Ajustes";
  const temAtivo = items.some((i) => i.href === current);
  const [aberto, setAberto] = React.useState<boolean | null>(null);
  const expanded = aberto ?? temAtivo;
  const Icon = ICONS[GROUP_ICONS[titulo] ?? "Settings"];
  return (
    <div className="ds-group ds-group--rodape">
      <button type="button" className="ds-navgroup" data-has-active={temAtivo} aria-expanded={expanded} aria-controls="ds-sub-rodape" title={collapsed ? titulo : undefined} onClick={() => setAberto(!expanded)}>
        <Icon className="size-[18px]" aria-hidden />
        <span className="ds-item-label">{titulo}</span>
        <ChevronDown className="ds-chev size-4" aria-hidden />
      </button>
      <div id="ds-sub-rodape" className="ds-sub" data-open={expanded} inert={!expanded}>
        <div><ul className="ds-subnav">{items.map((i) => <li key={i.href}>{leaf(i, true)}</li>)}</ul></div>
      </div>
    </div>
  );
}

function AccordionNav({ items, pins, current, collapsed, leaf }: { items: NavItem[]; pins: React.ReactNode; current: string; collapsed: boolean; leaf: (i: NavItem, sub?: boolean) => React.ReactNode }) {
  const top = items.filter((i) => !i.group);
  const groups = [...new Set(items.filter((i) => i.group).map((i) => i.group!))];
  const activeGroup = items.find((i) => i.href === current)?.group;
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const isOpen = (g: string) => open[g] ?? g === activeGroup;
  return (
    <nav className="ds-nav-inner" aria-label="Menu principal">
      {pins}
      <ul>{top.map((i) => <li key={i.href}>{leaf(i)}</li>)}</ul>
      {groups.map((g) => {
        const Icon = ICONS[GROUP_ICONS[g] ?? "LayoutDashboard"];
        const expanded = isOpen(g);
        const id = `ds-sub-${g.replace(/\W+/g, "-").toLowerCase()}`;
        const members = items.filter((i) => i.group === g);
        return (
          <div key={g}>
            <button type="button" className="ds-navgroup" data-has-active={g === activeGroup} aria-expanded={expanded} aria-controls={id} title={collapsed ? g : undefined} onClick={() => setOpen((o) => ({ ...o, [g]: !expanded }))}>
              <Icon className="size-[18px]" aria-hidden />
              <span className="ds-item-label">{g}</span>
              <ChevronDown className="ds-chev size-4" aria-hidden />
            </button>
            <div id={id} className="ds-sub" data-open={expanded} inert={!expanded}>
              <div><ul className="ds-subnav">{members.map((i) => <li key={i.href}>{leaf(i, true)}</li>)}</ul></div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
