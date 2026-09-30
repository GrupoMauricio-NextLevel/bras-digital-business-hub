import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { ForceLight } from "@/components/portal/force-light";

const NAV = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/planos", label: "Planos" },
  { href: "/loja-nextlevel", label: "Loja NextLevel" },
  { href: "/faq", label: "Dúvidas" },
];

/** Estrutura do portal público: claro, editorial e independente do tema dos painéis. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ForceLight />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Ir para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="SuperDrop, página inicial"><Logo tone="on-light" className="h-9" priority /></Link>
          <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}</nav>
          <div className="flex items-center gap-2"><Link href="/seja-fornecedor" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 lg:inline-flex">Seja fornecedor</Link><Link href="/login" className="hidden h-10 items-center rounded-lg px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 sm:inline-flex">Área de membros</Link><Link href="/cadastro" className="inline-flex h-10 items-center rounded-lg bg-[#0f1c16] px-4 text-sm font-semibold text-white hover:bg-[#1c2e25]">Criar minha loja</Link></div>
        </div>
        <nav aria-label="Principal (celular)" className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 md:hidden">{NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap">{n.label}</Link>)}</nav>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-neutral-600 md:grid-cols-3">
          <div><Logo tone="on-light" className="h-8" /><p className="mt-2">Loja online sem estoque, com fornecedor que separa e envia.</p></div>
          <div className="flex flex-col gap-1">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}<Link href="/cadastro" className="hover:text-neutral-900">Criar minha loja</Link><Link href="/login" className="hover:text-neutral-900">Área de membros</Link><Link href="/seja-fornecedor" className="hover:text-neutral-900">Seja fornecedor</Link></div>
          <div className="text-xs text-neutral-600"><NextLevelSignature /><p className="mt-3">© {new Date().getFullYear()} NextLevel Marketing Ltda. Termos de uso e política de privacidade serão publicados aqui antes da abertura ao público.</p></div>
        </div>
      </footer>
    </div>
  );
}
