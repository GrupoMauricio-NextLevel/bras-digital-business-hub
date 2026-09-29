import * as React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { canUse, FEATURE_INFO, minOfferFor, type FeatureKey } from "@/lib/features";
import type { OfferKey } from "@/lib/finance/price-book";
import { cn } from "@/lib/utils";

const OFFER_LABEL: Record<OfferKey, string> = { DROP_MANUAL: "Drop manual", STORE_SUBDOMAIN: "Loja SuperDrop", STORE_OWN: "Loja própria" };

export function UpgradeCard({ feature, className, ctaHref = "/merchant/services" }: { feature: FeatureKey; className?: string; ctaHref?: string }) {
  const info = FEATURE_INFO[feature];
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-dashed border-accent/40 bg-accent-soft/50 p-4 sm:flex-row sm:items-center", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"><Lock className="size-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{info.label} <span className="font-normal text-muted-foreground">· disponível em {OFFER_LABEL[minOfferFor(feature)]}</span></p>
        <p className="text-sm text-muted-foreground">{info.pitch}</p>
      </div>
      <Link href={ctaHref} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground hover:opacity-90"><Sparkles className="size-4" aria-hidden />Ver como liberar</Link>
    </div>
  );
}

/** Mostra o conteúdo se a oferta libera o recurso; senão, o cartão de upgrade (nunca esconde). */
export function FeatureGate({ offer, feature, children, fallback }: { offer: OfferKey; feature: FeatureKey; children: React.ReactNode; fallback?: React.ReactNode }) {
  return canUse(offer, feature) ? <>{children}</> : <>{fallback ?? <UpgradeCard feature={feature} />}</>;
}
