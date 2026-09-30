import * as React from "react";
import type { Template } from "@/lib/themes/types";
import { AnnouncementBar, CategoryChips, Footer, HeaderSection, Hero, ProductGrid, ProductShowcase, PromoBanners, RichText, TrustBar } from "./sections";
import type { SectionCtx, SectionProps } from "./types";

export type { SectionCtx } from "./types";

/** Tipo de seção para o componente que a desenha. Os esquemas ficam em `lib/themes/sections`. */
export const SECTION_COMPONENTS: Record<string, (props: SectionProps) => React.ReactNode> = {
  "announcement-bar": AnnouncementBar, header: HeaderSection, hero: Hero, "trust-bar": TrustBar, "category-chips": CategoryChips,
  "product-showcase": ProductShowcase, "promo-banners": PromoBanners, "product-grid": ProductGrid, "rich-text": RichText, footer: Footer,
};

/**
 * Desenha as seções de um modelo na ordem, pulando as ocultas. Cada seção fica dentro de um contêiner
 * `display: contents` marcado com `data-section-id`, que o editor usa para localizar e destacar sem mexer no layout.
 */
export function SectionList({ template, ctx }: { template: Template; ctx: SectionCtx }) {
  return (
    <>
      {template.order.map((id) => {
        const s = template.sections[id]; if (!s || s.hidden) return null;
        const Comp = SECTION_COMPONENTS[s.type]; if (!Comp) return null;
        const blocks = s.blockOrder.flatMap((bid) => { const b = s.blocks[bid]; return b && !b.hidden ? [{ id: bid, type: b.type, settings: b.settings }] : []; });
        return <div key={id} className="contents" data-section-id={id} data-section-type={s.type}>{Comp({ id, settings: s.settings, blocks, ctx })}</div>;
      })}
    </>
  );
}
