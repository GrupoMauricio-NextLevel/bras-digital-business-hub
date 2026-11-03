import { negocioAberto } from "@/lib/negocios";
import { EC_TECH } from "@/components/portal/commerce/fontes-ec";
import { FaixaBlack } from "@/components/black/faixa-black";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { NextLevelSignature } from "@/components/brand/nextlevel-signature";
import { HOLDING_CODE, brandByCode, brandHas, isClosedCommerceBrand } from "@/lib/brand";
import { getBrand, groupLink } from "@/lib/brand-server";
import { supportContacts } from "@/lib/support";
import { PublicShell, type PublicNavItem } from "@/design-system/components/public-shell";
import { FamiliaGrupo } from "@/components/ecossistema/familia-grupo";

import { getDb } from "@/db/client";
import { fatosDoVendedor } from "@/lib/ia/vendedor-fatos";
import { VendedorHome } from "@/components/ia/vendedor-home";
/** Estrutura do portal público: UMA casca (PublicShell) para todas as marcas. Menu, logo e rodapé vêm da marca do endereço; as cores, do tema. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();
  const dropship = brandHas(brand, "dropship");
  const commerce = brand.code === "NEXTLEVEL_COMMERCE" && !brand.soon;
  const closed = isClosedCommerceBrand(brand) && !brand.soon;
  const cargas = brand.landing === "cargas";
  // Endereço do grupo (hoje o do Master; depois nextlevelgroup.com.br, D147): só as páginas do grupo, e as marcas pelo endereço delas.
  const holding = brand.code === HOLDING_CODE;
  const site = (c: Parameters<typeof brandByCode>[0]) => brandByCode(c).baseUrl;
  // Soluções e Loja NextLevel são da agência e moram no site do grupo (D149): nas marcas, o link vai direto para lá.
  const [solucoes, lojaNl] = await Promise.all([groupLink("/solucoes"), groupLink("/loja-nextlevel")]);
  const nav: PublicNavItem[] = brand.soon ? [] : holding
    // D219: no ecossistema público só entram as marcas já liberadas (as mesmas abertas no Master); as outras ficam bloqueadas até serem concluídas.
    ? [{ href: "/solucoes", label: "Soluções" }, ...(negocioAberto("BRAS_DIGITAL") ? [{ href: "/club", label: "Club" }] : []), ...(negocioAberto("SUPERDROP") ? [{ href: `${site("SUPERDROP")}/`, label: "SuperDrop" }] : []), { href: `${site("NEXTLEVEL_COMMERCE")}/`, label: "E-commerce" }, ...(negocioAberto("BRAS_DIGITAL") && brandByCode("BRAS_DIGITAL").live ? [{ href: `${site("BRAS_DIGITAL")}/`, label: "Brás Digital Club" }] : []), ...(negocioAberto("NEXTLEVEL_CARGAS") ? [{ href: `${site("NEXTLEVEL_CARGAS")}/`, label: "Cargas" }] : [])]
    : cargas
    ? [{ href: "/#beneficios", label: "Para transportadoras" }, { href: "/#importadoras", label: "Para importadoras" }, { href: "/#como-funciona", label: "Como funciona" }, { href: "/#planos", label: "Planos" }, { href: "/#duvidas", label: "Dúvidas" }]
    : closed
    ? [{ href: "/#compradores", label: "Para compradores" }, { href: "/#fornecedores", label: "Para fornecedores" }, { href: "/#videos", label: "Descobertas" }, { href: "/#como-funciona", label: "Como funciona" }, { href: "/#duvidas", label: "Dúvidas" }]
    : commerce
    ? [{ href: "/recursos", label: "Recursos" }, { href: "/comparativo", label: "Comparativo" }, { href: "/planos", label: "Planos" }, { href: "/temas", label: "Temas" }, { href: "/parceiros", label: "Parceiros" }]
    : dropship
      ? [{ href: "/como-funciona", label: "Como funciona" }, { href: "/planos", label: "Planos" }, { href: solucoes, label: "Soluções" }, { href: "/parceiros", label: "Seja parceiro" }, { href: "/faq", label: "Dúvidas" }]
      : [{ href: "/#temas", label: "Temas" }, { href: "/planos", label: "Planos" }, { href: lojaNl, label: "Loja NextLevel" }, { href: "/faq", label: "Dúvidas" }];
  const cta = holding ? { href: "/solucoes#diagnostico", label: "Diagnóstico gratuito" } : cargas ? { href: "/#cadastro", label: "Cadastrar grátis" } : closed ? { href: "/cadastro", label: "Cadastrar grátis" } : brand.signupOpen ? { href: "/cadastro", label: "Criar minha loja" } : brand.soon ? { href: "/quero-minha-loja", label: "Entrar na lista de espera" } : { href: "/quero-minha-loja", label: "Quero minha loja" };
  const c = supportContacts();
  const whatsapp = (commerce || closed) && c.whatsappUrl ? c.whatsappUrl.replace(/text=.*$/, `text=${encodeURIComponent(`Olá! Quero saber mais sobre ${closed ? "o Brás Digital Club" : "a NextLevel E-commerce"}.`)}`) : null;
  // Vendedor 24h (D195): só nas páginas públicas da E-commerce; responde com os dados reais, com ou sem IA ligada.
  const vendedor = commerce ? await (async () => { const db = await getDb(); const fatos = await fatosDoVendedor(db, brand.signupOpen ? "/cadastro" : "/quero-minha-loja"); return <VendedorHome fatos={fatos} whatsappEquipe={supportContacts().whatsappUrl} />; })() : null;
  const casca = (
    <PublicShell
      // NextLevel v2 (D161): assinatura larga, um pouco mais baixa; NextLevel E-commerce (D163): três linhas, um pouco mais alta.
      brand={<BrandLogo brand={brand} tone="auto" className={holding ? "h-6" : commerce ? "h-10" : "h-8"} priority />}
      brandLabel={brand.name}
      homeHref={holding ? "/solucoes" : "/"}
      nav={nav}
      cta={cta}
      secondary={dropship && !holding ? [{ href: "/seja-fornecedor", label: "Seja fornecedor" }] : undefined}
      footerEscuro={!!brand.rodapeEscuro}
      footerBrand={brand.rodapeEscuro
        // Rodapé escuro (Brás Digital Club, D158): assinatura escura com o slogan; o slogan já está na imagem e vai como texto alternativo.
        ? <BrandLogo brand={{ ...brand, name: `${brand.name}: ${brand.tagline}` }} tone="on-dark" variant="assinatura-completa" className="h-20" />
        : <><BrandLogo brand={brand} tone="auto" className="h-8" /><p className="mt-2">{brand.tagline.replace(/\.$/, "")}.</p></>}
      footerNote={<><FamiliaGrupo brandCode={brand.code} /><NextLevelSignature product={brand.name} /><p className="mt-3">© {new Date().getFullYear()} NextLevel Marketing Ltda. {brand.soon ? "Termos de uso e política de privacidade serão publicados aqui antes da abertura ao público." : <><Link href="/termos" className="underline underline-offset-2">Termos de uso</Link> · <Link href="/privacidade" className="underline underline-offset-2">Política de privacidade</Link></>}</p></>}
      floating={<>{whatsapp ? <Link href={whatsapp} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp" className="ds-pub-btn ds-pub-btn--sm fixed bottom-4 right-4 z-40 gap-2 shadow-[var(--ds-shadow-md)]"><MessageCircle className="size-4" aria-hidden />WhatsApp</Link> : null}{vendedor}</>}
    >
      {children}
    </PublicShell>
  );
  // Black NextLevel (D229): faixa com a contagem no topo dos sites públicos abertos (E-commerce e grupo).
  if (commerce) return <div className={EC_TECH}><FaixaBlack lugar="publico" />{casca}</div>;
  if (holding) return <><FaixaBlack lugar="grupo" hrefGrupo={`${site("NEXTLEVEL_COMMERCE")}/planos`} />{casca}</>;
  return casca;
}
