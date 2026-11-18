import * as React from "react";
import type { Template } from "@/lib/themes/types";
import { AnnouncementBar, CartMain, CategoryChips, CollectionGrid, CollectionHeader, Footer, HeaderSection, Hero, ProductGrid, ProductMain, ProductRelated, ProductShowcase, PromoBanners, RichText, TrustBar } from "./sections";
import { ArenaHero, CategoryGrid, CountdownSection, CtaBanner, Faq, HeaderPlus, ImageHero, ImageWithText, Lookbook, ProductTabs, SlideshowSection, Testimonials, VideoHero } from "./premium";
import { SecuritySeals, StoreAbout, WhatsappFloat } from "./trust";
import { ContactInfo, LeadForm, ServicesGrid, WorkGallery } from "./negocio";
import { BannerDuo, BannerMosaic, BannerStrip, HeroBanner } from "./banners";
import { CategoryBanner, HeroImmersive, HeroLayers, ImageTiles, NavCards, WelcomeCoupon } from "./navigation";
import { Reveal } from "@/components/portal/reveal";
import { sectionSchema } from "@/lib/themes/sections";
import { PLATFORM_MODULES } from "@/lib/themes/levels";
import type { SectionCtx, SectionProps } from "./types";

export type { SectionCtx } from "./types";

/** Tipo de seção para o componente que a desenha. Os esquemas ficam em `lib/themes/sections`. */
export const SECTION_COMPONENTS: Record<string, (props: SectionProps) => React.ReactNode> = {
  "services-grid": ServicesGrid, "lead-form": LeadForm, "contact-info": ContactInfo, "work-gallery": WorkGallery, "security-seals": SecuritySeals, "store-about": StoreAbout, "whatsapp-float": WhatsappFloat, "announcement-bar": AnnouncementBar, header: HeaderSection, hero: Hero, "trust-bar": TrustBar, "category-chips": CategoryChips,
  "product-showcase": ProductShowcase, "promo-banners": PromoBanners, "product-grid": ProductGrid, "rich-text": RichText, footer: Footer,
  "product-main": ProductMain, "product-related": ProductRelated, "collection-header": CollectionHeader, "collection-grid": CollectionGrid, "cart-main": CartMain,
  "arena-hero": ArenaHero, "image-hero": ImageHero, slideshow: SlideshowSection, "video-hero": VideoHero, "category-grid": CategoryGrid, "image-with-text": ImageWithText, testimonials: Testimonials, faq: Faq, lookbook: Lookbook, countdown: CountdownSection, "cta-banner": CtaBanner, "product-tabs": ProductTabs, "header-plus": HeaderPlus,
  "hero-banner": HeroBanner, "banner-duo": BannerDuo, "banner-strip": BannerStrip, "banner-mosaic": BannerMosaic,
  "hero-layers": HeroLayers, "hero-immersive": HeroImmersive, "nav-cards": NavCards, "image-tiles": ImageTiles, "category-banner": CategoryBanner, "welcome-coupon": WelcomeCoupon,
};

/**
 * Desenha as seções de um modelo na ordem, pulando as ocultas. Cada seção fica dentro de um contêiner
 * `display: contents` marcado com `data-section-id`, que o editor usa para localizar e destacar sem mexer no layout.
 */
export function SectionList({ template, ctx, animate = false, region = "content" }: { template: Template; ctx: SectionCtx; animate?: boolean; region?: "header" | "content" | "footer" }) {
  // Seção que depende de módulo operacional não disponível degrada em silêncio para o visitante (nunca quebra a página).
  const visible = template.order.filter((id) => { const s = template.sections[id]; if (!s || s.hidden) return false; const m = sectionSchema(s.type)?.module; return !m || PLATFORM_MODULES[m].available; });
  const firstId = region === "content" ? visible[0] : undefined;
  const c = { ...ctx, firstId };
  return (
    <>
      {visible.map((id, n) => {
        const s = template.sections[id]; if (!s) return null;
        const Comp = SECTION_COMPONENTS[s.type]; if (!Comp) return null;
        const blocks = s.blockOrder.flatMap((bid) => { const b = s.blocks[bid]; return b && !b.hidden ? [{ id: bid, type: b.type, settings: b.settings }] : []; });
        const node = Comp({ id, settings: s.settings, blocks, ctx: c });
        return <div key={id} className="contents" data-section-id={id} data-section-type={s.type}>{animate && region === "content" && n > 0 ? <Reveal>{node}</Reveal> : node}</div>;
      })}
    </>
  );
}
