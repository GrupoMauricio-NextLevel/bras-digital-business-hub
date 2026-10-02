import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { ForceLight } from "@/components/portal/force-light";
import { brandHas } from "@/lib/brand";
import { getBrand } from "@/lib/brand-server";
import { CommerceShell } from "@/components/portal/commerce/commerce-shell";

/** Estrutura do portal público: claro, editorial e independente do tema dos painéis. Menu, logo e rodapé vêm da marca do endereço. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const dropship = brandHas(brand, "dropship");
  const NAV = brand.soon ? [] : dropship
    ? [{ href: "/como-funciona", label: "Como funciona" }, { href: "/planos", label: "Planos" }, { href: "/loja-nextlevel", label: "Loja NextLevel" }, { href: "/parceiros", label: "Seja parceiro" }, { href: "/faq", label: "Dúvidas" }]
    : [{ href: "/#temas", label: "Temas" }, { href: "/planos", label: "Planos" }, { href: "/loja-nextlevel", label: "Loja NextLevel" }, { href: "/faq", label: "Dúvidas" }];
  const cta = brand.signupOpen ? { href: "/cadastro", label: "Criar minha loja" } : brand.soon ? { href: "/quero-minha-loja", label: "Entrar na lista de espera" } : { href: "/quero-minha-loja", label: "Quero minha loja" };
  if (brand.code === "NEXTLEVEL_COMMERCE" && !brand.soon) return <><ForceLight /><CommerceShell cta={cta} legal={brand.legalLine}>{children}</CommerceShell></>;
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <ForceLight />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Ir para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label={`${brand.name}, página inicial`}><BrandLogo brand={brand} tone="on-light" className="h-9" priority /></Link>
          <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}</nav>
          <div className="flex items-center gap-2">{dropship ? <Link href="/seja-fornecedor" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 lg:inline-flex">Seja fornecedor</Link> : null}<Link href="/login" className="hidden h-10 items-center rounded-lg px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 sm:inline-flex">Área de membros</Link><Link href={cta.href} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white" style={{ background: brand.primaryColor }}>{cta.label}</Link></div>
        </div>
        <nav aria-label="Principal (celular)" className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 md:hidden">{NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap">{n.label}</Link>)}</nav>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-neutral-600 md:grid-cols-3">
          <div><BrandLogo brand={brand} tone="on-light" className="h-8" /><p className="mt-2">{brand.tagline}.</p></div>
          <div className="flex flex-col gap-1">{NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-neutral-900">{n.label}</Link>)}<Link href={cta.href} className="hover:text-neutral-900">{cta.label}</Link><Link href="/login" className="hover:text-neutral-900">Área de membros</Link>{dropship ? <><Link href="/seja-fornecedor" className="hover:text-neutral-900">Seja fornecedor</Link><Link href="/parceiros/termos" className="hover:text-neutral-900">Termos de parceiros</Link></> : null}</div>
          <div className="text-xs text-neutral-600"><NextLevelSignature product={brand.name} /><p className="mt-3">© {new Date().getFullYear()} NextLevel Marketing Ltda. Termos de uso e política de privacidade serão publicados aqui antes da abertura ao público.</p></div>
        </div>
      </footer>
    </div>
  );
}
