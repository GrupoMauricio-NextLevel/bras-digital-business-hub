import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { brandHas, isClosedCommerceBrand } from "@/lib/brand";
import { getBrand } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { PublicShell, type PublicNavItem } from "@/design-system/components/public-shell";

/** Estrutura do portal público: UMA casca (PublicShell) para todas as marcas. Menu, logo e rodapé vêm da marca do endereço; as cores, do tema. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const dropship = brandHas(brand, "dropship");
  const commerce = brand.code === "NEXTLEVEL_COMMERCE" && !brand.soon;
  const closed = isClosedCommerceBrand(brand) && !brand.soon;
  const nav: PublicNavItem[] = brand.soon ? [] : closed
    ? [{ href: "/#plataforma", label: "Plataforma" }, { href: "/#videos", label: "Descobertas" }, { href: "/#acesso", label: "Acesso" }, { href: "/#como-funciona", label: "Como funciona" }, { href: "/#duvidas", label: "Dúvidas" }]
    : commerce
    ? [{ href: "/#exemplos", label: "Lojas de exemplo" }, { href: "/#personalizar", label: "Personalização" }, { href: "/planos", label: "Planos" }, { href: "/solucoes", label: "Soluções" }, { href: "/#duvidas", label: "Dúvidas" }]
    : dropship
      ? [{ href: "/como-funciona", label: "Como funciona" }, { href: "/planos", label: "Planos" }, { href: "/solucoes", label: "Soluções" }, { href: "/parceiros", label: "Seja parceiro" }, { href: "/faq", label: "Dúvidas" }]
      : [{ href: "/#temas", label: "Temas" }, { href: "/planos", label: "Planos" }, { href: "/loja-nextlevel", label: "Loja NextLevel" }, { href: "/faq", label: "Dúvidas" }];
  const cta = closed ? { href: "/cadastro", label: "Cadastrar grátis" } : brand.signupOpen ? { href: "/cadastro", label: "Criar minha loja" } : brand.soon ? { href: "/quero-minha-loja", label: "Entrar na lista de espera" } : { href: "/quero-minha-loja", label: "Quero minha loja" };
  const c = supportContacts();
  const whatsapp = (commerce || closed) && c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero saber mais sobre ${closed ? "a Brás Digital" : "a NextLevel Commerce"}.`)}`) : null;
  return (
    <PublicShell
      brand={<BrandLogo brand={brand} tone="auto" className="h-8" priority />}
      brandLabel={brand.name}
      nav={nav}
      cta={cta}
      secondary={dropship ? [{ href: "/seja-fornecedor", label: "Seja fornecedor" }] : undefined}
      footerBrand={<><BrandLogo brand={brand} tone="auto" className="h-8" /><p className="mt-2">{brand.tagline}.</p></>}
      footerNote={<><NextLevelSignature product={brand.name} /><p className="mt-3">{brand.legalLine} © {new Date().getFullYear()} NextLevel Marketing Ltda. Termos de uso e política de privacidade serão publicados aqui antes da abertura ao público.</p></>}
      floating={whatsapp ? <Link href={whatsapp} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp" className="ds-pub-btn ds-pub-btn--sm fixed bottom-4 right-4 z-40 gap-2 shadow-[var(--ds-shadow-md)]"><MessageCircle className="size-4" aria-hidden />WhatsApp</Link> : null}
    >
      {children}
    </PublicShell>
  );
}
