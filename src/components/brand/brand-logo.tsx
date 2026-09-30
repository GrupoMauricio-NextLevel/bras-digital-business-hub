import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { Brand } from "@/lib/brand";

/** Logo da marca: SuperDrop usa a arte própria; as demais usam a arte NextLevel numa plaquinha escura com o nome do produto ao lado. */
export function BrandLogo({ brand, tone = "on-light", className, priority = false }: { brand: Pick<Brand, "logo" | "name" | "wordmark" | "accentColor">; tone?: "auto" | "on-dark" | "on-light"; className?: string; priority?: boolean }) {
  if (brand.logo === "superdrop") return <Logo tone={tone} className={className} priority={priority} alt={brand.name} />;
  const dark = tone === "on-dark";
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={brand.name}>
      <span className="inline-flex items-center rounded-lg bg-black px-2 py-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- arquivo estático pequeno */}
        <img src="/brand/nextlevel-logo.webp" width={640} height={174} alt="" className={cn("w-auto", className ?? "h-8")} loading={priority ? "eager" : "lazy"} decoding="async" />
      </span>
      {brand.wordmark ? <span className={cn("font-[family-name:var(--nl-font-display)] text-lg font-extrabold tracking-tight", dark ? "text-white" : "text-neutral-900")}>{brand.wordmark}</span> : null}
    </span>
  );
}
