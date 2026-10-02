"use client";
import Link from "next/link";
import * as React from "react";
import { Menu, X } from "lucide-react";

export type CommerceNav = { href: string; label: string }[];

/** Assinatura provisória (proposta): texto, sem arte. A logomarca definitiva não é trocada nesta etapa. */
export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 font-[family-name:var(--nl-font-display)] text-lg tracking-tight">
      <b className={`font-extrabold ${light ? "text-[#f5f1e8]" : "text-[#14213d]"}`}>NextLevel</b>
      <i aria-hidden className="inline-block size-1.5 translate-y-[-1px] bg-[#f2b600]" />
      <span className={`font-medium ${light ? "text-[#f5f1e8]/80" : "text-[#14213d]/75"}`}>Commerce</span>
    </span>
  );
}

const cta = "inline-flex h-10 items-center justify-center rounded-md bg-[#f2b600] px-4 text-sm font-bold text-[#14213d] transition-colors hover:bg-[#ffc933] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14213d]";

export function CommerceHeader({ nav, cta: action }: { nav: CommerceNav; cta: { href: string; label: string } }) {
  const [open, setOpen] = React.useState(false);
  const btn = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="sticky top-0 z-30 border-b border-[#14213d]/12 bg-[#f5f1e8]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" aria-label="NextLevel Commerce, página inicial" className="shrink-0"><Wordmark /></Link>
        <nav aria-label="Principal" className="ml-4 hidden items-center gap-6 text-sm font-medium text-[#14213d]/80 lg:flex">
          {nav.map((n) => <a key={n.href} href={n.href} className="py-2 hover:text-[#14213d] hover:underline hover:decoration-[#f2b600] hover:decoration-2 hover:underline-offset-8">{n.label}</a>)}
        </nav>
        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <Link href="/login" className="text-sm font-semibold text-[#14213d] hover:underline">Entrar</Link>
          <Link href={action.href} className={cta}>{action.label}</Link>
        </div>
        <button ref={btn} type="button" className="ml-auto inline-flex size-11 items-center justify-center rounded-md text-[#14213d] hover:bg-[#14213d]/8 focus-visible:outline-2 focus-visible:outline-[#14213d] lg:hidden" aria-expanded={open} aria-controls="menu-celular" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>
      {open ? (
        <div id="menu-celular" className="border-t border-[#14213d]/12 bg-[#f5f1e8] px-4 pb-5 pt-2 lg:hidden">
          <nav aria-label="Principal (celular)" className="flex flex-col">
            {nav.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-[#14213d]/10 py-3.5 text-base font-medium text-[#14213d]">{n.label}</a>)}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={action.href} className={`${cta} h-12 text-base`}>{action.label}</Link>
            <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-[#14213d]/25 text-base font-semibold text-[#14213d]">Entrar na minha conta</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
