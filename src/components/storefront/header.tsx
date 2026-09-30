"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, MessageCircle, Menu, X } from "lucide-react";
import * as React from "react";
import { useCart } from "./cart-context";
import { cn } from "@/lib/utils";

export function StoreHeader({ slug, name, logoText, whatsapp: whatsappNumber, sticky = true, showWhatsapp = true }: { slug: string; name: string; logoText: string | null; whatsapp: string | null; sticky?: boolean; showWhatsapp?: boolean }) {
  const whatsapp = showWhatsapp ? whatsappNumber : null;
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const base = `/store/${slug}`;
  const links = [{ href: base, label: "Início" }, { href: `${base}/catalog`, label: "Catálogo" }];
  return (
    <header className={cn("top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur", sticky && "sticky")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <button className="rounded-md p-2 sm:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link href={base} className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md text-xs font-bold" style={{ background: "var(--sf-primary)", color: "var(--sf-on-primary)" }}>{logoText ?? name.slice(0, 2).toUpperCase()}</span>
          <span className="text-base font-semibold tracking-tight">{name}</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-sm sm:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className={cn("text-neutral-600 hover:text-neutral-900", pathname === l.href && "font-medium text-neutral-900")}>{l.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 sm:inline-flex"><MessageCircle className="size-4" /> WhatsApp</a> : null}
          <Link href={`${base}/cart`} className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100" aria-label="Carrinho">
            <ShoppingBag className="size-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {ready && count > 0 ? <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold sm:static sm:size-auto sm:rounded-full sm:px-2 sm:py-0.5" style={{ background: "var(--sf-accent)", color: "var(--sf-on-accent)" }}>{count}</span> : null}
          </Link>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-black/5 px-4 py-2 sm:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-sm">{l.label}</Link>)}
          {whatsapp ? <a href={`https://wa.me/${whatsapp}`} className="block rounded-md px-2 py-2.5 text-sm">WhatsApp</a> : null}
        </nav>
      ) : null}
    </header>
  );
}
