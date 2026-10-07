"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, MessageCircle, Menu, PackageSearch, Search, ShoppingBag, X } from "lucide-react";
import * as React from "react";
import { useCart } from "./cart-context";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export type MenuItem = { label: string; href: string; children: { label: string; href: string }[] };
export type SearchProduct = { name: string; slug: string; category: string; priceCents: number };
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca com sugestões (padrão combobox): setas, Enter e Esc. As sugestões vêm da lista de produtos já carregada. */
function SearchBox({ base, products, dark, className }: { base: string; products: SearchProduct[]; dark: boolean; className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState(""); const [open, setOpen] = React.useState(false); const [active, setActive] = React.useState(-1);
  const results = q.trim() ? products.filter((p) => fold(`${p.name} ${p.category}`).includes(fold(q.trim()))).slice(0, 6) : [];
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };
  return (
    <div className={cn("relative", className)} role="search">
      <Search className={cn("pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2", dark ? "text-neutral-400" : "text-neutral-400")} aria-hidden />
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); }
          else if (e.key === "Escape") { setOpen(false); }
          else if (e.key === "Enter") { e.preventDefault(); if (active >= 0 && results[active]) go(`${base}/product/${results[active]!.slug}`); else if (q.trim()) go(`${base}/catalog?q=${encodeURIComponent(q.trim())}`); }
        }}
        role="combobox" aria-expanded={open && q.trim() !== ""} aria-controls="sf-search-list" aria-autocomplete="list" aria-activedescendant={active >= 0 ? `sf-search-${active}` : undefined} aria-label="Buscar produtos" placeholder="Buscar produtos"
        className={cn("h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none", dark ? "border-white/20 bg-white/10 text-white placeholder:text-neutral-400 focus:border-white/60" : "border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900")} />
      {open && q.trim() ? (
        <ul id="sf-search-list" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-xl">
          {results.length ? results.map((p, i) => <li key={p.slug} id={`sf-search-${i}`} role="option" aria-selected={i === active}><Link href={`${base}/product/${p.slug}`} onClick={() => { setOpen(false); setQ(""); }} className={cn("flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-neutral-50", i === active && "bg-neutral-100")}><span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="block text-xs text-neutral-500">{p.category}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums">{formatBRL(p.priceCents)}</span></Link></li>) : <li className="px-3 py-3 text-sm text-neutral-500" role="option" aria-selected={false}>Nenhum produto encontrado.</li>}
          {q.trim() ? <li role="presentation" className="border-t border-neutral-100"><Link href={`${base}/catalog?q=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Ver todos os resultados para “{q.trim()}”</Link></li> : null}
        </ul>
      ) : null}
    </div>
  );
}

export function StoreHeader({ slug, name, logoText, logoUrl, logoHeight = 36, whatsapp: whatsappNumber, sticky = true, showWhatsapp = true, tone = "light", menu, searchProducts, showSearch = false }: { slug: string; name: string; logoUrl?: string | null; logoHeight?: number; logoText: string | null; whatsapp: string | null; sticky?: boolean; showWhatsapp?: boolean; tone?: "light" | "dark"; menu?: MenuItem[]; searchProducts?: SearchProduct[]; showSearch?: boolean }) {
  const whatsapp = showWhatsapp ? whatsappNumber : null;
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mega, setMega] = React.useState<number | null>(null);
  const base = `/store/${slug}`;
  const dark = tone === "dark";
  const links: MenuItem[] = menu && menu.length ? menu : [{ label: "Início", href: base, children: [] }, { label: "Catálogo", href: `${base}/catalog`, children: [] }];
  const T = { bar: dark ? "border-white/10 bg-neutral-950/95 text-white" : "border-black/5 bg-white/95", link: dark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900", active: dark ? "font-medium text-white" : "font-medium text-neutral-900", hover: dark ? "hover:bg-white/10" : "hover:bg-neutral-100", divider: dark ? "border-white/10" : "border-black/5" };
  return (
    <header className={cn("top-0 z-30 border-b backdrop-blur", T.bar, sticky && "sticky")} onMouseLeave={() => setMega(null)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button className={cn("inline-flex size-11 items-center justify-center rounded-md sm:hidden", T.hover)} onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link href={base} className="flex min-h-11 items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo enviada pelo lojista
            <img src={logoUrl} alt={name} style={{ height: logoHeight }} className="w-auto max-w-[180px] object-contain" />
          ) : (
            <>
              <span className="flex size-9 items-center justify-center rounded-md text-xs font-bold" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{logoText ?? name.slice(0, 2).toUpperCase()}</span>
              <span className="whitespace-nowrap text-base font-semibold tracking-tight">{name}</span>
            </>
          )}
        </Link>
        <nav className={cn("hidden items-center whitespace-nowrap text-sm sm:flex", links.length > 3 ? "ml-2 gap-4" : "ml-6 gap-5")} aria-label="Principal">
          {links.map((l, i) => (
            <div key={`${l.label}-${i}`} className="relative" onMouseEnter={() => setMega(l.children.length ? i : null)}>
              {l.children.length ? (
                <button type="button" aria-expanded={mega === i} aria-haspopup="true" onClick={() => setMega(mega === i ? null : i)} onKeyDown={(e) => { if (e.key === "Escape") setMega(null); }} className={cn("inline-flex items-center gap-1", T.link)}>{l.label}<ChevronDown className="size-3.5" aria-hidden /></button>
              ) : <Link href={l.href} className={cn(T.link, pathname === l.href && T.active)}>{l.label}</Link>}
            </div>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {showSearch && searchProducts ? <SearchBox base={base} products={searchProducts} dark={dark} className="hidden w-52 lg:block xl:w-64" /> : null}
          {/* Com busca e menu grande, o atalho vira só o ícone para a barra caber numa linha. */}
          <Link href={`${base}/acompanhar`} aria-label={showSearch ? "Acompanhar pedido" : undefined} title={showSearch ? "Acompanhar pedido" : undefined} className={cn("hidden min-h-11 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm lg:inline-flex", T.hover)}><PackageSearch className="size-4" aria-hidden />{showSearch ? null : " Acompanhar pedido"}</Link>
          {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className={cn("hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm sm:inline-flex", dark ? "text-neutral-300" : "text-neutral-600", T.hover)}><MessageCircle className="size-4" /> WhatsApp</a> : null}
          <Link href={`${base}/cart`} className={cn("relative inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium", T.hover)} aria-label="Carrinho">
            <ShoppingBag className="size-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {ready && count > 0 ? <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold sm:static sm:size-auto sm:rounded-full sm:px-2 sm:py-0.5" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{count}</span> : null}
          </Link>
        </div>
      </div>
      {mega !== null && links[mega]?.children.length ? (
        <div className="hidden border-t border-neutral-200 bg-white text-neutral-900 shadow-xl sm:block" onMouseLeave={() => setMega(null)}>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-1 px-6 py-6 lg:grid-cols-4">
            <Link href={links[mega]!.href} onClick={() => setMega(null)} className="col-span-full mb-2 text-sm font-semibold underline-offset-4 hover:underline">Ver tudo em {links[mega]!.label}</Link>
            {links[mega]!.children.map((c) => <Link key={c.href + c.label} href={c.href.startsWith("/") ? `${base}${c.href === "/" ? "" : c.href}` : c.href} onClick={() => setMega(null)} className="rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900">{c.label}</Link>)}
          </div>
        </div>
      ) : null}
      {open ? (
        <nav className={cn("border-t px-4 py-2 sm:hidden", T.divider)} aria-label="Menu do celular">
          {showSearch && searchProducts ? <div className="py-2"><SearchBox base={base} products={searchProducts} dark={dark} /></div> : null}
          {links.map((l, i) => l.children.length ? (
            <details key={`${l.label}-${i}`} className="group"><summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2.5 text-sm">{l.label}<ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden /></summary>
              <div className="pb-1 pl-4">{l.children.map((c) => <Link key={c.href + c.label} href={c.href.startsWith("/") ? `${base}${c.href === "/" ? "" : c.href}` : c.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm opacity-80">{c.label}</Link>)}</div></details>
          ) : <Link key={`${l.label}-${i}`} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-sm">{l.label}</Link>)}
          {whatsapp ? <a href={`https://wa.me/${whatsapp}`} className="block rounded-md px-2 py-2.5 text-sm">WhatsApp</a> : null}
        </nav>
      ) : null}
    </header>
  );
}
