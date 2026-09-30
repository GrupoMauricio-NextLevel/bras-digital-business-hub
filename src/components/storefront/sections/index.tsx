import * as React from "react";
import type { Template } from "@/lib/themes/types";
import { AnnouncementBar, CartMain, CategoryChips, CollectionGrid, CollectionHeader, Footer, HeaderSection, Hero, ProductGrid, ProductMain, ProductRelated, ProductShowcase, PromoBanners, RichText, TrustBar } from "./sections";
import { CategoryGrid, CountdownSection, CtaBanner, Faq, HeaderPlus, ImageHero, ImageWithText, Lookbook, ProductTabs, SlideshowSection, Testimonials, VideoHero } from "./premium";
import { Reveal } from "@/components/portal/reveal";
import type { SectionCtx, SectionProps } from "./types";

export type { SectionCtx } from "./types";

/** Tipo de seção para o componente que a desenha. Os esquemas ficam em `lib/themes/sections`. */
export const SECTION_COMPONENTS: Record<string, (props: SectionProps) => React.ReactNode> = {
  "announcement-bar": AnnouncementBar, header: HeaderSection, hero: Hero, "trust-bar": TrustBar, "category-chips": CategoryChips,
  "product-showcase": ProductShowcase, "promo-banners": PromoBanners, "product-grid": ProductGrid, "rich-text": RichText, footer: Footer,
  "product-main": ProductMain, "product-related": ProductRelated, "collection-header": CollectionHeader, "collection-grid": CollectionGrid, "cart-main": CartMain,
  "image-hero": ImageHero, slideshow: SlideshowSection, "video-hero": VideoHero, "category-grid": CategoryGrid, "image-with-text": ImageWithText, testimonials: Testimonials, faq: Faq, lookbook: Lookbook, countdown: CountdownSection, "cta-banner": CtaBanner, "product-tabs": ProductTabs, "header-plus": HeaderPlus,
};

/**
 * Desenha as seções de um modelo na ordem, pulando as ocultas. Cada seção fica dentro de um contêiner
 * `display: contents` marcado com `data-section-id`, que o editor usa para localizar e destacar sem mexer no layout.
 */
export function SectionList({ template, ctx, animate = false, region = "content" }: { template: Template; ctx: SectionCtx; animate?: boolean; region?: "header" | "content" | "footer" }) {
  const visible = template.order.filter((id) => !template.sections[id]?.hidden);
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
