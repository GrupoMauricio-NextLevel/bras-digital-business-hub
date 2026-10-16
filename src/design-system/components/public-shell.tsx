"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeSwitch } from "./theme-switch";

export type PublicNavItem = { href: string; label: string };
export type PublicCta = { href: string; label: string };

/**
 * Casca PÚBLICA do sistema de design (header translúcido 72 px, largura 1200, rodapé). Uma só para todas as marcas:
 * a marca entra como slot (logo), o menu e a chamada como dados, e as cores vêm do tema. Sem condicional por empresa.
 * Menu do celular: botão com aria-expanded, Escape fecha e devolve o foco ao botão.
 */
export function PublicShell({ brand, brandLabel, homeHref = "/", nav, cta, secondary, footerBrand, footerNote, floating, children }: {
  brand: React.ReactNode;
  brandLabel: string;
  /** Destino da logo (o endereço do grupo não tem página inicial própria ainda). */
  homeHref?: string;
  nav: PublicNavItem[];
  cta: PublicCta;
  secondary?: PublicNavItem[];
  footerBrand: React.ReactNode;
  footerNote: React.ReactNode;
  floating?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  // Estado "rolado": a barra de vidro ganha elevação quando há conteúdo passando por baixo (uma leitura por quadro).
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    let raf = 0;
    const read = () => { raf = 0; setScrolled(window.scrollY > 8); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const btn = React.useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const here = (href: string) => (href.startsWith("/#") ? false : href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className="ds-pub">
      <a href="#conteudo" className="ds-skip">Ir para o conteúdo</a>
      <header className="ds-pub-header" data-scrolled={scrolled || open ? "" : undefined}>
        <div className="ds-pub-wrap ds-pub-header-in">
          <Link href={homeHref} className="ds-pub-brand" aria-label={`${brandLabel}, página inicial`}>{brand}</Link>
          <nav aria-label="Principal" className="ds-pub-nav">
            {nav.map((n) => <Link key={n.href} href={n.href} aria-current={here(n.href) ? "page" : undefined}>{n.label}</Link>)}
          </nav>
          <div className="ds-pub-actions">
            {(secondary ?? []).map((n) => <Link key={n.href} href={n.href} className="ds-pub-btn ds-pub-btn--ghost ds-pub-btn--sm ds-hide-compact">{n.label}</Link>)}
            <Link href="/login" className="ds-pub-btn ds-pub-btn--ghost ds-pub-btn--sm ds-hide-compact">Entrar</Link>
            <Link href={cta.href} className="ds-pub-btn ds-pub-btn--sm whitespace-nowrap ds-hide-tiny">{cta.label}</Link>
            <ThemeSwitch className="ds-hide-compact" />
            <button ref={btn} type="button" className="ds-pub-burger" aria-expanded={open} aria-controls="menu-publico" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen((v) => !v)}>
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
        {open ? (
          <div id="menu-publico" className="ds-pub-mobile">
            <div className="ds-pub-wrap">
              <nav aria-label="Principal (celular)">
                {nav.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={here(n.href) ? "page" : undefined}>{n.label}</Link>)}
                {(secondary ?? []).map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>)}
                <Link href="/login" onClick={() => setOpen(false)}>Entrar na minha conta</Link>
              </nav>
              <Link href={cta.href} onClick={() => setOpen(false)} className="ds-pub-btn ds-pub-btn--block ds-show-tiny">{cta.label}</Link>
              <div className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-semibold text-muted-foreground">Tema</span><ThemeSwitch /></div>
            </div>
          </div>
        ) : null}
      </header>
      <main id="conteudo" className="flex-1">{children}</main>
      <footer className="ds-pub-footer">
        <div className="ds-pub-wrap ds-pub-footer-in">
          <div>{footerBrand}</div>
          <nav aria-label="Rodapé" className="flex flex-col gap-1.5">
            {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
            <Link href={cta.href}>{cta.label}</Link>
            <Link href="/login">Área de membros</Link>
          </nav>
          <div className="text-xs leading-relaxed">{footerNote}</div>
        </div>
      </footer>
      {floating}
    </div>
  );
}
