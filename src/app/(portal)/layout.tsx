import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/planos", label: "Planos" },
  { href: "/faq", label: "Dúvidas" },
];

/** Estrutura do portal público: claro, editorial e independente do tema dos painéis. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Ir para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="SuperDrop, página inicial"><Logo tone="on-light" className="h-9" /></Link>
          <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}</nav>
          <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-[#0f1c16] px-4 text-sm font-semibold text-white hover:bg-[#1c2e25]">Entrar</Link>
        </div>
        <nav aria-label="Principal (celular)" className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 md:hidden">{NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap">{n.label}</Link>)}</nav>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-neutral-600 md:grid-cols-3">
          <div><Logo tone="on-light" className="h-8" /><p className="mt-2">Plataforma de e-commerce para quem vende e para quem fornece.</p></div>
          <div className="flex flex-col gap-1">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}</div>
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} NextLevel Marketing Ltda. Termos de uso e política de privacidade serão publicados aqui antes da abertura ao público.</p>
        </div>
      </footer>
    </div>
  );
}
