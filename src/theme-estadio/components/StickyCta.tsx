"use client";

import Link from "next/link";

export function StickyCta({ href, label, priceLabel }: { href: string; label: string; priceLabel: string }) {
  return (
    <div className="stadium-sticky-cta lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--stadium-muted)]">A partir de</p>
        <p className="truncate font-semibold">{priceLabel}</p>
      </div>
      <Link href={href} className="stadium-btn stadium-btn-primary inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold">{label}</Link>
    </div>
  );
}
